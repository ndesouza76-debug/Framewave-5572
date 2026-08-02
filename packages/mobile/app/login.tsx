import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { authClient, captureToken } from "@/lib/auth";
import { GradientButton } from "@/components/gradient-button";

export default function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    const result = await authClient.managedAuth.signIn({ provider: "google" });
    if (result?.error && result.error.code !== "AUTH_SESSION_DISMISSED") {
      setError(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (!result?.error) router.replace("/(tabs)");
  }

  async function onEmail() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email(
          { name: name || email.split("@")[0], email, password },
          { onSuccess: captureToken },
        );
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await authClient.signIn.email(
          { email, password },
          { onSuccess: captureToken },
        );
        if (res.error) throw new Error(res.error.message);
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.close}>
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </Pressable>

          <View style={styles.hero}>
            <Text style={[styles.brand, { color: colors.foreground }]}>Framewave</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 6, fontSize: 15 }}>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </Text>
          </View>

          {/* Google */}
          <Pressable onPress={onGoogle} style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="logo-google" size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>Continue with Google</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>or</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          {mode === "signup" && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {error && <Text style={{ color: colors.destructive, marginBottom: 12, fontSize: 13 }}>{error}</Text>}

          <GradientButton
            label={mode === "signin" ? "Sign in" : "Create account"}
            loading={loading}
            disabled={!email || !password}
            onPress={onEmail}
          />

          <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: colors.mutedForeground }}>
              {mode === "signin" ? "New here? " : "Already have an account? "}
              <Text style={{ color: colors.gold, fontWeight: "700" }}>{mode === "signin" ? "Sign up" : "Sign in"}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 8, flexGrow: 1, justifyContent: "center" },
  close: { alignSelf: "flex-end", padding: 8 },
  hero: { alignItems: "center", marginBottom: 32 },
  brand: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 26, borderWidth: 1, marginBottom: 20 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1 },
  input: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
});
