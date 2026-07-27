-- Migration 4: invitation sent status
-- Run: wrangler d1 execute matri-db --file=migration4.sql
ALTER TABLE invitations ADD COLUMN invitation_sent INTEGER DEFAULT 0;
