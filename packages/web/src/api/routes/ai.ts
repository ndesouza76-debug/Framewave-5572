import { z } from "zod";
import { generateText } from "ai";
import { authed } from "../middleware/auth";
import { gateway } from "../lib/gateway";

/** AI helpers for the studio — prompt enhancement. */
export const ai = {
  enhancePrompt: authed
    .input(
      z.object({
        prompt: z.string().min(1).max(2000),
        stylePreset: z.string().optional(),
        cameraMotion: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const parts = [
        `Rewrite the following idea into a single vivid, cinematic text-to-video prompt for an AI video model.`,
        `Keep it under 90 words. Describe subject, setting, lighting, mood, lens/camera, and motion.`,
        `Do not use markdown, quotes, or a preamble — output only the final prompt.`,
        input.stylePreset ? `Visual style: ${input.stylePreset}.` : "",
        input.cameraMotion ? `Camera movement: ${input.cameraMotion}.` : "",
        `Idea: ${input.prompt}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { text } = await generateText({
        model: gateway("google/gemini-3-flash"),
        prompt: parts,
      });

      return { prompt: text.trim() };
    }),
};
