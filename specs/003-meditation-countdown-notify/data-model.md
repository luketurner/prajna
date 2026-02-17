# Data Model: Meditation Countdown Timer with Notifications

**Feature Branch**: `003-meditation-countdown-notify`
**Date**: 2026-02-16

## Overview

This feature does not require database schema changes. The `sessions` table already stores `duration_seconds` (total session duration) and `source` ('timer'), which is sufficient for both countdown and open-ended sessions. The countdown duration is a transient UI concept — only the total meditation time matters for the saved record.

## Extended Timer State (In-Memory + KV-Store)

The `useTimer` hook's persisted state needs to be extended to support countdown mode and crash recovery.

### Current Persisted State

```typescript
interface PersistedTimerState {
  startTime: number;      // Date.now() when timer started
  accumulatedMs: number;  // Accumulated milliseconds from prior cycles
  isRunning: boolean;     // Whether timer was running
}
```

### Extended Persisted State

```typescript
interface PersistedTimerState {
  startTime: number;      // Date.now() when timer started
  accumulatedMs: number;  // Accumulated milliseconds from prior cycles
  isRunning: boolean;     // Whether timer was running
  durationMs: number | null;  // Target duration in ms (null = open-ended)
  mode: TimerMode;        // Current timer mode at time of persistence
}
```

### Timer Mode

```typescript
type TimerMode = 'open-ended' | 'countdown' | 'overtime';
```

**State Transitions**:

| From | Event | To | Condition |
| ---- | ----- | -- | --------- |
| idle | start (no duration) | open-ended | User presses play with empty duration |
| idle | start (with duration) | countdown | User presses play with duration set |
| countdown | elapsed >= durationMs | overtime | Timer reaches zero |
| countdown | stop/discard | idle | User ends session early |
| open-ended | stop/discard | idle | User ends session |
| overtime | stop/discard | idle | User ends session after alarm |

### Display Value Derivation

| Mode | Display Value | Formula |
| ---- | ------------- | ------- |
| open-ended | Elapsed time (count up) | `elapsedMs` |
| countdown | Remaining time (count down) | `durationMs - elapsedMs` |
| overtime | Overtime (count up) | `elapsedMs - durationMs` |

### Saved Session Duration

Regardless of mode, the saved `durationSeconds` is always:
```
Math.floor(elapsedMs / 1000)
```
where `elapsedMs` is the total time from start to stop. This is the same as the current behavior — the database schema does not change.

## Notification State (Transient)

Notification state is managed in-memory only and does not persist to the database or KV-store.

### Notification Identifiers

| Identifier | Purpose | Lifecycle |
| ---------- | ------- | --------- |
| `meditation-timer-notification` | Persistent timer display in notification shade | Created on session start, updated every second, dismissed on session end |
| `meditation-alarm` | Scheduled alarm notification for background delivery | Scheduled on countdown start, cancelled on early stop/discard, fires when countdown reaches zero |

### Android Notification Channel

| Property | Value | Rationale |
| -------- | ----- | --------- |
| Channel ID | `meditation-timer` | Unique channel for timer notifications |
| Name | `Meditation Timer` | User-visible channel name in settings |
| Importance | LOW | Silent updates, no heads-up alert per tick |
| Vibration | None | Timer ticks should not vibrate |
| Badge | No | Timer does not affect app badge |
| Lock Screen | PUBLIC | Timer visible on lock screen |

## Audio Asset

| Asset | Path | Format | Purpose |
| ----- | ---- | ------ | ------- |
| Meditation bell | `assets/audio/bell.mp3` | MP3 | Alarm sound when countdown reaches zero |

**Audio Configuration**:

| Setting | Value | Rationale |
| ------- | ----- | --------- |
| playsInSilentMode | false | Respect device silent switch (spec edge case) |
| shouldPlayInBackground | false | Alarm only plays when app is foregrounded |
| interruptionMode | mixWithOthers | Don't pause background music |
| Auto-stop duration | ~4 seconds | FR-007: alarm stops automatically |
