-- Trips
INSERT OR IGNORE INTO trips (id, name, description, order_idx) VALUES
  ('kruger-luna', 'Kruger — Luna de Miel', 'Safari en Sudáfrica', 0),
  ('kruger-madagascar', 'Kruger — Madagascar', 'Aventura en Madagascar', 1),
  ('seychelles', 'Seychelles', 'Paraíso en el Índico', 2);

-- Gifts: Kruger Luna de Miel
INSERT OR IGNORE INTO gifts (id, trip_id, name, price, order_idx) VALUES
  ('k1', 'kruger-luna', 'Safari privado por todo el día', 400000, 0),
  ('k2', 'kruger-luna', 'Safari nocturno', 150000, 1),
  ('k3', 'kruger-luna', 'Noche en tree house', 500000, 2),
  ('k4', 'kruger-luna', 'Spa completo para dos', 200000, 3),
  ('k5', 'kruger-luna', 'Cena romántica en el bush', 120000, 4);

-- Gifts: Kruger Madagascar
INSERT OR IGNORE INTO gifts (id, trip_id, name, price, order_idx) VALUES
  ('m1', 'kruger-madagascar', 'Lemures en libertad', 180000, 0),
  ('m2', 'kruger-madagascar', 'Camaleón hunt & fotosafari', 90000, 1),
  ('m3', 'kruger-madagascar', 'Snorkel en reserva marina', 120000, 2),
  ('m4', 'kruger-madagascar', 'Avistamiento de ballenas', 250000, 3),
  ('m5', 'kruger-madagascar', 'Tour día completo por la isla', NULL, 4);

-- Gifts: Seychelles
INSERT OR IGNORE INTO gifts (id, trip_id, name, price, order_idx) VALUES
  ('s1', 'seychelles', 'Snorkel privado en La Digue', 150000, 0),
  ('s2', 'seychelles', 'Catamarán día completo', 350000, 1),
  ('s3', 'seychelles', 'Isla privada por un día', 450000, 2);

-- Site content defaults
INSERT OR IGNORE INTO site_content (key, value) VALUES
  ('hero_title', 'Andrés & Catalina'),
  ('hero_date', 'Viernes 6 de noviembre de 2026'),
  ('hero_image', ''),
  ('wedding_date', '2026-11-06'),
  ('ceremony_time', '17:00'),
  ('reception_time', '19:30'),
  ('wedding_end_time', '03:00'),
  ('venue_name', 'Altos del Paico'),
  ('venue_address', ''),
  ('venue_map_title', 'Plano del lugar'),
  -- Entry envelope
  ('envelope_cta_text', 'Toca aquí para abrir la invitación'),
  -- Citación tag
  ('citation_card_title', 'La citación'),
  ('citation_note', ''),
  ('wedding_day_off_tip', ''),
  -- Programme of the day (see src/utils/timelineItems.js for the shape)
  ('timeline_title', 'Programa del día'),
  ('timeline_items', '[]'),
  -- Story
  ('story_heading', 'El camino que nos trajo hasta aquí'),
  ('story_subtitle', ''),
  ('story_body', ''),
  -- Transfer details
  ('bank_name', 'Banco Estado'),
  ('bank_account', ''),
  ('bank_rut', ''),
  ('bank_email', '');
