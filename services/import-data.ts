import type { SQLiteDatabase } from "expo-sqlite";

interface RawSession {
  date: string;
  durationSeconds: number;
  source: "timer" | "manual";
  createdAt?: string;
  updatedAt?: string;
}

interface RawGoal {
  targetHours: number;
  periodType: "year" | "month" | "custom";
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

function isValidSession(s: unknown): s is RawSession {
  if (typeof s !== "object" || s === null) return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.date === "string" &&
    typeof obj.durationSeconds === "number" &&
    obj.durationSeconds > 0 &&
    (obj.source === "timer" || obj.source === "manual")
  );
}

function isValidGoal(g: unknown): g is RawGoal {
  if (typeof g !== "object" || g === null) return false;
  const obj = g as Record<string, unknown>;
  return (
    typeof obj.targetHours === "number" &&
    obj.targetHours > 0 &&
    (obj.periodType === "year" ||
      obj.periodType === "month" ||
      obj.periodType === "custom") &&
    typeof obj.startDate === "string" &&
    typeof obj.endDate === "string"
  );
}

export async function importData(
  db: SQLiteDatabase,
  json: { sessions?: unknown[]; goals?: unknown[] },
): Promise<{ sessions: number; goals: number }> {
  let sessionCount = 0;
  let goalCount = 0;

  await db.withTransactionAsync(async () => {
    if (Array.isArray(json.sessions)) {
      for (const raw of json.sessions) {
        if (!isValidSession(raw)) continue;
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO sessions (date, duration_seconds, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          raw.date,
          raw.durationSeconds,
          raw.source,
          raw.createdAt ?? now,
          raw.updatedAt ?? now,
        );
        sessionCount++;
      }
    }

    if (Array.isArray(json.goals)) {
      for (const raw of json.goals) {
        if (!isValidGoal(raw)) continue;
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO goals (target_hours, period_type, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          raw.targetHours,
          raw.periodType,
          raw.startDate,
          raw.endDate,
          raw.createdAt ?? now,
          raw.updatedAt ?? now,
        );
        goalCount++;
      }
    }
  });

  return { sessions: sessionCount, goals: goalCount };
}
