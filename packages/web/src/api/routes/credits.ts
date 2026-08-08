import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { getBalance, grantCredits } from "../lib/balance";
import {
  DAILY_FREE,
  DAILY_PAID,
  MISSIONS,
  MISSION_BY_ID,
  REFERRAL_REFEREE,
  REFERRAL_REFERRER,
  STREAK_BONUS,
  STREAK_LENGTH,
  dayKey,
  makeReferralCode,
  previousDay,
} from "../lib/rewards";
import { CREDITS_PER_SECOND, TIER_INFO } from "../lib/credits";

/** Returns the user's referral code, creating it on first access. */
async function ensureReferralCode(userId: string): Promise<string> {
  const [existing] = await db
    .select()
    .from(schema.referralCodes)
    .where(eq(schema.referralCodes.userId, userId));
  if (existing) return existing.code;

  // Retry on the (astronomically unlikely) code collision.
  for (let i = 0; i < 5; i++) {
    const code = makeReferralCode();
    try {
      await db.insert(schema.referralCodes).values({ userId, code });
      return code;
    } catch {
      /* collision — try again */
    }
  }
  throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Could not create a referral code." });
}

/** Awards a one-off mission if it hasn't already been claimed. Safe to call repeatedly. */
export async function awardMission(userId: string, missionId: string): Promise<boolean> {
  const mission = MISSION_BY_ID.get(missionId);
  if (!mission) return false;

  try {
    await db.insert(schema.missionClaims).values({
      userId,
      missionId,
      creditsAwarded: mission.credits,
    });
  } catch {
    return false; // already claimed — composite PK rejected it
  }

  await grantCredits({
    userId,
    amount: mission.credits,
    source: "mission",
    idempotencyKey: `mission:${userId}:${missionId}`,
    note: mission.label,
  });
  return true;
}

/**
 * Pays out a pending referral once the referee has actually generated
 * something. Called from the generation success path.
 */
export async function qualifyReferral(refereeId: string): Promise<void> {
  const [ref] = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.refereeId, refereeId));
  if (!ref || ref.status !== "pending") return;

  const updated = await db
    .update(schema.referrals)
    .set({ status: "qualified", qualifiedAt: new Date() })
    .where(and(eq(schema.referrals.refereeId, refereeId), eq(schema.referrals.status, "pending")))
    .returning({ refereeId: schema.referrals.refereeId });
  if (updated.length === 0) return; // someone else qualified it first

  await grantCredits({
    userId: ref.referrerId,
    amount: REFERRAL_REFERRER,
    source: "referral",
    idempotencyKey: `referral:${ref.referrerId}:${refereeId}`,
    note: "A friend you invited made their first video",
  });
  await awardMission(ref.referrerId, "first_referral");
}

export const credits = {
  /** Effective balance across the plan allowance and the bonus ledger. */
  balance: authed.handler(({ context }) => getBalance(context.user.id)),

  /** The credit cost table, so clients never hardcode prices. */
  rates: authed.handler(() => ({ perSecond: CREDITS_PER_SECOND, tiers: TIER_INFO })),

  /** Recent credit movements, newest first. */
  history: authed.handler(async ({ context }) => {
    return db
      .select()
      .from(schema.creditEvents)
      .where(eq(schema.creditEvents.userId, context.user.id))
      .orderBy(desc(schema.creditEvents.createdAt))
      .limit(50);
  }),

  /**
   * Everything the rewards screen needs: daily claim state, streak, missions,
   * referral code and stats.
   */
  rewards: authed.handler(async ({ context }) => {
    const userId = context.user.id;
    const today = dayKey();

    const [claims, missionRows, code, refRows, balance] = await Promise.all([
      db
        .select()
        .from(schema.dailyClaims)
        .where(eq(schema.dailyClaims.userId, userId))
        .orderBy(desc(schema.dailyClaims.day))
        .limit(2),
      db.select().from(schema.missionClaims).where(eq(schema.missionClaims.userId, userId)),
      ensureReferralCode(userId),
      db.select().from(schema.referrals).where(eq(schema.referrals.referrerId, userId)),
      getBalance(userId),
    ]);

    const isPaid = balance.planId !== "free";
    const last = claims[0];
    const claimedToday = last?.day === today;
    // The streak survives if the last claim was today or yesterday.
    const streak =
      last && (last.day === today || last.day === previousDay(today)) ? last.streak : 0;
    const nextStreak = claimedToday ? streak : streak + 1;

    const claimedMissions = new Set(missionRows.map((m) => m.missionId));

    return {
      daily: {
        amount: isPaid ? DAILY_PAID : DAILY_FREE,
        claimedToday,
        streak,
        /** How many more consecutive days until the streak bonus. */
        untilBonus: Math.max(0, STREAK_LENGTH - (nextStreak % STREAK_LENGTH || STREAK_LENGTH)),
        streakBonus: STREAK_BONUS,
        streakLength: STREAK_LENGTH,
      },
      missions: MISSIONS.map((m) => ({ ...m, claimed: claimedMissions.has(m.id) })),
      referral: {
        code,
        referrerReward: REFERRAL_REFERRER,
        refereeReward: REFERRAL_REFEREE,
        invited: refRows.length,
        qualified: refRows.filter((r) => r.status === "qualified").length,
        earned: refRows.filter((r) => r.status === "qualified").length * REFERRAL_REFERRER,
      },
      balance,
    };
  }),

  /**
   * Claim today's free credits. The (user, day) primary key makes a second
   * claim on the same day impossible, including under concurrent requests.
   */
  claimDaily: authed.handler(async ({ context }) => {
    const userId = context.user.id;
    const today = dayKey();

    const balance = await getBalance(userId);
    const amount = balance.planId !== "free" ? DAILY_PAID : DAILY_FREE;

    const [last] = await db
      .select()
      .from(schema.dailyClaims)
      .where(eq(schema.dailyClaims.userId, userId))
      .orderBy(desc(schema.dailyClaims.day))
      .limit(1);

    const streak = last?.day === previousDay(today) ? last.streak + 1 : 1;

    try {
      await db
        .insert(schema.dailyClaims)
        .values({ userId, day: today, creditsAwarded: amount, streak });
    } catch {
      throw new ORPCError("CONFLICT", { message: "You've already claimed your credits today." });
    }

    await grantCredits({
      userId,
      amount,
      source: "daily",
      idempotencyKey: `daily:${userId}:${today}`,
      note: "Daily credits",
    });

    let bonus = 0;
    if (streak > 0 && streak % STREAK_LENGTH === 0) {
      bonus = STREAK_BONUS;
      await grantCredits({
        userId,
        amount: bonus,
        source: "streak",
        idempotencyKey: `streak:${userId}:${today}`,
        note: `${STREAK_LENGTH}-day streak`,
      });
    }

    return { amount, bonus, streak, balance: await getBalance(userId) };
  }),

  /**
   * Re-checks the automatic missions and awards any that now qualify.
   * Idempotent — already-claimed missions are skipped.
   */
  syncMissions: authed.handler(async ({ context }) => {
    const userId = context.user.id;
    const awarded: string[] = [];

    const rows = await db
      .select({
        id: schema.generations.id,
        status: schema.generations.status,
        isPublic: schema.generations.isPublic,
      })
      .from(schema.generations)
      .where(eq(schema.generations.userId, userId));

    const completed = rows.filter((r) => r.status === "completed");
    if (completed.length > 0 && (await awardMission(userId, "first_generation"))) {
      awarded.push("first_generation");
    }
    if (completed.some((r) => r.isPublic) && (await awardMission(userId, "publish_gallery"))) {
      awarded.push("publish_gallery");
    }
    if (
      context.user.name?.trim() &&
      context.user.image &&
      (await awardMission(userId, "complete_profile"))
    ) {
      awarded.push("complete_profile");
    }

    return { awarded, balance: await getBalance(userId) };
  }),

  /**
   * Redeem someone else's referral code. Only valid before the new user has
   * generated anything, and only once per account.
   */
  redeemReferral: authed
    .input(z.object({ code: z.string().min(4).max(16) }))
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const code = input.code.trim().toUpperCase();

      const [owner] = await db
        .select()
        .from(schema.referralCodes)
        .where(eq(schema.referralCodes.code, code));
      if (!owner) throw new ORPCError("NOT_FOUND", { message: "That code isn't valid." });
      if (owner.userId === userId) {
        throw new ORPCError("BAD_REQUEST", { message: "You can't refer yourself." });
      }

      const [already] = await db
        .select()
        .from(schema.referrals)
        .where(eq(schema.referrals.refereeId, userId));
      if (already) {
        throw new ORPCError("CONFLICT", { message: "You've already used a referral code." });
      }

      // Only brand-new accounts can be referred.
      const [existingGen] = await db
        .select({ id: schema.generations.id })
        .from(schema.generations)
        .where(eq(schema.generations.userId, userId))
        .limit(1);
      if (existingGen) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Referral codes can only be applied before your first video.",
        });
      }

      try {
        await db
          .insert(schema.referrals)
          .values({ refereeId: userId, referrerId: owner.userId, status: "pending" });
      } catch {
        throw new ORPCError("CONFLICT", { message: "You've already used a referral code." });
      }

      await grantCredits({
        userId,
        amount: REFERRAL_REFEREE,
        source: "referral_signup",
        idempotencyKey: `referral_signup:${userId}`,
        note: "Welcome bonus from a referral",
      });

      return { amount: REFERRAL_REFEREE, balance: await getBalance(userId) };
    }),
};
