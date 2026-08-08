/**
 * Credit balance and spending.
 *
 * Two pools back a user's balance:
 *   1. The Autumn plan allowance — resets every billing month.
 *   2. The local bonus ledger (`credit_ledger`) — daily claims, streaks,
 *      referrals, missions, and purchased pay-as-you-go packs. Survives resets.
 *
 * Spend order is deliberately ledger-first, soonest-expiring-first: it burns
 * the credits that would otherwise be lost before touching the allowance the
 * user has already paid for.
 *
 * Everything here is server-side. Clients only ever *read* a balance; they can
 * never assert one.
 */
import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { Autumn } from "autumn-js";
import { db } from "../database";
import * as schema from "../database/schema";

const autumn = new Autumn();

export type Balance = {
  /** Unspent credits from the Autumn plan allowance. */
  plan: number;
  /** Credits granted by the current plan this period. */
  planGranted: number;
  /** Unspent bonus + purchased credits. */
  bonus: number;
  /** plan + bonus — what the user can actually spend right now. */
  total: number;
  /** When the plan allowance next resets, epoch ms. */
  nextResetAt: number | null;
  planId: string;
};

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Sum of unexpired, unspent bonus credits. */
export async function bonusBalance(userId: string): Promise<number> {
  const now = new Date();
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.creditLedger.remaining}), 0)` })
    .from(schema.creditLedger)
    .where(
      and(
        eq(schema.creditLedger.userId, userId),
        gt(schema.creditLedger.remaining, 0),
        or(isNull(schema.creditLedger.expiresAt), gt(schema.creditLedger.expiresAt, now)),
      ),
    );
  return Number(row?.total ?? 0);
}

/** Full effective balance across both pools. */
export async function getBalance(userId: string): Promise<Balance> {
  const [bonus, check] = await Promise.all([
    bonusBalance(userId),
    autumn
      .check({ customerId: userId, featureId: "credits" })
      .catch(() => null as Awaited<ReturnType<typeof autumn.check>> | null),
  ]);

  const b = check?.balance;
  const plan = Math.max(0, Number(b?.remaining ?? 0));
  const planGranted = Math.max(0, Number(b?.granted ?? 0));
  // Autumn's REST payload is snake_case while the SDK types are camelCase —
  // read both so a client-version change can't silently break the plan id.
  const bd = b?.breakdown?.[0] as
    | { planId?: string | null; plan_id?: string | null }
    | undefined;
  const planId = bd?.planId ?? bd?.plan_id ?? "free";
  const raw = b as unknown as { nextResetAt?: number | null; next_reset_at?: number | null } | undefined;

  return {
    plan,
    planGranted,
    bonus,
    total: plan + bonus,
    nextResetAt: raw?.nextResetAt ?? raw?.next_reset_at ?? null,
    planId,
  };
}

/** True when the user can afford `cost` right now. */
export async function canAfford(userId: string, cost: number): Promise<boolean> {
  const { total } = await getBalance(userId);
  return total >= cost;
}

/**
 * Grant bonus credits.
 * `idempotencyKey` must be unique per logical grant — the unique index on
 * credit_events is what guarantees a bonus can never be awarded twice, even
 * under concurrent requests. Returns false when the grant was already applied.
 */
export async function grantCredits(opts: {
  userId: string;
  amount: number;
  source: string;
  idempotencyKey: string;
  note?: string;
  expiresAt?: Date | null;
}): Promise<boolean> {
  if (opts.amount <= 0) return false;

  try {
    // Claim the idempotency key first. If this throws on the unique
    // constraint, the grant already happened and we must not issue a lot.
    await db.insert(schema.creditEvents).values({
      id: id("cev"),
      userId: opts.userId,
      delta: opts.amount,
      source: opts.source,
      idempotencyKey: opts.idempotencyKey,
    });
  } catch {
    return false;
  }

  await db.insert(schema.creditLedger).values({
    id: id("clot"),
    userId: opts.userId,
    amount: opts.amount,
    remaining: opts.amount,
    source: opts.source,
    note: opts.note,
    expiresAt: opts.expiresAt ?? null,
  });

  return true;
}

export type SpendResult = {
  charged: boolean;
  fromLedger: number;
  fromPlan: number;
  /** Set when the spend was skipped because this key was already charged. */
  duplicate?: boolean;
};

/**
 * Charge `cost` credits, ledger first then the Autumn plan allowance.
 *
 * Idempotent: `idempotencyKey` (the generation id for a generation charge) is
 * written to credit_events inside the same path, so a retried or duplicated
 * call is a no-op rather than a double charge.
 *
 * Call this only after the work succeeded — a failed generation is free.
 */
export async function spendCredits(opts: {
  userId: string;
  cost: number;
  source: string;
  idempotencyKey: string;
}): Promise<SpendResult> {
  if (opts.cost <= 0) return { charged: true, fromLedger: 0, fromPlan: 0 };

  // Reserve the idempotency key up front.
  try {
    await db.insert(schema.creditEvents).values({
      id: id("cev"),
      userId: opts.userId,
      delta: -opts.cost,
      source: opts.source,
      idempotencyKey: opts.idempotencyKey,
    });
  } catch {
    return { charged: false, fromLedger: 0, fromPlan: 0, duplicate: true };
  }

  let outstanding = opts.cost;
  let fromLedger = 0;

  const now = new Date();
  const lots = await db
    .select()
    .from(schema.creditLedger)
    .where(
      and(
        eq(schema.creditLedger.userId, opts.userId),
        gt(schema.creditLedger.remaining, 0),
        or(isNull(schema.creditLedger.expiresAt), gt(schema.creditLedger.expiresAt, now)),
      ),
    )
    // Soonest-expiring first; nulls (never expire) sort last in SQLite.
    .orderBy(asc(schema.creditLedger.expiresAt), asc(schema.creditLedger.createdAt));

  for (const lot of lots) {
    if (outstanding <= 0) break;
    const take = Math.min(lot.remaining, outstanding);
    // Guarded update: `remaining >= take` makes the decrement safe against a
    // concurrent spend draining the same lot.
    const res = await db
      .update(schema.creditLedger)
      .set({ remaining: sql`${schema.creditLedger.remaining} - ${take}` })
      .where(
        and(eq(schema.creditLedger.id, lot.id), sql`${schema.creditLedger.remaining} >= ${take}`),
      )
      .returning({ id: schema.creditLedger.id });
    if (res.length > 0) {
      outstanding -= take;
      fromLedger += take;
    }
  }

  const fromPlan = outstanding;
  if (fromPlan > 0) {
    await autumn
      .track({ customerId: opts.userId, featureId: "credits", value: fromPlan })
      .catch((e) => console.error("[credits] autumn track failed:", e));
  }

  await db
    .update(schema.creditEvents)
    .set({ fromLedger, fromPlan })
    .where(eq(schema.creditEvents.idempotencyKey, opts.idempotencyKey));

  return { charged: true, fromLedger, fromPlan };
}

/** Reverse a spend (e.g. a completed generation later found to be corrupt). */
export async function refundCredits(opts: {
  userId: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const [ev] = await db
    .select()
    .from(schema.creditEvents)
    .where(eq(schema.creditEvents.idempotencyKey, opts.idempotencyKey));
  if (!ev || ev.delta >= 0) return false;

  return grantCredits({
    userId: opts.userId,
    amount: Math.abs(ev.delta),
    source: "refund",
    idempotencyKey: `refund:${opts.idempotencyKey}`,
    note: "Refund for a failed generation",
  });
}
