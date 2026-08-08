import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
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
    resolution: text("resolution").notNull().default("720p"), // "720p" | "1080p" | "4k"
    tier: text("tier").notNull().default("standard"), // "draft" | "standard" | "cinematic"
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

/* ------------------------------------------------------------ credits ---- */

/**
 * Bonus / purchased credits that live outside the Autumn plan allowance.
 * Autumn owns the monthly plan allowance; this ledger owns everything earned
 * (daily claims, streaks, referrals, missions) so it survives the monthly
 * reset. A user's effective balance is Autumn remaining + unspent ledger.
 *
 * `remaining` is decremented in place; a lot is exhausted at remaining = 0.
 */
export const creditLedger = sqliteTable(
  "credit_ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Credits originally granted by this lot. Always positive. */
    amount: integer("amount").notNull(),
    /** Credits still unspent in this lot. */
    remaining: integer("remaining").notNull(),
    /** daily | streak | referral | referral_signup | mission | promo | admin */
    source: text("source").notNull(),
    note: text("note"),
    /** Null = never expires. */
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("credit_ledger_user_idx").on(t.userId),
    index("credit_ledger_remaining_idx").on(t.remaining),
  ],
);

/**
 * Append-only audit of every credit movement.
 * `idempotencyKey` is unique, so a spend for a given generation can only ever
 * be recorded once no matter how many times the charge path runs.
 */
export const creditEvents = sqliteTable(
  "credit_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Negative for spend, positive for grants. */
    delta: integer("delta").notNull(),
    /** How much of the spend came from the bonus ledger vs the plan allowance. */
    fromLedger: integer("from_ledger").notNull().default(0),
    fromPlan: integer("from_plan").notNull().default(0),
    source: text("source").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("credit_events_user_idx").on(t.userId),
    // The guarantee that a charge or grant can never be applied twice.
    uniqueIndex("credit_events_idem_key_idx").on(t.idempotencyKey),
  ],
);

/**
 * One row per user per calendar day (UTC). The composite primary key is what
 * makes double-claiming impossible — a second insert for the same day fails.
 */
export const dailyClaims = sqliteTable(
  "daily_claims",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD in UTC. */
    day: text("day").notNull(),
    creditsAwarded: integer("credits_awarded").notNull(),
    /** Consecutive-day streak this claim landed on, 1-based. */
    streak: integer("streak").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

/** One row per completed mission per user. PK prevents re-claiming. */
export const missionClaims = sqliteTable(
  "mission_claims",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    missionId: text("mission_id").notNull(),
    creditsAwarded: integer("credits_awarded").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.missionId] })],
);

/** Stable share code per user. */
export const referralCodes = sqliteTable(
  "referral_codes",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("referral_codes_code_idx").on(t.code)],
);

/**
 * A redeemed referral. `refereeId` is the primary key: a user can be referred
 * exactly once, ever. The referrer's reward is held until the referee actually
 * completes a generation, which is what stops signup farming.
 */
export const referrals = sqliteTable(
  "referrals",
  {
    refereeId: text("referee_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    referrerId: text("referrer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** pending -> qualified (referee generated something, referrer paid out) */
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    qualifiedAt: integer("qualified_at", { mode: "timestamp" }),
  },
  (t) => [index("referrals_referrer_idx").on(t.referrerId)],
);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type CreditLot = typeof creditLedger.$inferSelect;
