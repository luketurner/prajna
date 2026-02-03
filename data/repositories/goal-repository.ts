import type { SQLiteDatabase } from "expo-sqlite";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import type {
  GoalWithProgress,
  CreateGoalInput,
  UpdateGoalInput,
  IGoalRepository,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface GoalRow {
  id: number;
  target_hours: number;
  period_type: "year" | "month" | "custom";
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  progress_seconds: number;
}

export class GoalRepository implements IGoalRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<GoalWithProgress[]> {
    const rows = await this.db.getAllAsync<GoalRow>(`
      SELECT
        g.*,
        COALESCE(SUM(s.duration_seconds), 0) AS progress_seconds
      FROM goals g
      LEFT JOIN sessions s ON s.date BETWEEN g.start_date AND g.end_date
      GROUP BY g.id
      ORDER BY g.end_date ASC
    `);

    return rows.map((r) => this.mapRowWithProgress(r));
  }

  async getById(id: number): Promise<GoalWithProgress | null> {
    const row = await this.db.getFirstAsync<GoalRow>(
      `
      SELECT
        g.*,
        COALESCE(SUM(s.duration_seconds), 0) AS progress_seconds
      FROM goals g
      LEFT JOIN sessions s ON s.date BETWEEN g.start_date AND g.end_date
      WHERE g.id = ?
      GROUP BY g.id
    `,
      [id]
    );

    if (!row) return null;
    return this.mapRowWithProgress(row);
  }

  async create(input: CreateGoalInput): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO goals (target_hours, period_type, start_date, end_date) VALUES (?, ?, ?, ?)`,
      [input.targetHours, input.periodType, input.startDate, input.endDate]
    );
    return result.lastInsertRowId;
  }

  async update(input: UpdateGoalInput): Promise<void> {
    await this.db.runAsync(
      `UPDATE goals SET target_hours = ?, period_type = ?, start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ?`,
      [
        input.targetHours,
        input.periodType,
        input.startDate,
        input.endDate,
        input.id,
      ]
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync(`DELETE FROM goals WHERE id = ?`, [id]);
  }

  private mapRowWithProgress(row: GoalRow): GoalWithProgress {
    const targetSeconds = row.target_hours * 3600;
    const progressPercent =
      targetSeconds > 0
        ? Math.min(100, (row.progress_seconds / targetSeconds) * 100)
        : 0;
    const remainingHours = Math.max(
      0,
      row.target_hours - row.progress_seconds / 3600
    );
    const isCompleted = row.progress_seconds >= targetSeconds;

    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const isExpired = isBefore(parseISO(row.end_date), parseISO(today));

    return {
      id: row.id,
      targetHours: row.target_hours,
      periodType: row.period_type,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      progressSeconds: row.progress_seconds,
      progressPercent,
      remainingHours,
      isCompleted,
      isExpired,
    };
  }
}
