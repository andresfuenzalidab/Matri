export async function getInvitation(request, env) {
  const token = request.headers.get('X-Invite-Token')
  if (!token) return null
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
