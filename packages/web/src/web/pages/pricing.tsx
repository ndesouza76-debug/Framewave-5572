import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomer, useListPlans } from "autumn-js/react";
import { Check, Gem, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { PLAN_COPY, PLAN_ORDER } from "../lib/constants";

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isPending } = useAuth();
  const { data: customer, attach, isPending: customerPending } = useCustomer();
  const { data: plans } = useListPlans();

  const activePlan = customer?.subscriptions?.[0]?.planId ?? "free";
  const balance = customer?.balances?.credits;

  useEffect(() => {
    // Redirect to login only if the user is definitely signed out.
    if (!isPending && !isAuthenticated) {
      // allow browsing, but attach requires auth — handled per click
    }
  }, [isAuthenticated, isPending]);

  const byId = new Map((plans ?? []).map((p) => [p.id, p]));

  async function choose(planId: string) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (planId === activePlan) return;
    try {
      await attach({ planId, successUrl: window.location.origin + "/studio" });
      if (planId === "free") toast.success("Plan updated");
    } catch {
      toast.error("Could not start checkout");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Credit-based pricing
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold md:text-5xl">
          Pick the plan that <span className="gradient-text">fits your flow</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Credits reset monthly. 720p costs 2 credits/second, 1080p costs 3. Upgrade or downgrade any
          time.
        </p>
      </div>

      {isAuthenticated && balance && (
        <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm text-gold">
          <Gem className="h-4 w-4" />
          <span className="font-semibold tabular-nums">{balance.remaining}</span> credits remaining ·{" "}
          <span className="capitalize">{activePlan} plan</span>
        </div>
      )}

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const plan = byId.get(id);
          const copy = PLAN_COPY[id];
          const featured = id === "pro";
          const isActive = id === activePlan;
          const priceCents = plan?.price?.amount ?? (id === "free" ? 0 : undefined);

          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                featured ? "border-gold/50 bg-card glow-gold" : "border-border bg-card/50"
              }`}
            >
              {featured && (
                <span className="absolute -top-2.5 left-6 rounded-full gradient-bg px-3 py-0.5 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold capitalize">{plan?.name ?? id}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">
                  {priceCents === undefined ? "—" : priceCents === 0 ? "$0" : `$${priceCents / 100}`}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">{copy.blurb}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {copy.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choose(id)}
                disabled={isActive || customerPending}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-default ${
                  isActive
                    ? "border border-border bg-background text-muted-foreground"
                    : featured
                      ? "gradient-bg text-white hover:brightness-110"
                      : "border border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
                }`}
              >
                {customerPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isActive ? "Current plan" : id === "free" ? "Get started" : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Payments are securely processed. Cancel anytime — no lock-in.
      </p>
    </div>
  );
}
