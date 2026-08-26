import { requireAdmin, json, err, handleAuthError } from '../_auth.js'

const YES = new Set(['si', 'sí', 'yes', 'true', '1', 'x'])
const isYes = v => YES.has(String(v ?? '').trim().toLowerCase())

/**
 * Bulk create/update from a parsed spreadsheet (see src/utils/spreadsheet.js
 * on the client — this endpoint receives already-parsed row objects, not a
 * raw .xlsx file). Each row is matched to an existing invitation by its Token column:
 * a blank token creates a new invitation, a token that matches an existing
 * one updates it, and a token that doesn't match anything is reported as an
 * error rather than silently creating a duplicate (the far more likely cause
 * is a copy/paste slip, not an intentionally new row).
 *
 * Only the fields an admin actually authors are written — RSVP answers and
 * gift reservations are guest-driven data and this import never touches
 * them, even though the matching export includes them for context.
 */
export async function onRequestPost({ request, env }) {
  try {
    await requireAdmin(request, env)
    const body = await request.json().catch(() => null)
    const rows = Array.isArray(body?.rows) ? body.rows : null
    if (!rows) return err('Se esperaba una lista de filas.')

    const existing = await env.DB.prepare('SELECT id, token FROM invitations').all()
    const byToken = new Map(existing.results.map(r => [r.token, r.id]))

    let created = 0, updated = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2 // header is row 1
      const name = (r.name || '').trim()
      if (!name) { errors.push(`Fila ${rowNum}: falta el nombre.`); continue }

      const fields = {
        name,
        email: (r.email || '').trim() || null,
        phone: (r.phone || '').trim() || null,
        nickname: (r.nickname || '').trim() || null,
        companion_name: (r.companionName || '').trim() || null,
        is_admin: isYes(r.isAdmin) ? 1 : 0,
        invitation_sent: isYes(r.invitationSent) ? 1 : 0,
        welcome_message: (r.welcomeMessage || '').trim() || null,
        notes: (r.notes || '').trim() || null,
        invitation_type: String(r.invitationType || '').trim().toLowerCase().startsWith('solo') ? 'party_only' : 'all_in',
        max_additional_guests: r.maxAdditionalGuests !== '' && r.maxAdditionalGuests != null && !Number.isNaN(Number(r.maxAdditionalGuests))
          ? Number(r.maxAdditionalGuests)
          : null,
      }

      const token = (r.token || '').trim()

      if (!token) {
        await env.DB.prepare(
          `INSERT INTO invitations
            (token, name, email, phone, nickname, companion_name, is_admin, invitation_sent, welcome_message, notes, invitation_type, max_additional_guests)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(), fields.name, fields.email, fields.phone, fields.nickname,
          fields.companion_name, fields.is_admin, fields.invitation_sent, fields.welcome_message,
          fields.notes, fields.invitation_type, fields.max_additional_guests
        ).run()
        created++
        continue
      }

      const id = byToken.get(token)
      if (!id) { errors.push(`Fila ${rowNum}: el token "${token}" no corresponde a ninguna invitación existente.`); continue }

      await env.DB.prepare(
        `UPDATE invitations SET
           name = ?, email = ?, phone = ?, nickname = ?, companion_name = ?,
           is_admin = ?, invitation_sent = ?, welcome_message = ?, notes = ?,
           invitation_type = ?, max_additional_guests = ?
         WHERE id = ?`
      ).bind(
        fields.name, fields.email, fields.phone, fields.nickname, fields.companion_name,
        fields.is_admin, fields.invitation_sent, fields.welcome_message, fields.notes,
        fields.invitation_type, fields.max_additional_guests, id
      ).run()
      updated++
    }

    return json({ created, updated, errors })
  } catch (e) {
    return handleAuthError(e) || err('Error interno.', 500)
  }
}
