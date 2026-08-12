import { normalizeImageUrl } from './imageUrl.js'

export function downloadInvitationPDF(inv, content = {}) {
  const base = (content.site_url || '').trim() || window.location.origin
  const link = `${base}/?token=${inv.token}`
  const companion = (inv.companion_name || '').trim()
  const guestName = companion ? `${inv.name} y ${companion}` : inv.name
  const isPartyOnly = (inv.invitation_type || 'all_in') === 'party_only'

  const coupleNames = content.hero_title || 'Andrés & Catalina'
  const weddingDate = content.hero_date || 'Viernes 6 de noviembre de 2026'
  const venueName = content.venue_name || 'Altos del Paico'
  const venueAddress = content.venue_address || ''
  const ceremonyTime = content.ceremony_time || '17:00'
  const receptionTime = content.reception_time || '19:30'
  const heroImage = normalizeImageUrl(content.hero_image || '')

  const timingLine = isPartyOnly
    ? `Citación a fiesta: ${receptionTime} hrs`
    : `Citación a ceremonia: ${ceremonyTime} hrs`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Invitación — ${coupleNames}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:0}
html,body{width:210mm;min-height:297mm;background:#f6f1e9}
body{font-family:'Lora',Georgia,serif;color:#2d2520}
.page{
  width:210mm;min-height:297mm;background:#f6f1e9;
  position:relative;display:flex;flex-direction:column;align-items:center;
  padding:0 0 14mm;
}
.frame{position:absolute;inset:10mm;border:1px solid #c09045;pointer-events:none;z-index:0}
.frame::before{content:'';position:absolute;inset:4px;border:1px solid rgba(192,144,69,0.3)}
.corner{position:absolute;width:22px;height:22px;border-color:#c09045;border-style:solid;z-index:2}
.tl{top:10mm;left:10mm;border-width:2px 0 0 2px;margin:-1px}
.tr{top:10mm;right:10mm;border-width:2px 2px 0 0;margin:-1px}
.bl{bottom:10mm;left:10mm;border-width:0 0 2px 2px;margin:-1px}
.br{bottom:10mm;right:10mm;border-width:0 2px 2px 0;margin:-1px}

.hero-img{
  width:100%;height:52mm;object-fit:cover;display:block;
  position:relative;z-index:1;
}
.hero-overlay{
  position:absolute;top:0;left:0;right:0;height:52mm;
  background:linear-gradient(to bottom,rgba(0,0,0,.15),rgba(246,241,233,.9));
  z-index:1;
}

.content{
  width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;
  padding:${heroImage ? '6mm' : '14mm'} 20mm 0;z-index:2;position:relative;
}
.label-top{font-size:7.5pt;letter-spacing:.22em;text-transform:uppercase;color:#c09045;margin-bottom:5mm}
.monogram{
  font-family:'Cormorant Garamond',serif;font-size:${heroImage ? '36pt' : '46pt'};font-weight:400;
  line-height:1;color:#2d2520;letter-spacing:.06em;margin-bottom:2.5mm
}
.ornament{color:#c09045;font-size:10pt;letter-spacing:.5em;margin-bottom:4mm;opacity:.8}
.divider{display:flex;align-items:center;gap:8px;width:55%;margin:4mm auto}
.dl{flex:1;height:1px;background:linear-gradient(to right,transparent,#c09045,transparent)}
.dd{width:5px;height:5px;background:#c09045;transform:rotate(45deg);flex-shrink:0}
.to-label{font-size:7pt;letter-spacing:.18em;text-transform:uppercase;color:#c09045;margin-bottom:2mm}
.guest-name{
  font-family:'Cormorant Garamond',serif;font-size:26pt;font-style:italic;
  font-weight:400;color:#2d2520;margin-bottom:6mm;line-height:1.2
}
.intro{font-size:9.5pt;line-height:1.85;color:#4a3f35;max-width:132mm;margin-bottom:5mm}
.wedding-box{display:flex;flex-direction:column;align-items:center;gap:2mm;margin-bottom:6mm}
.wd-date{font-family:'Cormorant Garamond',serif;font-size:18pt;font-weight:600;color:#2d2520;letter-spacing:.04em}
.wd-times{font-size:9pt;color:#c09045;letter-spacing:.06em}
.wd-venue{font-family:'Cormorant Garamond',serif;font-size:13pt;font-weight:600;color:#2d2520}
.wd-address{font-size:8pt;color:#7a6a5a;font-style:italic}

.link-box{
  background:white;border:1px solid rgba(192,144,69,.45);border-radius:6px;
  padding:5mm 7mm;max-width:148mm;width:100%;text-align:center;margin-bottom:4mm
}
.link-box-label{font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:#c09045;margin-bottom:3mm}

/* The main CTA button */
.open-btn{
  display:inline-block;
  background:#b68235;color:white;
  font-family:'Lora',serif;font-size:10pt;font-weight:500;
  padding:3mm 8mm;border-radius:3px;text-decoration:none;
  letter-spacing:.04em;margin-bottom:4mm;
}
.fallback-label{font-size:7.5pt;color:#9a8a7a;font-style:italic;margin-bottom:1.5mm}
.link-url{font-family:monospace;font-size:7.5pt;color:#7a6a5a;word-break:break-all;line-height:1.5}

.footer{margin-top:auto;padding-top:7mm;font-size:7.5pt;color:#9a8a7a;letter-spacing:.06em;text-align:center}

@media print{
  html,body,.page{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f6f1e9}
  .open-btn{background:#b68235!important;color:white!important;-webkit-print-color-adjust:exact}
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

  ${heroImage ? `
  <div style="position:relative;width:100%;z-index:1">
    <img src="${heroImage}" class="hero-img" alt="Portada">
    <div class="hero-overlay"></div>
  </div>` : ''}

  <div class="content">
    <p class="label-top">Invitación de Matrimonio</p>
    <div class="monogram">${coupleNames}</div>
    <div class="ornament">✦ ✦ ✦</div>

    <div class="divider"><div class="dl"></div><div class="dd"></div><div class="dl"></div></div>

    <p class="to-label">Para</p>
    <div class="guest-name">${guestName}</div>

    <p class="intro">Con todo nuestro amor, tenemos el placer de ${companion ? 'invitarlos' : 'invitarte'} a celebrar con nosotros el día más especial de nuestras vidas. ${companion ? 'Su' : 'Tu'} presencia hará de este momento algo aún más mágico.</p>

    <div class="wedding-box">
      <div class="wd-date">${weddingDate}</div>
      <div class="wd-times">${timingLine}</div>
      <div class="wd-venue">${venueName}</div>
      ${venueAddress ? `<div class="wd-address">${venueAddress}</div>` : ''}
    </div>

    <div class="divider" style="margin-bottom:6mm"><div class="dl"></div><div class="dd"></div><div class="dl"></div></div>

    <div class="link-box">
      <div class="link-box-label">Tu invitación personalizada</div>
      <a href="${link}" class="open-btn">Abrir invitación →</a>
      <div class="fallback-label">Si el botón no funciona, ingresa este enlace en tu navegador:</div>
      <div class="link-url">${link}</div>
    </div>
  </div>

  <div class="footer">Con amor, ${coupleNames} &nbsp;•&nbsp; ${weddingDate}</div>
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
