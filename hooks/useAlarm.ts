import { useEffect, useRef, useCallback } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";

const ALARM_AUTO_STOP_MS = 4000;

const bellSound = require("@/assets/audio/bell.wav");

export function useAlarm() {
  const player = useAudioPlayer(bellSound);
  const status = useAudioPlayerStatus(player);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
    });
  }, []);

  const clearAutoStop = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const stopAlarm = useCallback(() => {
    clearAutoStop();
    player.pause();
  }, [player, clearAutoStop]);

  const playAlarm = useCallback(() => {
    clearAutoStop();
    player.seekTo(0);
    player.play();
    autoStopRef.current = setTimeout(() => {
      player.pause();
      autoStopRef.current = null;
    }, ALARM_AUTO_STOP_MS);
  }, [player, clearAutoStop]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      clearAutoStop();
    };
  }, [clearAutoStop]);

  return {
    playAlarm,
    stopAlarm,
    isPlaying: status.playing,
  };
}
