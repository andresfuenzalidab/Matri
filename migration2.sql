-- Migration 2: indexes for JOIN performance
-- Run: wrangler d1 execute matri-db --file=migration2.sql

CREATE INDEX IF NOT EXISTS idx_gifts_trip_id ON gifts(trip_id);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(active);
CREATE INDEX IF NOT EXISTS idx_gift_res_gift_id ON gift_reservations(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_res_inv_id ON gift_reservations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_inv_id ON rsvp_responses(invitation_id);
