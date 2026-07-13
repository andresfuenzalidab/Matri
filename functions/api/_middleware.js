const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'X-Invite-Token, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }
  const response = await context.next()
  const next = new Response(response.body, response)
  Object.entries(CORS).forEach(([k, v]) => next.headers.set(k, v))
  return next
}
