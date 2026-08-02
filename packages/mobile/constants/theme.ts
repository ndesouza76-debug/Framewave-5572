import { Platform } from "react-native";

/**
 * App color tokens. Recolor these to brand the app — every screen and component
 * reads from here via `useColors()` (see `hooks/use-colors.ts`), so changing a
 * value here updates the whole app in both light and dark mode.
 *
 * The token names mirror the web app's design tokens (`packages/web/src/web/styles.css`)
 * so the two platforms share one vocabulary: `background`, `foreground`, `card`,
 * `primary`, `muted`, `border`, etc. Values are plain hex/rgba strings — React
 * Native's StyleSheet does not support CSS color functions like `oklch()`.
 */
// Framewave is a dark-only brand. Both schemes resolve to the same premium
// near-black palette with a warm gold accent + signature gradient stops
// (FF7A45 → FF3D77 → 8B5CF6) so the app looks identical regardless of the
// system light/dark setting.
const framewave = {
  background: "#0B0A09",
  foreground: "#F5F0E8",
  card: "#151311",
  cardForeground: "#F5F0E8",
  primary: "#E8B44A",
  primaryForeground: "#1A1206",
  secondary: "#1E1B18",
  secondaryForeground: "#F5F0E8",
  muted: "#1A1815",
  mutedForeground: "#9A9086",
  accent: "#221E1A",
  accentForeground: "#F5F0E8",
  border: "#2A2622",
  destructive: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  // brand gradient stops (used for CTAs / accents)
  gradientStart: "#FF7A45",
  gradientMid: "#FF3D77",
  gradientEnd: "#8B5CF6",
  gold: "#E8B44A",
} as const;

export const Colors = {
  light: framewave,
  dark: framewave,
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];

/**
 * Platform-appropriate font families. Use for `fontFamily` in styles, or load a
 * custom font with `useFonts` from `expo-font` and reference it here.
 */
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "'SF Mono', 'Roboto Mono', monospace",
  },
});
