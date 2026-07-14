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
  ('hero_subtitle', 'Nos casamos'),
  ('hero_date', 'viernes 6 de noviembre de 2026'),
  ('hero_location', 'Altos del Paico'),
  ('hero_image', ''),
  ('story_how_we_met', 'Todo comenzó en una tarde de otoño, cuando el destino quiso que nuestros caminos se cruzaran. Desde ese primer momento, supimos que algo especial había comenzado. Lo que empezó como una amistad fue creciendo, conversación a conversación, hasta convertirse en el amor más grande de nuestras vidas. Cada momento compartido nos fue acercando más, tejiendo una historia que hoy celebramos con quienes más amamos.'),
  ('story_how_we_met_date', ''),
  ('story_image_1', ''),
  ('story_proposal', 'Después de años de aventuras juntos, Andrés eligió el momento perfecto para pedirle a Catalina que fuera su compañera de vida para siempre. Con el corazón en la mano y mucho amor, le propuso matrimonio en un lugar que ambos guardan en el corazón. Ese «sí» fue el comienzo de un nuevo capítulo, el más emocionante de todos.'),
  ('story_proposal_date', ''),
  ('proposal_image', ''),
  ('story_family', 'Nuestra familia no estaría completa sin nuestros tres peludos. Ellos también son parte de esta historia de amor y, como buenos anfitriones, estarán presentes en espíritu el día de la boda.'),
  ('pet1_name', 'Nuestro perro'),
  ('pet1_image', ''),
  ('pet2_name', 'Nuestra gata'),
  ('pet2_image', ''),
  ('pet3_name', 'Nuestra otra gata'),
  ('pet3_image', ''),
  ('ceremony_time', '17:00'),
  ('reception_time', '19:30'),
  ('venue_name', 'Altos del Paico'),
  ('venue_address', ''),
  ('venue_description', 'Un lugar mágico en medio de la naturaleza, donde celebraremos este momento tan especial rodeados de quienes más amamos.'),
  ('bank_name', 'Banco Estado'),
  ('bank_account', ''),
  ('bank_rut', ''),
  ('bank_email', '');
