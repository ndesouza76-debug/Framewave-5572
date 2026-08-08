import { orpc } from "@/lib/api";

export const creditsBalanceOptions = () => orpc.credits.balance.queryOptions();
export const creditsRewardsOptions = () => orpc.credits.rewards.queryOptions();
export const creditsHistoryOptions = () => orpc.credits.history.queryOptions();

export const claimDailyMutationOptions = () => orpc.credits.claimDaily.mutationOptions();
export const redeemReferralMutationOptions = () => orpc.credits.redeemReferral.mutationOptions();
