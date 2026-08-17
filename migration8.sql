-- Migration 8: per-photo crop focal point for both carousels ("Nuestra
-- Historia" and "El lugar"). Stored as a CSS object-position value (e.g.
-- "50% 50%"); NULL means centered, same as the previous fixed behavior.
-- Run: wrangler d1 execute matri-db --file=migration8.sql --remote
ALTER TABLE story_photos ADD COLUMN focal_point TEXT;
ALTER TABLE venue_photos ADD COLUMN focal_point TEXT;
