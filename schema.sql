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
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id INTEGER REFERENCES invitations(id) UNIQUE,
  attending INTEGER NOT NULL,
  num_guests INTEGER DEFAULT 1,
  message TEXT,
  dietary_restriction TEXT,
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
