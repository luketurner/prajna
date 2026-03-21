/**
 * Gold metallic gradient configuration for shimmer effect.
 * 7-stop gradient simulating a specular highlight band on gold surfaces.
 */

export const GOLD_GRADIENT_COLORS = [
  "#7A7456", // Deep shadow
  "#9A9578", // Secondary gold
  "#C3BC9B", // Primary gold
  "#E8E0C0", // Bright specular highlight
  "#C3BC9B", // Primary gold
  "#9A9578", // Secondary gold
  "#7A7456", // Deep shadow
] as const;

export const GOLD_GRADIENT_LOCATIONS = [
  0, 0.3, 0.45, 0.5, 0.55, 0.7, 1,
] as const;

/** Accelerometer update interval in ms (~60Hz) */
export const ACCELEROMETER_INTERVAL = 16;

/** Exponential moving average smoothing factor (0–1, lower = smoother) */
export const SMOOTHING_FACTOR = 0.5;

/**
 * Gradient oversize along each axis.
 * Kept modest to stay within Android's bitmap size limits.
 * The extra size lets the highlight band translate without clipping.
 * Total area multiplier = X * Y = 1.5 * 1.3 ≈ 2x (safe for Android).
 */
export const GRADIENT_OVERSIZE_X = 1.5;
export const GRADIENT_OVERSIZE_Y = 1.3;
