/**
 * Provider-agnostic video generation contract.
 * Framewave ships with a Veo (Gemini API) provider today; Runway/Luma/Kling/Pika
 * can be added later by implementing this same interface and registering it in
 * ./index.ts — nothing else in the app needs to change.
 */

export interface GenerateVideoInput {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: string; // "16:9" | "9:16"
  durationSeconds: number;
  resolution: string; // "720p" | "1080p" | "4k"
  /** Provider model id to run. Defaults to the provider's own default. */
  model?: string;
  seed?: number | null;
  /** Raw bytes of a source image for image-to-video mode. */
  image?: { bytes: Uint8Array; mimeType: string } | null;
  /** Called as generation progresses (0-100). */
  onProgress?: (progress: number) => void;
}

export interface GenerateVideoResult {
  /** The generated MP4 bytes. */
  bytes: Uint8Array;
  mimeType: string;
}

export interface VideoProvider {
  id: string;
  model: string;
  generate(input: GenerateVideoInput): Promise<GenerateVideoResult>;
}
