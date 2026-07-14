-- Run after migrate.sql if already applied
-- npx wrangler d1 execute matri-db --remote --file=migrate2.sql

-- Background music URL (configure in Admin → Contenido → Música de fondo)
INSERT OR IGNORE INTO site_content (key, value) VALUES ('music_url', '');
