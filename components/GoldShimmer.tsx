import {
  GOLD_GRADIENT_COLORS,
  GOLD_GRADIENT_LOCATIONS,
  GRADIENT_OVERSIZE_X,
  GRADIENT_OVERSIZE_Y,
} from "@/constants/GoldGradient";
import { useAccelerometerContext } from "@/contexts/AccelerometerContext";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

interface GoldShimmerProps {
  mode: "text" | "view" | "icon";
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function GoldShimmer({
  mode,
  children,
  style,
  disabled,
}: GoldShimmerProps) {
  if (disabled) {
    return <View style={style}>{children}</View>;
  }

  if (mode === "view") {
    return <ShimmerView style={style}>{children}</ShimmerView>;
  }

  // mode === "text" or "icon"
  return <ShimmerMask style={style}>{children}</ShimmerMask>;
}

/**
 * For buttons/backgrounds: oversized gradient behind children, clipped by overflow:hidden.
 * Container has fixed dimensions from `style`, so no layout feedback loop.
 */
function ShimmerView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tiltX, tiltY } = useAccelerometerContext();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const gradientWidth = Math.max(size.width * GRADIENT_OVERSIZE_X, 1);
  const gradientHeight = Math.max(size.height * GRADIENT_OVERSIZE_Y, 1);
  const offsetX = size.width * (GRADIENT_OVERSIZE_X - 1);
  const offsetY = size.height * (GRADIENT_OVERSIZE_Y - 1);

  const translateX = useDerivedValue(() => -offsetX * tiltX.value);
  const translateY = useDerivedValue(() => -offsetY * tiltY.value);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={[style, styles.overflowHidden]} onLayout={onLayout}>
      <AnimatedLinearGradient
        colors={[...GOLD_GRADIENT_COLORS]}
        locations={[...GOLD_GRADIENT_LOCATIONS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.absoluteFill,
          { width: gradientWidth, height: gradientHeight },
          animatedStyle,
        ]}
      />
      <View style={styles.childrenAbove}>{children}</View>
    </View>
  );
}

/**
 * For text/icons: gradient shows through children shapes via MaskedView.
 *
 * Two-phase render to avoid a layout feedback loop:
 *   Phase 1 — render children to measure their natural size.
 *   Phase 2 — render MaskedView at that fixed size; gradient dimensions
 *             are derived from the measurement, not from the container,
 *             so they can never trigger a re-layout cycle.
 */
function ShimmerMask({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tiltX, tiltY } = useAccelerometerContext();
  const [size, setSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onChildrenLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => {
      if (prev && prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  };

  // Phase 1: measure children's natural size
  if (!size) {
    return (
      <View style={style} onLayout={onChildrenLayout}>
        {children}
      </View>
    );
  }

  const gradientWidth = size.width * GRADIENT_OVERSIZE_X;
  const gradientHeight = size.height * GRADIENT_OVERSIZE_Y;
  const offsetX = size.width * (GRADIENT_OVERSIZE_X - 1);
  const offsetY = size.height * (GRADIENT_OVERSIZE_Y - 1);

  return (
    <ShimmerMaskInner
      style={style}
      size={size}
      gradientWidth={gradientWidth}
      gradientHeight={gradientHeight}
      offsetX={offsetX}
      offsetY={offsetY}
      tiltX={tiltX}
      tiltY={tiltY}
    >
      {children}
    </ShimmerMaskInner>
  );
}

/**
 * Inner component so the reanimated hooks are always called
 * (not conditionally behind the size === null guard).
 */
function ShimmerMaskInner({
  children,
  style,
  size,
  gradientWidth,
  gradientHeight,
  offsetX,
  offsetY,
  tiltX,
  tiltY,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size: { width: number; height: number };
  gradientWidth: number;
  gradientHeight: number;
  offsetX: number;
  offsetY: number;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}) {
  const translateX = useDerivedValue(() => -offsetX * tiltX.value);
  const translateY = useDerivedValue(() => -offsetY * tiltY.value);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View
      style={[
        style,
        { width: size.width, height: size.height, overflow: "hidden" },
      ]}
    >
      <MaskedView
        style={{ width: size.width, height: size.height }}
        maskElement={
          <View style={{ width: size.width, height: size.height }}>
            {children}
          </View>
        }
      >
        <AnimatedLinearGradient
          colors={[...GOLD_GRADIENT_COLORS]}
          locations={[...GOLD_GRADIENT_LOCATIONS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            { width: gradientWidth, height: gradientHeight },
            animatedStyle,
          ]}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  overflowHidden: {
    overflow: "hidden",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
  },
  childrenAbove: {
    position: "relative",
    zIndex: 1,
  },
});
