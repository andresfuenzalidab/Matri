export async function onRequestDelete({ request, env }) {
  const adminToken = request.headers.get('X-Invite-Token')
  const inv = await env.DB.prepare('SELECT is_admin FROM invitations WHERE token = ?').bind(adminToken).first()
  if (!inv?.is_admin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

  await env.DB.prepare('DELETE FROM rsvp_responses WHERE invitation_id = ?').bind(Number(id)).run()
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
