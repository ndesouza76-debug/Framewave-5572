/**
 * End-to-end proof that the credit system is enforced by the server.
 *
 * Runs against the live dev server over real HTTP with real sessions — nothing
 * here trusts client state. Veo has no quota on this key, so the spend path is
 * exercised directly through the same server-side helpers the generation route
 * uses, rather than through a real render.
 *
 *   cd packages/web && bun --env-file=../../.env scripts/verify-credits.ts
 */
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "../src/api";
import { getBalance, grantCredits, spendCredits } from "../src/api/lib/balance";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:4200";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  }
}

type Session = { client: AppRouterClient; userId: string; email: string };

/** Signs up a brand-new account and returns a cookie-authenticated client. */
async function signUp(tag: string): Promise<Session> {
  const email = `verify_${tag}_${Date.now().toString(36)}@framewave.test`;
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Test-Password-123!", name: `Verify ${tag}` }),
  });
  const body = (await res.json()) as { user?: { id: string }; message?: string };
  if (!res.ok || !body.user) throw new Error(`sign-up failed: ${res.status} ${body.message}`);

  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const link = new RPCLink({ url: `${BASE}/api/rpc`, headers: () => ({ cookie }) });
  return { client: createORPCClient(link), userId: body.user.id, email };
}

async function expectError(label: string, fn: () => Promise<unknown>, match?: RegExp) {
  try {
    const out = await fn();
    check(label, false, { unexpectedSuccess: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    check(label, match ? match.test(msg) : true, msg);
  }
}

const a = await signUp("a");
const b = await signUp("b");

console.log(`\n1. Free plan grants 100 real credits (user ${a.email})`);
const balA = await a.client.credits.balance();
check("plan allowance is 100", balA.plan === 100, balA);
check("plan id is free", balA.planId === "free", balA);
check("total starts at 100", balA.total === 100, balA);

console.log("\n2. Daily claim");
const claim1 = await a.client.credits.claimDaily();
check("free plan claim is +5", claim1.amount === 5, claim1);
check("streak starts at 1", claim1.streak === 1, claim1);
check("bonus credits land in the ledger", claim1.balance.bonus === 5, claim1.balance);
check("total is 105", claim1.balance.total === 105, claim1.balance);
await expectError("second claim same day is rejected", () => a.client.credits.claimDaily(), /already claimed/i);

console.log("\n3. Referral rules");
const rewardsA = await a.client.credits.rewards();
const codeA = rewardsA.referral.code;
check("referral code issued", /^[A-Z0-9]{4,16}$/.test(codeA), codeA);
await expectError("cannot refer yourself", () => a.client.credits.redeemReferral({ code: codeA }), /yourself/i);
await expectError("invalid code rejected", () => b.client.credits.redeemReferral({ code: "ZZZZZZZ" }), /valid/i);

const redeem = await b.client.credits.redeemReferral({ code: codeA });
check("referee gets +100", redeem.amount === 100, redeem);
check("referee total is 200", redeem.balance.total === 200, redeem.balance);
await expectError("code cannot be reused", () => b.client.credits.redeemReferral({ code: codeA }), /already used/i);

const rewardsA2 = await a.client.credits.rewards();
check("referrer sees 1 invite", rewardsA2.referral.invited === 1, rewardsA2.referral);
check("referrer reward still pending (unqualified)", rewardsA2.referral.qualified === 0, rewardsA2.referral);

console.log("\n4. Spend order: bonus ledger first, then plan allowance");
// b: 100 plan + 100 bonus. Spending 150 must take 100 bonus + 50 plan.
const spend = await spendCredits({
  userId: b.userId,
  cost: 150,
  source: "generation",
  idempotencyKey: `verify_gen_${b.userId}`,
});
check("charged", spend.charged, spend);
check("100 from the bonus ledger", spend.fromLedger === 100, spend);
check("50 from the plan allowance", spend.fromPlan === 50, spend);

const balB = await getBalance(b.userId);
check("bonus drained to 0", balB.bonus === 0, balB);
check("plan allowance down to 50", balB.plan === 50, balB);
check("total is 50", balB.total === 50, balB);

console.log("\n5. Idempotency");
const dup = await spendCredits({
  userId: b.userId,
  cost: 150,
  source: "generation",
  idempotencyKey: `verify_gen_${b.userId}`,
});
check("duplicate spend is a no-op", dup.duplicate === true && dup.charged === false, dup);
const balB2 = await getBalance(b.userId);
check("balance unchanged after duplicate", balB2.total === 50, balB2);

const g1 = await grantCredits({
  userId: b.userId,
  amount: 25,
  source: "promo",
  idempotencyKey: `verify_promo_${b.userId}`,
});
const g2 = await grantCredits({
  userId: b.userId,
  amount: 25,
  source: "promo",
  idempotencyKey: `verify_promo_${b.userId}`,
});
check("first grant applied", g1, g1);
check("duplicate grant refused", g2 === false, g2);
check("total is 75 after one grant", (await getBalance(b.userId)).total === 75, await getBalance(b.userId));

console.log("\n6. Server rejects unaffordable generations");
await expectError(
  "cinematic 8s (448 credits) blocked on 75 credits",
  () =>
    b.client.generations.create({
      mode: "text",
      prompt: "a verification clip that must never start",
      aspectRatio: "16:9",
      durationSeconds: 8,
      resolution: "1080p",
      tier: "cinematic",
      category: "general",
    }),
  /credits/i,
);
await expectError(
  "draft 4K rejected as an unsupported combination",
  () =>
    b.client.generations.create({
      mode: "text",
      prompt: "a verification clip that must never start",
      aspectRatio: "16:9",
      durationSeconds: 4,
      resolution: "4k",
      tier: "draft",
      category: "general",
    }),
  /doesn't support/i,
);

console.log("\n7. Cost table is served by the server, not hardcoded in clients");
const rates = await a.client.credits.rates();
check("draft 720p is 7 credits/sec", rates.perSecond.draft["720p"] === 7, rates.perSecond.draft);
check("draft has no 4K", rates.perSecond.draft["4k"] === null, rates.perSecond.draft);
check("cinematic 1080p is 56 credits/sec", rates.perSecond.cinematic["1080p"] === 56, rates.perSecond.cinematic);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
