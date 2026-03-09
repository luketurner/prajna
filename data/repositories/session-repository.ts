import type {
  CreateSessionInput,
  ISessionRepository,
  Session,
  SessionStats,
  UpdateSessionInput,
} from "@/data/repository-interfaces";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

interface SessionRow {
  id: number;
  date: string;
  duration_seconds: number;
  source: "timer" | "manual";
  created_at: string;
  updated_at: string;
}

export class SessionRepository implements ISessionRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<Session[]> {
    const sessions = await this.db.getAllAsync<SessionRow>(
      `SELECT * FROM sessions ORDER BY date DESC, created_at DESC`,
    );

    return sessions.map((s) => this.mapRow(s));
  }

  async getById(id: number): Promise<Session | null> {
    const session = await this.db.getFirstAsync<SessionRow>(
      `SELECT * FROM sessions WHERE id = ?`,
      [id],
    );

    if (!session) return null;
    return this.mapRow(session);
  }

  async create(input: CreateSessionInput): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO sessions (date, duration_seconds, source) VALUES (?, ?, ?)`,
      [input.date, input.durationSeconds, input.source],
    );

    return result.lastInsertRowId;
  }

  async update(input: UpdateSessionInput): Promise<void> {
    await this.db.runAsync(
      `UPDATE sessions SET date = ?, duration_seconds = ?, updated_at = datetime('now') WHERE id = ?`,
      [input.date, input.durationSeconds, input.id],
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync(`DELETE FROM sessions WHERE id = ?`, [id]);
  }

  async getStats(earliestDate?: string): Promise<SessionStats> {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const weekStart = format(
      startOfWeek(now, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );

    // Total all time
    const allTimeResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions`,
    );
    const totalSecondsAllTime = allTimeResult?.total ?? 0;

    // Total this month
    const monthResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions WHERE date >= ?`,
      [monthStart],
    );
    const totalSecondsThisMonth = monthResult?.total ?? 0;

    // Total this week
    const weekResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions WHERE date >= ?`,
      [weekStart],
    );
    const totalSecondsThisWeek = weekResult?.total ?? 0;

    // Count and average
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sessions`,
    );
    const totalSessions = countResult?.count ?? 0;
    const averageSessionSeconds =
      totalSessions > 0 ? Math.round(totalSecondsAllTime / totalSessions) : 0;

    // Average sessions per day
    let resolvedEarliest = earliestDate ?? null;
    if (!resolvedEarliest) {
      const earliestResult = await this.db.getFirstAsync<{
        earliest: string | null;
      }>(`SELECT MIN(date) as earliest FROM sessions`);
      resolvedEarliest = earliestResult?.earliest ?? null;
    }
    let averageSessionsPerDay = 0;
    if (totalSessions > 0 && resolvedEarliest) {
      const daysSinceFirst =
        differenceInCalendarDays(now, parseISO(resolvedEarliest)) + 1;
      averageSessionsPerDay =
        Math.round((totalSessions / daysSinceFirst) * 100) / 100;
    }

    // Streaks
    const { currentStreak, longestStreak } = await this.calculateStreaks();

    return {
      totalSecondsAllTime,
      totalSecondsThisMonth,
      totalSecondsThisWeek,
      averageSessionSeconds,
      totalSessions,
      averageSessionsPerDay,
      currentStreak,
      longestStreak,
    };
  }

  private mapRow(row: SessionRow): Session {
    return {
      id: row.id,
      date: row.date,
      durationSeconds: row.duration_seconds,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async calculateStreaks(): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    const rows = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM sessions ORDER BY date DESC`,
    );

    if (rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = rows.map((r) => startOfDay(parseISO(r.date)));
    const today = startOfDay(new Date());

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let currentStreakEnded = false;
    let prevDate: Date | null = null;

    for (const date of dates) {
      if (prevDate === null) {
        // First date - check if it's today or yesterday to count current streak
        const daysFromToday = differenceInCalendarDays(today, date);
        if (daysFromToday <= 1) {
          streak = 1;
          currentStreak = 1;
        } else {
          // Gap from today, so current streak is 0 but we still count longest
          streak = 1;
          currentStreakEnded = true;
        }
      } else {
        const daysDiff = differenceInCalendarDays(prevDate, date);
        if (daysDiff === 1) {
          streak++;
          if (!currentStreakEnded) {
            currentStreak = streak;
          }
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
          currentStreakEnded = true;
        }
      }
      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, streak);

    return { currentStreak, longestStreak };
  }
}
