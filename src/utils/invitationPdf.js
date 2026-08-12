import { normalizeImageUrl } from './imageUrl.js'

/** Trailing slashes here produced links like `https://site//?token=…`. */
export function inviteLink(inv, content = {}) {
  const base = ((content.site_url || '').trim() || window.location.origin).replace(/\/+$/, '')
  return `${base}/?token=${inv.token}`
}

/**
 * The popup is written into an `about:blank` document, so root-relative R2
 * paths have no reliable base to resolve against once the page is printed or
 * saved. Pin them to the current origin.
 */
function absolute(url) {
  const u = normalizeImageUrl(url || '')
  if (!u) return ''
  return u.startsWith('/') ? `${window.location.origin}${u}` : u
}

/* The flourish used between sections on the site, and the wax-seal sprig from
   the envelope cover — same art, so the PDF reads as part of the same set. */
const FLOURISH = `
<svg class="flourish" viewBox="0 0 300 40" fill="none" stroke="currentColor"
  stroke-width="0.9" stroke-linecap="round" aria-hidden="true">
  <path d="M6 20h108" opacity="0.35"/>
  <path d="M186 20h108" opacity="0.35"/>
  <path d="M114 20c8 0 14-2 19-6"/>
  <path d="M124 18c-1.5-3.4-1-6 1.6-7.8.9 3.3.2 5.9-1.6 7.8z"/>
  <path d="M131 14.6c-2.4-2.7-2.6-5.4-.7-8 2 2.8 2.2 5.5.7 8z"/>
  <path d="M114 20c8 0 14 2 19 6"/>
  <path d="M124 22c-1.5 3.4-1 6 1.6 7.8.9-3.3.2-5.9-1.6-7.8z"/>
  <path d="M186 20c-8 0-14-2-19-6"/>
  <path d="M176 18c1.5-3.4 1-6-1.6-7.8-.9 3.3-.2 5.9 1.6 7.8z"/>
  <path d="M169 14.6c2.4-2.7 2.6-5.4.7-8-2 2.8-2.2 5.5-.7 8z"/>
  <path d="M186 20c-8 0-14 2-19 6"/>
  <path d="M176 22c1.5 3.4 1 6-1.6 7.8-.9-3.3-.2-5.9 1.6-7.8z"/>
  <path d="M150 12.5 156 20l-6 7.5-6-7.5z"/>
  <circle cx="150" cy="20" r="1.6" fill="currentColor" stroke="none"/>
</svg>`

const SEAL_SPRIG = `
<svg class="seal-art" viewBox="0 0 40 40" aria-hidden="true">
  <g fill="none" stroke="#f4f1e4" stroke-width="1.1" stroke-linecap="round">
    <path d="M20 31V15"/>
    <path d="M20 22c-4 0-6.5-2-7.5-5.5 3.5 0 6.5 1.5 7.5 5.5z"/>
    <path d="M20 22c4 0 6.5-2 7.5-5.5-3.5 0-6.5 1.5-7.5 5.5z"/>
    <path d="M20 15c-2.6-1.4-3.6-3.4-3-6 2.2.8 3.4 2.6 3 6z"/>
    <path d="M20 15c2.6-1.4 3.6-3.4 3-6-2.2.8-3.4 2.6-3 6z"/>
    <circle cx="20" cy="10.5" r="1.6"/>
    <circle cx="13.5" cy="13" r="1.2"/>
    <circle cx="26.5" cy="13" r="1.2"/>
  </g>
</svg>`

export function downloadInvitationPDF(inv, content = {}) {
  const link = inviteLink(inv, content)

  const companion = (inv.companion_name || '').trim()
  // Formal names on the invitation, joined the same way as on the RSVP card.
  const guestName = companion ? `${inv.name} y ${companion}` : inv.name
  const isPartyOnly = (inv.invitation_type || 'all_in') === 'party_only'

  const names = content.envelope_names || content.hero_title || 'Cata & Andrés'
  const weddingDate = content.hero_date || 'Viernes 6 de noviembre de 2026'
  const venueName = content.venue_name || 'Altos del Paico'
  const venueAddress = content.venue_address || ''
  const ceremonyTime = content.ceremony_time || '17:00'
  const receptionTime = content.reception_time || '19:30'
  const cta = content.envelope_cta_text || 'Toca aquí para abrir la invitación'

  const logo = absolute(content.envelope_logo_image)
  const sealImage = absolute(content.envelope_seal_image)

  const timingLine = isPartyOnly
    ? `Citación a fiesta: ${receptionTime} hrs`
    : `Citación a ceremonia: ${ceremonyTime} hrs`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Invitación — ${names}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:0}
html,body{width:210mm;min-height:297mm;background:#f7f3ea}
body{font-family:'Lora',Georgia,serif;color:#4a4038}

.page{
  width:210mm;min-height:297mm;
  background:linear-gradient(158deg,#faf6ee 0%,#f7f3ea 48%,#f0eadd 100%);
  position:relative;display:flex;flex-direction:column;align-items:center;
  text-align:center;padding:26mm 24mm 16mm;
}
/* Double hairline frame, matching the card borders on the site */
.frame{position:absolute;inset:9mm;border:1px solid #c09045;pointer-events:none}
.frame::before{content:'';position:absolute;inset:1.4mm;border:1px solid rgba(192,144,69,0.32)}
.corner{position:absolute;width:6mm;height:6mm;border-color:#b68235;border-style:solid}
.tl{top:9mm;left:9mm;border-width:1.5px 0 0 1.5px;margin:-1px}
.tr{top:9mm;right:9mm;border-width:1.5px 1.5px 0 0;margin:-1px}
.bl{bottom:9mm;left:9mm;border-width:0 0 1.5px 1.5px;margin:-1px}
.br{bottom:9mm;right:9mm;border-width:0 1.5px 1.5px 0;margin:-1px}

.inner{position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center}

.kicker{
  font-size:7.5pt;letter-spacing:.24em;text-transform:uppercase;
  color:#b68235;margin-bottom:7mm
}
.logo{width:44mm;height:auto;margin:0 auto 5mm;display:block}
/* No logo uploaded → the names take the oval frame from the cover */
.names{
  position:relative;display:inline-block;
  font-family:'Cormorant Garamond',serif;font-size:30pt;font-style:italic;
  font-weight:400;letter-spacing:.04em;color:#b68235;line-height:1.15;
  margin-bottom:2mm
}
.names.framed{padding:7mm 10mm}
.ring{
  position:absolute;inset:0;border:1px solid rgba(192,144,69,0.4);
  border-radius:50% / 42%
}

.flourish{width:72mm;height:auto;color:#b68235;opacity:.6;margin:6mm auto}

.to-label{font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:#b68235;margin-bottom:2.5mm}
.guest-name{
  font-family:'Cormorant Garamond',serif;font-size:24pt;font-style:italic;
  font-weight:400;color:#4a4038;line-height:1.25
}
.intro{
  font-family:'Cormorant Garamond',serif;font-size:13pt;font-style:italic;
  line-height:1.75;color:#5a5048;max-width:118mm;margin:5mm auto 0
}

.details{display:flex;flex-direction:column;align-items:center;gap:2mm}
.wd-date{font-family:'Cormorant Garamond',serif;font-size:19pt;font-weight:600;color:#4a4038;letter-spacing:.03em}
.wd-times{font-size:9pt;color:#b68235;letter-spacing:.05em}
.wd-venue{font-family:'Cormorant Garamond',serif;font-size:14pt;font-weight:600;color:#4a4038}
.wd-address{font-size:8.5pt;color:#8a7a68;font-style:italic}

/* The wax seal, as on the envelope cover — the thing you press to open */
.seal-block{display:flex;flex-direction:column;align-items:center}
.seal{
  width:22mm;height:22mm;border-radius:50%;
  background:radial-gradient(circle at 34% 30%, #6d7355 0%, #565c42 72%);
  display:flex;align-items:center;justify-content:center;
  text-decoration:none;margin-bottom:4mm;
  box-shadow:0 1mm 3mm rgba(40,44,30,0.32);
}
.seal-art{width:66%;height:66%}
.seal img{width:100%;height:100%;object-fit:contain;border-radius:50%}
.cta{
  font-family:'Cormorant Garamond',serif;font-size:15pt;font-style:italic;
  color:#565c42;max-width:80mm;line-height:1.5;margin-bottom:5mm
}
.fallback-label{font-size:8pt;color:#9a8a7a;font-style:italic;margin-bottom:1.5mm}
.link-url{
  font-family:monospace;font-size:8pt;color:#7a6a5a;word-break:break-all;
  line-height:1.5;max-width:130mm
}

.footer{
  margin-top:auto;padding-top:8mm;font-size:8pt;color:#a09080;
  letter-spacing:.06em
}

@media print{
  html,body,.page,.seal{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="page">
  <div class="frame"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="inner">
    <p class="kicker">Invitación de Matrimonio</p>

    ${logo ? `<img src="${logo}" class="logo" alt="">` : ''}
    <div class="names${logo ? '' : ' framed'}">
      ${logo ? '' : '<span class="ring"></span>'}${names}
    </div>

    ${FLOURISH}

    <p class="to-label">Para</p>
    <div class="guest-name">${guestName}</div>

    <p class="intro">Con todo nuestro amor, tenemos el placer de ${companion ? 'invitarlos' : 'invitarte'} a celebrar con nosotros el día más especial de nuestras vidas. ${companion ? 'Su' : 'Tu'} presencia hará de este momento algo aún más mágico.</p>

    ${FLOURISH}

    <div class="details">
      <div class="wd-date">${weddingDate}</div>
      <div class="wd-times">${timingLine}</div>
      <div class="wd-venue">${venueName}</div>
      ${venueAddress ? `<div class="wd-address">${venueAddress}</div>` : ''}
    </div>

    ${FLOURISH}

    <div class="seal-block">
      <a href="${link}" class="seal">
        ${sealImage ? `<img src="${sealImage}" alt="">` : SEAL_SPRIG}
      </a>
      <p class="cta">${cta}</p>
      <p class="fallback-label">O ingresa este enlace en tu navegador:</p>
      <p class="link-url">${link}</p>
    </div>
  </div>

  <div class="footer">Con amor, ${names} &nbsp;•&nbsp; ${weddingDate}</div>
</div>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),900))</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Permite ventanas emergentes en tu navegador para descargar el PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
}
