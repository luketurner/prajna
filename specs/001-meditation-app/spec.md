# Feature Specification: Meditation Timer & Logger

**Feature Branch**: `001-meditation-app`
**Created**: 2026-02-02
**Status**: Draft
**Input**: User description: "Build a mobile app for meditation timing, logging, and comparing against goals (e.g. '100 hours of meditation in 2026'). Should support manually entering meditation sessions as well as timing them with a stopwatch-like interface. Should also support tagging meditations with user-specified tags e.g. 'Mindfulness', 'Yoga' etc. The app should be built with Expo and React Native. Data should be stored in the app's local data and no user account or network access should be required."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Time a Meditation Session (Priority: P1)

A user wants to meditate and track how long they sit. They open the app, see a timer screen, and tap "Start" to begin timing. During their session, the timer displays elapsed time. When finished, the user taps "Stop." The app shows the session duration and lets the user optionally add tags (e.g., "Mindfulness," "Morning") before saving the session. The session is saved with the date, duration, and any selected tags.

**Why this priority**: This is the core value proposition — without the ability to time and save a meditation session, no other feature is useful. It provides immediate, standalone utility.

**Independent Test**: Can be fully tested by starting a timer, letting it run, stopping it, and verifying the session appears in the session history with correct duration and date.

**Acceptance Scenarios**:

1. **Given** the user is on the timer screen, **When** they tap "Start," **Then** the timer begins counting up and displays elapsed time in hours, minutes, and seconds.
2. **Given** the timer is running, **When** the user taps "Stop," **Then** the timer stops and the app presents a save screen showing the session duration.
3. **Given** the save screen is displayed, **When** the user selects one or more tags and confirms, **Then** the session is saved with the date, duration, and selected tags.
4. **Given** the save screen is displayed, **When** the user confirms without selecting any tags, **Then** the session is saved with just the date and duration.
5. **Given** the timer is running, **When** the user backgrounds the app and returns later, **Then** the timer reflects the correct elapsed time including time spent in the background.

---

### User Story 2 - Manually Log a Past Session (Priority: P1)

A user meditated without the app (e.g., at a retreat, or forgot to use the timer) and wants to record the session after the fact. They navigate to a manual entry screen, enter the date, duration, and optionally select tags, then save the session.

**Why this priority**: Users need the ability to capture all their meditation time, not just sessions timed with the app. Without manual entry, the log would be incomplete and goals would be inaccurate.

**Independent Test**: Can be fully tested by navigating to manual entry, filling in date and duration, saving, and verifying the session appears in the history.

**Acceptance Scenarios**:

1. **Given** the user is on the manual entry screen, **When** they enter a valid date, duration (in minutes), and tap "Save," **Then** the session is saved and appears in the session history.
2. **Given** the user is on the manual entry screen, **When** they enter a date in the future, **Then** the app prevents saving and displays a validation message.
3. **Given** the user is on the manual entry screen, **When** they enter a duration of zero or negative, **Then** the app prevents saving and displays a validation message.
4. **Given** the user is on the manual entry screen, **When** they optionally select tags and save, **Then** the session is saved with the chosen tags.

---

### User Story 3 - View Session History (Priority: P2)

A user wants to review their meditation practice over time. They navigate to a history screen that shows a chronological list of all logged sessions, including date, duration, and tags. They can scroll through past sessions to see their practice patterns.

**Why this priority**: Seeing past sessions provides essential feedback and motivation. It also validates that session saving works correctly and underpins the goals feature.

**Independent Test**: Can be fully tested by logging multiple sessions (timed and manual) and verifying they all appear in the history with correct details, in reverse chronological order.

**Acceptance Scenarios**:

1. **Given** the user has logged multiple sessions, **When** they navigate to the history screen, **Then** all sessions are displayed in reverse chronological order showing date, duration, and tags.
2. **Given** the user has no logged sessions, **When** they navigate to the history screen, **Then** a helpful empty state message is displayed encouraging them to start meditating.
3. **Given** the user is viewing the history, **When** they tap on a session, **Then** they can view the full details of that session.
4. **Given** the user is viewing the history, **When** they want to delete a session, **Then** they can remove it with a confirmation prompt.

---

### User Story 4 - Set and Track Goals (Priority: P2)

A user wants to set a meditation goal such as "100 hours of meditation in 2026." They create a goal by specifying a target duration and a time period (e.g., year, month, or custom date range). The app shows their progress toward each active goal, including total time completed, percentage progress, and remaining time needed.

**Why this priority**: Goals are a key motivator and differentiator for this app. They turn raw session data into meaningful progress tracking. This depends on sessions being logged first (P1 stories).

**Independent Test**: Can be fully tested by creating a goal, logging sessions that count toward it, and verifying the progress display updates correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the goals screen, **When** they tap "Add Goal," **Then** they can specify a target duration (in hours) and a time period (year, month, or custom date range).
2. **Given** a goal exists for "100 hours in 2026," **When** the user has logged 25 hours of sessions within 2026, **Then** the goal shows 25% completion with 75 hours remaining.
3. **Given** a goal exists, **When** the user logs a new session within the goal's time period, **Then** the goal progress updates immediately to reflect the new total.
4. **Given** a goal exists, **When** the goal's time period has ended and the target was not met, **Then** the goal is visually marked as incomplete with the final tally shown.
5. **Given** a goal exists, **When** the user has met or exceeded the target, **Then** the goal is visually marked as achieved.
6. **Given** a goal exists, **When** the user edits the goal's target duration or time period, **Then** the progress recalculates immediately based on the updated parameters.
7. **Given** a goal exists, **When** the user deletes the goal, **Then** the goal is removed after a confirmation prompt (sessions are not affected).

---

### User Story 5 - Manage Tags (Priority: P3)

A user wants to organize their meditation sessions by type. They can create custom tags (e.g., "Mindfulness," "Yoga," "Body Scan," "Walking"), edit existing tags, and delete tags they no longer use. When tagging a session, they select from their existing tags.

**Why this priority**: Tags add organizational depth but are not essential for core functionality. The app works without tags, but they enhance the experience for committed users.

**Independent Test**: Can be fully tested by creating tags, editing a tag name, deleting a tag, and verifying tags appear as options when saving a session.

**Acceptance Scenarios**:

1. **Given** the user navigates to tag management, **When** they create a new tag with a unique name, **Then** the tag is saved and available for session tagging.
2. **Given** the user has existing tags, **When** they edit a tag's name, **Then** all sessions previously tagged with the old name reflect the updated name.
3. **Given** a tag is associated with existing sessions, **When** the user deletes the tag, **Then** the tag is removed from the tag list and from all associated sessions, after a confirmation prompt.
4. **Given** the user is creating a tag, **When** they enter a name that already exists, **Then** the app prevents the duplicate and displays a message.

---

### User Story 6 - View Statistics and Insights (Priority: P3)

A user wants to understand their meditation habits at a glance. They navigate to a statistics screen that shows summary data: total meditation time (all-time, this month, this week), average session duration, longest streak of consecutive days meditating, current streak, and a breakdown by tag.

**Why this priority**: Statistics provide long-term engagement and deeper insight but depend on having enough session data. This is a "delight" feature that enhances retention.

**Independent Test**: Can be fully tested by logging sessions across multiple days and tags, then verifying the statistics screen shows correct totals, averages, streaks, and tag breakdowns.

**Acceptance Scenarios**:

1. **Given** the user has logged sessions over multiple days, **When** they view the statistics screen, **Then** they see total meditation time for all-time, current month, and current week.
2. **Given** the user has logged sessions, **When** they view average session duration, **Then** the displayed average matches the actual computed average of all sessions.
3. **Given** the user has meditated on consecutive days, **When** they view streaks, **Then** the current streak and longest streak are displayed accurately.
4. **Given** the user has sessions with different tags, **When** they view the tag breakdown, **Then** they see total time spent per tag.

---

### Edge Cases

- What happens when the user starts a timer and the device runs out of battery or is force-closed? The app should attempt to recover the in-progress session on next launch, offering the user the option to save the elapsed time up to the last known point or discard it.
- What happens when the user edits a session to have a duration that would change goal progress? Goal progress should recalculate immediately.
- What happens when the user deletes a session that contributed to a goal? Goal progress should recalculate to exclude the deleted session.
- What happens when the user has hundreds or thousands of sessions? The history and statistics screens should remain responsive with large datasets.
- What happens when the user creates a goal with a time period in the past? The app should allow it (to track retroactive goals) and calculate progress from existing sessions in that period.
- What happens when the user enters a manual session with a very long duration (e.g., 24 hours)? The app should accept it with a confirmation prompt warning that the duration seems unusually long.

## Clarifications

### Session 2026-02-02

- Q: Can users edit or delete goals after creation? → A: Users can both edit and delete goals (full CRUD).
- Q: How do users navigate between the app's major screens? → A: 4 bottom tabs (Timer, History, Goals, Stats). Manual entry via "+" action button. Tag management in Settings.
- Q: Can multiple goals have overlapping time periods? → A: Yes, overlapping goals are allowed. Each goal tracks independently; sessions count toward every goal whose date range includes them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a stopwatch-style timer that counts up from zero, displaying elapsed time in hours, minutes, and seconds.
- **FR-002**: The app MUST allow users to start, stop, and discard a timed session.
- **FR-003**: The timer MUST continue tracking time accurately when the app is in the background.
- **FR-004**: The app MUST allow users to manually log a session by specifying a date and duration.
- **FR-005**: Manual session entry MUST validate that the date is not in the future and the duration is greater than zero.
- **FR-006**: The app MUST allow users to optionally assign one or more tags to any session (timed or manual).
- **FR-007**: The app MUST persist all session data, tags, and goals to on-device storage. No network access or user account is required.
- **FR-008**: The app MUST display a chronological history of all logged sessions, showing date, duration, and tags.
- **FR-009**: The app MUST allow users to edit the date, duration, and tags of any existing session.
- **FR-010**: The app MUST allow users to delete a session, with a confirmation prompt.
- **FR-011**: The app MUST allow users to create goals with a target duration (in hours) and a time period (specific year, specific month, or custom date range).
- **FR-012**: The app MUST display progress toward each active goal, including total time completed, percentage, and remaining hours.
- **FR-012a**: The app MUST allow users to edit an existing goal's target duration and time period.
- **FR-012b**: The app MUST allow users to delete a goal, with a confirmation prompt.
- **FR-013**: The app MUST automatically recalculate goal progress whenever sessions are added, edited, or deleted, or when a goal's parameters are edited.
- **FR-014**: The app MUST allow users to create, edit, and delete custom tags.
- **FR-015**: When a tag is renamed, the app MUST update the tag name across all associated sessions.
- **FR-016**: When a tag is deleted, the app MUST remove that tag from all associated sessions (after confirmation).
- **FR-017**: The app MUST display summary statistics including total meditation time (all-time, this month, this week), average session duration, current streak, and longest streak of consecutive days.
- **FR-018**: The app MUST display a per-tag breakdown of total meditation time.
- **FR-019**: The app MUST attempt to recover an in-progress timer session after an unexpected app termination, offering the user the choice to save or discard.
- **FR-020**: The app MUST function entirely offline with no network dependency.
- **FR-021**: Manual session duration entry MUST display a confirmation prompt if the entered duration exceeds 4 hours.
- **FR-022**: The app MUST provide a bottom tab bar with four tabs: Timer, History, Goals, and Stats.
- **FR-023**: The app MUST provide a prominent "+" action button for manual session entry, accessible from any tab.
- **FR-024**: The app MUST provide a Settings screen (accessible via a gear icon) containing tag management.

### Key Entities

- **Session**: Represents a single meditation event. Key attributes: unique identifier, date, duration (in seconds), creation method (timed or manual), timestamp of when it was recorded. A session can have zero or more tags.
- **Tag**: Represents a user-defined label for categorizing sessions. Key attributes: unique identifier, name (unique, user-editable). A tag can be associated with zero or more sessions.
- **Goal**: Represents a meditation target the user wants to achieve. Key attributes: unique identifier, target duration (in hours), time period type (year, month, or custom range), start date, end date, creation date. Progress is calculated from sessions falling within the goal's date range.

### Assumptions

- A "day" for streak calculation is based on the device's local timezone.
- A streak counts any day where at least one session (of any duration) was logged.
- Goal progress is calculated by summing the durations of all sessions whose date falls within the goal's time period, regardless of tags. Multiple goals with overlapping time periods are allowed; each goal tracks independently and a single session can contribute to multiple goals.
- The timer displays elapsed time but does not provide interval/bell features (out of scope for initial version).
- The app does not support data export or import (out of scope for initial version).
- The app does not support notifications or reminders (out of scope for initial version).
- Session duration for manual entry is input in minutes for user convenience, stored internally in seconds for precision.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start, run, and save a timed meditation session in under 3 taps from app launch.
- **SC-002**: Users can manually log a past session in under 30 seconds.
- **SC-003**: Goal progress updates within 1 second of saving, editing, or deleting a session.
- **SC-004**: Session history loads and displays within 1 second for a user with up to 1,000 sessions.
- **SC-005**: Users can create a new goal in under 30 seconds.
- **SC-006**: The app launches and is ready for interaction within 2 seconds on a typical device.
- **SC-007**: All data persists across app restarts with zero data loss.
- **SC-008**: 90% of first-time users can successfully time and save a session without any guidance or tutorial.
- **SC-009**: Statistics screen accurately reflects all logged session data with zero calculation errors.
- **SC-010**: The app functions fully without any network connectivity.
