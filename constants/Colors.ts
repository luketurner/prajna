/**
 * Theme colors for the Meditation Timer app.
 * Supports light and dark mode.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#fff",
    backgroundSecondary: "#f5f5f5",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    border: "#e0e0e0",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    card: "#fff",
    progressBar: "#0a7ea4",
    progressBarBackground: "#e5e5e5",
    fab: "#0a7ea4",
    fabIcon: "#fff",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#151718",
    backgroundSecondary: "#1e2022",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    border: "#2e2e2e",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    card: "#1e2022",
    progressBar: "#0a7ea4",
    progressBarBackground: "#2e2e2e",
    fab: "#0a7ea4",
    fabIcon: "#fff",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];
