# Framewave — pricing & credits rebuild

## Locked economics (user-approved 2026-08-05)
- Grid approved as-is: Free $0/100 · Spark $9/400 · Creator $19/900 · Studio $49/2,500 · Scale $99/5,500. Monthly, no annual lock-in.
- Margin floor: 60%. Conflict with the 44-56% grid resolved by lowering the credit burn rate,
  NOT by changing prices. 1 credit === $0.0072 of Veo compute (was $0.01).
  Cheapest credit sold = Scale $99/5500 = $0.018/cr -> exactly 60% margin. Everything else is above.
- Cinematic (Veo 3.1 Standard) available to EVERYONE including Free.
- Daily claim: Free +5/day, Paid +15/day.
- PAYG: packs 500/$12, 1200/$25, 3000/$55 + single-credit top-up at $0.03/credit. Never expire.

## Credit cost table (COGS/credit <= $0.0072 everywhere)
| Tier | Model | 720p | 1080p | 4k |
|---|---|---|---|---|
| Draft | veo-3.1-lite-generate-preview | 7 cr/s | 12 cr/s | n/a |
| Standard | veo-3.1-fast-generate-preview | 14 cr/s | 17 cr/s | 42 cr/s |
| Cinematic | veo-3.1-generate-preview | 56 cr/s | 56 cr/s | 84 cr/s |

8s clip: Draft 720p 56 · Draft 1080p 96 · Standard 720p 112 · Standard 1080p 136 · Cinematic 448.

## Honesty constraint
Cannot beat Higgsfield on raw credit counts (different units) or on Veo-Standard per-video cost
without selling below cost. Compare only $/month, videos-per-dollar on like tiers, and the things
they genuinely lack: a real free tier, no annual lock-in, non-expiring PAYG credits.

## Steps
- [x] autumn.config.ts rewritten: free=100, 4 paid plans, 3 packs, 1 metered top-up
- [x] `bunx atmn push --yes` -> push complete; fresh customer verified granted 100 / remaining 100
- [x] BUG FOUND+FIXED: Autumn price.amount is DOLLARS not cents. Old config said 1200 = $1,200/mo.
      Pricing page divides by 100 -> must stop dividing.
- [ ] DB: credit_ledger, credit_events, daily_claims, mission_claims, referral_codes, referrals
- [ ] api/lib/credits.ts -> tier table; mirror to web lib + mobile constants
- [ ] api/lib/balance.ts -> effective balance + atomic idempotent spend (ledger first, then Autumn)
- [ ] routes/credits.ts -> balance, claimDaily, missions, referral
- [ ] generations.ts -> gate + spend via new path, model tier field
- [ ] UI web: pricing page w/ comparison, rewards page, studio tier selector + live cost
- [ ] UI mobile: mirror
- [ ] e2e test proving server-side decrement + no double claim
- [ ] lint / build / typecheck, restart dev servers (web 4200, mobile 4300), deliver

## Known blockers
- GEMINI_API_KEY has no Veo quota (429 RESOURCE_EXHAUSTED). No generation has completed end-to-end.
  Credit spend path must therefore be proven by a direct test harness, not by a real generation.
- Existing free customers sit on an older Autumn plan version -> need backfill to 100.

## Session close-out (Aug 8)
- Autumn plan-version backfill SOLVED: the cancel param is `cancel_immediately: true`
  (NOT `cancel: "immediately"`, which the API rejects with a misleading message).
  Flow: POST /v1/cancel {customer_id, product_id, cancel_immediately:true} -> POST /v1/attach {customer_id, product_id}.
  Both legacy users (WSDEZeMD..., 6Lmew2x4...) re-checked: granted=100, remaining=100, plan_id=free.
- Mobile account.tsx now reads server balance (total/plan/bonus) via creditsBalanceOptions + links to Rewards.
  Also fixed `plan.price.amount / 100` -> `amount` (Autumn prices are dollars).
- Assets: og-image.png rebuilt at 1200x630 from the brand mark (was 6.5MB template placeholder);
  mobile icon/adaptive-icon/splash-icon/favicon generated from icon-512.png.
- Verified: root lint 0/0, web typecheck+build, mobile typecheck, verify-credits.ts 32 passed / 0 failed.
- STILL BLOCKED: Veo 429 RESOURCE_EXHAUSTED — GEMINI_API_KEY has no paid Veo quota, so no real
  generation has completed end-to-end. Credit spend path proven only via the e2e harness.
- Left in DB: 4 throwaway verify_*@framewave.test users (no psql in sandbox; harmless).
