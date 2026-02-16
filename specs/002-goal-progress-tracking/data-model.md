# Data Model: Goal Expected Progress Tracking

**Feature Branch**: `002-goal-progress-tracking`
**Date**: 2026-02-15
**Storage**: expo-sqlite v16 (local SQLite database: `prajna.db`) — no schema changes

## Schema Changes

**None.** This feature adds no new tables, columns, or indexes. Expected progress is a set of computed fields derived from existing goal data and the current date.

## Entity Changes

### GoalWithProgress (extended)

The existing `GoalWithProgress` interface gains three new computed fields. These are calculated at query time in `GoalRepository.mapRowWithProgress()`, not stored in the database.

| Field | Type | Computation | Description |
|-------|------|-------------|-------------|
| `expectedHours` | `number` | `targetHours × clamp(elapsedDays / totalDays, 0, 1)` | Hours the user should have completed by today, based on linear interpolation over the goal period |
| `expectedPercent` | `number` | `(expectedHours / targetHours) × 100` | Expected progress as a percentage of target (0–100) |
| `deltaHours` | `number` | `actualHours − expectedHours` | Difference between actual and expected progress in hours. Positive = ahead, negative = behind |

**Computation details**:

```
today        = current date (YYYY-MM-DD)
elapsedDays  = differenceInCalendarDays(today, startDate) + 1   // inclusive
totalDays    = differenceInCalendarDays(endDate, startDate) + 1  // inclusive
fraction     = clamp(elapsedDays / totalDays, 0, 1)

expectedHours   = targetHours × fraction
expectedPercent = fraction × 100
deltaHours      = (progressSeconds / 3600) − expectedHours
```

**Boundary conditions**:

| Condition | elapsedDays | fraction | expectedHours |
|-----------|-------------|----------|---------------|
| `today < startDate` | ≤ 0 | 0 | 0 |
| `today = startDate` | 1 | 1/totalDays | targetHours/totalDays |
| `today = endDate` | totalDays | 1 | targetHours |
| `today > endDate` | > totalDays | 1 | targetHours |

**Status derivation** (for UI display):

```
threshold = targetHours × 0.05   // 5% of target

if goal.isCompleted:
  status = N/A (expected progress not displayed)
elif deltaHours > threshold:
  status = "ahead"
elif deltaHours < -threshold:
  status = "behind"
else:
  status = "on_track"
```

## Existing Entity Reference

The following entities remain unchanged from the 001-meditation-app data model:

- **goals** table: id, target_hours, period_type, start_date, end_date, created_at, updated_at
- **sessions** table: id, date, duration_seconds, source, created_at, updated_at
- **Goal progress query**: `LEFT JOIN sessions s ON s.date BETWEEN g.start_date AND g.end_date`

## Migration

**No migration needed.** No database version bump required. The new fields are purely computed in the application layer.
