# Feature Specification: Goal Expected Progress Tracking

**Feature Branch**: `002-goal-progress-tracking`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "When looking at a goal, the user should be able to compare their current progress against the expected progress. For example if you have a goal to meditate 100 hours in a year and you're halfway through the year, then you should have meditated at least 50 hours by now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Expected Progress on Goal Card (Priority: P1)

A user has an active goal (e.g., meditate 100 hours this year). When they look at their goal on the goals list, they can immediately see how their actual progress compares against where they should be based on the current date. If the goal period is 50% elapsed, the expected progress indicator shows 50 hours. The user can see at a glance whether they are ahead, on track, or behind schedule.

**Why this priority**: This is the core value proposition — giving users a quick visual comparison between actual and expected progress without needing to navigate anywhere. It transforms the existing goal card from "how much have I done?" to "am I on track?"

**Independent Test**: Can be fully tested by creating a goal with a known target and date range, then checking that the expected progress value and visual indicator correctly reflect the proportion of time elapsed.

**Acceptance Scenarios**:

1. **Given** a user has a yearly goal of 100 hours starting Jan 1, **When** they view the goal on Feb 15 (approximately 12.5% through the year), **Then** they see an expected progress indicator showing approximately 12.5 hours alongside their actual progress.
2. **Given** a user has logged 60 hours toward a 100-hour yearly goal and 50% of the year has elapsed, **When** they view the goal card, **Then** the card visually indicates they are ahead of schedule (60 hours actual vs. 50 hours expected).
3. **Given** a user has logged 20 hours toward a 100-hour yearly goal and 50% of the year has elapsed, **When** they view the goal card, **Then** the card visually indicates they are behind schedule (20 hours actual vs. 50 hours expected).
4. **Given** a user has a goal that is completed (actual >= target), **When** they view the goal card, **Then** the expected progress indicator is not shown (completion takes precedence).

---

### User Story 2 - View Expected Progress on Goal Detail Screen (Priority: P1)

When a user navigates to a goal's detail screen, they see a more detailed breakdown of their actual vs. expected progress. This includes the expected hours value, how far ahead or behind they are (in hours), and a clear visual representation comparing the two.

**Why this priority**: The detail screen is where users go for deeper insight. Showing expected progress here with more context (exact hours ahead/behind) complements the at-a-glance card view and helps users make decisions about adjusting their practice.

**Independent Test**: Can be fully tested by navigating to a goal detail screen and verifying the expected progress value, ahead/behind calculation, and visual representation are correct for the current date.

**Acceptance Scenarios**:

1. **Given** a user navigates to a goal detail screen for a 100-hour yearly goal on July 1, **When** the screen loads, **Then** they see "Expected: ~50.0h" alongside their actual progress.
2. **Given** a user has logged 65 hours toward a 100-hour yearly goal and the expected progress is 50 hours, **When** they view the detail screen, **Then** they see a positive indicator showing they are approximately 15 hours ahead of schedule.
3. **Given** a user has logged 30 hours toward a 100-hour yearly goal and the expected progress is 50 hours, **When** they view the detail screen, **Then** they see an indicator showing they are approximately 20 hours behind schedule.
4. **Given** a goal has expired (end date is in the past), **When** they view the detail screen, **Then** the expected progress shows as the full target amount (100% of the period has elapsed).

---

### User Story 3 - Expected Progress for Monthly and Custom Goals (Priority: P2)

Expected progress calculation works correctly for all goal period types — yearly, monthly, and custom date ranges. The calculation is always based on the proportion of the goal period that has elapsed relative to today's date.

**Why this priority**: The core calculation (Story 1) naturally applies to all period types, but this story ensures correctness across edge cases specific to different period types (e.g., months with different day counts, custom ranges that span only a few days).

**Independent Test**: Can be tested by creating goals with each period type and verifying expected progress calculations are proportionally correct for each.

**Acceptance Scenarios**:

1. **Given** a user has a monthly goal of 10 hours for February 2026 (28 days), **When** they view the goal on Feb 14 (50% through the month), **Then** expected progress shows approximately 5.0 hours.
2. **Given** a user has a custom goal of 20 hours from Feb 1 to Feb 10 (10 days), **When** they view the goal on Feb 5 (50% through the range), **Then** expected progress shows approximately 10.0 hours.
3. **Given** a user has a custom goal that has not yet started (start date is in the future), **When** they view the goal, **Then** expected progress shows 0 hours.

---

### Edge Cases

- What happens when today is the start date of the goal? Expected progress should be 0 (or near-zero, proportional to one day out of the total period).
- What happens when today is the last day of the goal? Expected progress should be at or very near the full target.
- What happens when a goal has already been completed (actual >= target)? The expected progress indicator should not be displayed; the "Completed" status takes precedence.
- What happens when a goal has expired without being completed? Expected progress should show as the full target amount, since 100% of the time has elapsed.
- What happens when a custom goal has a very short period (e.g., 1 day)? Expected progress should still be calculated proportionally (0% at start of day, 100% at end of day or simply 100% on that day).
- What happens when the user creates a goal mid-period (e.g., creates a yearly goal in June)? The expected progress is based on the goal's defined start date, not the creation date. If the start date is Jan 1 but the goal was created in June, expected progress still reflects the full Jan 1 - Dec 31 range.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate expected progress for each active goal as a linear proportion of the target hours based on elapsed time within the goal period.
- **FR-002**: The expected progress formula MUST be: `expectedHours = targetHours × (daysSinceStart / totalDaysInPeriod)`, where `daysSinceStart` is the number of days from startDate to today (inclusive), and `totalDaysInPeriod` is the total number of days from startDate to endDate (inclusive).
- **FR-003**: System MUST display the expected progress value on the goal card in the goals list, formatted consistently with existing progress display (e.g., "Expected: 50.0h").
- **FR-004**: System MUST visually indicate on the goal card whether the user is ahead, on track, or behind relative to expected progress.
- **FR-005**: System MUST display the expected progress value on the goal detail screen with additional context showing how far ahead or behind the user is (e.g., "+15.0h ahead" or "−20.0h behind").
- **FR-006**: System MUST display an expected progress marker on the goal's progress bar, providing a visual reference point.
- **FR-007**: For goals that have not yet started (today < startDate), expected progress MUST be 0.
- **FR-008**: For goals that have expired (today > endDate), expected progress MUST equal the full target hours.
- **FR-009**: System MUST NOT display expected progress indicators for completed goals (where actual progress >= target).
- **FR-010**: Expected progress MUST be calculated correctly for all period types: year, month, and custom.
- **FR-011**: The expected progress calculation MUST update automatically when the user views a goal on a new day (no manual refresh required).

### Key Entities

- **Goal (extended)**: The existing Goal entity gains computed expected progress fields — expectedHours (the number of hours the user should have completed by now based on linear interpolation), expectedPercent (as a percentage of target), and a delta value representing the difference between actual and expected progress.

## Assumptions

- Expected progress follows a **linear model** (uniform daily progress). More sophisticated models (e.g., weighted by day of week, front-loaded, back-loaded) are out of scope.
- The "on track" threshold is defined as actual progress being within ±5% of the target hours from expected progress. Ahead means actual > expected + threshold. Behind means actual < expected − threshold.
- Progress bar marker for expected progress will be a simple visual indicator (e.g., a tick mark or line) on the existing progress bar, not a second progress bar.
- The feature enhances existing goal views and does not introduce new screens or navigation flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see their expected progress for any active goal within 1 second of viewing the goal card or detail screen.
- **SC-002**: 100% of active goals display expected progress that is mathematically accurate to within 0.1 hours of the correct linear interpolation.
- **SC-003**: Users can determine at a glance whether they are ahead, on track, or behind schedule without performing mental calculations.
- **SC-004**: Expected progress is correctly displayed for all three goal period types (year, month, custom) without errors.
- **SC-005**: The feature integrates seamlessly with the existing goal UI — no new screens, navigation flows, or user onboarding required.
