import {
  ACCELEROMETER_INTERVAL,
  SMOOTHING_FACTOR,
} from "@/constants/GoldGradient";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

let subscriberCount = 0;
let subscription: { remove(): void } | null = null;
let latestX = 0;
let latestY = 0;
let smoothedX = 0;
let smoothedY = 0;
let isAvailable: boolean | null = null;

// All shared-value consumers register here so we can update them
const consumers: Array<{
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}> = [];

function mapToUnit(value: number): number {
  "worklet";
  // Accelerometer range roughly [-1, 1] → map to [0, 1]
  return Math.max(0, Math.min(1, (value + 1) / 2));
}

async function startSubscription() {
  const { Accelerometer } = await import("expo-sensors");

  if (isAvailable === null) {
    isAvailable = await Accelerometer.isAvailableAsync();
  }
  if (!isAvailable) return;

  Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL);
  subscription = Accelerometer.addListener(({ x, y }) => {
    latestX = x;
    latestY = y;

    const alpha = SMOOTHING_FACTOR;
    smoothedX = smoothedX + alpha * (latestX - smoothedX);
    smoothedY = smoothedY + alpha * (latestY - smoothedY);

    const unitX = mapToUnit(smoothedX);
    const unitY = mapToUnit(smoothedY);

    for (const consumer of consumers) {
      consumer.tiltX.value = unitX;
      consumer.tiltY.value = unitY;
    }
  });
}

function stopSubscription() {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
}

/**
 * Singleton accelerometer hook.
 * Returns shared values tiltX and tiltY in [0, 1] range.
 * First consumer starts the subscription, last one stops it.
 * Pauses when app is backgrounded.
 */
export function useAccelerometer(): {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
} {
  const tiltX = useSharedValue(0.5);
  const tiltY = useSharedValue(0.5);
  const consumerRef = useRef<(typeof consumers)[0] | null>(null);

  useEffect(() => {
    const consumer = { tiltX, tiltY };
    consumerRef.current = consumer;
    consumers.push(consumer);

    subscriberCount++;
    if (subscriberCount === 1) {
      startSubscription();
    }

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active" && subscriberCount > 0 && !subscription) {
          startSubscription();
        } else if (state !== "active" && subscription) {
          stopSubscription();
        }
      },
    );

    return () => {
      subscriberCount--;
      const idx = consumers.indexOf(consumer);
      if (idx >= 0) consumers.splice(idx, 1);

      if (subscriberCount === 0) {
        stopSubscription();
      }

      appStateSubscription.remove();
    };
  }, [tiltX, tiltY]);

  return { tiltX, tiltY };
}
