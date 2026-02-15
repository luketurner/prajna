# Quickstart: Meditation Timer & Logger

**Feature Branch**: `001-meditation-app`

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) and/or Android Emulator
- Git (on branch `001-meditation-app`)

## Setup

```bash
# Install dependencies (already done if node_modules exists)
npm install

# Install the one new dependency
npx expo install expo-keep-awake

# Start the development server
npx expo start
```

## Project Structure (Target)

```
app/
  _layout.tsx                     # Root Stack — providers + modal routes
  (tabs)/
    _layout.tsx                   # Tab navigator (4 tabs + FAB + gear icon)
    index.tsx                     # Timer screen (default)
    history/
      _layout.tsx                 # Nested Stack for History
      index.tsx                   # Session list
      [sessionId].tsx             # Session detail
    goals/
      _layout.tsx                 # Nested Stack for Goals
      index.tsx                   # Goals list
      [goalId].tsx                # Goal detail
    stats.tsx                     # Statistics screen
  manual-entry.tsx                # Modal: log past session
  save-session.tsx                # Modal: save after timed session
  edit-session.tsx                # Modal: edit existing session
  create-goal.tsx                 # Modal: create/edit goal
  settings.tsx                    # Modal: settings + tag management

data/
  migrations.ts                   # PRAGMA user_version migration logic
  database-provider.tsx           # RepositoryProvider context
  query-keys.ts                   # TanStack Query key factory
  repositories/
    session-repository.ts         # Session CRUD + stats queries
    tag-repository.ts             # Tag CRUD
    goal-repository.ts            # Goal CRUD + progress queries

hooks/
  useTimer.ts                     # Stopwatch hook (Date.now pattern + kv-store)
  useSessions.ts                  # useQuery/useMutation for sessions
  useTags.ts                      # useQuery/useMutation for tags
  useGoals.ts                     # useQuery/useMutation for goals
  useSessionStats.ts              # useQuery for statistics

components/
  ui/                             # Reusable UI primitives
  TimerDisplay.tsx                # HH:MM:SS formatted timer
  SessionCard.tsx                 # Session list item
  GoalCard.tsx                    # Goal progress display
  TagPicker.tsx                   # Multi-select tag picker
  FAB.tsx                         # Floating action button

constants/
  Colors.ts                       # Theme colors
```

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Root Layout (app/_layout.tsx)                   │
│  ┌─────────────────────────────────────────────┐│
│  │  QueryClientProvider                         ││
│  │  ┌─────────────────────────────────────────┐││
│  │  │  SQLiteProvider (prajna.db, migrations)  │││
│  │  │  ┌─────────────────────────────────────┐│││
│  │  │  │  RepositoryProvider                  ││││
│  │  │  │  ┌─────────────────────────────────┐││││
│  │  │  │  │  Stack Navigator                │││││
│  │  │  │  │  ├── (tabs) — Tab Navigator     │││││
│  │  │  │  │  │   ├── Timer                  │││││
│  │  │  │  │  │   ├── History (nested stack) │││││
│  │  │  │  │  │   ├── Goals (nested stack)   │││││
│  │  │  │  │  │   └── Stats                  │││││
│  │  │  │  │  ├── manual-entry (modal)       │││││
│  │  │  │  │  ├── save-session (modal)       │││││
│  │  │  │  │  ├── edit-session (modal)       │││││
│  │  │  │  │  ├── create-goal (modal)        │││││
│  │  │  │  │  └── settings (modal)           │││││
│  │  │  │  │                                 │││││
│  │  │  │  └─────────────────────────────────┘││││
│  │  │  └─────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────┘││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Key Technology Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Storage | expo-sqlite v16 (async API) | Already installed; local-only app |
| KV store | expo-sqlite/kv-store | Timer crash recovery; same engine |
| State mgmt | @tanstack/react-query | Caching, invalidation, loading states |
| Navigation | Expo Router (file-based) | Typed routes, convention-based |
| Timer | Date.now() + setInterval(1s) | Accurate across background; simple |
| Dates | date-fns v4 | Already installed; tree-shakeable |
| Icons | @expo/vector-icons (MaterialIcons) | Already installed; cross-platform |
| Screen awake | expo-keep-awake | Prevent sleep during meditation |

## Verification

After implementation, verify with:

```bash
# Type checking
npx tsc --noEmit

# Linting
npx expo lint

# Project health
npx expo doctor

# Run dev server
npx expo start
```
