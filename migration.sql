-- Migration for existing databases
-- Run: wrangler d1 execute matri-db --file=migration.sql

ALTER TABLE invitations ADD COLUMN phone TEXT;
ALTER TABLE invitations ADD COLUMN nickname TEXT;

ALTER TABLE rsvp_responses ADD COLUMN dietary_restriction TEXT;

-- gift_reservations: drop UNIQUE(invitation_id), add quantity + congratulations_message
-- SQLite doesn't support DROP CONSTRAINT, so recreate the table
CREATE TABLE gift_reservations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id TEXT REFERENCES gifts(id),
  invitation_id INTEGER REFERENCES invitations(id),
  guest_name TEXT,
  quantity INTEGER DEFAULT 1,
  confirmed_payment INTEGER DEFAULT 0,
  congratulations_message TEXT,
  reserved_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gift_reservations_new (id, gift_id, invitation_id, guest_name, quantity, confirmed_payment, congratulations_message, reserved_at)
SELECT id, gift_id, invitation_id, guest_name, 1, confirmed_payment, congratulations_message, reserved_at
FROM gift_reservations;

DROP TABLE gift_reservations;
ALTER TABLE gift_reservations_new RENAME TO gift_reservations;
