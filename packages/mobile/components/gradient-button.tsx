import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BRAND_GRADIENT } from "@/constants/studio";

export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} style={{ opacity: off ? 0.5 : 1 }}>
      <LinearGradient
        colors={BRAND_GRADIENT as unknown as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});
