-- Migration 13: lets a voter vote for several files per category.
-- media_votes used to have PRIMARY KEY (voter_id, category) — one vote per category.
-- This rebuilds it with PRIMARY KEY (voter_id, file_id), keeping every existing vote.
-- Safe to run more than once (on the new layout it just copies the rows over).

DROP TABLE IF EXISTS media_votes_new;

CREATE TABLE media_votes_new (
  voter_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('image', 'video')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (voter_id, file_id)
);

INSERT OR IGNORE INTO media_votes_new (voter_id, file_id, category, created_at)
  SELECT voter_id, file_id, category, created_at FROM media_votes;

DROP TABLE media_votes;
ALTER TABLE media_votes_new RENAME TO media_votes;

CREATE INDEX IF NOT EXISTS idx_media_votes_file ON media_votes(file_id);
CREATE INDEX IF NOT EXISTS idx_media_votes_voter_cat ON media_votes(voter_id, category);
