import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GenerateVideoInput, GenerateVideoResult, VideoProvider } from "./types";

const MODEL = process.env.VEO_MODEL || "veo-3.1-fast-generate-preview";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to the root .env to enable video generation.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Google Veo provider via the Gemini API.
 * Starts a long-running generation operation, polls until done, downloads the
 * resulting MP4, and returns its bytes. Progress is estimated across the poll
 * loop since the API does not expose a granular percentage.
 */
export const veoProvider: VideoProvider = {
  id: "veo",
  model: MODEL,

  async generate(input: GenerateVideoInput): Promise<GenerateVideoResult> {
    const ai = client();
    input.onProgress?.(8);

    const config: Record<string, unknown> = {
      aspectRatio: input.aspectRatio,
      numberOfVideos: 1,
    };
    if (input.negativePrompt) config.negativePrompt = input.negativePrompt;
    if (typeof input.seed === "number") config.seed = input.seed;
    if (input.resolution) config.resolution = input.resolution;
    // Veo accepts 4, 6 or 8 second clips.
    if (input.durationSeconds) config.durationSeconds = Math.min(8, Math.max(4, Math.round(input.durationSeconds / 2) * 2));

    const request: Record<string, unknown> = {
      model: MODEL,
      prompt: input.prompt,
      config,
    };
    if (input.image) {
      request.image = {
        imageBytes: Buffer.from(input.image.bytes).toString("base64"),
        mimeType: input.image.mimeType,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let operation: any = await ai.models.generateVideos(request as any);
    input.onProgress?.(15);

    // Poll until the operation completes. Veo typically takes 30s–3min.
    let ticks = 0;
    while (!operation.done) {
      await new Promise((r) => setTimeout(r, 8000));
      ticks++;
      // Ease progress from ~15% toward ~90% while we wait.
      const est = Math.min(90, 15 + ticks * 7);
      input.onProgress?.(est);
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      throw new Error(operation.error.message || "Veo generation failed");
    }

    const generated = operation.response?.generatedVideos?.[0];
    const video = generated?.video;
    if (!video) throw new Error("Veo returned no video");

    input.onProgress?.(93);

    // Download to a temp file, then read the bytes back for upload to Tigris.
    const outPath = join(tmpdir(), `veo-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
    await ai.files.download({ file: video, downloadPath: outPath });
    const bytes = new Uint8Array(await fs.readFile(outPath));
    await fs.unlink(outPath).catch(() => {});

    input.onProgress?.(98);
    return { bytes, mimeType: "video/mp4" };
  },
};
