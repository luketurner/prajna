import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useCallback, useEffect, useRef } from "react";

const ALARM_AUTO_STOP_MS = 9000;

const bellSound = require("@/assets/audio/bell.mp3");

export function useAlarm() {
  const player = useAudioPlayer(bellSound);
  const status = useAudioPlayerStatus(player);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingPlaysRef = useRef(0);

  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
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
    remainingPlaysRef.current = 0;
    player.pause();
  }, [player, clearAutoStop]);

  const playSingle = useCallback(() => {
    player.seekTo(0);
    player.play();
    autoStopRef.current = setTimeout(() => {
      player.pause();
      autoStopRef.current = null;
      // Chain next play if remaining
      if (remainingPlaysRef.current > 0) {
        remainingPlaysRef.current--;
        // Brief pause between bells
        autoStopRef.current = setTimeout(() => {
          autoStopRef.current = null;
          playSingle();
        }, 500);
      }
    }, ALARM_AUTO_STOP_MS);
  }, [player]);

  const playAlarm = useCallback(
    (times: number = 1) => {
      clearAutoStop();
      remainingPlaysRef.current = Math.max(0, times - 1);
      playSingle();
    },
    [clearAutoStop, playSingle]
  );

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
