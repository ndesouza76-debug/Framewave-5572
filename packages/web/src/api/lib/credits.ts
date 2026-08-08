/**
 * Credit cost model.
 *
 * Foundation: 1 credit === $0.0072 of Veo compute cost.
 * That number is not arbitrary — the cheapest credit Framewave sells is the
 * Scale plan at $99 / 5,500 credits = $0.018/credit. Buying $0.0072 of compute
 * with $0.018 of revenue is a 60% gross margin, the approved floor. Every other
 * plan and every pay-as-you-go pack sells credits above $0.018, so no path
 * through the product can be sold below 60%.
 *
 * Rates below are derived from the official Gemini API per-second Veo 3.1
 * prices and rounded UP to a whole credit, which only ever helps the margin.
 *
 * This table is the single source of truth for the backend charge. It is
 * mirrored (as positional-arg client helpers) in:
 *   - packages/web/src/web/lib/constants.ts
 *   - packages/mobile/constants/studio.ts
 * Keep all three in sync.
 */

export const MODEL_TIERS = ["draft", "standard", "cinematic"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

export const RESOLUTIONS = ["720p", "1080p", "4k"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

/** Provider model id backing each tier. */
export const TIER_MODEL: Record<ModelTier, string> = {
  draft: "veo-3.1-lite-generate-preview",
  standard: "veo-3.1-fast-generate-preview",
  cinematic: "veo-3.1-generate-preview",
};

/**
 * Credits per second of output, by tier and resolution.
 * `null` means the tier does not support that resolution.
 * Underlying provider cost per second in comments.
 */
export const CREDITS_PER_SECOND: Record<ModelTier, Record<Resolution, number | null>> = {
  // Veo 3.1 Lite — $0.05 / $0.08, no 4k
  draft: { "720p": 7, "1080p": 12, "4k": null },
  // Veo 3.1 Fast — $0.10 / $0.12 / $0.30
  standard: { "720p": 14, "1080p": 17, "4k": 42 },
  // Veo 3.1 Standard — $0.40 flat for 720p and 1080p, $0.60 for 4k
  cinematic: { "720p": 56, "1080p": 56, "4k": 84 },
};

/** Durations Veo accepts. */
export const DURATIONS = [4, 6, 8] as const;

export function isTierSupported(tier: ModelTier, resolution: Resolution): boolean {
  return CREDITS_PER_SECOND[tier]?.[resolution] != null;
}

/** Resolutions a given tier can actually produce. */
export function resolutionsForTier(tier: ModelTier): Resolution[] {
  return RESOLUTIONS.filter((r) => isTierSupported(tier, r));
}

/**
 * Cost of one generation, in credits. Throws on an unsupported combination so
 * a bad request can never be charged at an undefined rate.
 */
export function creditCost(opts: {
  tier: ModelTier;
  resolution: Resolution;
  durationSeconds: number;
}): number {
  const perSecond = CREDITS_PER_SECOND[opts.tier]?.[opts.resolution];
  if (perSecond == null) {
    throw new Error(`${opts.tier} does not support ${opts.resolution}`);
  }
  const seconds = Math.max(1, Math.round(opts.durationSeconds));
  return perSecond * seconds;
}

/** Human-facing description of a tier, used by the studio UI and pricing page. */
export const TIER_INFO: Record<
  ModelTier,
  { label: string; tagline: string; eightSecond720p: number }
> = {
  draft: {
    label: "Draft",
    tagline: "Fastest and cheapest. Great for iterating on an idea.",
    eightSecond720p: creditCost({ tier: "draft", resolution: "720p", durationSeconds: 8 }),
  },
  standard: {
    label: "Standard",
    tagline: "The everyday balance of quality, speed and cost.",
    eightSecond720p: creditCost({ tier: "standard", resolution: "720p", durationSeconds: 8 }),
  },
  cinematic: {
    label: "Cinematic",
    tagline: "Highest fidelity Veo 3.1. Expensive — save it for finals.",
    eightSecond720p: creditCost({ tier: "cinematic", resolution: "720p", durationSeconds: 8 }),
  },
};
