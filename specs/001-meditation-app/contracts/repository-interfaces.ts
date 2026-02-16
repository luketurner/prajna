/**
 * Repository Interfaces — Meditation Timer & Logger
 *
 * These TypeScript interfaces define the data access contracts between
 * the UI layer (React components/hooks) and the persistence layer (expo-sqlite).
 * Implementation uses repository classes that accept SQLiteDatabase.
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

export interface SessionWithTags extends Session {
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
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
  tagIds: number[];
}

export interface UpdateSessionInput {
  id: number;
  date: string;
  durationSeconds: number;
  tagIds: number[];
}

export interface CreateTagInput {
  name: string;
}

export interface UpdateTagInput {
  id: number;
  name: string;
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
  currentStreak: number; // consecutive days
  longestStreak: number;
}

export interface TagBreakdown {
  tagId: number;
  tagName: string;
  totalSeconds: number;
}

// ─── Timer State (kv-store) ─────────────────────────────────────────

export interface PersistedTimerState {
  startTime: number; // Date.now() when timer was started
  accumulatedMs: number; // ms from prior start/stop cycles
  isRunning: boolean;
}

// ─── Repository Interfaces ──────────────────────────────────────────

export interface ISessionRepository {
  getAll(): Promise<SessionWithTags[]>;
  getById(id: number): Promise<SessionWithTags | null>;
  create(input: CreateSessionInput): Promise<number>;
  update(input: UpdateSessionInput): Promise<void>;
  delete(id: number): Promise<void>;
  getStats(): Promise<SessionStats>;
  getTagBreakdown(): Promise<TagBreakdown[]>;
}

export interface ITagRepository {
  getAll(): Promise<Tag[]>;
  getById(id: number): Promise<Tag | null>;
  create(input: CreateTagInput): Promise<number>;
  update(input: UpdateTagInput): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface IGoalRepository {
  getAll(): Promise<GoalWithProgress[]>;
  getById(id: number): Promise<GoalWithProgress | null>;
  create(input: CreateGoalInput): Promise<number>;
  update(input: UpdateGoalInput): Promise<void>;
  delete(id: number): Promise<void>;
}

// ─── Query Keys (for @tanstack/react-query) ─────────────────────────

export const queryKeys = {
  sessions: {
    all: ["sessions"] as const,
    byId: (id: number) => ["sessions", id] as const,
    stats: ["sessions", "stats"] as const,
    tagBreakdown: ["sessions", "tagBreakdown"] as const,
  },
  tags: {
    all: ["tags"] as const,
    byId: (id: number) => ["tags", id] as const,
  },
  goals: {
    all: ["goals"] as const,
    byId: (id: number) => ["goals", id] as const,
  },
} as const;
