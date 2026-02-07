import { useState, useRef, useEffect, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import Storage from "expo-sqlite/kv-store";
import type { PersistedTimerState } from "@/specs/001-meditation-app/contracts/repository-interfaces";

const TIMER_STATE_KEY = "timer_state";

// Maximum reasonable timer duration: 24 hours
const MAX_REASONABLE_MS = 24 * 60 * 60 * 1000;

interface UseTimerResult {
  elapsedMs: number;
  isRunning: boolean;
  hasRecoveryData: boolean;
  recoveredElapsedMs: number;
  start: () => void;
  stop: () => void;
  discard: () => void;
  acceptRecovery: () => void;
  discardRecovery: () => void;
}

function formatElapsedMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function useTimer(): UseTimerResult {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  const [recoveredElapsedMs, setRecoveredElapsedMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Persist timer state to kv-store
  const persistState = useCallback((running: boolean) => {
    const state: PersistedTimerState = {
      startTime: startTimeRef.current ?? 0,
      accumulatedMs: accumulatedMsRef.current,
      isRunning: running,
    };
    Storage.setItemSync(TIMER_STATE_KEY, JSON.stringify(state));
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    Storage.removeItemSync(TIMER_STATE_KEY);
  }, []);

  // Calculate current elapsed time
  const calculateElapsed = useCallback(() => {
    if (startTimeRef.current !== null) {
      return accumulatedMsRef.current + (Date.now() - startTimeRef.current);
    }
    return accumulatedMsRef.current;
  }, []);

  // Start the display interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(calculateElapsed());
    }, 1000);

    // Immediate update
    setElapsedMs(calculateElapsed());
  }, [calculateElapsed]);

  // Stop the display interval
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Check for crash recovery on mount
  useEffect(() => {
    try {
      const storedState = Storage.getItemSync(TIMER_STATE_KEY);
      if (storedState) {
        const state: PersistedTimerState = JSON.parse(storedState);
        if (state.isRunning) {
          // Calculate how long the timer was running
          const elapsed = state.accumulatedMs + (Date.now() - state.startTime);
          // Validate recovered value is within reasonable bounds
          if (elapsed > 0 && elapsed <= MAX_REASONABLE_MS) {
            setRecoveredElapsedMs(elapsed);
            setHasRecoveryData(true);
          }
          // Clear the stored state - user must choose to accept or discard
          clearPersistedState();
        }
      }
    } catch {
      // Invalid stored state, clear it
      clearPersistedState();
    }
  }, [clearPersistedState]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // Going to background - persist state and stop interval
          if (isRunning) {
            persistState(true);
            stopInterval();
          }
        } else if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // Coming to foreground - restart interval
          if (isRunning) {
            startInterval();
          }
        }
        appStateRef.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isRunning, persistState, stopInterval, startInterval]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, [stopInterval]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    accumulatedMsRef.current = 0;
    setIsRunning(true);
    setElapsedMs(0);
    persistState(true);
    startInterval();
  }, [persistState, startInterval]);

  const stop = useCallback(() => {
    // Finalize accumulated time
    accumulatedMsRef.current = calculateElapsed();
    startTimeRef.current = null;
    setIsRunning(false);
    stopInterval();
    // Don't clear persisted state yet - save-session screen will use it
    persistState(false);
    setElapsedMs(accumulatedMsRef.current);
  }, [calculateElapsed, stopInterval, persistState]);

  const discard = useCallback(() => {
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    setIsRunning(false);
    setElapsedMs(0);
    stopInterval();
    clearPersistedState();
  }, [stopInterval, clearPersistedState]);

  const acceptRecovery = useCallback(() => {
    // Set the recovered time as accumulated
    accumulatedMsRef.current = recoveredElapsedMs;
    setElapsedMs(recoveredElapsedMs);
    setHasRecoveryData(false);
    setRecoveredElapsedMs(0);
    // Timer is stopped, not running
    setIsRunning(false);
  }, [recoveredElapsedMs]);

  const discardRecovery = useCallback(() => {
    setHasRecoveryData(false);
    setRecoveredElapsedMs(0);
  }, []);

  return {
    elapsedMs,
    isRunning,
    hasRecoveryData,
    recoveredElapsedMs,
    start,
    stop,
    discard,
    acceptRecovery,
    discardRecovery,
  };
}

export { formatElapsedMs };
