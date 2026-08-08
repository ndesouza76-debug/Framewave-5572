import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Flame,
  Gem,
  Gift,
  Loader2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { orpc } from "../lib/api";
import {
  claimDailyMutationOptions,
  creditsHistoryOptions,
  creditsRewardsOptions,
  redeemReferralMutationOptions,
  syncMissionsMutationOptions,
} from "../queries/credits";

function fmt(n: number) {
  return n.toLocaleString();
}

const SOURCE_LABEL: Record<string, string> = {
  daily: "Daily credits",
  streak: "Streak bonus",
  referral: "Referral reward",
  referral_signup: "Referral welcome bonus",
  mission: "Mission complete",
  generation: "Video generated",
  refund: "Refund",
  promo: "Promotion",
  admin: "Adjustment",
};

export default function RewardsPage() {
  const { isAuthenticated, isPending } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const rewards = useQuery({ ...creditsRewardsOptions(), enabled: isAuthenticated });
  const history = useQuery({ ...creditsHistoryOptions(), enabled: isAuthenticated });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: orpc.credits.key() });
  };

  const claim = useMutation({
    ...claimDailyMutationOptions(),
    onSuccess: (res) => {
      toast.success(
        res.bonus > 0
          ? `+${res.amount} credits, plus a ${res.bonus} streak bonus!`
          : `+${res.amount} credits claimed`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not claim today's credits"),
  });

  const sync = useMutation({ ...syncMissionsMutationOptions(), onSuccess: invalidate });

  const redeem = useMutation({
    ...redeemReferralMutationOptions(),
    onSuccess: (res) => {
      toast.success(`+${res.amount} credits from your referral code`);
      setCode("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not redeem that code"),
  });

  // Missions are condition-based; re-check them whenever this page opens.
  useEffect(() => {
    if (isAuthenticated) sync.mutate({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (isPending) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Sign in to earn credits</h1>
          <p className="mt-2 text-muted-foreground">
            Daily credits, streaks, missions and referrals — all free.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full gradient-bg px-6 py-3 text-sm font-medium text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const r = rewards.data;
  const referralLink = r ? `${window.location.origin}/login?ref=${r.referral.code}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
          <Gift className="h-3.5 w-3.5" /> Free credits
        </span>
        <h1 className="mt-5 text-3xl font-semibold md:text-4xl">
          Earn credits <span className="gradient-text">without paying</span>
        </h1>
      </div>

      {/* ------------------------------------------------------- balance -- */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-gold/70">Available</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-3xl font-semibold tabular-nums text-gold">
            <Gem className="h-5 w-5" />
            {r ? fmt(r.balance.total) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">From your plan</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {r ? fmt(r.balance.plan) : "—"}
          </p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{r?.balance.planId} plan</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bonus earned</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {r ? fmt(r.balance.bonus) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Never expires</p>
        </div>
      </div>

      {/* --------------------------------------------------------- daily -- */}
      <section className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Flame className="h-5 w-5 text-gold" /> Daily credits
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {r
                ? `+${r.daily.amount} credits every day you show up. Hit a ${r.daily.streakLength}-day streak for a ${r.daily.streakBonus} credit bonus.`
                : "Loading…"}
            </p>
          </div>
          <button
            onClick={() => claim.mutate({})}
            disabled={!r || r.daily.claimedToday || claim.isPending}
            className="inline-flex items-center gap-2 rounded-full gradient-bg px-6 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-50"
          >
            {claim.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {r?.daily.claimedToday ? "Claimed today" : `Claim +${r?.daily.amount ?? 0}`}
          </button>
        </div>

        {r && (
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: r.daily.streakLength }).map((_, i) => {
              // Progress within the current 7-day cycle. A completed cycle
              // shows full before rolling over on the next claim.
              const inCycle =
                r.daily.streak === 0
                  ? 0
                  : r.daily.streak % r.daily.streakLength || r.daily.streakLength;
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < inCycle ? "gradient-bg" : "bg-border"}`}
                />
              );
            })}
          </div>
        )}
        {r && r.daily.streak > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {r.daily.streak} day streak. {r.daily.untilBonus > 0
              ? `${r.daily.untilBonus} more for the +${r.daily.streakBonus} bonus.`
              : "Bonus unlocked!"}
          </p>
        )}
      </section>

      {/* ------------------------------------------------------ missions -- */}
      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="h-5 w-5 text-gold" /> Missions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One-off rewards. They're granted automatically once you qualify.
        </p>
        <ul className="mt-5 space-y-3">
          {(r?.missions ?? []).map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {m.claimed && <Check className="h-4 w-4 shrink-0 text-gold" />}
                  {m.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                  m.claimed
                    ? "bg-gold/15 text-gold"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {m.claimed ? `+${m.credits} earned` : `+${m.credits}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ referrals -- */}
      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-gold" /> Invite friends
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {r
            ? `They get +${r.referral.refereeReward} credits on signup. You get +${r.referral.referrerReward} once they make their first video.`
            : "Loading…"}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <code className="flex-1 truncate rounded-lg border border-border bg-background/60 px-4 py-3 text-sm">
            {referralLink || "…"}
          </code>
          <button
            onClick={copyLink}
            disabled={!referralLink}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold/15"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {r && (
          <div className="mt-4 flex gap-6 text-sm">
            <span className="text-muted-foreground">
              Invited <span className="font-semibold text-foreground">{r.referral.invited}</span>
            </span>
            <span className="text-muted-foreground">
              Qualified{" "}
              <span className="font-semibold text-foreground">{r.referral.qualified}</span>
            </span>
            <span className="text-muted-foreground">
              Earned{" "}
              <span className="font-semibold text-gold">{fmt(r.referral.earned)} credits</span>
            </span>
          </div>
        )}

        <div className="mt-6 border-t border-border/60 pt-5">
          <p className="text-sm font-medium">Got a code from a friend?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Redeemable once, before your first video.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              aria-label="Referral code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC1234"
              maxLength={16}
              className="flex-1 rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-gold/50"
            />
            <button
              onClick={() => redeem.mutate({ code })}
              disabled={code.trim().length < 4 || redeem.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/15 disabled:opacity-50"
            >
              {redeem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Redeem
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- history -- */}
      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-gold" /> Recent activity
        </h2>
        {history.data && history.data.length > 0 ? (
          <ul className="mt-4 divide-y divide-border/50">
            {history.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-muted-foreground">
                  {SOURCE_LABEL[e.source] ?? e.source}
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    e.delta > 0 ? "text-gold" : "text-muted-foreground"
                  }`}
                >
                  {e.delta > 0 ? "+" : ""}
                  {fmt(e.delta)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>
        )}
      </section>
    </div>
  );
}
