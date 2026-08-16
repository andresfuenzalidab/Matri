CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_idx INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id),
  name TEXT NOT NULL,
  price INTEGER,
  order_idx INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nickname TEXT,
  companion_name TEXT,
  is_admin INTEGER DEFAULT 0,
  invitation_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id INTEGER REFERENCES invitations(id) UNIQUE,
  attending INTEGER NOT NULL,
  num_guests INTEGER DEFAULT 1,
  message TEXT,
  dietary_restriction TEXT,
  companion_name TEXT,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gift_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id TEXT REFERENCES gifts(id),
  invitation_id INTEGER REFERENCES invitations(id),
  guest_name TEXT,
  quantity INTEGER DEFAULT 1,
  confirmed_payment INTEGER DEFAULT 0,
  congratulations_message TEXT,
  reserved_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_photos (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venue_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_gifts_trip_id ON gifts(trip_id);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(active);
CREATE INDEX IF NOT EXISTS idx_gift_res_gift_id ON gift_reservations(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_res_inv_id ON gift_reservations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_inv_id ON rsvp_responses(invitation_id);
