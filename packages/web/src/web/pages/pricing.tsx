import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCustomer } from "autumn-js/react";
import { Check, Gem, Infinity as InfinityIcon, Loader2, Minus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { creditsBalanceOptions } from "../queries/credits";
import {
  COMPARISON_ROWS,
  CREDITS_PER_SECOND,
  CREDIT_PACKS,
  HIGGSFIELD,
  PLANS,
  PLAN_ORDER,
  SINGLE_CREDIT_PRICE,
  type PlanId,
  draftVideosPerMonth,
  standardVideosPerMonth,
} from "../lib/pricing";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: customer, attach, isPending: customerPending } = useCustomer();
  const { data: balance } = useQuery({ ...creditsBalanceOptions(), enabled: isAuthenticated });
  const [busy, setBusy] = useState<string | null>(null);

  const activePlan = (customer?.subscriptions?.[0]?.planId ?? "free") as string;

  async function choose(planId: string) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (planId === activePlan) return;
    setBusy(planId);
    try {
      await attach({ planId, successUrl: window.location.origin + "/studio" });
      if (planId === "free") toast.success("Plan updated");
    } catch {
      toast.error("Could not start checkout");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      {/* ---------------------------------------------------------- hero -- */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" /> 100 free credits every month — no card
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold md:text-5xl">
          Real AI video, <span className="gradient-text">without the annual lock-in</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Every plan is month-to-month at its listed price. Credits buy Veo 3.1 across three
          quality tiers, so a rough draft never costs what a final cut does.
        </p>
      </div>

      {isAuthenticated && balance && (
        <div className="mx-auto mt-8 flex w-fit flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm text-gold">
          <Gem className="h-4 w-4" />
          <span className="font-semibold tabular-nums">{fmt(balance.total)}</span> credits available
          <span className="text-gold/60">
            ({fmt(balance.plan)} from plan + {fmt(balance.bonus)} bonus)
          </span>
        </div>
      )}

      {/* --------------------------------------------------------- plans -- */}
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id as PlanId];
          const isActive = id === activePlan;
          const loading = busy === id;

          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                p.featured ? "border-gold/50 bg-card glow-gold" : "border-border bg-card/50"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-2.5 left-6 rounded-full gradient-bg px-3 py-0.5 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">${p.priceMonthly}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {fmt(p.credits)} credits
                {p.priceMonthly > 0 && (
                  <> · ${((p.priceMonthly / p.credits) * 100).toFixed(1)}¢ per credit</>
                )}
              </p>
              <p className="mt-3 min-h-[40px] text-sm text-muted-foreground">{p.blurb}</p>

              <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">8s Draft videos</span>
                  <span className="font-semibold tabular-nums">{draftVideosPerMonth(id)}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-muted-foreground">8s Standard videos</span>
                  <span className="font-semibold tabular-nums">{standardVideosPerMonth(id)}</span>
                </div>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choose(id)}
                disabled={isActive || customerPending || loading}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-default disabled:opacity-70 ${
                  isActive
                    ? "border border-border bg-background text-muted-foreground"
                    : p.featured
                      ? "gradient-bg text-white hover:brightness-110"
                      : "border border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
                }`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isActive ? "Current plan" : id === "free" ? "Get started" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------- how it costs -- */}
      <section className="mt-20">
        <h2 className="text-center text-2xl font-semibold">What a video actually costs</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Credits per second of video. Pick a cheaper tier while you iterate and only spend
          Cinematic credits on the take you're keeping.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Tier</th>
                <th className="py-3 pr-4 font-medium">720p</th>
                <th className="py-3 pr-4 font-medium">1080p</th>
                <th className="py-3 pr-4 font-medium">4K</th>
                <th className="py-3 font-medium">An 8s clip at 720p</th>
              </tr>
            </thead>
            <tbody>
              {(["draft", "standard", "cinematic"] as const).map((tier) => {
                const row = CREDITS_PER_SECOND[tier];
                return (
                  <tr key={tier} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium capitalize">{tier}</td>
                    {(["720p", "1080p", "4k"] as const).map((res) => (
                      <td key={res} className="py-3 pr-4 tabular-nums text-muted-foreground">
                        {row[res] == null ? (
                          <Minus className="h-4 w-4 text-muted-foreground/50" />
                        ) : (
                          `${row[res]} / sec`
                        )}
                      </td>
                    ))}
                    <td className="py-3 font-semibold tabular-nums text-gold">
                      {row["720p"]! * 8} credits
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* -------------------------------------------------- pay as you go -- */}
      <section className="mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Out of credits? Just buy more.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            One-off top-ups stack on top of your plan and{" "}
            <span className="text-foreground">never expire</span>. No subscription required.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.planId}
              className={`relative flex flex-col items-center rounded-2xl border p-6 text-center ${
                "best" in pack && pack.best
                  ? "border-gold/50 bg-card"
                  : "border-border bg-card/50"
              }`}
            >
              {"best" in pack && pack.best && (
                <span className="absolute -top-2.5 rounded-full gradient-bg px-3 py-0.5 text-[11px] font-semibold text-white">
                  Best value
                </span>
              )}
              <p className="text-2xl font-semibold tabular-nums">{fmt(pack.credits)}</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="mt-3 text-lg font-semibold">${pack.price}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <InfinityIcon className="h-3 w-3" /> Never expires
              </p>
              <button
                onClick={() => choose(pack.planId)}
                disabled={busy === pack.planId}
                className="mt-5 w-full rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/15 disabled:opacity-70"
              >
                {busy === pack.planId ? "Opening…" : "Buy credits"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Need an exact amount?{" "}
          <button
            onClick={() => choose("credits_topup")}
            className="text-gold underline underline-offset-4 hover:text-gold/80"
          >
            Buy single credits at ${SINGLE_CREDIT_PRICE.toFixed(2)} each
          </button>
          .
        </p>
      </section>

      {/* ----------------------------------------------------- comparison -- */}
      <section className="mt-20">
        <h2 className="text-center text-2xl font-semibold">
          How we compare to {HIGGSFIELD.name}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          Their pricing as published on higgsfield.ai, August 2026. We compare dollars and terms
          rather than credit counts — a credit means something different on every platform, so
          that number alone tells you nothing.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60 text-left">
                <th className="px-5 py-3 font-medium text-muted-foreground">&nbsp;</th>
                <th className="px-5 py-3 font-semibold text-gold">Framewave</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{HIGGSFIELD.name}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3.5 text-muted-foreground">{row.label}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium">
                      {row.win && <Check className="h-4 w-4 shrink-0 text-gold" />}
                      {row.framewave}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      {row.win && <X className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
                      {row.higgsfield}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          Straight answer: on the very top Veo 3.1 Cinematic tier, a single 8-second clip costs us
          real money and we price it accordingly — if all you ever render is maximum-fidelity
          footage, shop around. Where we win is everything below that: a free tier that actually
          exists, $9 to start instead of $19, daily credits, and top-ups that don't evaporate.
        </p>
      </section>

      <p className="mt-14 text-center text-sm text-muted-foreground">
        Cancel anytime. Plan credits reset monthly; bonus and purchased credits never expire.
      </p>
    </div>
  );
}
