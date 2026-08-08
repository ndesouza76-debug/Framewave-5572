# Framewave — Pricing & Credits Redesign (proposal, needs sign-off)

## 1. What Higgsfield actually charges (pulled live from higgsfield.ai/pricing)

| Plan | Price | Credits/mo | $/credit | Notes |
|---|---|---|---|---|
| Starter | **$19/mo** (billed annually) | 270 | $0.070 | No Seedance 2.5 access |
| Plus | **$47/mo** annual ($59 monthly) | 1,200 | $0.039 | |
| Ultra | **$99/mo** annual ($129 monthly) | 3,000 | $0.033 | |

- Their own calculator: **~14 credits per 8s 720p Kling 3.0 video**.
- So Starter = ~19 videos for $19 → **~$1.00 per video**.
- **They have no free credit tier.** Only card-required trial promos.
- Best prices are **annual-locked**; monthly is 25% more.

## 2. What our videos actually cost (official Gemini API rates, per second)

| Model | 720p | 1080p |
|---|---|---|
| Veo 3.1 Lite | $0.05 | $0.08 |
| Veo 3.1 Fast | $0.10 | $0.12 |
| Veo 3.1 Standard | $0.40 | $0.40 |

Cost of one **8-second** clip: Lite 720p **$0.40** · Fast 720p **$0.80** · Standard **$3.20**.

## 3. The problem with the current model

Today: `2 credits/sec` at 720p, `3/sec` at 1080p, always on Veo Fast.

- An 8s 720p clip = 16 credits but costs us **$0.80**.
- The free plan (100 credits) therefore buys ~6 clips = **~$4.80 of COGS per free user per month.**
- At that rate every paid tier is also underwater. **This is unsustainable as written.**

## 4. Proposed foundation: 1 credit ≡ $0.01 of real cost

Credits/second = provider cost/second × 100. Auditable, honest, and every tier keeps a stable margin.

| Model tier (UI name) | 720p | 1080p |
|---|---|---|
| **Draft** (Veo 3.1 Lite) | 5 cr/s | 8 cr/s |
| **Standard** (Veo 3.1 Fast) | 10 cr/s | 12 cr/s |
| **Cinematic** (Veo 3.1 Standard) | 40 cr/s | 40 cr/s |

8s clip: Draft 720p = **40 cr** · Standard 720p = **80 cr** · Cinematic = **320 cr**.

Free tier at 100 credits = **$1.00 of COGS** — 2 Draft clips or 1 Standard clip. Sane.

## 5. Proposed subscription grid (monthly, no annual lock-in required)

| Plan | Price | Credits/mo | $/credit | Our COGS | Gross margin |
|---|---|---|---|---|---|
| **Free** | $0 | **100** | — | $1.00 | — (acquisition) |
| **Spark** | $9 | 400 | $0.0225 | $4.00 | 56% |
| **Creator** | $19 | 900 | $0.0211 | $9.00 | 53% |
| **Studio** | $49 | 2,500 | $0.0196 | $25.00 | 49% |
| **Scale** | $99 | 5,500 | $0.0180 | $55.00 | 44% |

Annual billing = 2 months free (~17% off), optional not required.

## 6. Pay-as-you-go packs (never expire)

| Pack | Credits | Price | $/credit |
|---|---|---|---|
| Top-up | 500 | $12 | $0.0240 |
| Boost | 1,200 | $25 | $0.0208 |
| Bulk | 3,000 | $55 | $0.0183 |

## 7. Loyalty / growth mechanics (all server-enforced)

| Reward | Amount | Cost to us |
|---|---|---|
| Daily claim (free users) | +5 cr/day | up to $1.50/mo |
| Daily claim (paid users) | +15 cr/day | up to $4.50/mo |
| 7-day streak bonus | +50 cr | $0.50 |
| Referral (referrer) | +200 cr on referee's 1st generation | $2.00 |
| Referral (referee) | +100 cr | $1.00 |
| Missions (one-time) | first generation +25, publish to gallery +25, complete profile +15, first share +15 | $0.80 total |

Effective CAC per referral ≈ **$3.00** in credits. Fully-engaged free user ≈ **$2.50/mo** — the main risk to watch.

## 8. The honest competitive story

We **cannot** undercut Higgsfield per-video on Veo Standard — $3.20 of COGS per 8s clip makes that impossible without selling below cost. Where we genuinely win:

- **A real free tier with 100 credits.** They have none.
- **$9 entry vs their $19** — 53% cheaper to start.
- **22 Draft videos for $19** vs their ~19 videos — more output per dollar at the entry tier.
- **True monthly pricing.** Their headline prices require an annual commitment.
- **No card required** to start.

Marketing copy will compare **$/month and videos-per-dollar**, never raw credit counts (credits aren't comparable across platforms, and implying otherwise would be misleading).

## 9. Engineering plan (server-side, not cosmetic)

1. `autumn.config.ts` — rewrite: free 100, four paid plans, three one-time PAYG packs. Push to Autumn.
2. **New DB tables**: `credit_ledger` (bonus + PAYG grants, with optional expiry), `credit_events` (immutable audit trail), `daily_claims`, `missions`, `referrals`.
3. **`lib/credits.ts`** — new cost table keyed on model tier + resolution + duration. Single source of truth, mirrored to web/mobile clients.
4. **Balance = Autumn plan remaining + ledger balance.** New `credits.balance` endpoint returning the full breakdown.
5. **Spend order**: ledger (soonest-expiring first) → plan allowance. Atomic transaction, charged only on successful generation, with the audit row written in the same transaction.
6. **Enforcement**: pre-flight check rejects submission when effective balance < cost; post-success decrement is idempotent per generation id.
7. **Routes**: `credits.claimDaily`, `credits.missions`, `credits.redeemReferral`, `billing.purchasePack`.
8. **UI**: new pricing page with comparison table, credits/rewards dashboard, model-tier selector in studio, live cost preview — web + mobile.
9. **Verification**: automated end-to-end test proving balance actually decrements server-side and bonuses can't be double-claimed.

## 10. Open decisions for you

1. Approve the price points in §5 (or give me your own numbers).
2. Margin floor — I targeted ~50%. Higher floor means higher prices or fewer credits.
3. Should **Cinematic (Veo Standard)** be gated to Studio/Scale only? At 320 cr per 8s clip it will drain low tiers in 1–2 clips.
4. Daily-claim for free users — keep at 5 cr/day, or drop it to paid-only to protect margin?
