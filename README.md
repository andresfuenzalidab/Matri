# Matri

Wedding website with invite-only RSVP, a gift registry with bank-transfer and
Mercado Pago checkout, and a full admin panel to edit content, photos and
appearance without touching code.

Built with React + Vite on the front end and Cloudflare Pages/Workers, D1
(SQLite) and R2 on the back end. It was built for one specific wedding, but
everything guest-facing is editable from the admin panel, so it's a
reasonable starting point for another couple's site — see
[Customizing](#customizing) below.

## Stack

- **Frontend:** React 18 + Vite, no router (a single page, sections linked by
  in-page anchors: `#inicio #historia #boda #rsvp #regalos`).
- **Backend:** Cloudflare Worker (`src/worker.js`) that serves the built
  frontend and dispatches `/api/*` routes to the handlers in `functions/api/`.
- **Database:** Cloudflare D1 (SQLite) — schema in `schema.sql`.
- **File storage:** Cloudflare R2 — uploaded photos, served back through
  `/api/images/:key`.
- **Email:** [Resend](https://resend.com) (optional).
- **Card payments:** [Mercado Pago](https://www.mercadopago.com) (optional;
  bank transfer always works without it).

## How auth works

There's no username/password login. Each guest gets a unique invitation link
containing a token (`?token=<uuid>`), which the app stores in
`sessionStorage` and sends back as the `X-Invite-Token` header on every API
call (see `functions/api/_auth.js`). An invitation row with `is_admin = 1`
sees a floating "Admin" button that opens the admin panel — there is no
separate admin login, the invite link itself is the credential, so treat
admin invitation links as sensitive.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the D1 database**

   ```bash
   npx wrangler d1 create matri-db
   ```

   Copy the `database_id` it prints into `wrangler.toml`.

3. **Create the R2 bucket** (only needed if you want photo uploads to work
   locally / in production — the site otherwise works without it)

   ```bash
   npx wrangler r2 bucket create matri-photos
   ```

4. **Load the schema and seed data**

   ```bash
   npx wrangler d1 execute matri-db --local --file=schema.sql
   npx wrangler d1 execute matri-db --local --file=seed.sql
   ```

   Drop `--local` to run against the real (remote) database instead of
   Wrangler's local dev copy.

5. **Create your own admin invitation** — there's no signup flow, so the
   first admin has to be inserted directly:

   ```bash
   npx wrangler d1 execute matri-db --local --command \
     "INSERT INTO invitations (token, name, is_admin) VALUES ('replace-with-any-string', 'Admin', 1)"
   ```

   Then open the site with `?token=replace-with-any-string` to see the Admin
   button.

6. **(Optional) local secrets** — copy `.dev.vars.example` to `.dev.vars` and
   fill in `resend_api_key` / `mp_access_token` if you want email and card
   payments to work locally. In production these are set as Wrangler secrets
   instead (`wrangler secret put resend_api_key`), not committed anywhere.

7. **Run it**

   ```bash
   npm run dev          # Vite only, frontend hot-reload, API calls will 404
   npm run pages:dev     # Vite + a local Worker, so /api/* actually works
   ```

## Deployment

New to the command line? [DEPLOY.md](DEPLOY.md) walks through the entire
setup from zero, in Spanish, assuming no coding experience.

Handing setup to an AI coding agent instead (recommended)? Fork this repo,
open the folder with an AI coding assistant that has terminal access
(Claude Code, Cursor, etc.), and give it a prompt like:

> Read AGENTS.md in this repo and help me deploy my own copy. Before
> running anything, tell me exactly what I need to do manually first.

It will read [AGENTS.md](AGENTS.md) and hand you back a short checklist
(a Cloudflare account + API token, and a few names/dates it needs from
you) — do those, hand back the answers, and it takes it from there.

The project deploys as a Cloudflare Pages project connected to this Git repo
(build command `npm run build`, output directory `dist`); Pages picks up the
D1/R2 bindings from `wrangler.toml` automatically. `npx wrangler deploy` also
works directly if you'd rather skip Git integration.

Whichever route you use, remember to:
- Set the real `database_id` / R2 `bucket_name` in `wrangler.toml`.
- Run `schema.sql` (and `seed.sql`, if you want the example content) against
  the **remote** database (`--remote` instead of `--local`).
- Set `resend_api_key` and `mp_access_token` as encrypted secrets, if used.

## Customizing

Most of what makes this *your* wedding site lives in the database, editable
from the Admin panel (the floating button visible to any `is_admin`
invitation) — no redeploy needed for any of this:

| Tab | What it edits |
|---|---|
| Invitaciones | Guest list, invite tokens, per-guest companion/plus-one limits |
| RSVP | Submitted responses, attendance/guest-count summary |
| Regalos | Gift registry items, trips/categories, reservations |
| Recordatorio | Bulk "thank you" / reminder emails to guests who received gifts |
| Carrusel | "Our story" photo carousel |
| Lugar | Venue photo carousel |
| Contenido | All page text: hero title/date, venue name, schedule, story text, bank transfer details, etc. |
| Apariencia | Colors and fonts (heading/body), live-previewed |

Photo uploads (through Contenido/Carrusel/Lugar) go to R2 and are served via
`/api/images/:key` — you never need to touch `public/` for guest photos.

`hero_title` (the couple's names) and `hero_date` under Contenido → Hero /
Portada aren't just page text — they also drive the subject line and
signature of every transactional email (RSVP confirmation, gift thank-you,
reminder) and the downloadable PDF invitation's document title. Set them
once and the rest follows.

Things that **do** require editing code:

- **Static assets** in `public/` — background video (`hero.mp4`), background
  music (`Beta Radio - Our Remains.mp3`), decorative GIFs, and the two
  illustrated cover-art backgrounds (`welcome-cover-bg.png`,
  `pdf-invitation-bg.png`). The `references/` folder keeps the original,
  higher-res source art those two backgrounds were exported from — if you
  change the names/date baked into the artwork, start there.
- **Layout/structure** of a section — each section under
  `src/components/sections/` is a normal React component.
- **Database structure** — add a migration-style `ALTER TABLE`/`CREATE
  TABLE` and update `schema.sql` to match, so a fresh install stays
  one-command.

## Project structure

```
src/
  worker.js              Cloudflare Worker entry point — routes /api/* to functions/api/*
  App.jsx                Top-level app: token validation, section layout
  context/AppContext.jsx  Shared content/data fetching, used by live view + admin
  components/            Shared UI (nav, modals, carousel, admin/*)
  components/sections/   The page's sections (Home, OurStory, RSVP, Gifts, ...)
  utils/                 PDF invitation generation, spreadsheet import/export, etc.
  styles/                Design tokens + component styles (index.css, stationery.css)
functions/api/           Cloudflare Pages Functions-shaped handlers, imported by worker.js
  _auth.js               Invite-token lookup, requireInvitation()/requireAdmin()
  _email.js              Resend wrapper
  admin/                 Admin-only endpoints (require is_admin)
schema.sql               Full D1 schema (run once on a fresh database)
seed.sql                 Example site content + gift registry (optional)
```

## Running on something other than Cloudflare

Cloudflare (Pages + Workers + D1 + R2) is the only platform this project is
built and tested for, and `wrangler.toml`/`worker.js` assume it. Porting it
elsewhere (a VPS, Vercel, Render, etc.) is possible but is a real backend
change, not a config tweak — it isn't something this repo supports out of
the box. Concretely, someone doing that would need to:

1. Replace every `env.DB.prepare(...)` call across `functions/api/**/*.js`
   (~25 files) with calls to a different SQL client (e.g. `better-sqlite3`
   or Postgres) — D1's query API is Cloudflare-specific, though the SQL
   itself in `schema.sql` is plain SQLite and mostly portable as-is.
2. Replace the `env.PHOTOS.get/put/head` calls in
   `functions/api/images/[[path]].js` and `functions/api/admin/upload.js`
   with a different storage client (local disk, S3, etc.) — R2's API is
   Cloudflare-specific too, though it's S3-compatible enough that an S3 SDK
   pointed at R2 is also an option if you want to keep the bucket itself.
3. Add a second entry point (e.g. a small Node/Express server) that calls
   the same `functions/api/*` handlers instead of `src/worker.js`, which is
   Workers-specific glue.
4. Serve the Vite build output (`dist/`) as static files from wherever you
   land — that part already works anywhere.

## Known limitations

- No automated tests.
- `package-lock.json` isn't committed (see `.gitignore`); run `npm install`
  to generate one for reproducible installs if you'd like.
- Only deploys to Cloudflare today — see "Running on something other than
  Cloudflare" above.
