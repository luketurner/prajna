import type { SQLiteDatabase } from "expo-sqlite";
import {
  differenceInCalendarDays,
  parseISO,
  startOfDay,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  SessionWithTags,
  Tag,
  CreateSessionInput,
  UpdateSessionInput,
  SessionStats,
  TagBreakdown,
  ISessionRepository,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface SessionRow {
  id: number;
  date: string;
  duration_seconds: number;
  source: "timer" | "manual";
  created_at: string;
  updated_at: string;
}

interface TagRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export class SessionRepository implements ISessionRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<SessionWithTags[]> {
    const sessions = await this.db.getAllAsync<SessionRow>(
      `SELECT * FROM sessions ORDER BY date DESC, created_at DESC`
    );

    return Promise.all(sessions.map((s) => this.attachTags(s)));
  }

  async getById(id: number): Promise<SessionWithTags | null> {
    const session = await this.db.getFirstAsync<SessionRow>(
      `SELECT * FROM sessions WHERE id = ?`,
      [id]
    );

    if (!session) return null;
    return this.attachTags(session);
  }

  async create(input: CreateSessionInput): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO sessions (date, duration_seconds, source) VALUES (?, ?, ?)`,
      [input.date, input.durationSeconds, input.source]
    );

    const sessionId = result.lastInsertRowId;

    // Insert tag associations
    for (const tagId of input.tagIds) {
      await this.db.runAsync(
        `INSERT INTO session_tags (session_id, tag_id) VALUES (?, ?)`,
        [sessionId, tagId]
      );
    }

    return sessionId;
  }

  async update(input: UpdateSessionInput): Promise<void> {
    await this.db.runAsync(
      `UPDATE sessions SET date = ?, duration_seconds = ?, updated_at = datetime('now') WHERE id = ?`,
      [input.date, input.durationSeconds, input.id]
    );

    // Replace tag associations
    await this.db.runAsync(`DELETE FROM session_tags WHERE session_id = ?`, [
      input.id,
    ]);
    for (const tagId of input.tagIds) {
      await this.db.runAsync(
        `INSERT INTO session_tags (session_id, tag_id) VALUES (?, ?)`,
        [input.id, tagId]
      );
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync(`DELETE FROM sessions WHERE id = ?`, [id]);
  }

  async getStats(): Promise<SessionStats> {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

    // Total all time
    const allTimeResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions`
    );
    const totalSecondsAllTime = allTimeResult?.total ?? 0;

    // Total this month
    const monthResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions WHERE date >= ?`,
      [monthStart]
    );
    const totalSecondsThisMonth = monthResult?.total ?? 0;

    // Total this week
    const weekResult = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM sessions WHERE date >= ?`,
      [weekStart]
    );
    const totalSecondsThisWeek = weekResult?.total ?? 0;

    // Count and average
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sessions`
    );
    const totalSessions = countResult?.count ?? 0;
    const averageSessionSeconds =
      totalSessions > 0 ? Math.round(totalSecondsAllTime / totalSessions) : 0;

    // Streaks
    const { currentStreak, longestStreak } = await this.calculateStreaks();

    return {
      totalSecondsAllTime,
      totalSecondsThisMonth,
      totalSecondsThisWeek,
      averageSessionSeconds,
      totalSessions,
      currentStreak,
      longestStreak,
    };
  }

  async getTagBreakdown(): Promise<TagBreakdown[]> {
    const rows = await this.db.getAllAsync<{
      tag_id: number;
      tag_name: string;
      total_seconds: number;
    }>(`
      SELECT
        t.id as tag_id,
        t.name as tag_name,
        COALESCE(SUM(s.duration_seconds), 0) as total_seconds
      FROM tags t
      LEFT JOIN session_tags st ON st.tag_id = t.id
      LEFT JOIN sessions s ON s.id = st.session_id
      GROUP BY t.id
      ORDER BY total_seconds DESC
    `);

    return rows.map((r) => ({
      tagId: r.tag_id,
      tagName: r.tag_name,
      totalSeconds: r.total_seconds,
    }));
  }

  private async attachTags(session: SessionRow): Promise<SessionWithTags> {
    const tagRows = await this.db.getAllAsync<TagRow>(
      `SELECT t.* FROM tags t
       JOIN session_tags st ON st.tag_id = t.id
       WHERE st.session_id = ?`,
      [session.id]
    );

    const tags: Tag[] = tagRows.map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return {
      id: session.id,
      date: session.date,
      durationSeconds: session.duration_seconds,
      source: session.source,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      tags,
    };
  }

  private async calculateStreaks(): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    const rows = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM sessions ORDER BY date DESC`
    );

    if (rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = rows.map((r) => startOfDay(parseISO(r.date)));
    const today = startOfDay(new Date());

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
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
        }
      } else {
        const daysDiff = differenceInCalendarDays(prevDate, date);
        if (daysDiff === 1) {
          streak++;
          if (currentStreak > 0) {
            currentStreak = streak;
          }
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
          if (currentStreak > 0) {
            // Current streak ended, keep its value
            currentStreak = Math.max(longestStreak, currentStreak);
          }
        }
      }
      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, streak);

    return { currentStreak, longestStreak };
  }
}
