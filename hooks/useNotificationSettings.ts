import { useCallback, useSyncExternalStore } from "react";
import Storage from "expo-sqlite/kv-store";

export type NotificationType = "silent" | "vibrate" | "chime" | "chime_twice";

const STAGE_END_KEY = "notification_stage_end";
const SESSION_END_KEY = "notification_session_end";

const DEFAULT_STAGE_END: NotificationType = "chime";
const DEFAULT_SESSION_END: NotificationType = "chime_twice";

// Simple in-memory cache + listeners for useSyncExternalStore
let cachedStageEnd: NotificationType | null = null;
let cachedSessionEnd: NotificationType | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readStageEnd(): NotificationType {
  if (cachedStageEnd === null) {
    cachedStageEnd =
      (Storage.getItemSync(STAGE_END_KEY) as NotificationType) ||
      DEFAULT_STAGE_END;
  }
  return cachedStageEnd;
}

function readSessionEnd(): NotificationType {
  if (cachedSessionEnd === null) {
    cachedSessionEnd =
      (Storage.getItemSync(SESSION_END_KEY) as NotificationType) ||
      DEFAULT_SESSION_END;
  }
  return cachedSessionEnd;
}

/** Read notification settings synchronously (for use outside React). */
export function getNotificationSettings() {
  return {
    stageEnd: readStageEnd(),
    sessionEnd: readSessionEnd(),
  };
}

export function useNotificationSettings() {
  const stageEnd = useSyncExternalStore(subscribe, readStageEnd);
  const sessionEnd = useSyncExternalStore(subscribe, readSessionEnd);

  const setStageEnd = useCallback((value: NotificationType) => {
    Storage.setItemSync(STAGE_END_KEY, value);
    cachedStageEnd = value;
    emitChange();
  }, []);

  const setSessionEnd = useCallback((value: NotificationType) => {
    Storage.setItemSync(SESSION_END_KEY, value);
    cachedSessionEnd = value;
    emitChange();
  }, []);

  return { stageEnd, sessionEnd, setStageEnd, setSessionEnd };
}
