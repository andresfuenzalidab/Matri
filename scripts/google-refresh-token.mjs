// One-time helper: signs in with the Google account that owns the album folder
// and prints a refresh token for the site's Cloudflare secrets.
//
//   node scripts/google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
//
// The OAuth client must be of type "Web application" with
// http://localhost:53682/callback as an authorized redirect URI (MEDIA_SETUP.md).
import http from 'node:http'
import { exec } from 'node:child_process'

const [clientId, clientSecret] = process.argv.slice(2)
if (!clientId || !clientSecret) {
  console.error('Uso: node scripts/google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>')
  process.exit(1)
}

const PORT = 53682
const redirect = `http://localhost:${PORT}/callback`
const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirect,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/drive',
  access_type: 'offline',
  prompt: 'consent', // forces Google to return a refresh token
})

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirect)
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return }
  const code = url.searchParams.get('code')
  if (!code) { res.writeHead(400).end('Falta el código.'); return }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: 'authorization_code' }),
    })
    const data = await r.json()
    if (!data.refresh_token) throw new Error(JSON.stringify(data))
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Listo. Puedes cerrar esta pestaña y volver a la terminal.')
    console.log('\nGOOGLE_REFRESH_TOKEN =', data.refresh_token, '\n')
  } catch (e) {
    res.writeHead(500).end('Error, revisa la terminal.')
    console.error('No se obtuvo el token:', e.message)
  }
  server.close()
})

server.listen(PORT, () => {
  console.log('Abre este enlace e inicia sesión con la cuenta dueña de la carpeta:\n\n' + authUrl + '\n')
  const open = process.platform === 'win32' ? `start "" "${authUrl}"` : process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`
  exec(open, () => {})
})
