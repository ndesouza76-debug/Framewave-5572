import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { VideoPlayer } from "@/components/video-player";
import { GradientButton } from "@/components/gradient-button";
import {
  useGenerations,
  useToggleFavorite,
  useTogglePublic,
  useDeleteGeneration,
  useRetryGeneration,
  type GenerationRow,
} from "@/queries/generations";

type Tab = "all" | "favorites" | "published";

export default function HistoryScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const gens = useGenerations(isAuthenticated);
  const [tab, setTab] = useState<Tab>("all");

  const toggleFav = useToggleFavorite();
  const togglePub = useTogglePublic();
  const del = useDeleteGeneration();
  const retry = useRetryGeneration();

  const items = useMemo(() => {
    const all = gens.data ?? [];
    if (tab === "favorites") return all.filter((g) => g.isFavorite);
    if (tab === "published") return all.filter((g) => g.isPublic);
    return all;
  }, [gens.data, tab]);

  if (!isAuthenticated) {
    return <SignedOut colors={colors} />;
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
      </View>
      <View style={styles.tabs}>
        {(["all", "favorites", "published"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { backgroundColor: colors.gold }]}>
            <Text style={{ color: tab === t ? colors.primaryForeground : colors.mutedForeground, fontWeight: "600", fontSize: 13, textTransform: "capitalize" }}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {gens.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="film-outline" size={40} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>No videos yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card
              g={item}
              colors={colors}
              onFav={() => toggleFav.mutate({ id: item.id })}
              onPub={() => togglePub.mutate({ id: item.id })}
              onRetry={() => retry.mutate({ id: item.id })}
              onDelete={() =>
                Alert.alert("Delete video", "This can't be undone.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => del.mutate({ id: item.id }) },
                ])
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

type Colors = ReturnType<typeof useColors>;

function Card({
  g,
  colors,
  onFav,
  onPub,
  onRetry,
  onDelete,
}: {
  g: GenerationRow;
  colors: Colors;
  onFav: () => void;
  onPub: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const done = g.status === "completed" && g.videoUrl;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {done ? (
        <VideoPlayer uri={g.videoUrl!} style={styles.media} controls />
      ) : (
        <View style={[styles.media, styles.center, { backgroundColor: colors.muted }]}>
          {g.status === "failed" ? (
            <>
              <Ionicons name="alert-circle-outline" size={26} color={colors.destructive} />
              <Pressable onPress={onRetry} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.gold, fontWeight: "600" }}>Retry</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.gold} />
              <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12 }}>{g.status}</Text>
            </>
          )}
        </View>
      )}
      <View style={{ padding: 14 }}>
        <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{g.prompt}</Text>
        <View style={styles.actions}>
          <IconBtn icon={g.isFavorite ? "heart" : "heart-outline"} active={g.isFavorite} colors={colors} onPress={onFav} />
          <IconBtn icon={g.isPublic ? "globe" : "globe-outline"} active={g.isPublic} colors={colors} onPress={onPub} />
          <IconBtn icon="trash-outline" colors={colors} onPress={onDelete} />
        </View>
      </View>
    </View>
  );
}

function IconBtn({ icon, active, colors, onPress }: { icon: keyof typeof Ionicons.glyphMap; active?: boolean; colors: Colors; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.iconBtn, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={active ? colors.gold : colors.mutedForeground} />
    </Pressable>
  );
}

function SignedOut({ colors }: { colors: Colors }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, styles.center, { backgroundColor: colors.background, padding: 32 }]}>
      <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16 }}>Sign in required</Text>
      <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8, marginBottom: 24 }}>
        Sign in to view your generated videos.
      </Text>
      <GradientButton label="Sign in" icon="log-in-outline" onPress={() => router.push("/login")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  media: { width: "100%", aspectRatio: 16 / 9 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
