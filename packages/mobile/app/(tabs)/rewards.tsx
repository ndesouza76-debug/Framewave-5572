import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { GradientButton } from "@/components/gradient-button";
import { SOURCE_LABEL } from "@/constants/credits";
import {
  claimDailyMutationOptions,
  creditsHistoryOptions,
  creditsRewardsOptions,
  redeemReferralMutationOptions,
} from "@/queries/credits";

export default function RewardsScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");

  const rewards = useQuery({ ...creditsRewardsOptions(), enabled: isAuthenticated });
  const history = useQuery({ ...creditsHistoryOptions(), enabled: isAuthenticated });

  function refresh() {
    void qc.invalidateQueries();
  }

  const claim = useMutation({
    ...claimDailyMutationOptions(),
    onSuccess: (res) => {
      refresh();
      Alert.alert(
        "Credits claimed",
        res.bonus > 0
          ? `+${res.amount} credits, plus a ${res.bonus} credit streak bonus.`
          : `+${res.amount} credits. Day ${res.streak} of your streak.`,
      );
    },
    onError: (e: Error) => Alert.alert("Not claimed", e.message),
  });

  const redeem = useMutation({
    ...redeemReferralMutationOptions(),
    onSuccess: (res) => {
      setCode("");
      refresh();
      Alert.alert("Code applied", `+${res.amount} credits added to your balance.`);
    },
    onError: (e: Error) => Alert.alert("Could not apply code", e.message),
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.container, styles.center, { backgroundColor: colors.background, padding: 32 }]}
      >
        <Ionicons name="gift-outline" size={44} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16 }}>
          Free credits, every day
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          Sign in to claim daily credits, build a streak, and earn from referrals.
        </Text>
        <GradientButton label="Sign in" icon="log-in-outline" onPress={() => router.push("/login")} />
      </SafeAreaView>
    );
  }

  const data = rewards.data;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Rewards</Text>

        {rewards.isPending || !data ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Balance */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Credits available</Text>
              <View style={styles.rowCenterSm}>
                <Ionicons name="flash" size={20} color={colors.gold} />
                <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>
                  {data.balance.total.toLocaleString()}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
                {data.balance.plan.toLocaleString()} from your {data.balance.planId} plan ·{" "}
                {data.balance.bonus.toLocaleString()} bonus credits that never expire
              </Text>
            </View>

            {/* Daily claim */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.rowBetween}>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                  Daily credits
                </Text>
                <Text style={{ color: colors.gold, fontWeight: "700" }}>+{data.daily.amount}</Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                {data.daily.claimedToday
                  ? "Claimed today — come back tomorrow to keep the streak."
                  : "Tap to claim today's credits."}
              </Text>

              {/* Streak dots */}
              <View style={styles.streakRow}>
                {Array.from({ length: data.daily.streakLength }).map((_, i) => {
                  const filled = i < data.daily.streak % data.daily.streakLength ||
                    (data.daily.streak > 0 && data.daily.streak % data.daily.streakLength === 0);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: filled ? colors.gold : "transparent",
                          borderColor: filled ? colors.gold : colors.border,
                        },
                      ]}
                    />
                  );
                })}
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginLeft: 8 }}>
                  {data.daily.untilBonus === 0
                    ? `+${data.daily.streakBonus} bonus ready`
                    : `${data.daily.untilBonus} more day${data.daily.untilBonus === 1 ? "" : "s"} → +${data.daily.streakBonus}`}
                </Text>
              </View>

              <View style={{ marginTop: 14 }}>
                <GradientButton
                  label={data.daily.claimedToday ? "Claimed" : "Claim credits"}
                  icon="gift-outline"
                  loading={claim.isPending}
                  disabled={data.daily.claimedToday}
                  onPress={() => claim.mutate({})}
                />
              </View>
            </View>

            {/* Missions */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                Missions
              </Text>
              {data.missions.map((m) => (
                <View key={m.id} style={styles.missionRow}>
                  <Ionicons
                    name={m.claimed ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={m.claimed ? colors.gold : colors.mutedForeground}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                      {m.label}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {m.description}
                    </Text>
                  </View>
                  <Text style={{ color: m.claimed ? colors.mutedForeground : colors.gold, fontWeight: "700" }}>
                    +{m.credits}
                  </Text>
                </View>
              ))}
            </View>

            {/* Referral */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                Invite creators
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                They get +{data.referral.refereeReward} credits. You get +
                {data.referral.referrerReward} once they finish their first video.
              </Text>

              <Pressable
                onPress={() =>
                  void Share.share({
                    message: `Make AI videos with Framewave — use my code ${data.referral.code} for ${data.referral.refereeReward} free credits.`,
                  })
                }
                style={[styles.codeBox, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", letterSpacing: 3 }}>
                  {data.referral.code}
                </Text>
                <Ionicons name="share-outline" size={18} color={colors.gold} />
              </Pressable>

              <View style={styles.statsRow}>
                <Stat label="Invited" value={data.referral.invited} colors={colors} />
                <Stat label="Qualified" value={data.referral.qualified} colors={colors} />
                <Stat label="Credits earned" value={data.referral.earned} colors={colors} />
              </View>

              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 16 }}>
                Got a code? Apply it before your first video.
              </Text>
              <View style={styles.redeemRow}>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  placeholder="ABC1234"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  maxLength={16}
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                  ]}
                />
                <Pressable
                  onPress={() => code.trim().length >= 4 && redeem.mutate({ code: code.trim() })}
                  disabled={redeem.isPending || code.trim().length < 4}
                  style={[
                    styles.redeemBtn,
                    { borderColor: colors.gold, opacity: code.trim().length < 4 ? 0.5 : 1 },
                  ]}
                >
                  <Text style={{ color: colors.gold, fontWeight: "700" }}>
                    {redeem.isPending ? "…" : "Apply"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* History */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                Credit history
              </Text>
              {history.data && history.data.length > 0 ? (
                history.data.slice(0, 15).map((e) => (
                  <View key={e.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 14 }}>
                        {SOURCE_LABEL[e.source] ?? e.source}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                        {new Date(e.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: e.delta > 0 ? colors.gold : colors.mutedForeground,
                        fontWeight: "700",
                      }}
                    >
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 8 }}>
                  Nothing yet. Claim your daily credits to get started.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCenterSm: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  codeBox: {
    marginTop: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  redeemRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, letterSpacing: 2 },
  redeemBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
});
