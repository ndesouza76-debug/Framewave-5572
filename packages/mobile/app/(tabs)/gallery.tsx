import { useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { VideoPlayer } from "@/components/video-player";
import { CATEGORIES } from "@/constants/studio";
import { useGallery, useToggleLike, type GalleryItem } from "@/queries/gallery";

export default function GalleryScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"trending" | "recent">("trending");

  const listInput = { search: search.trim() || undefined, category, sort };
  const gallery = useGallery(listInput);
  const like = useToggleLike(listInput);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
        <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>Community creations</Text>
      </View>

      <View style={styles.controls}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search prompts…"
            placeholderTextColor={colors.mutedForeground}
            style={{ flex: 1, color: colors.foreground, fontSize: 15 }}
          />
        </View>
        <Pressable
          onPress={() => setSort((s) => (s === "trending" ? "recent" : "trending"))}
          style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name={sort === "trending" ? "flame" : "time"} size={16} color={colors.gold} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((c) => {
          const active = c.value === category;
          return (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[styles.cat, { borderColor: active ? colors.gold : colors.border, backgroundColor: active ? "rgba(232,180,74,0.12)" : colors.card }]}
            >
              <Text style={{ color: active ? colors.gold : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {gallery.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : (gallery.data ?? []).length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={40} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Nothing here yet</Text>
        </View>
      ) : (
        <FlatList
          data={gallery.data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GalleryCard g={item} colors={colors} onLike={() => like.mutate({ id: item.id })} />}
        />
      )}
    </SafeAreaView>
  );
}

type Colors = ReturnType<typeof useColors>;

function GalleryCard({ g, colors, onLike }: { g: GalleryItem; colors: Colors; onLike: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {g.videoUrl ? <VideoPlayer uri={g.videoUrl} style={styles.media} controls /> : <View style={[styles.media, { backgroundColor: colors.muted }]} />}
      <View style={{ padding: 14 }}>
        <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{g.prompt}</Text>
        <View style={styles.metaRow}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{g.creatorName ?? "Anonymous"}</Text>
          <Pressable onPress={onLike} style={styles.likeBtn}>
            <Ionicons name={g.liked ? "heart" : "heart-outline"} size={18} color={g.liked ? colors.gold : colors.mutedForeground} />
            <Text style={{ color: g.liked ? colors.gold : colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>{g.likeCount}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  controls: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14 },
  sortBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cats: { gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  cat: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  media: { width: "100%", aspectRatio: 16 / 9 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
});
