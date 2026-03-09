import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AppState, type AppStateStatus } from "react-native";
import Storage from "expo-sqlite/kv-store";

const TIMER_STATE_KEY = "timer_state";

// Maximum reasonable timer duration: 24 hours
const MAX_REASONABLE_MS = 24 * 60 * 60 * 1000;

export type TimerMode = "open-ended" | "countdown" | "overtime";

interface PersistedTimerState {
  startTime: number;
  accumulatedMs: number;
  isRunning: boolean;
  stages: number[] | null; // array of stage durations in ms, null for open-ended
  mode: TimerMode;
}

interface UseTimerResult {
  elapsedMs: number;
  displayMs: number;
  isRunning: boolean;
  mode: TimerMode | null;
  totalDurationMs: number | null;
  currentStageIndex: number;
  totalStages: number;
  completedStageCount: number;
  hasRecoveryData: boolean;
  recoveredElapsedMs: number;
  start: (stages?: number[] | null) => void;
  stop: () => void;
  discard: () => void;
  reset: () => void;
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

/** Compute cumulative thresholds from stage durations. E.g. [5000, 3000] -> [5000, 8000] */
function cumulativeThresholds(stages: number[]): number[] {
  const thresholds: number[] = [];
  let sum = 0;
  for (const s of stages) {
    sum += s;
    thresholds.push(sum);
  }
  return thresholds;
}

/** Find which stage index the elapsed time falls in. Returns stages.length if past all stages. */
function stageIndexForElapsed(elapsed: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (elapsed < thresholds[i]) return i;
  }
  return thresholds.length; // past all stages
}

export function useTimer(): UseTimerResult {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStageCount, setCompletedStageCount] = useState(0);
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  const [recoveredElapsedMs, setRecoveredElapsedMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const stagesRef = useRef<number[] | null>(null);
  const modeRef = useRef<TimerMode | null>(null);
  const currentStageIndexRef = useRef(0);
  const completedStageCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const [totalDurationMs, setTotalDurationMs] = useState<number | null>(null);

  // Persist timer state to kv-store
  const persistState = useCallback((running: boolean) => {
    const state: PersistedTimerState = {
      startTime: startTimeRef.current ?? 0,
      accumulatedMs: accumulatedMsRef.current,
      isRunning: running,
      stages: stagesRef.current,
      mode: modeRef.current ?? "open-ended",
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

  // Check stage transitions and mode changes for a given elapsed value
  const checkTransitions = useCallback((elapsed: number) => {
    const stages = stagesRef.current;
    if (!stages || stages.length === 0) return; // open-ended, no transitions

    const thresholds = cumulativeThresholds(stages);
    const totalMs = thresholds[thresholds.length - 1];

    // Check for overtime transition
    if (modeRef.current === "countdown" && elapsed >= totalMs) {
      modeRef.current = "overtime";
      setMode("overtime");
      // Complete any remaining stages
      const remaining = stages.length - completedStageCountRef.current;
      if (remaining > 0) {
        completedStageCountRef.current = stages.length;
        setCompletedStageCount(stages.length);
      }
      currentStageIndexRef.current = stages.length;
      setCurrentStageIndex(stages.length);
      return;
    }

    // Check for stage advancement within countdown
    if (modeRef.current === "countdown") {
      const newIndex = stageIndexForElapsed(elapsed, thresholds);
      if (
        newIndex > currentStageIndexRef.current &&
        newIndex <= stages.length
      ) {
        // Stages were completed
        const newCompleted = newIndex;
        if (newCompleted > completedStageCountRef.current) {
          completedStageCountRef.current = newCompleted;
          setCompletedStageCount(newCompleted);
        }
        currentStageIndexRef.current = newIndex;
        setCurrentStageIndex(newIndex);
      }
    }
  }, []);

  // Start the display interval
  const startInterval = useCallback(() => {
    // Create interval if not already running
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const elapsed = calculateElapsed();
        setElapsedMs(elapsed);
        checkTransitions(elapsed);
      }, 1000);
    }

    // Immediate update (always runs, even if interval already exists)
    const elapsed = calculateElapsed();
    setElapsedMs(elapsed);
    checkTransitions(elapsed);
  }, [calculateElapsed, checkTransitions]);

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
        const state = JSON.parse(storedState) as PersistedTimerState;
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
          // Going to background — persist state for crash recovery.
          if (isRunning) {
            persistState(true);
          }
        } else if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // Coming to foreground — ensure interval is running and do an
          // immediate elapsed/transition check.
          if (isRunning) {
            startInterval();
          }
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isRunning, persistState, startInterval]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, [stopInterval]);

  const start = useCallback(
    (stages?: number[] | null) => {
      startTimeRef.current = Date.now();
      accumulatedMsRef.current = 0;

      const hasStages = stages != null && stages.length > 0;
      const newMode: TimerMode = hasStages ? "countdown" : "open-ended";
      modeRef.current = newMode;
      stagesRef.current = hasStages ? stages : null;
      currentStageIndexRef.current = 0;
      completedStageCountRef.current = 0;

      setIsRunning(true);
      setElapsedMs(0);
      setMode(newMode);
      setTotalDurationMs(hasStages ? stages!.reduce((a, b) => a + b, 0) : null);
      setCurrentStageIndex(0);
      setCompletedStageCount(0);

      persistState(true);
      startInterval();
    },
    [persistState, startInterval],
  );

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
    stagesRef.current = null;
    modeRef.current = null;
    currentStageIndexRef.current = 0;
    completedStageCountRef.current = 0;
    setIsRunning(false);
    setElapsedMs(0);
    setMode(null);
    setTotalDurationMs(null);
    setCurrentStageIndex(0);
    setCompletedStageCount(0);
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

  // Reset timer display after a session is saved (or discarded from save screen)
  const reset = useCallback(() => {
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    stagesRef.current = null;
    modeRef.current = null;
    currentStageIndexRef.current = 0;
    completedStageCountRef.current = 0;
    setElapsedMs(0);
    setMode(null);
    setTotalDurationMs(null);
    setCurrentStageIndex(0);
    setCompletedStageCount(0);
    stopInterval();
    clearPersistedState();
  }, [stopInterval, clearPersistedState]);

  // Compute display value based on mode and current stage
  const displayMs = useMemo(() => {
    const stages = stagesRef.current;
    if (mode === "countdown" && stages && stages.length > 0) {
      const thresholds = cumulativeThresholds(stages);
      const idx = Math.min(currentStageIndex, stages.length - 1);
      const stageEnd = thresholds[idx];
      return Math.max(0, stageEnd - elapsedMs);
    }
    if (mode === "overtime" && stages && stages.length > 0) {
      const total = stages.reduce((a, b) => a + b, 0);
      return elapsedMs - total;
    }
    // open-ended or null mode
    return elapsedMs;
  }, [mode, currentStageIndex, elapsedMs]);

  return {
    elapsedMs,
    displayMs,
    isRunning,
    mode,
    totalDurationMs,
    currentStageIndex,
    totalStages: stagesRef.current?.length ?? 0,
    completedStageCount,
    hasRecoveryData,
    recoveredElapsedMs,
    start,
    stop,
    discard,
    reset,
    acceptRecovery,
    discardRecovery,
  };
}

export { formatElapsedMs };
