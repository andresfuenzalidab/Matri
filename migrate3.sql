-- Run after migrate2.sql
-- npx wrangler d1 execute matri-db --remote --file=migrate3.sql

-- Invitation type: 'all_in' (ceremony + reception) | 'party_only' (reception/party only)
ALTER TABLE invitations ADD COLUMN invitation_type TEXT DEFAULT 'all_in';

-- Configurable section headings
INSERT OR IGNORE INTO site_content (key, value) VALUES
  ('story_subtitle', 'El camino que nos trajo hasta aquí.'),
  ('gifts_section_label', 'Luna de Miel'),
  ('gifts_section_title', 'Regala un pedacito de nuestro viaje'),
  ('site_url', '');
