import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { GradientButton } from "@/components/gradient-button";
import { VideoPlayer } from "@/components/video-player";
import {
  ASPECT_RATIOS,
  DURATIONS,
  STYLE_PRESETS,
  CAMERA_MOTIONS,
  CATEGORIES,
  TIERS,
  creditCost,
  resolutionsForTier,
  type ModelTier,
  type Resolution,
} from "@/constants/studio";
import { creditsBalanceOptions } from "@/queries/credits";
import {
  useCreateGeneration,
  useGeneration,
  useEnhancePrompt,
} from "@/queries/generations";

export default function StudioScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const balanceQuery = useQuery({ ...creditsBalanceOptions(), enabled: isAuthenticated });
  const balance = balanceQuery.data?.total ?? 0;

  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [camera, setCamera] = useState<string | null>(null);
  const [aspect, setAspect] = useState<string>("16:9");
  const [tier, setTier] = useState<ModelTier>("standard");
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [duration, setDuration] = useState<number>(6);
  const [category, setCategory] = useState<string>("general");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const create = useCreateGeneration();
  const enhance = useEnhancePrompt();
  const active = useGeneration(activeId);

  // Draft has no 4K — keep the selection legal when the tier changes.
  const allowedResolutions = resolutionsForTier(tier);
  useEffect(() => {
    if (!allowedResolutions.includes(resolution)) setResolution(allowedResolutions[0]!);
  }, [allowedResolutions, resolution]);

  const cost = creditCost(tier, resolution, duration);
  const enough = balance >= cost;

  async function onEnhance() {
    if (!prompt.trim()) return;
    const res = await enhance.mutateAsync({ prompt });
    if (res?.prompt) setPrompt(res.prompt);
  }

  async function onGenerate() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!prompt.trim() || !enough) return;
    const res = await create.mutateAsync({
      mode: "text",
      prompt: prompt.trim(),
      negativePrompt: negative.trim() || undefined,
      aspectRatio: aspect as "16:9" | "9:16",
      durationSeconds: duration,
      resolution,
      tier,
      stylePreset: style ?? undefined,
      cameraMotion: camera ?? undefined,
      category,
    });
    if (res?.id) setActiveId(res.id);
  }

  const gen = active.data;
  const running = gen?.status === "queued" || gen?.status === "processing";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.brand, { color: colors.foreground }]}>Framewave</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>AI Video Studio</Text>
            </View>
            <View style={[styles.creditPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="flash" size={14} color={colors.gold} />
              <Text style={[styles.creditText, { color: colors.foreground }]}>
                {balance.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Active preview */}
          {activeId && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {gen?.status === "completed" && gen.videoUrl ? (
                <VideoPlayer uri={gen.videoUrl} style={styles.preview} controls />
              ) : gen?.status === "failed" ? (
                <View style={[styles.preview, styles.centered]}>
                  <Ionicons name="alert-circle-outline" size={30} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, marginTop: 8 }}>Generation failed</Text>
                  {gen.error ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        marginTop: 4,
                        fontSize: 12,
                        textAlign: "center",
                        paddingHorizontal: 24,
                      }}
                    >
                      {gen.error}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.preview, styles.centered]}>
                  <ActivityIndicator color={colors.gold} size="large" />
                  <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
                    {gen?.status === "processing" ? "Rendering your video…" : "Queued…"}
                  </Text>
                  {typeof gen?.progress === "number" && gen.progress > 0 && (
                    <Text style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 12 }}>
                      {gen.progress}%
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Prompt */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: colors.foreground }]}>Prompt</Text>
              <Pressable onPress={onEnhance} disabled={enhance.isPending || !prompt.trim()} style={styles.enhance}>
                {enhance.isPending ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : (
                  <Ionicons name="sparkles" size={14} color={colors.gold} />
                )}
                <Text style={{ color: colors.gold, fontSize: 13, fontWeight: "600" }}>Enhance</Text>
              </Pressable>
            </View>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="A lone astronaut walking across red desert dunes at golden hour, dust drifting in the wind…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          {/* Style */}
          <ChipGroup
            title="Style"
            options={STYLE_PRESETS.map((s) => ({ value: s, label: s }))}
            value={style}
            onSelect={(v) => setStyle(v === style ? null : v)}
            colors={colors}
          />

          {/* Camera */}
          <ChipGroup
            title="Camera motion"
            options={CAMERA_MOTIONS.map((c) => ({ value: c.value, label: c.label }))}
            value={camera}
            onSelect={(v) => setCamera(v === camera ? null : v)}
            colors={colors}
          />

          {/* Aspect + resolution */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Aspect ratio</Text>
            <Segmented
              options={ASPECT_RATIOS.map((a) => ({ value: a.value, label: a.label }))}
              value={aspect}
              onSelect={setAspect}
              colors={colors}
            />
          </View>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Quality</Text>
            <Segmented
              options={TIERS.map((t) => ({ value: t.value, label: t.label }))}
              value={tier}
              onSelect={(v) => setTier(v as ModelTier)}
              colors={colors}
            />
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
              {TIERS.find((t) => t.value === tier)?.tagline}
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Resolution</Text>
            <Segmented
              options={allowedResolutions.map((r) => ({
                value: r,
                label: r === "4k" ? "4K" : r,
              }))}
              value={resolution}
              onSelect={(v) => setResolution(v as Resolution)}
              colors={colors}
            />
          </View>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Duration</Text>
            <Segmented
              options={DURATIONS.map((d) => ({ value: String(d), label: `${d}s` }))}
              value={String(duration)}
              onSelect={(v) => setDuration(Number(v))}
              colors={colors}
            />
          </View>

          {/* Advanced */}
          <Pressable onPress={() => setShowAdvanced((s) => !s)} style={styles.advancedToggle}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Advanced</Text>
            <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {showAdvanced && (
            <View style={styles.section}>
              <TextInput
                value={negative}
                onChangeText={setNegative}
                placeholder="Negative prompt (what to avoid)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
              <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Gallery category</Text>
              <ChipGroup
                options={CATEGORIES.filter((c) => c.value !== "all").map((c) => ({ value: c.value, label: c.label }))}
                value={category}
                onSelect={setCategory}
                colors={colors}
              />
            </View>
          )}

          {/* Cost + generate */}
          <View style={[styles.costRow, { borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground }}>Cost</Text>
            <View style={styles.row}>
              <Ionicons name="flash" size={14} color={colors.gold} />
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>{cost} credits</Text>
            </View>
          </View>
          {isAuthenticated && !enough && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginBottom: 10 }}>
              Not enough credits. Claim your daily credits in Rewards or pick a cheaper quality.
            </Text>
          )}
          <GradientButton
            label={!isAuthenticated ? "Sign in to generate" : running ? "Generating…" : "Generate video"}
            icon="film-outline"
            loading={create.isPending || running}
            disabled={isAuthenticated && (!prompt.trim() || !enough)}
            onPress={onGenerate}
          />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Colors = ReturnType<typeof useColors>;

function ChipGroup({
  title,
  options,
  value,
  onSelect,
  colors,
}: {
  title?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onSelect: (v: string) => void;
  colors: Colors;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.label, { color: colors.foreground }]}>{title}</Text> : null}
      <View style={styles.chipWrap}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={[
                styles.chip,
                { borderColor: active ? colors.gold : colors.border, backgroundColor: active ? "rgba(232,180,74,0.12)" : colors.card },
              ]}
            >
              <Text style={{ color: active ? colors.gold : colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Segmented({
  options,
  value,
  onSelect,
  colors,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
  colors: Colors;
}) {
  return (
    <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.gold }]}
          >
            <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontWeight: "600", fontSize: 14 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  brand: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  creditPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditText: { fontWeight: "700", fontSize: 15 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  preview: { width: "100%", aspectRatio: 16 / 9 },
  centered: { alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  enhance: { flexDirection: "row", alignItems: "center", gap: 5 },
  textarea: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    textAlignVertical: "top",
  },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46, fontSize: 15 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  segmented: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  advancedToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, marginBottom: 6 },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    marginBottom: 14,
  },
});
