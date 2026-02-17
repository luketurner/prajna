# Feature Specification: Meditation Countdown Timer with Notifications

**Feature Branch**: `003-meditation-countdown-notify`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "In the Timer page, allow users to specify a meditation duration e.g. 24 minutes. Instead of counting up, then the meditation timer will start to count down from the duration. It should play an alarm when the meditation is complete. If the user continues meditating past the alarm, the timer should start counting up again. Note that specifying a duration is optional. Also, the meditation timer should be shown in the phone notifications menu."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Duration and Meditate with Countdown (Priority: P1)

A meditator opens the Timer page and wants to meditate for a specific duration (e.g., 24 minutes). They enter their desired duration before starting the session. When they press play, the timer counts down from 24:00 to 00:00. When it reaches zero, an alarm sound plays to signal the session is complete. The meditator can then stop the session and save it.

**Why this priority**: This is the core feature — countdown with alarm is the primary new capability that enables structured meditation practice.

**Independent Test**: Can be fully tested by setting a duration, starting the timer, waiting for countdown to reach zero, hearing the alarm, and stopping the session. Delivers the core value of timed meditation.

**Acceptance Scenarios**:

1. **Given** the timer is stopped, **When** the user sets a duration of 24 minutes and presses play, **Then** the timer displays "24:00" and begins counting down second by second.
2. **Given** the timer is counting down, **When** the timer reaches 00:00, **Then** an alarm sound plays to notify the user that the session duration is complete.
3. **Given** the timer is counting down and showing "12:34", **When** the user presses stop, **Then** the session is saved with the elapsed time (the time actually meditated, not the remaining time).
4. **Given** the timer is counting down, **When** the user presses discard, **Then** the session is discarded and the timer resets, just like the current behavior.

---

### User Story 2 - Continue Meditating Past the Alarm (Priority: P2)

A meditator completes their set duration and hears the alarm, but wants to continue meditating. The alarm stops after a brief period, and the timer automatically begins counting up from 00:00 to show the overtime. When the meditator eventually stops, the total session time (original duration + overtime) is saved.

**Why this priority**: This extends the countdown feature naturally — many meditators want to sit longer than planned, and the app should support this seamlessly.

**Independent Test**: Can be tested by setting a short duration (e.g., 1 minute), letting it count down to zero, hearing the alarm, continuing to meditate, and verifying the timer counts up and the total duration is saved correctly.

**Acceptance Scenarios**:

1. **Given** the countdown has reached 00:00 and the alarm has played, **When** the user does not stop the timer, **Then** the timer begins counting up from 00:00 to show overtime duration.
2. **Given** the timer is counting up in overtime mode, **When** the user presses stop, **Then** the total session duration (original set duration + overtime) is passed to the save screen.
3. **Given** the alarm is playing, **When** a few seconds pass, **Then** the alarm stops automatically so it does not play indefinitely.

---

### User Story 3 - Meditate Without a Duration (Open-Ended Session) (Priority: P2)

A meditator opens the Timer page and wants to meditate without a set goal. They leave the duration empty (or clear any previously set duration) and press play. The timer counts up from 00:00, exactly as the app currently works.

**Why this priority**: Setting a duration is optional, so the existing open-ended timer behavior must be preserved for users who prefer unstructured sessions.

**Independent Test**: Can be tested by starting the timer with no duration set and verifying it counts up from 00:00, with no alarm triggered, and can be stopped/saved normally.

**Acceptance Scenarios**:

1. **Given** no duration is set, **When** the user presses play, **Then** the timer counts up from 00:00 exactly as it does today.
2. **Given** the timer is counting up in open-ended mode, **When** the user presses stop, **Then** the session proceeds to the save screen with the elapsed time.
3. **Given** a duration was previously set, **When** the user clears the duration field and presses play, **Then** the timer operates in open-ended count-up mode.

---

### User Story 4 - Timer Notification in System Notification Area (Priority: P3)

A meditator starts a session and switches away from the app (e.g., to check a quick message). The phone's notification area shows the current timer status — either the countdown remaining or the elapsed time. This helps the meditator track their session without returning to the app.

**Why this priority**: Notifications enhance the experience but are supplementary to the core timer functionality. The timer works without them.

**Independent Test**: Can be tested by starting a timer, pulling down the notification shade, and verifying the timer is visible and updating. Also verify the notification disappears when the session ends.

**Acceptance Scenarios**:

1. **Given** the user starts a meditation session (countdown or open-ended), **When** they view the phone's notification area, **Then** they see a persistent notification showing the current timer value.
2. **Given** a notification is visible during a countdown session, **When** the countdown reaches 00:00 and switches to overtime, **Then** the notification updates to reflect the overtime count-up.
3. **Given** the user stops or discards the session, **When** the session ends, **Then** the notification is dismissed automatically.

---

### Edge Cases

- What happens if the user sets a duration of 0 minutes? The app does not allow a duration of zero; the minimum settable duration is 1 minute.
- What happens if the user sets a very long duration (e.g., 12 hours)? The app allows durations up to the existing 24-hour cap. The timer counts down normally.
- What happens if the app crashes during a countdown session? Crash recovery works the same as today — on next launch, the user is prompted to save or discard the recovered session, with the total elapsed time calculated correctly.
- What happens if the alarm plays while the phone is on silent/vibrate mode? The alarm respects the device's sound settings. On silent mode, the device vibrates instead.
- What happens if the user locks the screen during a countdown? The timer continues running in the background, and the notification remains visible on the lock screen.
- What happens if the phone's notification permissions are denied? The timer works normally without notifications. The user can still meditate, but the notification will not appear. The app requests notification permissions when the user first starts a timer session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to set an optional meditation duration in minutes before starting a session.
- **FR-002**: System MUST provide a clear way to input duration (e.g., minute picker or numeric input) that is quick and intuitive.
- **FR-003**: When a duration is set, system MUST count down from the specified duration to zero.
- **FR-004**: When no duration is set, system MUST count up from zero (preserving existing behavior).
- **FR-005**: System MUST play an audible alarm when the countdown reaches zero.
- **FR-006**: The alarm MUST respect the device's sound/vibrate/silent settings.
- **FR-007**: The alarm MUST stop automatically after a brief period (approximately 3-5 seconds) if the user does not interact with the app.
- **FR-008**: After the countdown reaches zero and the alarm plays, system MUST begin counting up from zero to track overtime.
- **FR-009**: When saving a session that had a set duration, the total session duration (countdown time + any overtime) MUST be recorded.
- **FR-010**: System MUST display a persistent notification in the device notification area while a meditation session is active.
- **FR-011**: The notification MUST show the current timer value (countdown remaining or elapsed time).
- **FR-012**: The notification MUST update in near-real-time (at least once per second).
- **FR-013**: The notification MUST be automatically dismissed when the session ends (stop or discard).
- **FR-014**: System MUST enforce a minimum duration of 1 minute and a maximum of 24 hours.
- **FR-015**: Crash recovery MUST work correctly for countdown sessions, restoring the accurate elapsed time.
- **FR-016**: System MUST request notification permissions from the user when needed (first timer start or when permissions are not yet granted).

### Key Entities

- **Duration Setting**: An optional value representing the user's desired meditation length in minutes. When set, it determines countdown mode. When absent, the timer operates in open-ended count-up mode.
- **Timer Mode**: The operational mode of the timer — either "countdown" (duration set) or "open-ended" (no duration). Transitions to "overtime" when countdown reaches zero.
- **Alarm**: An audible/haptic signal that fires when countdown completes. Respects device sound settings and auto-stops after a brief period.
- **Session Notification**: A persistent system notification that displays the current timer value while a session is active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can set a meditation duration and start a countdown session within 10 seconds of opening the Timer page.
- **SC-002**: The alarm plays within 1 second of the countdown reaching zero.
- **SC-003**: The timer transitions from countdown to overtime count-up seamlessly (no visible gap or reset delay).
- **SC-004**: Open-ended sessions (no duration set) work identically to the current timer behavior with no regressions.
- **SC-005**: The notification appears in the system notification area within 2 seconds of starting a session.
- **SC-006**: The notification accurately reflects the timer value, updating every second.
- **SC-007**: 100% of saved sessions record the correct total meditation time, regardless of mode (countdown, overtime, or open-ended).
- **SC-008**: Crash recovery correctly restores countdown sessions, preserving the total elapsed time.

## Assumptions

- The duration input will use a simple minute-based input (not hours and minutes) since most meditation sessions are specified in minutes. Durations over 60 minutes can still be entered as a number (e.g., 90 minutes).
- The alarm sound will be a gentle, meditation-appropriate tone (not jarring) — a default sound bundled with the app.
- The notification will be a standard system notification with a persistent/ongoing flag so it is not dismissible by the user while the session is active.
- Notification permissions will be requested at the point of first use (starting a timer), not on app install.
- The timer display on the main screen continues to show the countdown (or overtime) as the primary display; the notification mirrors this value.
