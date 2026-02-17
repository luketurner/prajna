# Tasks: Meditation Countdown Timer with Notifications

**Input**: Design documents from `/specs/003-meditation-countdown-notify/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/timer-interfaces.ts, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install new dependencies, configure plugins, add assets

- [x] T001 Install expo-notifications and expo-audio packages via `npx expo install expo-notifications expo-audio`
- [x] T002 [P] Add `"expo-notifications"` and `"expo-audio"` to the plugins array in app.json
- [x] T003 [P] Add a meditation bell alarm sound file (gentle tone, 3-5 seconds long, WAV format) to assets/audio/bell.wav. Create the `assets/audio/` directory if it does not exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the core timer hook with the tri-mode state machine that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend useTimer hook with tri-mode state machine, durationMs, displayMs, and extended crash recovery in hooks/useTimer.ts. Specifically:
  - Add `TimerMode` type: `'open-ended' | 'countdown' | 'overtime'`
  - Add state: `mode` (TimerMode | null), `durationMs` (number | null)
  - Add `durationMsRef` to track target duration alongside existing refs
  - Compute `displayMs` based on mode: open-ended = `elapsedMs`, countdown = `durationMs - elapsedMs` (clamped to 0), overtime = `elapsedMs - durationMs`
  - Modify `start()` to accept optional `durationMs` parameter — when provided, set mode to `'countdown'`; when null/undefined, set mode to `'open-ended'`
  - Add mode transition: when mode is `'countdown'` and `elapsedMs >= durationMs`, transition mode to `'overtime'`
  - Extend `PersistedTimerState` interface to include `durationMs: number | null` and `mode: TimerMode`
  - Update `persistState()` to save `durationMs` and `mode`
  - Update crash recovery to restore `durationMs` and `mode` from persisted state
  - Update `stop()` and `discard()` to reset `mode` to null and `durationMs` to null
  - Export `displayMs` and `mode` and `durationMs` in the `UseTimerResult` return value
  - Preserve all existing behavior — open-ended mode must work identically to current implementation
  - Reference contracts: `specs/003-meditation-countdown-notify/contracts/timer-interfaces.ts` for UseTimerResult and PersistedTimerState interfaces
  - Reference data model: `specs/003-meditation-countdown-notify/data-model.md` for state transitions and display value derivation

**Checkpoint**: useTimer hook now supports all three modes. All existing timer behavior preserved. Ready for user story implementation.

---

## Phase 3: User Story 1 - Set Duration and Meditate with Countdown (Priority: P1) MVP

**Goal**: Users can set a meditation duration, timer counts down, alarm plays at zero

**Independent Test**: Set a duration (e.g., 1 minute), press play, watch countdown to 00:00, hear alarm, press stop, verify correct elapsed time on save screen

### Implementation for User Story 1

- [x] T005 [P] [US1] Create useAlarm hook in hooks/useAlarm.ts. This hook wraps expo-audio to play a meditation bell sound with auto-stop:
  - Use `useAudioPlayer` hook from expo-audio with the bundled alarm sound (`require('@/assets/audio/bell.mp3')`)
  - Configure audio mode via `setAudioModeAsync`: `playsInSilentMode: false` (respect silent switch), `interruptionMode: 'mixWithOthers'` (don't pause background music)
  - Expose `playAlarm()` — calls `seekTo(0)` then `play()`, sets a 4-second `setTimeout` to auto-stop
  - Expose `stopAlarm()` — calls `pause()`, clears auto-stop timeout
  - Expose `isPlaying` boolean from player status
  - Clean up timeout on unmount
  - Reference: `specs/003-meditation-countdown-notify/research.md` R-001 for implementation details
  - Reference: `specs/003-meditation-countdown-notify/contracts/timer-interfaces.ts` for AlarmService interface

- [x] T006 [P] [US1] Create DurationInput component in components/DurationInput.tsx. A numeric input for setting meditation duration in minutes:
  - Accept props: `value: number | null`, `onChange: (minutes: number | null) => void`, `disabled?: boolean`
  - Render a `TextInput` with `keyboardType="number-pad"` for numeric entry
  - Include a label (e.g., "Duration (minutes)") and placeholder text (e.g., "Optional")
  - On text change: parse integer, validate range 1-1440, call `onChange(parsed)`. If empty or invalid, call `onChange(null)`
  - When `disabled` is true, disable the input (used while timer is running)
  - Style consistently with existing components: use `Colors[colorScheme]` for text, background, and border colors. Use the existing theme pattern from `constants/Colors.ts`
  - Add `testID="duration-input"` for automation
  - Reference: `specs/003-meditation-countdown-notify/contracts/timer-interfaces.ts` for DurationInputProps interface

- [x] T007 [US1] Integrate DurationInput, countdown display, and alarm trigger into the timer page in app/(tabs)/index.tsx. This is the main UI integration for countdown mode:
  - Add `durationMinutes` local state (number | null, default null)
  - Render `DurationInput` above the timer display when the timer is NOT running. Hide it when running.
  - Update play button handler: call `start(durationMinutes ? durationMinutes * 60 * 1000 : null)`
  - Pass `displayMs` (from useTimer) instead of `elapsedMs` to `TimerDisplay` for the visual countdown
  - Use `useAlarm` hook. Add a `useEffect` that watches the `mode` value from useTimer — when mode transitions to `'overtime'` (meaning countdown just reached zero), call `playAlarm()`
  - On stop: call `stopAlarm()` (in case alarm is playing), then navigate to save-session with `durationMs: String(elapsedMs)` (total elapsed, not displayMs)
  - On discard: call `stopAlarm()`, then call `discard()` as before
  - Recovery dialog: continue to use `elapsedMs` (total time) for recovered session
  - Keep `DurationInput` value in state so it persists while the timer page is mounted (user can start multiple sessions without re-entering)

**Checkpoint**: User Story 1 complete. Users can set a duration, countdown works, alarm plays at zero, sessions save correctly. This is the MVP.

---

## Phase 4: User Story 2 - Continue Meditating Past the Alarm (Priority: P2)

**Goal**: After alarm, timer seamlessly transitions to overtime count-up, total time saved correctly

**Independent Test**: Set 1-minute duration, let countdown reach zero, hear alarm, wait for alarm to auto-stop (~4 seconds), verify timer shows overtime counting up from 00:00, press stop, verify total time (>1 minute) saved on save screen

### Implementation for User Story 2

- [x] T008 [US2] Add overtime visual indicator to the timer page in app/(tabs)/index.tsx:
  - When `mode` from useTimer is `'overtime'`, display a label below or above the timer (e.g., "Overtime" or "+") styled with `Colors[colorScheme].textSecondary` to visually distinguish overtime from a fresh session
  - Optionally show the original target duration as secondary text (e.g., "24:00 + overtime")
  - Ensure the alarm auto-stop (built into useAlarm at 4 seconds) works correctly — no additional code needed for auto-stop itself
  - Verify stop during overtime passes total `elapsedMs` (not displayMs) to save-session screen

**Checkpoint**: User Stories 1 and 2 both work. Countdown → alarm → overtime → save total time flow is complete.

---

## Phase 5: User Story 3 - Meditate Without a Duration (Priority: P2)

**Goal**: Existing open-ended timer behavior is preserved when no duration is set

**Independent Test**: Leave duration input empty (or clear it), press play, verify timer counts up from 00:00 with no alarm, press stop, verify elapsed time saved correctly

### Implementation for User Story 3

- [x] T009 [US3] Ensure open-ended mode works correctly with the DurationInput in app/(tabs)/index.tsx:
  - Verify that when `DurationInput` value is null (empty), pressing play starts the timer in open-ended mode (counting up from 00:00)
  - Add a clear button or clear interaction to `DurationInput` in components/DurationInput.tsx so users can remove a previously entered duration (e.g., a small "X" button or clearing the text input to empty)
  - Verify no alarm fires during open-ended sessions (the `useEffect` watching mode should not trigger alarm since mode never becomes 'overtime')
  - Verify stop/discard work identically to the current behavior
  - Verify `displayMs` equals `elapsedMs` in open-ended mode

**Checkpoint**: All three timer modes work independently. No regression in existing behavior.

---

## Phase 6: User Story 4 - Timer Notification in System Notification Area (Priority: P3)

**Goal**: Persistent system notification shows current timer value, updates every second, dismissed on session end

**Independent Test**: Start a timer (countdown or open-ended), pull down notification shade, verify notification visible with timer value updating, stop session, verify notification disappears

### Implementation for User Story 4

- [x] T010 [P] [US4] Create useTimerNotification hook in hooks/useTimerNotification.ts. This hook wraps expo-notifications for timer-related notifications:
  - `requestPermissions()`: Check existing permissions via `getPermissionsAsync()`. If not granted, call `requestPermissionsAsync()`. Return boolean.
  - `updateTimerNotification(displayTime: string, subtitle: string)`: Call `scheduleNotificationAsync` with identifier `'meditation-timer-notification'`, `sticky: true`, `autoDismiss: false`, `priority: LOW`, `sound: false`, `trigger: null`. Title: `'Prajna - Meditating'`.
  - `dismissTimerNotification()`: Call `dismissNotificationAsync('meditation-timer-notification')`.
  - `scheduleAlarmNotification(seconds: number)`: Schedule a future notification with identifier `'meditation-alarm'`, trigger type `TIME_INTERVAL` with given seconds, `sound: true`, priority `HIGH`. Title: `'Meditation Complete'`. Body: `'Your meditation session is complete.'`
  - `cancelAlarmNotification()`: Call `cancelScheduledNotificationAsync('meditation-alarm')`.
  - Reference: `specs/003-meditation-countdown-notify/contracts/timer-interfaces.ts` for TimerNotificationService interface and NOTIFICATION_IDS constants
  - Reference: `specs/003-meditation-countdown-notify/research.md` R-002 and R-003 for implementation details

- [x] T011 [US4] Configure Android notification channel and foreground notification handler in app/_layout.tsx:
  - On app startup (in root layout useEffect or top-level call), create Android notification channel: channel ID `'meditation-timer'`, name `'Meditation Timer'`, importance `LOW`, no vibration, no badge, lockscreen visibility `PUBLIC`
  - Set notification handler via `Notifications.setNotificationHandler()`: `shouldShowAlert: false`, `shouldPlaySound: false`, `shouldSetBadge: false` — this prevents in-app pop-ups for timer tick updates
  - Guard channel creation with `Platform.OS === 'android'` check
  - Reference: `specs/003-meditation-countdown-notify/data-model.md` for notification channel configuration

- [x] T012 [US4] Integrate timer notification lifecycle into the timer page in app/(tabs)/index.tsx:
  - Use `useTimerNotification` hook
  - On timer start: call `requestPermissions()`, then `updateTimerNotification()` with initial time. If countdown mode, also call `scheduleAlarmNotification(durationSeconds)` for background alarm delivery.
  - On each timer tick (in the existing interval or via useEffect on `displayMs`): call `updateTimerNotification(formattedDisplayMs, subtitle)` where subtitle indicates mode (e.g., "Countdown", "Overtime", or "Meditating")
  - On timer stop or discard: call `dismissTimerNotification()` and `cancelAlarmNotification()`
  - On app returning to foreground (existing AppState listener): immediately update notification with correct current time
  - Graceful fallback: if permission denied, timer works normally without notifications (no error shown)
  - Notification updates should not block the UI — use fire-and-forget pattern (no await in the tick callback)

**Checkpoint**: Full feature complete. All four user stories work. Notifications show and update. Alarm fires both in-app and via notification.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, and final validation

- [x] T013 Verify crash recovery handles all timer modes correctly in hooks/useTimer.ts:
  - Test: start countdown → kill app → reopen → recovery prompt shows correct total elapsed time
  - Test: start open-ended → kill app → reopen → recovery works as before
  - Ensure recovered countdown sessions restore `durationMs` and `mode` from persisted state
  - Ensure recovered sessions navigate to save-session with correct `elapsedMs`

- [x] T014 Run quickstart.md testing checklist — manually verify all 8 test scenarios listed in specs/003-meditation-countdown-notify/quickstart.md:
  1. Countdown to zero with alarm and overtime
  2. Open-ended session with no alarm
  3. Early stop during countdown with correct elapsed time
  4. Background countdown with alarm notification delivery
  5. Notification shade shows timer value
  6. Crash recovery for countdown session
  7. Silent mode alarm behavior
  8. Denied notification permissions graceful fallback

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **US2 (Phase 4)**: Depends on US1 (Phase 3) completion (builds on countdown UI)
- **US3 (Phase 5)**: Depends on US1 (Phase 3) completion (validates DurationInput clearing)
- **US4 (Phase 6)**: Depends on Foundational (Phase 2) completion — can run in parallel with US1/US2/US3 if desired
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational → can start first
- **US2 (P2)**: Depends on US1 → builds on the countdown + alarm integration in timer page
- **US3 (P2)**: Depends on US1 → validates open-ended mode with DurationInput present
- **US4 (P3)**: Independent of US1-US3 → can be developed in parallel (only depends on Foundational phase)

### Within Each User Story

- Tasks marked [P] can run in parallel (different files, no dependencies)
- Integration tasks (T007, T012) depend on their parallel prerequisite tasks within the same story
- Models/hooks before UI integration

### Parallel Opportunities

**Within Phase 1 (after T001):**
```
T002 (app.json) ─┐
                  ├─ in parallel
T003 (asset)   ──┘
```

**Within Phase 3 US1 (after T004):**
```
T005 (useAlarm hook) ──────┐
                           ├─ in parallel, then T007 after both
T006 (DurationInput comp) ─┘
```

**Within Phase 6 US4 (after T004):**
```
T010 (useTimerNotification hook) ─┐
                                  ├─ T010 parallel, T011 then T012 after both
T011 (notification channel)     ──┘
```

**Cross-story parallelism:**
```
US1 (Phase 3) ──┐
                ├─ US4 can run in parallel with US1 (both depend only on Phase 2)
US4 (Phase 6) ──┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004)
3. Complete Phase 3: User Story 1 (T005-T007)
4. **STOP and VALIDATE**: Test countdown → alarm → stop → save flow
5. This delivers the core value: timed meditation with alarm

### Incremental Delivery

1. Setup + Foundational → Timer hook ready with all modes
2. Add US1 → Countdown with alarm works → **MVP deployed**
3. Add US2 → Overtime visual indicator → **Enhanced experience**
4. Add US3 → Open-ended mode verified → **Regression-free**
5. Add US4 → Notifications complete → **Full feature shipped**
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No database schema changes needed — sessions table already stores total duration
- Alarm auto-stop (4 seconds) is built into useAlarm hook, not timer page logic
- Notification content freezes when backgrounded — this is accepted and documented
- Background alarm delivery uses scheduled OS notification, not in-app audio
- All file paths are relative to repository root (`/workspace/`)
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
