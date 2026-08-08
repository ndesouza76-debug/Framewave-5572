/** Mobile studio option sets — mirror packages/web/src/web/lib/constants.ts. */

export const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape" },
  { value: "9:16", label: "Portrait" },
] as const;

export const RESOLUTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4k", label: "4K" },
] as const;

export const DURATIONS = [4, 6, 8] as const;

export const STYLE_PRESETS = [
  "Cinematic",
  "Photorealistic",
  "Anime",
  "3D Animation",
  "Claymation",
  "Cyberpunk",
  "Film Noir",
  "Golden Hour",
] as const;

export const CAMERA_MOTIONS = [
  { value: "Static shot", label: "Static" },
  { value: "Slow dolly in", label: "Dolly In" },
  { value: "Dolly out", label: "Dolly Out" },
  { value: "Orbit around subject", label: "Orbit" },
  { value: "Aerial drone shot", label: "Drone" },
  { value: "Handheld tracking", label: "Handheld" },
  { value: "Crane up reveal", label: "Crane Up" },
  { value: "Whip pan", label: "Whip Pan" },
] as const;

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "nature", label: "Nature" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "cityscape", label: "Cityscape" },
  { value: "abstract", label: "Abstract" },
  { value: "character", label: "Character" },
  { value: "gaming", label: "Gaming" },
] as const;

/**
 * Mirror of packages/web/src/api/lib/credits.ts — keep in sync.
 * The server always recomputes the real cost, so this is a preview only.
 */
export const MODEL_TIERS = ["draft", "standard", "cinematic"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];
export type Resolution = "720p" | "1080p" | "4k";

export const CREDITS_PER_SECOND: Record<ModelTier, Record<Resolution, number | null>> = {
  draft: { "720p": 7, "1080p": 12, "4k": null },
  standard: { "720p": 14, "1080p": 17, "4k": 42 },
  cinematic: { "720p": 56, "1080p": 56, "4k": 84 },
};

export const TIERS: { value: ModelTier; label: string; tagline: string }[] = [
  { value: "draft", label: "Draft", tagline: "Fast & cheap" },
  { value: "standard", label: "Standard", tagline: "Everyday balance" },
  { value: "cinematic", label: "Cinematic", tagline: "Top fidelity" },
];

export function isTierSupported(tier: ModelTier, resolution: Resolution): boolean {
  return CREDITS_PER_SECOND[tier]?.[resolution] != null;
}

export function resolutionsForTier(tier: ModelTier): Resolution[] {
  return (["720p", "1080p", "4k"] as Resolution[]).filter((r) => isTierSupported(tier, r));
}

/** Preview cost. Returns 0 for an unsupported combination. */
export function creditCost(
  tier: ModelTier,
  resolution: Resolution,
  durationSeconds: number,
): number {
  const perSecond = CREDITS_PER_SECOND[tier]?.[resolution];
  if (perSecond == null) return 0;
  return perSecond * Math.max(1, Math.round(durationSeconds));
}

/** Signature brand gradient (matches web). */
export const BRAND_GRADIENT = ["#FF7A45", "#FF3D77", "#8B5CF6"] as const;
