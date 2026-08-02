import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { authClient, clearToken } from "@/lib/auth";
import { GradientButton } from "@/components/gradient-button";

export default function AccountScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const { data: customer, attach, isPending } = useCustomer();
  const { data: plans } = useListPlans();

  const balance = customer?.balances?.credits;
  const activePlan = customer?.subscriptions?.[0]?.planId ?? "free";

  async function onSignOut() {
    await authClient.signOut();
    await clearToken();
    router.replace("/(tabs)");
  }

  async function onAttach(planId: string) {
    try {
      const res = await attach({ planId });
      if (res?.paymentUrl) {
        await WebBrowser.openBrowserAsync(res.paymentUrl);
      }
    } catch {
      Alert.alert("Checkout error", "Could not start checkout. Try again.");
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, styles.center, { backgroundColor: colors.background, padding: 32 }]}>
        <Ionicons name="person-circle-outline" size={44} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16 }}>Welcome to Framewave</Text>
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          Sign in to generate videos, save your library, and manage credits.
        </Text>
        <GradientButton label="Sign in" icon="log-in-outline" onPress={() => router.push("/login")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>

        {/* Profile */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowCenter}>
            <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 20 }}>
                {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>{user?.name ?? "Creator"}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Credits */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <Text style={{ color: colors.mutedForeground }}>Credits remaining</Text>
            <View style={styles.rowCenterSm}>
              <Ionicons name="flash" size={16} color={colors.gold} />
              <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>{balance?.remaining ?? 0}</Text>
            </View>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
            Plan: <Text style={{ color: colors.gold, textTransform: "capitalize" }}>{activePlan}</Text>
          </Text>
        </View>

        {/* Plans */}
        <Text style={[styles.section, { color: colors.foreground }]}>Plans</Text>
        {isPending ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : (
          (plans ?? []).map((plan) => {
            const active = plan.id === activePlan;
            const price = plan.price ? `$${plan.price.amount / 100}/mo` : "Free";
            return (
              <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.card, borderColor: active ? colors.gold : colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>{plan.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                    {plan.items?.[0]?.display?.primaryText ?? price}
                  </Text>
                </View>
                {active ? (
                  <View style={[styles.badge, { borderColor: colors.gold }]}>
                    <Text style={{ color: colors.gold, fontSize: 12, fontWeight: "700" }}>Current</Text>
                  </View>
                ) : (
                  <Pressable onPress={() => onAttach(plan.id)} style={[styles.upgradeBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>{price}</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        <Pressable onPress={onSignOut} style={[styles.signOut, { borderColor: colors.border }]}>
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={{ color: colors.destructive, fontWeight: "700" }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowCenterSm: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  section: { fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  planCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10 },
  badge: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  upgradeBtn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
});
