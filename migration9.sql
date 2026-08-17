-- Migration 9: documents columns that already exist in the live database
-- (added ad-hoc, never captured in a migration — same situation as
-- story_photos/venue_photos in migration7).
--
-- SQLite's ALTER TABLE ADD COLUMN has no "IF NOT EXISTS" — unlike migration7's
-- CREATE TABLE IF NOT EXISTS, these three statements are NOT idempotent. If
-- your live database already has one of these columns (likely — that's why
-- the code worked before this migration existed), that single line will
-- fail with "duplicate column name" and wrangler stops there.
--
-- Run each line separately instead of the whole file, and just skip any line
-- that errors with "duplicate column name" — that only means it already
-- exists, nothing to do:
--   wrangler d1 execute matri-db --remote --command="ALTER TABLE trips ADD COLUMN image_url TEXT;"
--   wrangler d1 execute matri-db --remote --command="ALTER TABLE gifts ADD COLUMN description TEXT;"
--   wrangler d1 execute matri-db --remote --command="ALTER TABLE gifts ADD COLUMN image_url TEXT;"

ALTER TABLE trips ADD COLUMN image_url TEXT;
ALTER TABLE gifts ADD COLUMN description TEXT;
ALTER TABLE gifts ADD COLUMN image_url TEXT;
