/**
 * Two reserved, hardcoded tokens (never a real `crypto.randomUUID()` shape,
 * so they can never collide with an actual invitation) that let anyone with
 * the demo link tour the whole guest experience — RSVP, gift shopping, the
 * works — without ever touching a real row. `getInvitation` below hands
 * back a synthetic invitation for these, exactly like a real DB row, so
 * every read endpoint that already calls `requireInvitation`/`getInvitation`
 * (content, gifts, venue photos...) works completely unmodified. Endpoints
 * that WRITE (`rsvp.js`, `gifts/reserve.js`) still need their own explicit
 * `if (inv.isDemo)` guard before touching the DB or sending an email — this
 * only covers the read side for free.
 */
const DEMO_INVITATIONS = {
  'demo-completa': {
    id: 'demo', token: 'demo-completa', name: 'Nombre de Ejemplo', email: null, phone: null,
    nickname: 'Invitado/a', companion_name: 'Acompañante de Ejemplo', is_admin: 0,
    welcome_message: null, max_additional_guests: 1, invitation_type: 'all_in',
    notes: null, invitation_sent: 0, created_at: null, isDemo: true,
  },
  'demo-fiesta': {
    id: 'demo', token: 'demo-fiesta', name: 'Nombre de Ejemplo', email: null, phone: null,
    nickname: 'Invitado/a', companion_name: 'Acompañante de Ejemplo', is_admin: 0,
    welcome_message: null, max_additional_guests: 1, invitation_type: 'party_only',
    notes: null, invitation_sent: 0, created_at: null, isDemo: true,
  },
}

export async function getInvitation(request, env) {
  const token = request.headers.get('X-Invite-Token')
  if (!token) return null
  if (DEMO_INVITATIONS[token]) return DEMO_INVITATIONS[token]
  return env.DB.prepare('SELECT * FROM invitations WHERE token = ?').bind(token).first()
}

export async function requireInvitation(request, env) {
  const inv = await getInvitation(request, env)
  if (!inv) throw new AuthError('Unauthorized', 401)
  return inv
}

export async function requireAdmin(request, env) {
  const inv = await getInvitation(request, env)
  if (!inv || !inv.is_admin) throw new AuthError('Forbidden', 403)
  return inv
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function err(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

class AuthError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function handleAuthError(e) {
  if (e instanceof AuthError || e.status === 401 || e.status === 403) {
    return err(e.message, e.status || 401)
  }
  return null
}
