import { feature, plan, item } from "atmn";

/**
 * Framewave billing model.
 *
 * A single metered, consumable "credits" feature. Every video generation costs
 * credits from the table in `packages/web/src/api/lib/credits.ts`.
 *
 * Economics (locked 2026-08-05):
 *   1 credit === $0.0072 of provider (Veo 3.1) compute cost.
 *   The cheapest credit we sell is Scale at $99 / 5,500 = $0.018/credit,
 *   which is a 60% gross margin — the approved floor. Every other plan and
 *   every pay-as-you-go pack sells credits above that, so no path through the
 *   product can be sold below a 60% margin.
 *
 * NOTE ON UNITS: Autumn's `price.amount` is in WHOLE CURRENCY UNITS (dollars),
 * not cents. `amount: 9` is $9.00. Do not multiply by 100.
 *
 * Subscriptions grant a monthly allowance that resets each billing interval.
 * Pay-as-you-go packs and top-ups are `addOn` one-off plans with an item that
 * has NO reset — Autumn keeps that balance forever, which is exactly the
 * "credits never expire" promise.
 */
export const credits = feature({
  id: "credits",
  name: "Credits",
  type: "metered",
  consumable: true,
});

/* ---------------------------------------------------------------- plans ---- */

export const free = plan({
  id: "free",
  name: "Free",
  description: "100 credits every month, forever. No card required.",
  autoEnable: true,
  items: [
    item({
      featureId: credits.id,
      included: 100,
      reset: { interval: "month" },
    }),
  ],
});

export const spark = plan({
  id: "spark",
  name: "Spark",
  description: "The cheapest way to make AI video with a real model.",
  price: { amount: 9, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 400,
      reset: { interval: "month" },
    }),
  ],
});

export const creator = plan({
  id: "creator",
  name: "Creator",
  description: "For creators shipping content every week.",
  price: { amount: 19, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 900,
      reset: { interval: "month" },
    }),
  ],
});

export const studio = plan({
  id: "studio",
  name: "Studio",
  description: "Serious volume for pros and small teams.",
  price: { amount: 49, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 2500,
      reset: { interval: "month" },
    }),
  ],
});

export const scale = plan({
  id: "scale",
  name: "Scale",
  description: "Maximum firepower, our lowest price per credit.",
  price: { amount: 99, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 5500,
      reset: { interval: "month" },
    }),
  ],
});

/* ------------------------------------------------- pay-as-you-go add-ons ---- */

/** 500 credits, one-off, never expire. $0.024/credit — 70% margin. */
export const pack500 = plan({
  id: "pack_500",
  name: "500 Credits",
  description: "One-off top-up. Credits never expire.",
  addOn: true,
  price: { amount: 12, interval: "one_off" },
  items: [item({ featureId: credits.id, included: 500, reset: { interval: "one_off" } })],
});

/** 1,200 credits, one-off, never expire. $0.0208/credit — 65% margin. */
export const pack1200 = plan({
  id: "pack_1200",
  name: "1,200 Credits",
  description: "One-off top-up. Credits never expire.",
  addOn: true,
  price: { amount: 25, interval: "one_off" },
  items: [item({ featureId: credits.id, included: 1200, reset: { interval: "one_off" } })],
});

/** 3,000 credits, one-off, never expire. $0.0183/credit — 61% margin. */
export const pack3000 = plan({
  id: "pack_3000",
  name: "3,000 Credits",
  description: "One-off top-up. Credits never expire.",
  addOn: true,
  price: { amount: 55, interval: "one_off" },
  items: [item({ featureId: credits.id, included: 3000, reset: { interval: "one_off" } })],
});

/**
 * True pay-as-you-go: buy any number of individual credits at $0.03 each
 * (76% margin). Quantity is chosen at checkout via attach options.
 */
export const topup = plan({
  id: "credits_topup",
  name: "Credit Top-Up",
  description: "Buy exactly the credits you need, one credit at a time.",
  addOn: true,
  items: [
    item({
      featureId: credits.id,
      price: {
        amount: 0.03,
        interval: "one_off",
        billingMethod: "prepaid",
        billingUnits: 1,
      },
    }),
  ],
});

export default {
  features: [credits],
  plans: [free, spark, creator, studio, scale, pack500, pack1200, pack3000, topup],
};
