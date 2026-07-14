-- Run this after the initial schema.sql + seed.sql
-- npx wrangler d1 execute matri-db --remote --file=migrate.sql

-- Invitation personalization
ALTER TABLE invitations ADD COLUMN welcome_message TEXT;
ALTER TABLE invitations ADD COLUMN max_additional_guests INTEGER;

-- Dynamic story sections
CREATE TABLE IF NOT EXISTS story_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  date_label TEXT,
  image_url TEXT,
  order_idx INTEGER DEFAULT 0
);

-- Gift enhancements
ALTER TABLE gifts ADD COLUMN description TEXT;
ALTER TABLE gifts ADD COLUMN image_url TEXT;

-- Trip cover photo
ALTER TABLE trips ADD COLUMN image_url TEXT;

-- Congratulations message on reservation
ALTER TABLE gift_reservations ADD COLUMN congratulations_message TEXT;

-- Venue photo collage
CREATE TABLE IF NOT EXISTS venue_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_idx INTEGER DEFAULT 0
);

-- Additional site content keys
INSERT OR IGNORE INTO site_content (key, value) VALUES
  ('venue_maps_url', ''),
  ('gifts_intro', 'El mejor regalo es tu presencia. Pero si deseas hacernos un obsequio, aquí van algunas ideas para nuestra luna de miel.');

-- Default story sections
INSERT OR IGNORE INTO story_sections (title, content, date_label, image_url, order_idx) VALUES
  ('Cómo nos conocimos', 'Todo comenzó en una tarde de otoño, cuando el destino quiso que nuestros caminos se cruzaran. Desde ese primer momento, supimos que algo especial había comenzado. Lo que empezó como una amistad fue creciendo, conversación a conversación, hasta convertirse en el amor más grande de nuestras vidas.', NULL, '', 0),
  ('Convivencia y familia', 'Con el tiempo decidimos dar el siguiente paso y construir un hogar juntos. Nuestra familia creció con la llegada de nuestros tres peludos, que llenaron de vida y cariño cada rincón de nuestra casa. Cada día compartido nos fue acercando más.', NULL, '', 1),
  ('El compromiso', 'Después de años de aventuras juntos, llegó el momento más especial. Con el corazón en la mano y mucho amor, le propuse matrimonio en un lugar que ambos guardamos en el corazón. Ese «sí» fue el comienzo del capítulo más emocionante de nuestra historia.', NULL, '', 2);
