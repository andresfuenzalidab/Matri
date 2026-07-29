-- Migration 5: Add email to rsvp_responses
-- Run: wrangler d1 execute matri-db --file=migration5.sql --remote
ALTER TABLE rsvp_responses ADD COLUMN email TEXT DEFAULT '';
