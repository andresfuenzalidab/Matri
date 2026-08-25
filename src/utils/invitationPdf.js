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

/** The arrow from the cover, pointing down at the seal you press. */
const POINTER_ARROW = `
<svg class="pointer" viewBox="0 0 24 30" fill="none" stroke="currentColor"
  stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3v20"/>
  <path d="M5.5 16.5 12 23l6.5-6.5"/>
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

  const names = content.envelope_names || content.hero_title || 'Cata & Andrés'

  const sealImage = absolute(content.envelope_seal_image)
  // Static asset (public/), not an admin field — this is the illustrated
  // background art itself, not something that changes per wedding.
  const bg = absolute('/pdf-invitation-bg.png')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Invitación — ${names}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:0}
/* Exactly one sheet. 296mm rather than a full 297mm because a block the same
   height as the page rounds up by a fraction and spills into a blank second
   page; the overflow clip below is the hard guarantee behind that. */
html,body{width:210mm;height:296mm;overflow:hidden;background:#f7f3ea}
body{font-family:'Lora',Georgia,serif;color:#4a4038}

/* The illustrated card art IS the page now — it's drawn at the same
   portrait ratio as the A4 sheet (1414x2000px, same as 210x296mm), so
   background-size:cover here doesn't crop or stretch it. "Andres y
   Catalina, 6 de noviembre, Altos del Paico" is already baked into the
   art; only what the art can't know — who this particular copy is for,
   and the link to their actual invitation — is drawn on top, positioned
   toward the middle of the page (see .inner below) per feedback. */
.page{
  width:210mm;height:296mm;overflow:hidden;
  background:url('${bg}') center/cover no-repeat, #f7f3ea;
  position:relative;
  break-inside:avoid;page-break-inside:avoid;
}

/* Slightly above the middle per feedback — 2/5 down the page. The updated
   artwork (re-synced from the repo root — see public/pdf-invitation-bg.png)
   opened up a much bigger open band right around here (baked text now
   ends near 40%, sky/roofline doesn't start until ~72%), so 40% now lands
   right at the START of open space instead of on top of baked text —
   there's room to size everything up properly, per feedback. */
.inner{
  position:absolute;top:35%;left:14mm;right:14mm;
  display:flex;flex-direction:column;align-items:center;text-align:center;
}

.to-label{font-size:9.5pt;letter-spacing:.22em;text-transform:uppercase;color:#8a7a68;margin-bottom:3.5mm}
.guest-name{
  font-family:'Cormorant Garamond',serif;font-size:23pt;font-style:italic;
  font-weight:400;color:#4a4038;line-height:1.3;margin-bottom:6mm
}

/* The wax seal, as on the envelope cover — the thing you press to open.
   "Click aquí" above a deliberately bigger arrow, per feedback, so it's
   unambiguous the seal is the button, not just decoration. */
.seal-block{display:flex;flex-direction:column;align-items:center}
.click-label{
  font-size:13pt;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:#565c42;margin-bottom:2mm
}
.pointer{width:11mm;height:auto;color:#565c42;margin-bottom:2.5mm;display:block}
.seal{
  width:20mm;height:20mm;flex:0 0 auto;border-radius:50%;
  background:radial-gradient(circle at 34% 30%, #6d7355 0%, #565c42 72%);
  display:flex;align-items:center;justify-content:center;
  text-decoration:none;
  box-shadow:0 1mm 2.5mm rgba(40,44,30,0.3);
}
.seal-art{width:66%;height:66%}
.seal img{width:100%;height:100%;object-fit:contain;border-radius:50%}

@media print{
  html,body,.page,.seal{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="page">
  <div class="inner">
    <p class="to-label">Esta invitación es especialmente para</p>
    <div class="guest-name">${guestName}</div>

    <div class="seal-block">
      <p class="click-label">Click aquí</p>
      ${POINTER_ARROW}
      <a href="${link}" class="seal">
        ${sealImage ? `<img src="${sealImage}" alt="">` : SEAL_SPRIG}
      </a>
    </div>
  </div>
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
