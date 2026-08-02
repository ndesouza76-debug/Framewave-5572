import { feature, plan, item } from "atmn";

/**
 * Framewave billing model.
 * A single metered, consumable "credits" feature. Each video generation costs
 * credits (see api/lib/credits.ts for the cost table). Plans grant a monthly
 * credit allowance that resets each billing interval.
 */
export const credits = feature({
  id: "credits",
  name: "Credits",
  type: "metered",
  consumable: true,
});

export const free = plan({
  id: "free",
  name: "Free",
  autoEnable: true,
  items: [
    item({
      featureId: credits.id,
      included: 30,
      reset: { interval: "month" },
    }),
  ],
});

export const starter = plan({
  id: "starter",
  name: "Starter",
  price: { amount: 1200, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 300,
      reset: { interval: "month" },
    }),
  ],
});

export const pro = plan({
  id: "pro",
  name: "Pro",
  price: { amount: 3900, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 1200,
      reset: { interval: "month" },
    }),
  ],
});

export const studio = plan({
  id: "studio",
  name: "Studio",
  price: { amount: 9900, interval: "month" },
  items: [
    item({
      featureId: credits.id,
      included: 4000,
      reset: { interval: "month" },
    }),
  ],
});

export default {
  features: [credits],
  plans: [free, starter, pro, studio],
};
