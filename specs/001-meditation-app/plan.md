# Implementation Plan: Meditation Timer & Logger

**Branch**: `001-meditation-app` | **Date**: 2026-02-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-meditation-app/spec.md`

## Summary

Build a mobile meditation timing and logging app using Expo SDK 54 and React Native. The app provides a stopwatch-style timer, manual session entry, session history, goal tracking, tag management, and statistics. All data is stored locally in SQLite with no network dependency. Navigation uses 4 bottom tabs (Timer, History, Goals, Stats) with modal screens for data entry. The timer uses a `Date.now()` timestamp pattern with `expo-sqlite/kv-store` for crash recovery.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, @tanstack/react-query ^5.90.20, date-fns ^4.1.0, @expo/vector-icons ^15.0.2
**Storage**: expo-sqlite ~16.0.10 (local SQLite database: `bucket.db`); expo-sqlite/kv-store for timer crash recovery
**Testing**: Manual testing via Expo Go / development builds; `testID` props for automation; `npx expo lint` for linting; `npx tsc --noEmit` for type checking
**Target Platform**: iOS and Android (cross-platform via Expo managed workflow)
**Project Type**: Mobile (single Expo project with file-based routing)
**Performance Goals**: 60 fps animations (react-native-reanimated); session history loads < 1s for 1000 sessions (SC-004); goal progress updates < 1s (SC-003); app launch < 2s (SC-006)
**Constraints**: Fully offline (FR-020); no network dependency; all data on-device; portrait orientation
**Scale/Scope**: ~12 screens/modals; 4 database tables; single user; up to thousands of sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript First | PASS | All code will use .ts/.tsx; tsconfig.json has `strict: true`; path aliases configured |
| II. Mobile-First Design | PASS | Expo/React Native targeting iOS + Android; touch-first UI; react-native-reanimated for animations |
| III. Documentation-Driven Development | PASS | Research phase consulted Expo SDK docs, expo-sqlite docs, Expo Router docs |
| IV. Follow Existing Patterns | PASS | Using Expo Router file-based routing in `app/`; project is a clean slate so patterns are being established |
| V. Simplicity & Self-Documenting Code | PASS | No ORM (raw SQL is sufficient for 4 tables); no global state library; Date.now() pattern over complex background task APIs |

### Post-Design Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript First | PASS | All contracts defined in TypeScript; repository interfaces typed; query keys use `as const` |
| II. Mobile-First Design | PASS | Tab navigation for thumb-friendly access; formSheet modals for data entry; custom FAB in tab bar |
| III. Documentation-Driven Development | PASS | expo-sqlite v16 API patterns from official docs; Expo Router tab patterns from docs; timer pattern validated against community best practices |
| IV. Follow Existing Patterns | PASS | File-based routing in `app/(tabs)/`; providers in root layout; `@/*` path alias for imports |
| V. Simplicity & Self-Documenting Code | PASS | Repository classes with raw SQL (no ORM); TanStack Query for data fetching (no Redux); timer uses useRef + useState (no Reanimated for 1Hz text) |

**GATE RESULT: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-meditation-app/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions and rationale
├── data-model.md        # Phase 1 output — SQLite schema, queries, migrations
├── quickstart.md        # Phase 1 output — setup and architecture overview
├── contracts/           # Phase 1 output — TypeScript interfaces
│   └── repository-interfaces.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # Root Stack — providers (QueryClient, SQLite, Repos) + modal routes
├── (tabs)/
│   ├── _layout.tsx                 # Tab navigator (Timer, History, Goals, Stats) + FAB + gear icon
│   ├── index.tsx                   # Timer screen (default tab)
│   ├── history/
│   │   ├── _layout.tsx             # Nested Stack for History
│   │   ├── index.tsx               # Session list (reverse chronological)
│   │   └── [sessionId].tsx         # Session detail view
│   ├── goals/
│   │   ├── _layout.tsx             # Nested Stack for Goals
│   │   ├── index.tsx               # Goals list with progress
│   │   └── [goalId].tsx            # Goal detail/edit view
│   └── stats.tsx                   # Statistics and insights screen
├── manual-entry.tsx                # Modal (formSheet): log past session
├── save-session.tsx                # Modal (formSheet): save after timed session
├── edit-session.tsx                # Modal (formSheet): edit existing session
├── create-goal.tsx                 # Modal (formSheet): create/edit goal
└── settings.tsx                    # Modal: settings + tag management

data/
├── migrations.ts                   # PRAGMA user_version migration logic
├── database-provider.tsx           # RepositoryProvider context
├── query-keys.ts                   # TanStack Query key factory
└── repositories/
    ├── session-repository.ts       # Session CRUD + stats + tag breakdown queries
    ├── tag-repository.ts           # Tag CRUD
    └── goal-repository.ts          # Goal CRUD + progress calculation

hooks/
├── useTimer.ts                     # Stopwatch: Date.now() + AppState + kv-store persistence
├── useSessions.ts                  # useQuery/useMutation wrappers for sessions
├── useTags.ts                      # useQuery/useMutation wrappers for tags
├── useGoals.ts                     # useQuery/useMutation wrappers for goals
└── useSessionStats.ts              # useQuery for statistics + tag breakdown

components/
├── ui/                             # Reusable UI primitives
├── TimerDisplay.tsx                # HH:MM:SS formatted timer text
├── SessionCard.tsx                 # Session list item (date, duration, tags)
├── GoalCard.tsx                    # Goal progress card (bar, percentage, remaining)
├── TagPicker.tsx                   # Multi-select tag picker for session forms
├── SessionForm.tsx                 # Shared form for manual entry / edit session
├── GoalForm.tsx                    # Shared form for create / edit goal
└── EmptyState.tsx                  # Empty state message component

constants/
└── Colors.ts                       # Theme colors (light/dark)
```

**Structure Decision**: Single Expo mobile project using file-based routing. The `app/` directory follows Expo Router conventions. Data access code lives in `data/` at the repo root. Custom hooks in `hooks/`. Reusable components in `components/`. This follows the existing project structure defined in AGENTS.md.

## Complexity Tracking

No constitution violations to justify. All design decisions align with the simplicity principle.
