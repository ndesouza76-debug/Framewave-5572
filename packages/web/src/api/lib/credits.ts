/**
 * Credit cost model for a generation.
 * Base cost scales with duration and resolution. Kept intentionally simple and
 * centralized so both the studio UI (preview cost) and the backend (charge)
 * agree. The same numbers are mirrored in the web `lib/pricing.ts`.
 */
export function creditCost(opts: { durationSeconds: number; resolution: string }): number {
  const perSecond = opts.resolution === "1080p" ? 3 : 2;
  return Math.max(perSecond, Math.round(opts.durationSeconds * perSecond));
}
