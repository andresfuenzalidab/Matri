-- Migration 6: companion named up front on the invitation, so every
-- personalised message (welcome, RSVP, gift thanks) can address both people.
-- Run: wrangler d1 execute matri-db --file=migration6.sql --remote
ALTER TABLE invitations ADD COLUMN companion_name TEXT;
