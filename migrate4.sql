-- Migration 4: invitation notes + story photos carousel

ALTER TABLE invitations ADD COLUMN notes TEXT;

CREATE TABLE IF NOT EXISTS story_photos (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
