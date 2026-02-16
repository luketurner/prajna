/**
 * Contract: GoalWithProgress Extension for Expected Progress Tracking
 *
 * Feature: 002-goal-progress-tracking
 *
 * This contract defines the new computed fields added to GoalWithProgress.
 * These fields are computed in GoalRepository.mapRowWithProgress() and
 * flow to all consumers (GoalCard, GoalDetailScreen) through the existing
 * data pipeline.
 *
 * No new interfaces are created — the existing GoalWithProgress interface
 * in specs/001-meditation-app/contracts/repository-interfaces.ts is extended
 * with these fields.
 */

// ─── Extended GoalWithProgress Fields ───────────────────────────────

/**
 * These fields will be added to the existing GoalWithProgress interface:
 *
 * expectedHours: number
 *   - Hours the user should have completed by today
 *   - Formula: targetHours × clamp(elapsedDays / totalDays, 0, 1)
 *   - Range: [0, targetHours]
 *
 * expectedPercent: number
 *   - Expected progress as percentage of target
 *   - Formula: (expectedHours / targetHours) × 100
 *   - Range: [0, 100]
 *
 * deltaHours: number
 *   - Actual hours minus expected hours
 *   - Positive = ahead of schedule
 *   - Negative = behind schedule
 *   - Zero (within ±5% threshold) = on track
 */

// ─── Status Derivation ─────────────────────────────────────────────

/**
 * Expected progress status (not a stored field, derived in UI components):
 *
 * type ExpectedProgressStatus = "ahead" | "on_track" | "behind";
 *
 * Derivation:
 *   threshold = targetHours × 0.05
 *   if (isCompleted) → do not display expected progress
 *   if (deltaHours > threshold) → "ahead" (use colors.success)
 *   if (deltaHours < -threshold) → "behind" (use colors.warning)
 *   else → "on_track" (use colors.tint)
 */

// ─── Interface Changes ─────────────────────────────────────────────

/**
 * File: specs/001-meditation-app/contracts/repository-interfaces.ts
 *
 * BEFORE:
 *   export interface GoalWithProgress extends Goal {
 *     progressSeconds: number;
 *     progressPercent: number;
 *     remainingHours: number;
 *     isCompleted: boolean;
 *     isExpired: boolean;
 *   }
 *
 * AFTER:
 *   export interface GoalWithProgress extends Goal {
 *     progressSeconds: number;
 *     progressPercent: number;
 *     remainingHours: number;
 *     isCompleted: boolean;
 *     isExpired: boolean;
 *     expectedHours: number;
 *     expectedPercent: number;
 *     deltaHours: number;
 *   }
 */
