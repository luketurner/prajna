import {
  FABRIC_LAYERS,
  FABRIC_OVERSIZE_X,
  FABRIC_OVERSIZE_Y,
} from "@/constants/FabricGradient";
import { useAccelerometerContext } from "@/contexts/AccelerometerContext";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

export function FabricBackground() {
  const { width, height } = useWindowDimensions();
  const { tiltX, tiltY } = useAccelerometerContext();

  const gradientWidth = width * FABRIC_OVERSIZE_X;
  const gradientHeight = height * FABRIC_OVERSIZE_Y;
  const offsetX = width * (FABRIC_OVERSIZE_X - 1);
  const offsetY = height * (FABRIC_OVERSIZE_Y - 1);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FABRIC_LAYERS.map((layer, i) => (
        <FabricLayer
          key={i}
          layer={layer}
          gradientWidth={gradientWidth}
          gradientHeight={gradientHeight}
          offsetX={offsetX}
          offsetY={offsetY}
          tiltX={tiltX}
          tiltY={tiltY}
        />
      ))}
    </Animated.View>
  );
}

function FabricLayer({
  layer,
  gradientWidth,
  gradientHeight,
  offsetX,
  offsetY,
  tiltX,
  tiltY,
}: {
  layer: (typeof FABRIC_LAYERS)[number];
  gradientWidth: number;
  gradientHeight: number;
  offsetX: number;
  offsetY: number;
  tiltX: Animated.SharedValue<number>;
  tiltY: Animated.SharedValue<number>;
}) {
  const translateX = useDerivedValue(
    () => -offsetX * tiltX.value * layer.tiltMultiplierX
  );
  const translateY = useDerivedValue(
    () => -offsetY * tiltY.value * layer.tiltMultiplierY
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <AnimatedLinearGradient
      colors={[...layer.colors]}
      locations={[...layer.locations]}
      start={layer.start}
      end={layer.end}
      style={[
        styles.layer,
        { width: gradientWidth, height: gradientHeight, opacity: layer.opacity },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
