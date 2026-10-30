-- Migration 12: guest voting for the photo/video album.
-- A voter can vote for several different files per category ('image' | 'video');
-- the per-category limit is set in the admin (Álbum). media_files keeps a small
-- snapshot of each voted file so the live ranking never has to call Google Drive.
--
-- If you already ran an earlier version of this migration (one vote per category),
-- drop the old table first — it only holds test votes:
--   wrangler d1 execute matri-db --remote --command="DROP TABLE IF EXISTS media_votes;"

CREATE TABLE IF NOT EXISTS media_votes (
  voter_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('image', 'video')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (voter_id, file_id)
);
CREATE INDEX IF NOT EXISTS idx_media_votes_file ON media_votes(file_id);
CREATE INDEX IF NOT EXISTS idx_media_votes_voter_cat ON media_votes(voter_id, category);

CREATE TABLE IF NOT EXISTS media_files (
  file_id TEXT PRIMARY KEY,
  meta TEXT NOT NULL
);
