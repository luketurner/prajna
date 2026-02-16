# Tasks: Goal Expected Progress Tracking

**Input**: Design documents from `/specs/002-goal-progress-tracking/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Extend the data interface and computation layer to provide expected progress fields to all consumers. MUST be complete before any UI work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Extend GoalWithProgress interface with `expectedHours: number`, `expectedPercent: number`, and `deltaHours: number` fields in specs/001-meditation-app/contracts/repository-interfaces.ts

- [x] T002 Add expected progress computation to `mapRowWithProgress()` in data/repositories/goal-repository.ts — import `differenceInCalendarDays` from date-fns, compute `elapsedDays = max(0, differenceInCalendarDays(todayDate, start) + 1)`, `totalDays = differenceInCalendarDays(end, start) + 1`, `fraction = clamp(elapsedDays / totalDays, 0, 1)`, then set `expectedHours = target_hours × fraction`, `expectedPercent = fraction × 100`, `deltaHours = (progress_seconds / 3600) − expectedHours`; return all three in the result object

**Checkpoint**: Run `npx tsc --noEmit` — all existing code should compile with the new interface fields.

---

## Phase 2: User Story 1 — View Expected Progress on Goal Card (Priority: P1) 🎯 MVP

**Goal**: Users see at-a-glance whether they are ahead, on track, or behind schedule directly on the goal card in the goals list.

**Independent Test**: Create a yearly goal of 100 hours for 2026. Log some sessions. Open the Goals tab and verify the goal card shows an expected progress marker on the progress bar and an ahead/on-track/behind indicator with the correct color.

### Implementation for User Story 1

- [x] T003 [P] [US1] Add an expected progress marker to the GoalCard progress bar in components/GoalCard.tsx — render a thin vertical View (2px wide, 12px tall, positioned absolutely at `left: expectedPercent%`) inside the progress bar container. Use a semi-transparent dark color (e.g., `rgba(0,0,0,0.4)` light / `rgba(255,255,255,0.5)` dark) so the marker is visible against both the filled and unfilled portions. Only render when `!goal.isCompleted`.

- [x] T004 [US1] Replace the "remaining" stat in the GoalCard stats row with an expected progress status indicator in components/GoalCard.tsx — for non-completed goals, show the delta value (e.g., "+5.2h" or "−3.1h") with a label of "ahead", "on track", or "behind". Derive status using threshold: `threshold = goal.targetHours × 0.05`; if `deltaHours > threshold` → ahead (use `colors.success`), if `deltaHours < -threshold` → behind (use `colors.warning`), else → on track (use `colors.tint`). For completed goals, keep the existing "remaining" stat showing "0h remaining". Use the existing `formatHours()` helper for the delta display.

**Checkpoint**: User Story 1 is fully functional. Goal cards in the goals list show the expected progress marker and ahead/behind status. Completed goals show no expected progress indicator.

---

## Phase 3: User Story 2 — View Expected Progress on Goal Detail Screen (Priority: P1)

**Goal**: Users navigating to the goal detail screen see detailed expected progress information including exact hours ahead/behind.

**Independent Test**: Navigate to a goal's detail screen and verify it shows an "Expected Progress" section with expected hours, a delta display ("+15.0h ahead" or "−20.0h behind"), and a marker on the progress bar.

### Implementation for User Story 2

- [x] T005 [P] [US2] Add an expected progress marker to the goal detail screen progress bar in app/(tabs)/goals/[goalId].tsx — render a thin vertical View (2px wide, 16px tall, positioned absolutely at `left: expectedPercent%`) inside the progress bar container. Use a semi-transparent dark color matching the GoalCard marker style. Only render when `!goal.isCompleted`.

- [x] T006 [US2] Add an "Expected Progress" section to the goal detail screen in app/(tabs)/goals/[goalId].tsx — below the existing "Progress" section (and before "Remaining"), add a new section for non-completed goals showing: (1) label "Expected" in the existing uppercase label style, (2) the expected hours value using `formatHours()` (e.g., "50.0 hours"), (3) a delta line showing how far ahead or behind (e.g., "+15.0 hours ahead" in green or "−20.0 hours behind" in amber), using the same ±5% threshold logic from T004. Follow the existing `styles.section`, `styles.label`, and `styles.value` patterns. Use `{!goal.isCompleted && (...)}` conditional rendering matching the existing "Remaining" section pattern.

**Checkpoint**: User Stories 1 AND 2 are both functional. Goal card shows at-a-glance status, detail screen shows full breakdown.

---

## Phase 4: User Story 3 — Expected Progress for Monthly and Custom Goals (Priority: P2)

**Goal**: Verify expected progress calculation works correctly for all period types and edge cases — yearly, monthly, custom, not-yet-started, and expired goals.

**Independent Test**: Create goals of each period type (year, month, custom) and verify expected progress values are proportionally correct. Create a custom goal with a future start date and verify expected = 0. View an expired goal and verify expected = target.

### Implementation for User Story 3

- [x] T007 [US3] Verify and handle the edge case display for not-yet-started goals in components/GoalCard.tsx and app/(tabs)/goals/[goalId].tsx — when `expectedHours` is 0 and `!goal.isCompleted` and `!goal.isExpired`, the delta display should show "0h expected" or similar neutral text instead of a misleading ahead/behind indicator (since the goal hasn't started yet, deltaHours being positive just means sessions were logged before the period started). Add a check: if `today < startDate` (i.e., expectedPercent === 0 and !isExpired), skip the ahead/behind indicator and show "Not started" or simply hide the expected progress section.

**Checkpoint**: All three user stories functional. Expected progress works for yearly, monthly, custom, not-started, expired, and completed goals.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup across all modified files.

- [x] T008 Run TypeScript type check with `npx tsc --noEmit` and fix any type errors across all modified files
- [x] T009 Run linter with `npx expo lint` and fix any lint issues across all modified files
- [x] T010 Verify accessibility: ensure the GoalCard `accessibilityLabel` in components/GoalCard.tsx includes expected progress status for screen readers (e.g., "Goal: 100 hours, 45% complete, 5 hours behind expected")

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 completion (T001, T002)
- **US2 (Phase 3)**: Depends on Phase 1 completion (T001, T002)
- **US3 (Phase 4)**: Depends on Phase 2 and Phase 3 (needs UI to verify)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational only — no dependencies on other stories
- **User Story 2 (P1)**: Depends on Foundational only — no dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 + US2 (verification of their output across period types)

### Within Each User Story

- T003 and T005 are parallelizable (different files: GoalCard.tsx vs [goalId].tsx)
- T004 depends on T003 (same file: GoalCard.tsx)
- T006 depends on T005 (same file: [goalId].tsx)
- T007 depends on T003, T004, T005, T006 (verifies edge cases across both files)

### Parallel Opportunities

- **After Phase 1**: T003 (GoalCard marker) and T005 (detail screen marker) can run in parallel
- **Phase 5**: T008, T009, T010 can run in parallel

---

## Parallel Example: US1 + US2 After Foundational

```bash
# After T001 and T002 are complete, launch in parallel:
Task: "T003 [US1] Add expected progress marker to GoalCard in components/GoalCard.tsx"
Task: "T005 [US2] Add expected progress marker to detail screen in app/(tabs)/goals/[goalId].tsx"

# Then sequentially within each story:
# US1: T004 depends on T003 (same file)
# US2: T006 depends on T005 (same file)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001 → T002)
2. Complete Phase 2: User Story 1 (T003 → T004)
3. **STOP and VALIDATE**: Goal cards show expected progress marker and ahead/behind status
4. This alone delivers the core value — "am I on track?"

### Incremental Delivery

1. T001 → T002 → Foundation ready
2. T003 → T004 → Goal Card shows expected progress (MVP!)
3. T005 → T006 → Detail screen shows expected progress
4. T007 → Edge case verification
5. T008 → T009 → T010 → Polish

### Full Parallel Strategy

1. T001 → T002 (sequential, interface before computation)
2. T003 + T005 in parallel (different files)
3. T004 + T006 in parallel (different files, after their respective T003/T005)
4. T007 (verification after all UI complete)
5. T008 + T009 + T010 in parallel (validation)

---

## Notes

- **No new files created** — all changes modify existing files
- **No database migration** — all new fields are computed at query time
- **No new dependencies** — uses existing date-fns and theme colors
- **4 source files modified**: repository-interfaces.ts, goal-repository.ts, GoalCard.tsx, [goalId].tsx
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
