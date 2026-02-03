import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Database migration logic using PRAGMA user_version.
 * Called by SQLiteProvider onInit.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Enable WAL mode for better concurrent read/write performance
  await db.execAsync("PRAGMA journal_mode = WAL;");
  // Enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
  }

  // Future migrations go here:
  // if (currentVersion < 2) { await migrateToV2(db); }
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL CHECK(duration_seconds > 0),
      source TEXT NOT NULL DEFAULT 'timer' CHECK(source IN ('timer', 'manual')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session_tags (
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (session_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_hours REAL NOT NULL CHECK(target_hours > 0),
      period_type TEXT NOT NULL CHECK(period_type IN ('year', 'month', 'custom')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

    PRAGMA user_version = 1;
  `);
}
