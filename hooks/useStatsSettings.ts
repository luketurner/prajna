import { useCallback, useSyncExternalStore } from "react";
import Storage from "expo-sqlite/kv-store";

export type EarliestDateSource = "earliest_goal" | "first_session";

const EARLIEST_DATE_KEY = "stats_earliest_date_source";
const DEFAULT_EARLIEST_DATE: EarliestDateSource = "earliest_goal";

// Simple in-memory cache + listeners for useSyncExternalStore
let cachedEarliestDate: EarliestDateSource | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readEarliestDate(): EarliestDateSource {
  if (cachedEarliestDate === null) {
    cachedEarliestDate =
      (Storage.getItemSync(EARLIEST_DATE_KEY) as EarliestDateSource) ||
      DEFAULT_EARLIEST_DATE;
  }
  return cachedEarliestDate;
}

/** Read stats settings synchronously (for use outside React). */
export function getStatsSettings() {
  return {
    earliestDateSource: readEarliestDate(),
  };
}

export function useStatsSettings() {
  const earliestDateSource = useSyncExternalStore(subscribe, readEarliestDate);

  const setEarliestDateSource = useCallback((value: EarliestDateSource) => {
    Storage.setItemSync(EARLIEST_DATE_KEY, value);
    cachedEarliestDate = value;
    emitChange();
  }, []);

  return { earliestDateSource, setEarliestDateSource };
}
