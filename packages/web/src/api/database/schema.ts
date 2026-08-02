import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

/**
 * Framewave application schema.
 * Re-exports Better Auth's generated tables so drizzle produces complete migrations.
 */
export * from "./auth-schema";

/**
 * A single video generation job / result.
 * status: queued → processing → completed | failed
 */
export const generations = sqliteTable(
  "generations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Generation inputs
    mode: text("mode").notNull().default("text"), // "text" | "image"
    prompt: text("prompt").notNull(),
    enhancedPrompt: text("enhanced_prompt"),
    negativePrompt: text("negative_prompt"),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"), // "16:9" | "9:16"
    durationSeconds: integer("duration_seconds").notNull().default(8),
    resolution: text("resolution").notNull().default("720p"), // "720p" | "1080p"
    stylePreset: text("style_preset"),
    cameraMotion: text("camera_motion"),
    seed: integer("seed"),
    provider: text("provider").notNull().default("veo"),
    model: text("model").notNull().default("veo-3.1-fast-generate-preview"),
    sourceImageKey: text("source_image_key"), // Tigris key for image-to-video input

    // Output + lifecycle
    status: text("status").notNull().default("queued"),
    progress: integer("progress").notNull().default(0),
    videoKey: text("video_key"), // Tigris key for the generated mp4
    thumbnailKey: text("thumbnail_key"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    creditsCost: integer("credits_cost").notNull().default(0),

    // Social / organization
    title: text("title"),
    category: text("category").notNull().default("general"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
    likeCount: integer("like_count").notNull().default(0),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => [
    index("generations_user_idx").on(t.userId),
    index("generations_public_idx").on(t.isPublic),
    index("generations_status_idx").on(t.status),
    index("generations_category_idx").on(t.category),
  ],
);

/** Likes on public gallery videos (one row per user per generation). */
export const likes = sqliteTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.generationId] }),
    index("likes_generation_idx").on(t.generationId),
  ],
);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
