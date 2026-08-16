-- Migration 7: documents story_photos and venue_photos, which existed in the
-- live database already (created ad-hoc, never captured in a migration file).
-- Safe to run against a database that already has them — CREATE TABLE IF NOT
-- EXISTS is a no-op there. Only needed for a fresh install.
-- Run: wrangler d1 execute matri-db --file=migration7.sql --remote
CREATE TABLE IF NOT EXISTS story_photos (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venue_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER DEFAULT 0
);
