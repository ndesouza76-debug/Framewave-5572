/**
 * Client mirror of the server credit model.
 *
 * MUST stay in sync with packages/web/src/api/lib/credits.ts. The server always
 * recomputes the real cost from the request — anything here is a preview only,
 * so a stale mirror can mislead the UI but can never under-charge an account.
 */

export const MODEL_TIERS = ["draft", "standard", "cinematic"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

export const RESOLUTION_VALUES = ["720p", "1080p", "4k"] as const;
export type Resolution = (typeof RESOLUTION_VALUES)[number];

export const CREDITS_PER_SECOND: Record<ModelTier, Record<Resolution, number | null>> = {
  draft: { "720p": 7, "1080p": 12, "4k": null },
  standard: { "720p": 14, "1080p": 17, "4k": 42 },
  cinematic: { "720p": 56, "1080p": 56, "4k": 84 },
};

export function isTierSupported(tier: ModelTier, resolution: Resolution): boolean {
  return CREDITS_PER_SECOND[tier]?.[resolution] != null;
}

export function resolutionsForTier(tier: ModelTier): Resolution[] {
  return RESOLUTION_VALUES.filter((r) => isTierSupported(tier, r));
}

/** Preview cost. Returns null for an unsupported combination. */
export function creditCost(
  tier: ModelTier,
  resolution: Resolution,
  durationSeconds: number,
): number | null {
  const perSecond = CREDITS_PER_SECOND[tier]?.[resolution];
  if (perSecond == null) return null;
  return perSecond * Math.max(1, Math.round(durationSeconds));
}

export const TIERS: {
  value: ModelTier;
  label: string;
  tagline: string;
  badge?: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    tagline: "Fast and cheap — iterate on the idea",
    badge: "Best value",
  },
  { value: "standard", label: "Standard", tagline: "The everyday balance", badge: "Popular" },
  { value: "cinematic", label: "Cinematic", tagline: "Highest fidelity Veo 3.1" },
];

/* ------------------------------------------------------------- plans ---- */

export const PLAN_ORDER = ["free", "spark", "creator", "studio", "scale"] as const;
export type PlanId = (typeof PLAN_ORDER)[number];

export type PlanCopy = {
  name: string;
  priceMonthly: number;
  credits: number;
  blurb: string;
  features: string[];
  featured?: boolean;
};

/** Mirrors autumn.config.ts. Prices in whole dollars. */
export const PLANS: Record<PlanId, PlanCopy> = {
  free: {
    name: "Free",
    priceMonthly: 0,
    credits: 100,
    blurb: "A real free tier — not a trial.",
    features: [
      "100 credits every month",
      "+5 bonus credits every day",
      "All three quality tiers",
      "No credit card, ever",
    ],
  },
  spark: {
    name: "Spark",
    priceMonthly: 9,
    credits: 400,
    blurb: "The cheapest paid AI video plan worth having.",
    features: [
      "400 credits / month",
      "+15 bonus credits every day",
      "1080p output",
      "Cancel anytime",
    ],
  },
  creator: {
    name: "Creator",
    priceMonthly: 19,
    credits: 900,
    blurb: "For creators shipping every week.",
    features: [
      "900 credits / month",
      "+15 bonus credits every day",
      "Image-to-video",
      "Priority queue",
    ],
    featured: true,
  },
  studio: {
    name: "Studio",
    priceMonthly: 49,
    credits: 2500,
    blurb: "Serious volume for pros and small teams.",
    features: [
      "2,500 credits / month",
      "Everything in Creator",
      "4K on Standard & Cinematic",
      "Highest priority",
    ],
  },
  scale: {
    name: "Scale",
    priceMonthly: 99,
    credits: 5500,
    blurb: "Our lowest price per credit.",
    features: [
      "5,500 credits / month",
      "Everything in Studio",
      "Lowest cost per video",
      "Early access to new models",
    ],
  },
};

/** Dollars per credit for a plan — used for the value comparison. */
export function dollarsPerCredit(planId: PlanId): number {
  const p = PLANS[planId];
  return p.priceMonthly === 0 ? 0 : p.priceMonthly / p.credits;
}

/** How many 8s Draft 720p videos a plan's monthly allowance buys. */
export function draftVideosPerMonth(planId: PlanId): number {
  return Math.floor(PLANS[planId].credits / (CREDITS_PER_SECOND.draft["720p"]! * 8));
}

/** How many 8s Standard 720p videos a plan's monthly allowance buys. */
export function standardVideosPerMonth(planId: PlanId): number {
  return Math.floor(PLANS[planId].credits / (CREDITS_PER_SECOND.standard["720p"]! * 8));
}

/* --------------------------------------------------------- pay as you go ---- */

export const CREDIT_PACKS = [
  { planId: "pack_500", credits: 500, price: 12 },
  { planId: "pack_1200", credits: 1200, price: 25, best: true },
  { planId: "pack_3000", credits: 3000, price: 55 },
] as const;

/** Price of a single credit bought on its own. */
export const SINGLE_CREDIT_PRICE = 0.03;

/* ---------------------------------------------------------- competitors ---- */

/**
 * Higgsfield's published pricing, captured 2026-08-05 from higgsfield.ai/pricing.
 * Their cheapest prices require an ANNUAL commitment; the monthly figure is what
 * you actually pay month-to-month. We compare on dollars and commitment terms —
 * never on raw credit counts, because a Higgsfield credit and a Framewave credit
 * buy different amounts of compute and that comparison would be dishonest.
 */
export const HIGGSFIELD = {
  name: "Higgsfield",
  freeTier: false,
  annualLockIn: true,
  plans: [
    { name: "Starter", monthly: 19, annualMonthly: 19 },
    { name: "Plus", monthly: 59, annualMonthly: 47 },
    { name: "Ultra", monthly: 129, annualMonthly: 99 },
  ],
} as const;

/** Honest, checkable claims for the comparison block. */
export const COMPARISON_ROWS: {
  label: string;
  framewave: string;
  higgsfield: string;
  win: boolean;
}[] = [
  {
    label: "Free plan",
    framewave: "100 credits/mo, forever",
    higgsfield: "None",
    win: true,
  },
  {
    label: "Cheapest paid plan",
    framewave: "$9 / month",
    higgsfield: "$19 / month",
    win: true,
  },
  {
    label: "Best price needs an annual lock-in",
    framewave: "No — monthly is the price",
    higgsfield: "Yes",
    win: true,
  },
  {
    label: "Daily bonus credits",
    framewave: "Up to 15 / day",
    higgsfield: "None",
    win: true,
  },
  {
    label: "Top-up credits expire",
    framewave: "Never",
    higgsfield: "Expire with the plan",
    win: true,
  },
  {
    label: "Buy a single credit",
    framewave: "Yes — $0.03",
    higgsfield: "No, packs only",
    win: true,
  },
];
