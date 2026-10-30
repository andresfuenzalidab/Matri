-- Migration 12: guest voting for the photo/video album.
-- One vote per voter per category ('image' | 'video'); media_files keeps a small
-- snapshot of each voted file so the live ranking never has to call Google Drive.
-- Idempotent.

CREATE TABLE IF NOT EXISTS media_votes (
  voter_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('image', 'video')),
  file_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (voter_id, category)
);
CREATE INDEX IF NOT EXISTS idx_media_votes_file ON media_votes(file_id);

CREATE TABLE IF NOT EXISTS media_files (
  file_id TEXT PRIMARY KEY,
  meta TEXT NOT NULL
);
