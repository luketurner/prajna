# Implementation Plan: Meditation Countdown Timer with Notifications

**Branch**: `003-meditation-countdown-notify` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-meditation-countdown-notify/spec.md`

## Summary

Extend the existing meditation timer to support optional countdown mode with an alarm at completion, seamless overtime tracking, and a persistent system notification showing timer status. The implementation adds `expo-notifications` for system notifications and `expo-audio` for alarm playback, extending the existing `useTimer` hook with a tri-mode state machine (open-ended, countdown, overtime) while preserving all current behavior.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, expo-notifications (new), expo-audio (new)
**Storage**: expo-sqlite ~16.0.10 (prajna.db — no schema changes); expo-sqlite/kv-store (extended persisted timer state)
**Testing**: Manual testing on physical devices and emulators (testID props for automation)
**Target Platform**: iOS and Android via Expo managed workflow
**Project Type**: Mobile (Expo/React Native)
**Performance Goals**: 60 fps animations, alarm fires within 1 second of countdown reaching zero, notification updates every second
**Constraints**: JS timers stop in background (notification content freezes when backgrounded), Expo managed workflow limitations for background execution
**Scale/Scope**: Single-user local app, 1 screen modified, 3-4 new files, 2-3 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. TypeScript First | PASS | All new code in TypeScript strict mode. New files use `.ts`/`.tsx`. Contracts define all types. |
| II. Mobile-First Design | PASS | Duration input designed for touch. Notifications use platform-native APIs. Alarm respects device settings. |
| III. Documentation-Driven Development | PASS | Research consulted Expo docs for `expo-notifications` and `expo-audio`. Packages installed via `npx expo install`. |
| IV. Follow Existing Patterns | PASS | New hooks follow `useTimer` hook pattern. Components follow existing structure. Colors from `Colors` constants. Navigation via expo-router. |
| V. Simplicity & Self-Documenting Code | PASS | Minimal new abstractions. Duration input is a simple numeric input. Timer mode is an explicit state machine with 3 states. No over-engineering. |

**Gate Result**: PASS — All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-meditation-countdown-notify/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Extended timer state model
├── quickstart.md        # Phase 1: Setup and testing guide
├── contracts/           # Phase 1: TypeScript interfaces
│   └── timer-interfaces.ts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
hooks/
├── useTimer.ts              # MODIFY: Add mode, durationMs, displayMs, countdown/overtime logic
├── useAlarm.ts              # NEW: expo-audio hook for alarm playback with auto-stop
└── useTimerNotification.ts  # NEW: expo-notifications hook for persistent notification + scheduled alarm

components/
└── DurationInput.tsx        # NEW: Numeric input for meditation duration in minutes

app/
├── (tabs)/
│   └── index.tsx            # MODIFY: Add DurationInput, alarm trigger, notification lifecycle
└── _layout.tsx              # MODIFY: Add notification channel setup + foreground handler

assets/
└── audio/
    └── bell.mp3             # NEW: Meditation bell alarm sound

app.json                     # MODIFY: Add expo-notifications, expo-audio plugins
```

**Structure Decision**: Follows existing mobile app structure. New hooks go in `hooks/`, new components in `components/`, new assets in `assets/audio/`. No new directories beyond `assets/audio/`. Modified files remain in their current locations.

## Complexity Tracking

No constitution violations. Table not applicable.
