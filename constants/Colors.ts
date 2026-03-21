/**
 * Unified color scheme for the Meditation Timer app.
 * Single theme — no light/dark toggle.
 * Background: #246583 (deep teal blue)
 * Foreground: #C3BC9B (warm tan/gold)
 */

const palette = {
  text: "#C3BC9B",
  textSecondary: "#9A9578",
  background: "#246583",
  backgroundSecondary: "#1D5269",
  tint: "#C3BC9B",
  icon: "#9A9578",
  tabIconDefault: "#9A9578",
  tabIconSelected: "#C3BC9B",
  border: "#3A7A9A",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#d61737",
  card: "#600a18",
  primaryButton: "#8e0e23",
  progressBar: "#C3BC9B",
  progressBarBackground: "#1D5269",
  fab: "#C3BC9B",
  fabIcon: "#246583",
  headerBar: "#8e0e23",
  headerBarBorder: "#700b1c",
} as const;

export const Colors = {
  light: palette,
  dark: palette,
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];
