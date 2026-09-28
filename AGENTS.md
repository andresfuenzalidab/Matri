# AGENTS.md

Runbook for an AI coding agent with shell access to deploy a fresh, fully
configured copy of this project non-interactively. This is the
machine-executable counterpart to [DEPLOY.md](DEPLOY.md) (written for a
human clicking through a browser) — prefer this file when you (the agent)
are the one running the commands.

Cloudflare is the only supported target (see README.md → "Running on
something other than Cloudflare"). Every command below runs from the repo
root, in order, and is safe to re-run unless noted otherwise.

## 1. Collect inputs before running anything

Before executing a single command, present the human operator with the
checklist below as a plain list — what's manual for them vs. what you'll
handle — and wait for their answers. Do not start executing and then stop
mid-run to ask for something you're missing; gather everything first, then
run steps 2–12 without interruption.

Required, manual (things only they can do, in a browser, once):
- A Cloudflare account, if they don't already have one —
  [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token: **My Profile → API
  Tokens → Create Token → "Edit Cloudflare Workers" template**, which
  grants D1, R2, and Workers Scripts edit permissions. Have them paste it
  to you as an environment variable, never as plain chat text that might
  get logged or shared elsewhere. This is the one unavoidable manual step —
  there's no CLI/API path to create the token itself (it would be a
  bootstrapping paradox). Everything else in this file is scriptable once
  you have it.

Required, just answers (no browser needed, ask them directly):
- Couple's names as they should appear, e.g. `"Camila & Tomás"`.
- Wedding date, both forms: ISO (`2027-03-14`) and display text
  (`"Domingo 14 de marzo de 2027"`).
- Venue name.
- A secret string for the first admin invitation token — treat it like a
  password (whoever holds it gets full admin access). Generate one
  yourself (e.g. a random 20+ char string) if the operator doesn't supply
  one, and tell them what you generated.

Optional (skip the related step entirely if not supplied):
- `RESEND_API_KEY` — for transactional email.
- `MP_ACCESS_TOKEN` — Mercado Pago, for card payments on gifts.
- Local paths to real photos/videos if the operator wants their own media
  uploaded now rather than later through the admin panel.

## 2. Environment

```
export CLOUDFLARE_API_TOKEN="<token from step 1>"
npm install
```

Confirm auth works before proceeding:

```
npx wrangler whoami
```

If this fails, stop and report the error — nothing past this point will
work without valid auth.

## 3. Create the D1 database (skip if `wrangler.toml` already has a real,
non-placeholder `database_id`)

```
npx wrangler d1 create matri-db
```

Parse the `database_id` from the output and write it into `wrangler.toml`,
replacing the placeholder line:

```
database_id = "00000000-0000-0000-0000-000000000000"
```

Use a file edit, not a shell one-liner, so you can verify the exact line
matched before replacing it.

## 4. Create the R2 bucket (skip if you know it already exists)

```
npx wrangler r2 bucket create matri-photos
```

If you used a different bucket name, update `bucket_name` in
`wrangler.toml`'s `[[r2_buckets]]` block to match.

## 5. Load the schema (idempotent — safe to re-run; uses `CREATE TABLE IF
NOT EXISTS`)

```
npx wrangler d1 execute matri-db --remote --file=schema.sql
```

## 6. Example content (optional — only if the operator wants to start from
the example gift registry/text; also idempotent, uses `INSERT OR IGNORE`)

```
npx wrangler d1 execute matri-db --remote --file=seed.sql
```

## 7. Set the real site content

Use `INSERT OR REPLACE` so this is safe to re-run with updated values.
Substitute the values collected in step 1 (escape single quotes by
doubling them, standard SQL):

```
npx wrangler d1 execute matri-db --remote --command "INSERT OR REPLACE INTO site_content (key, value) VALUES ('hero_title', '<couple names>'), ('hero_date', '<display date>'), ('wedding_date', '<ISO date>'), ('venue_name', '<venue>')"
```

## 8. Create the first admin invitation

Check first so a re-run doesn't create a duplicate:

```
npx wrangler d1 execute matri-db --remote --command "SELECT id FROM invitations WHERE token = '<admin-token>'"
```

If that returns no rows:

```
npx wrangler d1 execute matri-db --remote --command "INSERT INTO invitations (token, name, is_admin) VALUES ('<admin-token>', 'Admin', 1)"
```

## 9. Secrets (only the ones the operator supplied in step 1)

`wrangler secret put` reads the value from stdin when it isn't a TTY, so
pipe it instead of typing interactively:

```
printf '%s' "$RESEND_API_KEY" | npx wrangler secret put resend_api_key
printf '%s' "$MP_ACCESS_TOKEN" | npx wrangler secret put mp_access_token
```

## 10. Build and deploy

```
npm run build
npx wrangler deploy
```

Capture the deployed URL from the output (something like
`https://matri.<subdomain>.workers.dev`).

## 11. Verify

```
curl -s -o /dev/null -w "%{http_code}" "<deployed-url>/api/content" -H "X-Invite-Token: <admin-token>"
```

Expect `200`. Anything else (especially `500`) means something upstream
failed — check the specific step (most likely 3, 5, or 7) rather than
retrying deploy blindly. A `404` on `/api/content` specifically would mean
the deploy didn't pick up `worker.js` correctly.

Optionally also confirm the content itself:

```
curl -s "<deployed-url>/api/content" -H "X-Invite-Token: <admin-token>"
```

and check the JSON includes the `hero_title` value from step 7.

## 12. Report back to the operator

Give them: the deployed URL, and the admin token (remind them it's
equivalent to a password — don't post it anywhere public or shared, e.g. a
group chat or a public issue).

## Uploading real photos/videos (optional, if paths were supplied)

Same two calls the admin panel itself makes — scriptable per file:

```
curl -s -X POST "<deployed-url>/api/admin/upload" \
  -H "X-Invite-Token: <admin-token>" \
  -F "file=@<local-path>"
```

This returns `{"url": "..."}`. Then set it as a content field (see
`src/components/admin/ContentEditor.jsx`'s `SECTIONS` for valid keys, e.g.
`hero_video`, `envelope_background_image`):

```
curl -s -X PUT "<deployed-url>/api/admin/content" \
  -H "X-Invite-Token: <admin-token>" -H "Content-Type: application/json" \
  -d '{"key":"<content-key>","value":"<url from upload>"}'
```

## What this does not automate

- Creating the Cloudflare API token (step 1 — inherently human, one-time).
- A custom domain — dashboard-only, optional, doesn't affect functionality
  on the `*.workers.dev` URL.
- Verifying a sending domain in Resend — dashboard-only on their side,
  only needed if `RESEND_API_KEY` was supplied.
