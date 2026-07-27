-- Migration 3: companion name in RSVP
-- Run: wrangler d1 execute matri-db --file=migration3.sql
ALTER TABLE rsvp_responses ADD COLUMN companion_name TEXT;
