# Quickstart: Goal Expected Progress Tracking

**Feature Branch**: `002-goal-progress-tracking`
**Date**: 2026-02-15

## Overview

This feature adds expected progress tracking to meditation goals. Users can see how their actual progress compares to where they should be based on linear interpolation over the goal period. The implementation modifies 4 existing files — no new files, screens, or database migrations needed.

## Architecture

```
GoalRepository.mapRowWithProgress()   ← Compute expectedHours, expectedPercent, deltaHours
        │
        ▼
GoalWithProgress interface            ← Extended with 3 new fields
        │
        ├──► GoalCard.tsx             ← Progress bar marker + ahead/behind text
        │
        └──► [goalId].tsx             ← Detailed expected progress section
```

**Data flow**: The expected progress fields are computed in the same `mapRowWithProgress()` method that already computes `progressPercent`, `remainingHours`, `isCompleted`, and `isExpired`. They flow through the existing TanStack Query hooks (`useGoals`, `useGoal`) to the UI components. No new hooks or data providers are needed.

## Implementation Order

### Step 1: Extend GoalWithProgress Interface

**File**: `specs/001-meditation-app/contracts/repository-interfaces.ts`

Add three fields to `GoalWithProgress`:

```typescript
export interface GoalWithProgress extends Goal {
  // ... existing fields ...
  expectedHours: number;    // targetHours × (elapsedDays / totalDays)
  expectedPercent: number;  // (expectedHours / targetHours) × 100
  deltaHours: number;       // (progressSeconds / 3600) − expectedHours
}
```

### Step 2: Compute Expected Progress in Repository

**File**: `data/repositories/goal-repository.ts`

Add computation to `mapRowWithProgress()`:

```typescript
import { differenceInCalendarDays, parseISO, format, isBefore, startOfDay } from "date-fns";

// Inside mapRowWithProgress():
const todayDate = parseISO(today);
const start = parseISO(row.start_date);
const end = parseISO(row.end_date);

const totalDays = differenceInCalendarDays(end, start) + 1;
const elapsedDays = Math.max(0, differenceInCalendarDays(todayDate, start) + 1);
const fraction = Math.min(1, Math.max(0, elapsedDays / totalDays));

const expectedHours = row.target_hours * fraction;
const expectedPercent = fraction * 100;
const deltaHours = (row.progress_seconds / 3600) - expectedHours;
```

### Step 3: Update GoalCard Component

**File**: `components/GoalCard.tsx`

Add to the GoalCard (for non-completed goals):
1. A thin vertical marker on the progress bar at `expectedPercent%` position
2. Replace the "remaining" stat with an "expected" stat showing ahead/behind status
3. Color-code the status indicator using existing theme colors

### Step 4: Update Goal Detail Screen

**File**: `app/(tabs)/goals/[goalId].tsx`

Add to the detail screen (for non-completed goals):
1. An "Expected Progress" section showing expected hours
2. A delta display ("+X.Xh ahead" or "−X.Xh behind")
3. A marker on the detail progress bar

## Key Patterns

### Following Existing Patterns

- **Computed fields**: Follow the same pattern as `progressPercent` and `remainingHours` — computed in `mapRowWithProgress()`, returned as part of `GoalWithProgress`
- **Status colors**: Reuse `colors.success` (ahead), `colors.tint` (on track), `colors.warning` (behind) — same palette used for completed/in-progress/expired
- **Conditional display**: Follow the same `{!goal.isCompleted && (...)}` pattern used for the "Remaining" section
- **formatHours()**: Reuse the existing helper for consistent formatting

### Threshold Calculation

```typescript
const threshold = goal.targetHours * 0.05; // 5% of target
const isAhead = goal.deltaHours > threshold;
const isBehind = goal.deltaHours < -threshold;
// Otherwise: on track
```

## Dependencies

- **date-fns** (already installed, ^4.1.0): `differenceInCalendarDays`, `parseISO`
- No new packages needed
- No database migration needed
- No new Expo modules needed

## Testing

1. Create a yearly goal (e.g., 100 hours, 2026)
2. Log some sessions
3. Verify GoalCard shows expected progress marker and ahead/behind status
4. Verify GoalDetailScreen shows expected hours and delta
5. Verify completed goals do not show expected progress
6. Verify expired goals show expected = target
7. Test with monthly and custom period goals
