# Tasks: Meditation Timer & Logger

**Input**: Design documents from `/specs/001-meditation-app/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md, contracts/repository-interfaces.ts

**Tests**: Not requested in the feature specification. No test tasks are generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, install dependencies, create directory structure

- [x] T001 Install expo-keep-awake dependency via `npx expo install expo-keep-awake`
- [x] T002 Create directory structure: `data/repositories/`, `hooks/`, `components/ui/`, `constants/`, `app/(tabs)/history/`, `app/(tabs)/goals/`
- [x] T003 [P] Create theme colors in `constants/Colors.ts`
- [x] T004 [P] Create TypeScript path alias `@/*` in `tsconfig.json` if not already configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, providers, query infrastructure, and shared components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement database migration logic (PRAGMA user_version, WAL mode, all 4 tables, indexes) in `data/migrations.ts`
- [x] T006 Implement SessionRepository class (CRUD, stats, tag breakdown queries) in `data/repositories/session-repository.ts` per contracts/repository-interfaces.ts
- [x] T007 [P] Implement TagRepository class (CRUD) in `data/repositories/tag-repository.ts` per contracts/repository-interfaces.ts
- [x] T008 [P] Implement GoalRepository class (CRUD with progress calculation) in `data/repositories/goal-repository.ts` per contracts/repository-interfaces.ts
- [x] T009 Create RepositoryProvider context (instantiates repositories from SQLiteDatabase, provides via React context) in `data/database-provider.tsx`
- [x] T010 Create TanStack Query key factory in `data/query-keys.ts` per contracts/repository-interfaces.ts
- [x] T011 Set up root layout with QueryClientProvider, SQLiteProvider (prajna.db + migrations), RepositoryProvider, and Stack navigator with modal routes in `app/_layout.tsx`
- [x] T012 Set up tab navigator layout with 4 tabs (Timer, History, Goals, Stats), custom tab bar with FAB, and gear icon for settings in `app/(tabs)/_layout.tsx`
- [x] T013 [P] Create EmptyState component in `components/EmptyState.tsx`
- [x] T014 [P] Create TagPicker multi-select component in `components/TagPicker.tsx`
- [x] T015 [P] Create SessionForm shared form component (date, duration, tags) in `components/SessionForm.tsx`
- [x] T016 [P] Create GoalForm shared form component (target hours, period type, date range) in `components/GoalForm.tsx`

**Checkpoint**: Foundation ready — database, providers, navigation, and shared components in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Time a Meditation Session (Priority: P1) 🎯 MVP

**Goal**: User can start a stopwatch timer, meditate, stop the timer, optionally tag the session, and save it. Timer survives backgrounding and crash recovery.

**Independent Test**: Start timer, let it run, background/foreground the app, stop timer, add tags, save. Verify session appears in history with correct duration and date. Kill and relaunch app during active timer to test crash recovery dialog.

### Implementation for User Story 1

- [x] T017 [US1] Implement useTimer hook (Date.now() pattern, setInterval 1s, AppState listener, kv-store persistence, crash recovery check on mount) in `hooks/useTimer.ts`
- [x] T018 [P] [US1] Create TimerDisplay component (HH:MM:SS formatted text) in `components/TimerDisplay.tsx`
- [x] T019 [US1] Implement useSessions hook (useQuery for getAll, useMutation for create/update/delete with cache invalidation) in `hooks/useSessions.ts`
- [x] T020 [P] [US1] Implement useTags hook (useQuery for getAll, useMutation for create/update/delete) in `hooks/useTags.ts`
- [x] T021 [US1] Build Timer screen with start/stop/discard controls, TimerDisplay, crash recovery dialog, and expo-keep-awake in `app/(tabs)/index.tsx`
- [x] T022 [US1] Build save-session modal screen (shows duration, TagPicker, save/discard buttons, navigates back on save) in `app/save-session.tsx`

**Checkpoint**: User Story 1 complete — users can time a meditation, optionally tag it, and save it. Timer works across background/foreground transitions and survives crashes.

---

## Phase 4: User Story 2 — Manually Log a Past Session (Priority: P1)

**Goal**: User can manually enter a past meditation session by specifying date, duration (in minutes), and optional tags. Validation prevents future dates, zero/negative durations, and warns on >4 hour durations.

**Independent Test**: Navigate to manual entry via FAB "+", enter a date and duration, optionally select tags, save. Verify session appears in history. Test validation: future date blocked, zero duration blocked, >4 hour duration shows confirmation.

### Implementation for User Story 2

- [x] T023 [US2] Build manual-entry modal screen (SessionForm with date picker, duration in minutes, TagPicker, validation: no future dates, duration > 0, >4h confirmation prompt) in `app/manual-entry.tsx`

**Checkpoint**: User Stories 1 & 2 complete — users can both time sessions and manually log past sessions. Both entry methods save to the same database.

---

## Phase 5: User Story 3 — View Session History (Priority: P2)

**Goal**: User can browse all logged sessions in reverse chronological order, view session details, edit sessions, and delete sessions with confirmation.

**Independent Test**: Log multiple sessions (timed and manual), navigate to History tab, verify all sessions appear in reverse chronological order with correct date, duration, and tags. Tap a session to view details. Edit a session's date/duration/tags and verify changes persist. Delete a session with confirmation and verify it disappears.

### Implementation for User Story 3

- [x] T024 [P] [US3] Create SessionCard component (date, duration formatted, tag chips) in `components/SessionCard.tsx`
- [x] T025 [US3] Create History nested stack layout in `app/(tabs)/history/_layout.tsx`
- [x] T026 [US3] Build History list screen (FlatList of SessionCard, reverse chronological, empty state) in `app/(tabs)/history/index.tsx`
- [x] T027 [US3] Build Session detail screen (full session info, edit/delete actions) in `app/(tabs)/history/[sessionId].tsx`
- [x] T028 [US3] Build edit-session modal screen (SessionForm pre-filled with existing data, update mutation) in `app/edit-session.tsx`

**Checkpoint**: User Stories 1–3 complete — users can time sessions, log past sessions, and browse/edit/delete their full history.

---

## Phase 6: User Story 4 — Set and Track Goals (Priority: P2)

**Goal**: User can create goals with a target duration and time period (year, month, custom range), view progress (percentage, hours completed, hours remaining), edit goals, and delete goals. Progress recalculates automatically when sessions change.

**Independent Test**: Create a goal (e.g., "100 hours in 2026"), log sessions within that period, verify progress updates. Edit goal target/period and verify recalculation. Delete goal with confirmation. Test overlapping goals.

### Implementation for User Story 4

- [x] T029 [US4] Implement useGoals hook (useQuery for getAll/getById, useMutation for create/update/delete with cache invalidation including sessions) in `hooks/useGoals.ts`
- [x] T030 [P] [US4] Create GoalCard component (progress bar, percentage, hours completed/remaining, completed/expired visual states) in `components/GoalCard.tsx`
- [x] T031 [US4] Create Goals nested stack layout in `app/(tabs)/goals/_layout.tsx`
- [x] T032 [US4] Build Goals list screen (FlatList of GoalCard, "Add Goal" action, empty state) in `app/(tabs)/goals/index.tsx`
- [x] T033 [US4] Build Goal detail/edit screen (GoalCard expanded, edit/delete actions) in `app/(tabs)/goals/[goalId].tsx`
- [x] T034 [US4] Build create-goal modal screen (GoalForm with period type picker, date range selection, target hours input) in `app/create-goal.tsx`

**Checkpoint**: User Stories 1–4 complete — users can time sessions, log past sessions, browse history, and track goals with automatic progress calculation.

---

## Phase 7: User Story 5 — Manage Tags (Priority: P3)

**Goal**: User can create, rename, and delete custom tags from Settings. Tag renames propagate to all sessions. Tag deletion removes the tag from all sessions after confirmation.

**Independent Test**: Open Settings, create a new tag, verify it appears in TagPicker when saving a session. Rename a tag, verify sessions using the old name now show the new name. Delete a tag, confirm the prompt, verify tag is removed from all sessions.

### Implementation for User Story 5

- [x] T035 [US5] Build Settings modal screen with tag management list (create, edit inline, delete with confirmation, duplicate name prevention) in `app/settings.tsx`

**Checkpoint**: User Stories 1–5 complete — users have full tag management with cascading updates.

---

## Phase 8: User Story 6 — View Statistics and Insights (Priority: P3)

**Goal**: User sees summary statistics: total meditation time (all-time, this month, this week), average session duration, current streak, longest streak, and per-tag time breakdown.

**Independent Test**: Log sessions across multiple days and with different tags. Navigate to Stats tab. Verify total times, average, streaks, and tag breakdown are all calculated correctly. Log additional sessions and verify stats update.

### Implementation for User Story 6

- [x] T036 [US6] Implement useSessionStats hook (useQuery for getStats and getTagBreakdown) in `hooks/useSessionStats.ts`
- [x] T037 [US6] Build Statistics screen (time totals, average, streaks, tag breakdown list, empty state) in `app/(tabs)/stats.tsx`

**Checkpoint**: All 6 user stories complete — full-featured meditation timer and logger.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements that affect multiple user stories

- [x] T038 [P] Ensure goal progress invalidation when sessions are created/edited/deleted (verify useSessions mutations invalidate goals query keys)
- [x] T039 [P] Verify session edit/delete from history properly invalidates stats and goals caches
- [x] T040 Run `npx tsc --noEmit` to verify zero type errors across all files
- [x] T041 Run `npx expo lint` to verify zero lint errors
- [ ] T042 Run `npx expo start` and perform manual smoke test per quickstart.md verification steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — No dependencies on other stories
- **US2 (Phase 4)**: Depends on Foundational + useSessions from US1 (T019) — Can begin after T019 completes
- **US3 (Phase 5)**: Depends on Foundational + useSessions from US1 (T019) — Can begin after T019 completes
- **US4 (Phase 6)**: Depends on Foundational — No dependencies on other stories (goals query sessions directly)
- **US5 (Phase 7)**: Depends on Foundational + useTags from US1 (T020) — Can begin after T020 completes
- **US6 (Phase 8)**: Depends on Foundational — No dependencies on other stories (stats query sessions directly)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
    ├── Phase 3: US1 (Timer + Save) ──┐
    │       ↓ (T019 useSessions)      │
    │   ├── Phase 4: US2 (Manual Entry)│
    │   └── Phase 5: US3 (History)    │
    │       ↓ (T020 useTags)          │
    │   └── Phase 7: US5 (Tags)       │
    │                                  │
    ├── Phase 6: US4 (Goals) ─────────┤
    ├── Phase 8: US6 (Stats) ─────────┤
    │                                  │
    ↓                                  ↓
Phase 9: Polish & Cross-Cutting
```

### Within Each User Story

- Hooks before screens (data layer before UI)
- Shared components before screens that use them
- List screens before detail screens
- Core CRUD before advanced features (edit, delete)

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T006, T007, T008 (repositories) can run in parallel after T005 (migrations)
- T013, T014, T015, T016 (shared components) can all run in parallel

**Across User Stories** (after Foundational):
- US4 (Goals) and US6 (Stats) can start immediately — no US1 dependency
- US1 tasks T018 (TimerDisplay) and T020 (useTags) can run in parallel

**Within US3 (History)**:
- T024 (SessionCard) can run in parallel with T025 (layout)

**Within US4 (Goals)**:
- T030 (GoalCard) can run in parallel with T031 (layout)

---

## Parallel Example: User Story 4 (Goals)

```bash
# After Foundational phase completes, launch in parallel:
Task: "Implement useGoals hook in hooks/useGoals.ts"
Task: "Create GoalCard component in components/GoalCard.tsx"
Task: "Create Goals nested stack layout in app/(tabs)/goals/_layout.tsx"

# Then sequentially:
Task: "Build Goals list screen in app/(tabs)/goals/index.tsx"
Task: "Build Goal detail screen in app/(tabs)/goals/[goalId].tsx"
Task: "Build create-goal modal in app/create-goal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Timer + Save)
4. **STOP and VALIDATE**: Start timer, meditate, stop, tag, save. Verify crash recovery.
5. Deploy/demo if ready — app has core value proposition

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Timer) → Test independently → **MVP!**
3. Add US2 (Manual Entry) → Test independently → Full session input
4. Add US3 (History) → Test independently → Session browsing and editing
5. Add US4 (Goals) → Test independently → Progress tracking
6. Add US5 (Tags) → Test independently → Tag management
7. Add US6 (Stats) → Test independently → Insights and analytics
8. Polish → Cache invalidation verification, type/lint checks, smoke test

### Suggested MVP Scope

**User Story 1 only** (Phases 1–3, tasks T001–T022). This delivers the core value: timing a meditation and saving it. All subsequent stories add value incrementally without breaking previous functionality.
