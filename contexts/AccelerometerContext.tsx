import { useAccelerometer } from "@/hooks/useAccelerometer";
import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

interface AccelerometerContextValue {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

const AccelerometerContext = createContext<AccelerometerContextValue | null>(
  null,
);

export function AccelerometerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tiltX, tiltY } = useAccelerometer();

  return (
    <AccelerometerContext.Provider value={{ tiltX, tiltY }}>
      {children}
    </AccelerometerContext.Provider>
  );
}

export function useAccelerometerContext(): AccelerometerContextValue {
  const ctx = useContext(AccelerometerContext);
  if (!ctx) {
    throw new Error(
      "useAccelerometerContext must be used within AccelerometerProvider",
    );
  }
  return ctx;
}
