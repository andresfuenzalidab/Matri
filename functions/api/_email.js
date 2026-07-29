export async function sendEmail(env, { from, to, subject, html }) {
  if (!env.resend_api_key || !from || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}
