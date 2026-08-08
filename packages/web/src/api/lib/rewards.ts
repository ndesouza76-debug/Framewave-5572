/**
 * Loyalty programme definitions.
 *
 * Every award routes through `grantCredits` with a deterministic idempotency
 * key, so each reward is structurally claimable exactly once.
 */

/** Daily claim size depends on whether the user pays us. */
export const DAILY_FREE = 5;
export const DAILY_PAID = 15;

/** Bonus on top of the daily claim when a 7-day streak completes. */
export const STREAK_LENGTH = 7;
export const STREAK_BONUS = 50;

/** Referral rewards. Referrer is paid only once the referee generates. */
export const REFERRAL_REFERRER = 200;
export const REFERRAL_REFEREE = 100;

export type Mission = {
  id: string;
  label: string;
  description: string;
  credits: number;
};

/** One-off missions. Awarded automatically when the condition is detected. */
export const MISSIONS: Mission[] = [
  {
    id: "first_generation",
    label: "Make your first video",
    description: "Generate anything at all.",
    credits: 25,
  },
  {
    id: "publish_gallery",
    label: "Publish to the gallery",
    description: "Share a finished video publicly.",
    credits: 25,
  },
  {
    id: "complete_profile",
    label: "Complete your profile",
    description: "Add your name and a profile image.",
    credits: 15,
  },
  {
    id: "first_referral",
    label: "Invite a friend",
    description: "Get one friend to generate their first video.",
    credits: 15,
  },
];

export const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

/** UTC calendar day key, e.g. "2026-08-05". */
export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** The UTC day before `day`. */
export function previousDay(day: string): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return dayKey(d);
}

/** Generates a short, unambiguous referral code (no 0/O/1/I). */
export function makeReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 7; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
