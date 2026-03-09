/**
 * Repository Interfaces — Meditation Timer & Logger
 *
 * Data access contracts between the UI layer (React components/hooks)
 * and the persistence layer (expo-sqlite).
 */

// ─── Entity Types ───────────────────────────────────────────────────

export interface Session {
  id: number;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  durationSeconds: number;
  source: "timer" | "manual";
  createdAt: string; // ISO 8601 datetime
  updatedAt: string;
}

export interface Goal {
  id: number;
  targetHours: number;
  periodType: "year" | "month" | "custom";
  startDate: string; // ISO 8601 date (YYYY-MM-DD)
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithProgress extends Goal {
  progressSeconds: number;
  progressPercent: number;
  remainingHours: number;
  isCompleted: boolean;
  isExpired: boolean;
  expectedHours: number;
  expectedPercent: number;
  deltaHours: number;
}

// ─── Input Types (for create/update operations) ─────────────────────

export interface CreateSessionInput {
  date: string;
  durationSeconds: number;
  source: "timer" | "manual";
}

export interface UpdateSessionInput {
  id: number;
  date: string;
  durationSeconds: number;
}

export interface CreateGoalInput {
  targetHours: number;
  periodType: "year" | "month" | "custom";
  startDate: string;
  endDate: string;
}

export interface UpdateGoalInput {
  id: number;
  targetHours: number;
  periodType: "year" | "month" | "custom";
  startDate: string;
  endDate: string;
}

// ─── Statistics Types ───────────────────────────────────────────────

export interface SessionStats {
  totalSecondsAllTime: number;
  totalSecondsThisMonth: number;
  totalSecondsThisWeek: number;
  averageSessionSeconds: number;
  totalSessions: number;
  averageSessionsPerDay: number;
  currentStreak: number; // consecutive days
  longestStreak: number;
}

// ─── Timer State (kv-store) ─────────────────────────────────────────

export interface PersistedTimerState {
  startTime: number; // Date.now() when timer was started
  accumulatedMs: number; // ms from prior start/stop cycles
  isRunning: boolean;
}

// ─── Repository Interfaces ──────────────────────────────────────────

export interface ISessionRepository {
  getAll(): Promise<Session[]>;
  getById(id: number): Promise<Session | null>;
  create(input: CreateSessionInput): Promise<number>;
  update(input: UpdateSessionInput): Promise<void>;
  delete(id: number): Promise<void>;
  getStats(): Promise<SessionStats>;
}

export interface IGoalRepository {
  getAll(): Promise<GoalWithProgress[]>;
  getById(id: number): Promise<GoalWithProgress | null>;
  create(input: CreateGoalInput): Promise<number>;
  update(input: UpdateGoalInput): Promise<void>;
  delete(id: number): Promise<void>;
}
