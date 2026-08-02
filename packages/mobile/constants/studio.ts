/** Mobile studio option sets — mirror packages/web/src/web/lib/constants.ts. */

export const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape" },
  { value: "9:16", label: "Portrait" },
] as const;

export const RESOLUTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
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

/** Mirror of api/lib/credits.ts — keep in sync. */
export function creditCost(durationSeconds: number, resolution: string): number {
  const perSecond = resolution === "1080p" ? 3 : 2;
  return Math.max(perSecond, Math.round(durationSeconds * perSecond));
}

/** Signature brand gradient (matches web). */
export const BRAND_GRADIENT = ["#FF7A45", "#FF3D77", "#8B5CF6"] as const;
