-- Migration 10: seating plan (already in schema.sql, never had a migration)
-- and the wedding planner. Both are idempotent.

CREATE TABLE IF NOT EXISTS seating_plan (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  layout TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wedding_plan (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  plan TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
