# Research: Goal Expected Progress Tracking

**Feature Branch**: `002-goal-progress-tracking`
**Date**: 2026-02-15

## Research Tasks

### 1. Expected Progress Calculation Model

**Decision**: Linear interpolation (uniform daily progress)

**Rationale**: The simplest and most intuitive model. If a user has a 100-hour goal over 365 days, the expected progress on day 183 is `100 × (183/365) ≈ 50.1 hours`. Users intuitively understand "I should be X% done since X% of the time has passed."

**Formula**:
```
elapsedDays = differenceInCalendarDays(today, startDate) + 1  (inclusive of start day)
totalDays   = differenceInCalendarDays(endDate, startDate) + 1  (inclusive of both endpoints)
fraction    = clamp(elapsedDays / totalDays, 0, 1)
expectedHours = targetHours × fraction
```

**Boundary conditions**:
- `today < startDate` → fraction = 0, expectedHours = 0
- `today > endDate` → fraction = 1, expectedHours = targetHours
- `today = startDate` → fraction = 1/totalDays (one day's worth)
- `today = endDate` → fraction = totalDays/totalDays = 1

**Alternatives considered**:

| Model | Description | Why Rejected |
|-------|-------------|-------------|
| Weighted by day-of-week | Expect more on weekends, less on weekdays | Adds complexity; user hasn't expressed schedule preferences; no data to calibrate weights |
| Front-loaded / back-loaded | Expect more at start or end of period | Arbitrary without user input; linear is the neutral assumption |
| Exponential curve | Expect slower start, faster ramp-up | Over-engineered for a meditation tracker; hard to explain to users |

### 2. Day Counting with date-fns

**Decision**: Use `differenceInCalendarDays` from date-fns

**Rationale**: Already in the project dependencies (date-fns ^4.1.0). `differenceInCalendarDays` counts full calendar days between two dates, ignoring time-of-day and timezone shifts. This avoids bugs from daylight saving transitions or partial days when using raw `Date` subtraction.

**Usage**:
```typescript
import { differenceInCalendarDays, parseISO } from "date-fns";

const elapsed = differenceInCalendarDays(parseISO(today), parseISO(startDate)) + 1;
const total = differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
```

The `+1` makes both endpoints inclusive: a goal from Jan 1 to Jan 1 is 1 day (not 0).

**Alternatives considered**:

| Approach | Why Rejected |
|----------|-------------|
| Raw `Date` subtraction (`(d2 - d1) / 86400000`) | Vulnerable to DST transitions (23h or 25h days); requires manual rounding |
| `differenceInDays` (date-fns) | Truncates to full 24h periods; less intuitive for calendar-day counting |

### 3. Ahead/On-Track/Behind Threshold

**Decision**: ±5% of target hours as threshold for "on track"

**Rationale**: A goal of 100 hours has a ±5h dead zone. If expected is 50h and actual is between 45h and 55h, the user is "on track." Outside that range, they're "ahead" or "behind." This avoids triggering anxiety for minor daily fluctuations.

**Examples**:
- 100h goal: ±5h threshold → on track if within 5h of expected
- 10h goal: ±0.5h threshold → on track if within 30m of expected
- 365h goal: ±18.25h threshold → on track if within ~18h of expected

**Alternatives considered**:

| Threshold | Why Rejected |
|-----------|-------------|
| Exact match (0% tolerance) | Would always show behind or ahead; never "on track" |
| ±10% of target | Too generous; would mask significant divergence |
| ±1 day's worth of progress | Varies too much — 1 day on a 365-day goal is 0.27%, but 1 day on a 7-day goal is 14% |

### 4. Visual Representation: Progress Bar Marker

**Decision**: A thin vertical line/tick on the existing progress bar at the expectedPercent position

**Rationale**: Reuses the existing progress bar without adding a second bar. A thin marker (2px wide, slightly taller than the bar) is immediately visible as a reference point. The user sees the colored fill (actual) relative to the marker (expected) — fill past the marker = ahead, fill before = behind.

**Alternatives considered**:

| Approach | Why Rejected |
|----------|-------------|
| Second progress bar below | Takes more vertical space; clutters the card; violates simplicity |
| Gradient fill (green→yellow→red) | Hard to read the exact expected value; gradient endpoint is ambiguous |
| Percentage text only | Doesn't leverage the existing progress bar visual; requires mental math |
| Overlay dashed line | Harder to implement in React Native; the View-based approach is simpler |

### 5. Where to Compute Expected Progress

**Decision**: In `GoalRepository.mapRowWithProgress()`, alongside existing computed fields

**Rationale**: Expected progress depends on the same data as existing computed fields (targetHours, startDate, endDate) plus today's date. Computing it in the mapper keeps all goal-derived computations in one place. The result flows through the existing `GoalWithProgress` interface to all consumers (GoalCard, GoalDetailScreen) without any hook or component changes to the data flow.

**Alternatives considered**:

| Approach | Why Rejected |
|----------|-------------|
| Compute in each component | Duplicates logic; inconsistent if formula changes |
| Compute in a custom hook | Unnecessary indirection; the repository mapper already computes derived fields |
| Compute in SQL | Date arithmetic in SQLite is less expressive than date-fns; would need `julianday()` function calls |

### 6. Color Scheme for Ahead/Behind Status

**Decision**: Reuse existing theme colors — `success` (green) for ahead, `tint` (blue) for on track, `warning` (amber) for behind

**Rationale**: These colors are already defined in `Colors.ts` and used throughout the app for status indication (goal completed = green, expired = amber). Reusing them maintains visual consistency without adding new color constants.

**No alternatives considered** — the existing palette is sufficient.
