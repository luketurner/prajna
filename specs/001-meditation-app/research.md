# Research: Meditation Timer & Logger

**Feature Branch**: `001-meditation-app`
**Date**: 2026-02-02

## 1. expo-sqlite Data Access Patterns

### Decision: Use expo-sqlite v16 async API with `<SQLiteProvider>`, repository classes, and @tanstack/react-query

**Rationale:** The project already has `expo-sqlite ~16.0.10` and `@tanstack/react-query ^5.90.20` installed. The v16 API provides `<SQLiteProvider>` for React context integration and `useSQLiteContext()` for hook access. Repository classes encapsulate SQL per entity. TanStack Query provides caching, loading states, and mutation-driven cache invalidation.

**Alternatives considered:**
- Drizzle ORM: Adds type-safe schema but is an extra dependency for a simple data model (3 tables).
- Direct queries in hooks: Couples data access to UI; harder to test.
- TypeORM: Heavier, maintenance concerns.

### Key Patterns

- **Initialization**: `<SQLiteProvider databaseName="bucket.db" onInit={migrateDbIfNeeded}>` wrapped in `<Suspense>`.
- **Migrations**: `PRAGMA user_version` incremented per migration step in `onInit` callback.
- **WAL mode**: `PRAGMA journal_mode = WAL` enabled on init for concurrent read/write performance.
- **Transactions**: `withExclusiveTransactionAsync(txn)` for write operations; use `txn` not `db` inside.
- **TanStack Query**: `staleTime: Infinity` for local DB (no auto-refetch); invalidate manually in mutation `onSuccess`.
- **Query keys**: Factory pattern (`queryKeys.sessions.all`, `queryKeys.goals.byId(id)`).

---

## 2. Expo Router Tab Navigation

### Decision: Use `(tabs)` directory group with `Tabs` from expo-router, custom tab bar for FAB, modals as root-level Stack screens

**Rationale:** Expo Router's file-based routing with `(tabs)` convention is the documented pattern. The `Tabs` component wraps `@react-navigation/bottom-tabs` (already installed at `^7.4.0`). Typed routes are already enabled in `app.json`.

**Alternatives considered:**
- NativeTabs (`expo-router/unstable-native-tabs`): Marked unstable in SDK 54; API subject to change.
- Custom tabs via `expo-router/ui` (TabList/TabTrigger/TabSlot): Experimental; more boilerplate.
- React Navigation directly (no Expo Router): Loses file-based routing and typed routes.

### Navigation Architecture

| Screen | Route Type | File Path |
|--------|-----------|-----------|
| Timer (home) | Tab | `app/(tabs)/index.tsx` |
| History list | Tab (nested stack) | `app/(tabs)/history/index.tsx` |
| Session detail | Pushed in history stack | `app/(tabs)/history/[sessionId].tsx` |
| Goals list | Tab (nested stack) | `app/(tabs)/goals/index.tsx` |
| Goal detail | Pushed in goals stack | `app/(tabs)/goals/[goalId].tsx` |
| Stats | Tab | `app/(tabs)/stats.tsx` |
| Manual entry | Modal (formSheet) | `app/manual-entry.tsx` |
| Save session | Modal (formSheet) | `app/save-session.tsx` |
| Edit session | Modal (formSheet) | `app/edit-session.tsx` |
| Create/edit goal | Modal (formSheet) | `app/create-goal.tsx` |
| Settings | Modal | `app/settings.tsx` |

### FAB Pattern

Use the `tabBar` prop on `<Tabs>` to render a custom tab bar component that inserts a "+" floating action button between the History and Goals tabs. The FAB calls `router.push('/manual-entry')` to open the manual entry modal. No phantom tab screen is needed.

### Settings Access

Gear icon in `headerRight` of the tab layout's `screenOptions`. Links to `/settings` modal.

---

## 3. Timer Implementation (Stopwatch + Background + Crash Recovery)

### Decision: Use `Date.now()` timestamp subtraction, `AppState` listener, and `expo-sqlite/kv-store` sync API for persistence

**Rationale:** A count-up stopwatch does not need background execution. Store the absolute `startTime` when the timer begins. Compute elapsed time as `Date.now() - startTime` on each display tick. This is inherently accurate across foreground/background transitions because the system clock continues regardless of app state.

**Alternatives considered:**
- `setInterval` accumulation (count += 1 each second): Drifts, compounds errors.
- `requestAnimationFrame`: No accuracy benefit over setInterval + Date.now() for 1Hz updates.
- `expo-background-task` / `expo-task-manager`: Not needed; timer doesn't need to execute in background.
- `react-native-background-timer`: Requires ejecting from Expo managed workflow.
- `react-native-reanimated` for timer display: Massive complexity for 1Hz text update; designed for 60fps animations.

### Timer Architecture

```
Start → Store startTime = Date.now() + persist to kv-store
Tick  → elapsed = accumulated + (Date.now() - startTime) → display HH:MM:SS
Background → Clear interval, persist state (sync)
Foreground → Restart interval, first tick auto-corrects
Crash → State persisted on last background event
Launch → Check kv-store for isRunning=true → offer save/discard
Stop → accumulated += elapsed, persist isRunning=false, navigate to save screen
```

### Crash Recovery (FR-019)

On app launch, read `timer_state` from `expo-sqlite/kv-store` using `getItemSync()`. If `isRunning` was `true`, calculate elapsed time from stored `startTime` to current time. Present a recovery dialog offering save or discard.

### Dependencies

All already installed:
- `expo-sqlite` (for kv-store) — ~16.0.10
- `react-native` (for AppState) — 0.81.4

Recommended addition:
- `expo-keep-awake` — prevent screen sleep during active meditation

Not needed:
- `expo-background-task`, `expo-task-manager`, `@react-native-async-storage/async-storage`

---

## 4. Date/Time Handling

### Decision: Use `date-fns` (already installed at `^4.1.0`) for all date formatting, comparison, and calculation

**Rationale:** `date-fns` is already a project dependency, provides tree-shakeable functions, works with native Date objects, and handles all needed operations (formatting, startOfDay, differenceInCalendarDays, isWithinInterval, etc.).

**Key operations:**
- Streak calculation: `differenceInCalendarDays`, `startOfDay`
- Goal period checking: `isWithinInterval`, `startOfYear`, `endOfYear`, `startOfMonth`, `endOfMonth`
- Display formatting: `format(date, 'MMM d, yyyy')`
- Duration formatting: Custom `formatDuration(seconds)` utility

---

## 5. State Management

### Decision: Use @tanstack/react-query for server state (DB reads/writes) and React `useState`/`useRef` for local UI state (timer)

**Rationale:** TanStack Query (already installed) provides caching, loading/error states, and cache invalidation for database operations. The timer is purely local UI state that doesn't benefit from query caching. No global state management library (Redux, Zustand) is needed.

**Key patterns:**
- `useQuery` for reads (sessions list, goals list, stats)
- `useMutation` with `onSuccess` invalidation for writes (create/edit/delete session/goal/tag)
- `staleTime: Infinity` since all data is local (invalidate manually)
- `useRef` for timer start time and accumulated time (not in render cycle)
- `useState` for timer display value (triggers re-render)

---

## 6. New Dependencies Required

| Package | Purpose | Already Installed |
|---------|---------|-------------------|
| `expo-keep-awake` | Prevent screen sleep during timer | No — install via `npx expo install expo-keep-awake` |

All other dependencies are already in `package.json`.
