import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { Autumn } from "autumn-js";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import type { Generation } from "../database/schema";
import { getVideoProvider } from "../lib/video";
import { getObjectBytes, putObject, signGetUrl, deleteObject } from "../lib/s3";
import { creditCost } from "../lib/credits";

const autumn = new Autumn();

const MODE = ["text", "image"] as const;
const ASPECT = ["16:9", "9:16"] as const;
const RESOLUTION = ["720p", "1080p"] as const;

const createInput = z.object({
  mode: z.enum(MODE).default("text"),
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  aspectRatio: z.enum(ASPECT).default("16:9"),
  durationSeconds: z.number().int().min(3).max(8).default(8),
  resolution: z.enum(RESOLUTION).default("720p"),
  stylePreset: z.string().max(60).optional(),
  cameraMotion: z.string().max(60).optional(),
  seed: z.number().int().optional(),
  sourceImageKey: z.string().optional(),
  title: z.string().max(120).optional(),
  category: z.string().max(40).default("general"),
});

function rid() {
  return `gen_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Adds presigned URLs (video, source image) to a stored generation. */
async function withUrls(g: Generation) {
  const [videoUrl, sourceImageUrl] = await Promise.all([
    g.videoKey ? signGetUrl(g.videoKey, 21_600) : Promise.resolve(null),
    g.sourceImageKey ? signGetUrl(g.sourceImageKey, 21_600) : Promise.resolve(null),
  ]);
  return { ...g, videoUrl, sourceImageUrl };
}

async function setProgress(id: string, progress: number) {
  await db.update(schema.generations).set({ progress }).where(eq(schema.generations.id, id));
}

/**
 * Runs a generation end-to-end in the background (not awaited by the request).
 * Updates status/progress as it goes, uploads the result to Tigris, then tracks
 * the credit spend in Autumn on success.
 */
async function runGeneration(id: string) {
  const [g] = await db.select().from(schema.generations).where(eq(schema.generations.id, id));
  if (!g) return;

  try {
    await db
      .update(schema.generations)
      .set({ status: "processing", progress: 5, error: null, attempts: g.attempts + 1 })
      .where(eq(schema.generations.id, id));

    let image: { bytes: Uint8Array; mimeType: string } | null = null;
    if (g.mode === "image" && g.sourceImageKey) {
      const obj = await getObjectBytes(g.sourceImageKey);
      image = { bytes: obj.bytes, mimeType: obj.contentType };
    }

    const provider = getVideoProvider(g.provider);
    const result = await provider.generate({
      prompt: g.enhancedPrompt || g.prompt,
      negativePrompt: g.negativePrompt,
      aspectRatio: g.aspectRatio,
      durationSeconds: g.durationSeconds,
      resolution: g.resolution,
      seed: g.seed,
      image,
      onProgress: (p) => void setProgress(id, p),
    });

    const videoKey = `generations/${g.userId}/${id}.mp4`;
    await putObject(videoKey, result.bytes, result.mimeType);

    await db
      .update(schema.generations)
      .set({ status: "completed", progress: 100, videoKey, completedAt: new Date() })
      .where(eq(schema.generations.id, id));

    // Charge credits only on success.
    await autumn
      .track({ customerId: g.userId, featureId: "credits", value: g.creditsCost })
      .catch((e) => console.error("[autumn] track failed:", e));
  } catch (err) {
    console.error("[generation] failed:", id, err);
    await db
      .update(schema.generations)
      .set({ status: "failed", error: humanError(err) })
      .where(eq(schema.generations.id, id));
  }
}

/** Turns raw provider errors (often JSON blobs) into something a user can act on. */
function humanError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (/RESOURCE_EXHAUSTED|quota|429/i.test(raw)) {
    return "The video model is out of quota right now. Try again shortly, or check the provider billing plan.";
  }
  if (/NOT_FOUND|is not found for API version/i.test(raw)) {
    return "The configured video model isn't available for this API key.";
  }
  if (/PERMISSION_DENIED|API key/i.test(raw)) {
    return "Video provider rejected the API key. Check GEMINI_API_KEY.";
  }
  if (/safety|blocked|policy/i.test(raw)) {
    return "That prompt was blocked by the model's safety filters. Try rewording it.";
  }
  return raw.length > 220 ? "Generation failed. Please try again." : raw;
}

export const generations = {
  /** Start a new generation. Checks credit balance, then runs in the background. */
  create: authed.input(createInput).handler(async ({ input, context }) => {
    const cost = creditCost({ durationSeconds: input.durationSeconds, resolution: input.resolution });

    const check = await autumn
      .check({ customerId: context.user.id, featureId: "credits", requiredBalance: cost })
      .catch(() => null);
    if (check && check.allowed === false) {
      throw new ORPCError("PAYMENT_REQUIRED", {
        message: "Not enough credits. Upgrade your plan to keep generating.",
      });
    }

    if (input.mode === "image" && !input.sourceImageKey) {
      throw new ORPCError("BAD_REQUEST", { message: "An image is required for image-to-video." });
    }

    const id = rid();
    const [row] = await db
      .insert(schema.generations)
      .values({
        id,
        userId: context.user.id,
        mode: input.mode,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        resolution: input.resolution,
        stylePreset: input.stylePreset,
        cameraMotion: input.cameraMotion,
        seed: input.seed,
        sourceImageKey: input.sourceImageKey,
        title: input.title,
        category: input.category,
        creditsCost: cost,
        status: "queued",
        provider: "veo",
        model: getVideoProvider("veo").model,
      })
      .returning();

    void runGeneration(id);
    return withUrls(row!);
  }),

  /** Retry a failed generation. */
  retry: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [g] = await db
      .select()
      .from(schema.generations)
      .where(and(eq(schema.generations.id, input.id), eq(schema.generations.userId, context.user.id)));
    if (!g) throw new ORPCError("NOT_FOUND");
    if (g.status === "processing" || g.status === "queued") return withUrls(g);
    await db
      .update(schema.generations)
      .set({ status: "queued", progress: 0, error: null })
      .where(eq(schema.generations.id, g.id));
    void runGeneration(g.id);
    const [updated] = await db.select().from(schema.generations).where(eq(schema.generations.id, g.id));
    return withUrls(updated!);
  }),

  /** List the signed-in user's generations (history), newest first. */
  list: authed.handler(async ({ context }) => {
    const rows = await db
      .select()
      .from(schema.generations)
      .where(eq(schema.generations.userId, context.user.id))
      .orderBy(desc(schema.generations.createdAt));
    return Promise.all(rows.map(withUrls));
  }),

  /** Get a single generation (used for polling job status). Owner only. */
  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [g] = await db
      .select()
      .from(schema.generations)
      .where(and(eq(schema.generations.id, input.id), eq(schema.generations.userId, context.user.id)));
    if (!g) throw new ORPCError("NOT_FOUND");
    return withUrls(g);
  }),

  delete: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [g] = await db
      .select()
      .from(schema.generations)
      .where(and(eq(schema.generations.id, input.id), eq(schema.generations.userId, context.user.id)));
    if (!g) throw new ORPCError("NOT_FOUND");
    if (g.videoKey) await deleteObject(g.videoKey).catch(() => {});
    await db.delete(schema.generations).where(eq(schema.generations.id, g.id));
    return { ok: true };
  }),

  toggleFavorite: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [g] = await db
      .select()
      .from(schema.generations)
      .where(and(eq(schema.generations.id, input.id), eq(schema.generations.userId, context.user.id)));
    if (!g) throw new ORPCError("NOT_FOUND");
    await db
      .update(schema.generations)
      .set({ isFavorite: !g.isFavorite })
      .where(eq(schema.generations.id, g.id));
    return { isFavorite: !g.isFavorite };
  }),

  /** Publish/unpublish to the public gallery. */
  togglePublic: authed
    .input(z.object({ id: z.string(), title: z.string().max(120).optional(), category: z.string().max(40).optional() }))
    .handler(async ({ input, context }) => {
      const [g] = await db
        .select()
        .from(schema.generations)
        .where(and(eq(schema.generations.id, input.id), eq(schema.generations.userId, context.user.id)));
      if (!g) throw new ORPCError("NOT_FOUND");
      if (!g.videoKey) throw new ORPCError("BAD_REQUEST", { message: "Only completed videos can be published." });
      const next = !g.isPublic;
      await db
        .update(schema.generations)
        .set({
          isPublic: next,
          title: input.title ?? g.title,
          category: input.category ?? g.category,
        })
        .where(eq(schema.generations.id, g.id));
      return { isPublic: next };
    }),
};
