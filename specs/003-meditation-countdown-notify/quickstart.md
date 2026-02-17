# Quickstart: Meditation Countdown Timer with Notifications

**Feature Branch**: `003-meditation-countdown-notify`
**Date**: 2026-02-16

## Prerequisites

- Node.js and npm installed
- Expo CLI available (`npx expo`)
- Development build environment set up (not Expo Go — new native modules required)
- Physical device or emulator for testing notifications and audio

## Setup

### 1. Install New Dependencies

```bash
npx expo install expo-notifications expo-audio
```

### 2. Add Plugins to app.json

Add to the `plugins` array in `app.json`:

```json
"expo-notifications",
"expo-audio"
```

### 3. Add Alarm Sound Asset

Place a meditation bell sound file at:

```
assets/audio/bell.mp3
```

Use a gentle, meditation-appropriate tone (3-5 seconds long).

### 4. Create Development Build

New native modules (`expo-notifications`, `expo-audio`) require a fresh development build:

```bash
npx eas-cli@latest build --profile development --platform all
```

Or for local development:

```bash
npx expo run:ios
npx expo run:android
```

### 5. Start Development Server

```bash
npx expo start --clear
```

## Files to Create/Modify

### New Files

| File | Purpose |
| ---- | ------- |
| `hooks/useAlarm.ts` | Hook wrapping `expo-audio` for alarm playback with auto-stop |
| `hooks/useTimerNotification.ts` | Hook wrapping `expo-notifications` for persistent timer notification and scheduled alarm |
| `components/DurationInput.tsx` | Numeric input component for setting meditation duration in minutes |
| `assets/audio/bell.mp3` | Meditation bell alarm sound |

### Modified Files

| File | Changes |
| ---- | ------- |
| `hooks/useTimer.ts` | Add `mode`, `durationMs`, `displayMs` to state. Extend `start()` to accept optional duration. Add countdown/overtime logic. Extend persisted state with `durationMs` and `mode`. |
| `app/(tabs)/index.tsx` | Add `DurationInput` above timer when stopped. Pass duration to `start()`. Handle alarm trigger on countdown completion. Integrate notification lifecycle (show on start, update on tick, dismiss on stop). |
| `components/TimerDisplay.tsx` | No changes needed — already accepts `elapsedMs` which will now receive `displayMs` (countdown remaining or overtime or elapsed). |
| `app/save-session.tsx` | No changes needed — already receives `durationMs` (total elapsed) as a route param. |
| `app/_layout.tsx` | Add notification channel setup and foreground notification handler configuration on app startup. |
| `app.json` | Add `expo-notifications` and `expo-audio` plugins. |
| `package.json` | Updated automatically by `npx expo install`. |

## Architecture Notes

### Timer Mode State Machine

```
[idle] ──start(no duration)──> [open-ended] ──stop/discard──> [idle]
[idle] ──start(duration)────> [countdown] ──reaches 0──> [overtime] ──stop/discard──> [idle]
[idle] ──start(duration)────> [countdown] ──stop/discard──> [idle]
```

### Display Value by Mode

| Mode | Display | Direction |
| ---- | ------- | --------- |
| open-ended | `elapsedMs` | Counting up from 00:00 |
| countdown | `durationMs - elapsedMs` | Counting down to 00:00 |
| overtime | `elapsedMs - durationMs` | Counting up from 00:00 |

### Background Behavior

- JS timers stop when app is backgrounded (iOS and Android limitation).
- The persistent notification freezes at last-shown value; updates immediately on return to foreground.
- A scheduled alarm notification fires at the correct time even when backgrounded (OS-managed).
- The in-app audio alarm plays only if the app is foregrounded at countdown completion.

### Testing Checklist

1. Set 1-minute countdown → verify countdown display → hear alarm at 00:00 → verify overtime count-up
2. Start open-ended session → verify count-up from 00:00 → no alarm
3. Start countdown → stop early → verify elapsed time saved correctly
4. Start countdown → background app → wait for completion → verify alarm notification received
5. Start session → check notification shade → verify timer notification visible
6. Start countdown → kill app → reopen → verify crash recovery prompt with correct elapsed time
7. Set phone to silent → start countdown → verify vibration (no sound) at alarm
8. Deny notification permissions → start session → verify timer works without notifications
