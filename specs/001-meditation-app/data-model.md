# Data Model: Meditation Timer & Logger

**Feature Branch**: `001-meditation-app`
**Date**: 2026-02-02
**Storage**: expo-sqlite v16 (local SQLite database: `prajna.db`)

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   sessions   │──M:N──│  session_tags    │──M:N──│    tags      │
│              │       │  (junction)       │       │              │
│ id (PK)      │       │ session_id (FK)   │       │ id (PK)      │
│ date         │       │ tag_id (FK)       │       │ name         │
│ duration_s   │       └──────────────────┘       │ created_at   │
│ source       │                                   │ updated_at   │
│ created_at   │                                   └──────────────┘
│ updated_at   │
└──────────────┘

┌──────────────┐
│    goals     │
│              │
│ id (PK)      │
│ target_hours │
│ period_type  │
│ start_date   │
│ end_date     │
│ created_at   │
│ updated_at   │
└──────────────┘
```

## Tables

### sessions

Represents a single meditation event, whether timed with the in-app stopwatch or manually entered.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `date` | TEXT | NOT NULL | ISO 8601 date string (YYYY-MM-DD) of the meditation session, in device local timezone |
| `duration_seconds` | INTEGER | NOT NULL, CHECK(duration_seconds > 0) | Duration of the session in seconds |
| `source` | TEXT | NOT NULL, DEFAULT 'timer', CHECK(source IN ('timer', 'manual')) | How the session was recorded |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of record creation (ISO 8601) |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of last update (ISO 8601) |

**Indexes:**
- `idx_sessions_date` on `date` DESC — for history list and goal progress queries
- `idx_sessions_created_at` on `created_at` DESC — for history display ordering

**Validation rules:**
- `date` must not be in the future (enforced in application layer, not DB constraint)
- `duration_seconds` must be > 0 (DB CHECK constraint)
- If `duration_seconds` > 14400 (4 hours) and `source` = 'manual', application shows confirmation prompt (FR-021)

---

### tags

Represents a user-defined label for categorizing meditation sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | User-visible tag name (case-sensitive) |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of record creation |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of last update |

**Validation rules:**
- `name` must be unique (DB UNIQUE constraint) — FR-014, scenario 4
- `name` must be non-empty (application layer)
- `name` is trimmed of leading/trailing whitespace (application layer)

---

### session_tags

Junction table implementing the many-to-many relationship between sessions and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `session_id` | INTEGER | NOT NULL, REFERENCES sessions(id) ON DELETE CASCADE | FK to sessions |
| `tag_id` | INTEGER | NOT NULL, REFERENCES tags(id) ON DELETE CASCADE | FK to tags |

**Primary key:** Composite (`session_id`, `tag_id`)

**Cascade behavior:**
- When a session is deleted → all its session_tags rows are deleted (ON DELETE CASCADE)
- When a tag is deleted → all its session_tags rows are deleted (ON DELETE CASCADE) — satisfies FR-016

---

### goals

Represents a meditation target the user wants to achieve within a time period.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `target_hours` | REAL | NOT NULL, CHECK(target_hours > 0) | Target duration in hours (e.g., 100.0) |
| `period_type` | TEXT | NOT NULL, CHECK(period_type IN ('year', 'month', 'custom')) | Type of time period |
| `start_date` | TEXT | NOT NULL | Start of goal period (ISO 8601 date, YYYY-MM-DD) |
| `end_date` | TEXT | NOT NULL | End of goal period (ISO 8601 date, YYYY-MM-DD) |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of record creation |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Timestamp of last update |

**Validation rules:**
- `target_hours` must be > 0 (DB CHECK constraint)
- `end_date` must be >= `start_date` (application layer)
- For `period_type = 'year'`: `start_date` is Jan 1 and `end_date` is Dec 31 of the selected year
- For `period_type = 'month'`: `start_date` is 1st and `end_date` is last day of the selected month
- For `period_type = 'custom'`: both dates are user-specified

**Computed fields (not stored, calculated at query time):**
- `progress_seconds`: `SELECT COALESCE(SUM(s.duration_seconds), 0) FROM sessions s WHERE s.date BETWEEN g.start_date AND g.end_date`
- `progress_percent`: `progress_seconds / (target_hours * 3600) * 100`
- `remaining_hours`: `MAX(0, target_hours - progress_seconds / 3600)`
- `is_completed`: `progress_seconds >= target_hours * 3600`
- `is_expired`: `end_date < date('now')`

---

## Key-Value Store (expo-sqlite/kv-store)

Used for ephemeral app state that must survive crashes but is not relational data.

| Key | Value Type | Purpose |
|-----|-----------|---------|
| `timer_state` | JSON string: `{ startTime: number, accumulatedMs: number, isRunning: boolean }` | Crash recovery for in-progress timer sessions (FR-019) |

---

## Migration Strategy

Use `PRAGMA user_version` for schema versioning, executed in `<SQLiteProvider onInit={migrateDbIfNeeded}>`.

### Version 1 (Initial Schema)

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

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
```

---

## Key Queries

### Goal Progress (FR-012, FR-013)

```sql
SELECT
  g.*,
  COALESCE(SUM(s.duration_seconds), 0) AS progress_seconds
FROM goals g
LEFT JOIN sessions s ON s.date BETWEEN g.start_date AND g.end_date
GROUP BY g.id
ORDER BY g.end_date ASC;
```

### Session History with Tags (FR-008)

```sql
SELECT
  s.*,
  GROUP_CONCAT(t.name, ', ') AS tag_names
FROM sessions s
LEFT JOIN session_tags st ON st.session_id = s.id
LEFT JOIN tags t ON t.id = st.tag_id
GROUP BY s.id
ORDER BY s.date DESC, s.created_at DESC;
```

### Statistics: Streaks (FR-017)

```sql
SELECT DISTINCT date FROM sessions ORDER BY date DESC;
-- Streak computed in application layer by iterating consecutive dates
```

### Statistics: Time Totals (FR-017)

```sql
-- All time
SELECT COALESCE(SUM(duration_seconds), 0) AS total FROM sessions;

-- This month
SELECT COALESCE(SUM(duration_seconds), 0) AS total
FROM sessions
WHERE date >= date('now', 'start of month');

-- This week (Monday-based)
SELECT COALESCE(SUM(duration_seconds), 0) AS total
FROM sessions
WHERE date >= date('now', 'weekday 0', '-6 days');
```

### Statistics: Per-Tag Breakdown (FR-018)

```sql
SELECT
  t.name,
  COALESCE(SUM(s.duration_seconds), 0) AS total_seconds
FROM tags t
LEFT JOIN session_tags st ON st.tag_id = t.id
LEFT JOIN sessions s ON s.id = st.session_id
GROUP BY t.id
ORDER BY total_seconds DESC;
```
