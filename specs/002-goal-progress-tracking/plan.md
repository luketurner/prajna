# Implementation Plan: Goal Expected Progress Tracking

**Branch**: `002-goal-progress-tracking` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-goal-progress-tracking/spec.md`

## Summary

Add expected progress tracking to the existing goal system. For each active goal, calculate how much meditation time the user should have completed by now (linear interpolation over the goal period), and display this alongside actual progress. The GoalCard and GoalDetailScreen are enhanced with expected progress values, ahead/behind indicators, and a progress bar marker. No new screens, database tables, or migrations are needed — this is a computed-field and UI enhancement to existing views.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, @tanstack/react-query ^5.90.20, date-fns ^4.1.0, @expo/vector-icons ^15.0.2
**Storage**: expo-sqlite ~16.0.10 (local SQLite database: `prajna.db`) — no schema changes needed
**Testing**: Manual testing via Expo Go / development builds; `testID` props for automation; `npx expo lint` for linting; `npx tsc --noEmit` for type checking
**Target Platform**: iOS and Android (cross-platform via Expo managed workflow)
**Project Type**: Mobile (single Expo project with file-based routing)
**Performance Goals**: 60 fps; expected progress calculation is pure math (< 1ms per goal)
**Constraints**: Fully offline; no network dependency; all data on-device
**Scale/Scope**: Modifies 4 existing files; no new files; no new screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript First | PASS | All modified files are .ts/.tsx; new computed fields will be typed in GoalWithProgress interface |
| II. Mobile-First Design | PASS | Enhances existing mobile UI components; no new screens; minimal visual additions |
| III. Documentation-Driven Development | PASS | date-fns differenceInCalendarDays is documented; no new library adoption needed |
| IV. Follow Existing Patterns | PASS | Extends existing GoalWithProgress interface pattern; follows existing mapRowWithProgress computation pattern |
| V. Simplicity & Self-Documenting Code | PASS | Pure math computation added to existing mapper; no new abstractions; no over-engineering |

### Post-Design Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript First | PASS | GoalWithProgress interface extended with 3 typed fields; all computations type-safe |
| II. Mobile-First Design | PASS | Expected progress marker is a thin line on existing progress bar; status colors reuse existing palette |
| III. Documentation-Driven Development | PASS | date-fns differenceInCalendarDays used for day counting (avoids timezone issues with raw Date math) |
| IV. Follow Existing Patterns | PASS | Computed fields follow same pattern as progressPercent/remainingHours; status color logic follows existing ahead/behind pattern |
| V. Simplicity & Self-Documenting Code | PASS | No new utility files; calculation is 5 lines in existing mapper; UI changes are minimal additions to existing components |

**GATE RESULT: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-goal-progress-tracking/
├── plan.md              # This file
├── research.md          # Phase 0 output — calculation approach decisions
├── data-model.md        # Phase 1 output — extended GoalWithProgress entity
├── quickstart.md        # Phase 1 output — implementation guide
├── contracts/           # Phase 1 output — updated TypeScript interface
│   └── goal-with-expected-progress.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes (repository root)

```text
# Files to MODIFY (no new files created):

specs/001-meditation-app/contracts/repository-interfaces.ts
  └── Extend GoalWithProgress interface with expectedHours, expectedPercent, deltaHours

data/repositories/goal-repository.ts
  └── Add expected progress computation to mapRowWithProgress()

components/GoalCard.tsx
  └── Add expected progress marker on progress bar
  └── Add ahead/on-track/behind indicator text
  └── Conditionally hide for completed goals

app/(tabs)/goals/[goalId].tsx
  └── Add expected progress section with detailed ahead/behind display
  └── Add expected progress marker on detail progress bar
  └── Conditionally hide for completed goals
```

**Structure Decision**: No new files or directories are needed at the source level. This feature extends existing interfaces and components. The expected progress calculation is a pure function added to the existing `mapRowWithProgress()` method in the goal repository.

## Complexity Tracking

No constitution violations to justify. All design decisions align with the simplicity principle — this feature adds computed fields to an existing mapper and visual indicators to existing components.
