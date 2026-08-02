import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Film,
  Clapperboard,
  Camera,
  Palette,
  Zap,
  Sun,
  Moon,
  Waves,
  Building2,
  Rocket,
  Leaf,
  Ghost,
  Gamepad2,
} from "lucide-react";

/** Aspect ratios supported by Veo. */
export const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape", hint: "16:9" },
  { value: "9:16", label: "Portrait", hint: "9:16" },
] as const;

export const RESOLUTIONS = [
  { value: "720p", label: "720p", hint: "Standard" },
  { value: "1080p", label: "1080p", hint: "Full HD" },
] as const;

export const DURATIONS = [4, 6, 8] as const;

/** Style presets — appended to the prompt and stored for reference. */
export const STYLE_PRESETS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "Cinematic", label: "Cinematic", icon: Film },
  { value: "Photorealistic", label: "Realistic", icon: Camera },
  { value: "Anime", label: "Anime", icon: Sparkles },
  { value: "3D Animation", label: "3D Animation", icon: Clapperboard },
  { value: "Claymation", label: "Claymation", icon: Palette },
  { value: "Cyberpunk", label: "Cyberpunk", icon: Zap },
  { value: "Film Noir", label: "Film Noir", icon: Moon },
  { value: "Golden Hour", label: "Golden Hour", icon: Sun },
];

/** Camera motion presets — encoded into the prompt for Veo. */
export const CAMERA_MOTIONS: { value: string; label: string }[] = [
  { value: "Static shot", label: "Static" },
  { value: "Slow dolly in", label: "Dolly In" },
  { value: "Dolly out", label: "Dolly Out" },
  { value: "Orbit around subject", label: "Orbit" },
  { value: "Aerial drone shot", label: "Drone" },
  { value: "Handheld tracking", label: "Handheld" },
  { value: "Crane up reveal", label: "Crane Up" },
  { value: "Whip pan", label: "Whip Pan" },
];

export const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "general", label: "General", icon: Film },
  { value: "nature", label: "Nature", icon: Leaf },
  { value: "scifi", label: "Sci-Fi", icon: Rocket },
  { value: "cityscape", label: "Cityscape", icon: Building2 },
  { value: "abstract", label: "Abstract", icon: Waves },
  { value: "character", label: "Character", icon: Ghost },
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
];

/** Mirror of api/lib/credits.ts — keep in sync. */
export function creditCost(durationSeconds: number, resolution: string): number {
  const perSecond = resolution === "1080p" ? 3 : 2;
  return Math.max(perSecond, Math.round(durationSeconds * perSecond));
}

export const PLAN_ORDER = ["free", "starter", "pro", "studio"] as const;

/** Marketing copy for the pricing section (limits mirror autumn.config.ts). */
export const PLAN_COPY: Record<string, { blurb: string; features: string[] }> = {
  free: {
    blurb: "Kick the tires and make your first clips.",
    features: ["30 credits / month", "720p output", "Public gallery access", "Standard queue"],
  },
  starter: {
    blurb: "For creators shipping regular content.",
    features: ["300 credits / month", "720p & 1080p", "Prompt enhancement", "Download & share"],
  },
  pro: {
    blurb: "Serious volume for pros and small teams.",
    features: ["1,200 credits / month", "1080p priority", "Image-to-video", "Priority queue"],
  },
  studio: {
    blurb: "Maximum firepower for studios.",
    features: ["4,000 credits / month", "Everything in Pro", "Highest priority", "Early features"],
  },
};
