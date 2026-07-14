export function downloadInvitationPDF(inv, content = {}) {
  const origin = window.location.origin
  const link = `${origin}/?token=${inv.token}`
  const guestName = inv.name
  const personalMessage = inv.welcome_message || ''

  const coupleNames = content.hero_title || 'Andrés & Catalina'
  const weddingDate = content.hero_date || '6 de noviembre de 2026'
  const venueName = content.venue_name || 'Altos del Paico'
  const venueAddress = content.venue_address || ''
  const ceremonyTime = content.ceremony_time || '17:00'
  const receptionTime = content.reception_time || '19:30'

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
body{font-family:'Lora',Georgia,serif;color:#2d2520;display:flex;align-items:center;justify-content:center}
.page{
  width:210mm;min-height:297mm;
  background:#f6f1e9;
  position:relative;
  display:flex;flex-direction:column;align-items:center;
  padding:18mm 20mm 14mm;
}
/* Outer border */
.frame{
  position:absolute;inset:10mm;
  border:1px solid #c09045;
  pointer-events:none;
}
.frame::before{
  content:'';position:absolute;inset:4px;
  border:1px solid rgba(192,144,69,0.3);
}
/* Corner flourishes */
.corner{position:absolute;width:22px;height:22px;border-color:#c09045;border-style:solid}
.tl{top:10mm;left:10mm;border-width:2px 0 0 2px;margin:-1px}
.tr{top:10mm;right:10mm;border-width:2px 2px 0 0;margin:-1px}
.bl{bottom:10mm;left:10mm;border-width:0 0 2px 2px;margin:-1px}
.br{bottom:10mm;right:10mm;border-width:0 2px 2px 0;margin:-1px}

.content{width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:0;z-index:1}

.label-top{
  font-size:7.5pt;letter-spacing:.22em;text-transform:uppercase;color:#c09045;
  margin-bottom:7mm;font-family:'Lora',serif
}
.monogram{
  font-family:'Cormorant Garamond',serif;font-size:46pt;font-weight:400;
  line-height:1;color:#2d2520;letter-spacing:.06em;margin-bottom:3mm
}
.ornament{color:#c09045;font-size:11pt;letter-spacing:.5em;margin-bottom:4mm;opacity:.8}

.divider{display:flex;align-items:center;gap:8px;width:55%;margin:5mm auto}
.dl{flex:1;height:1px;background:linear-gradient(to right,transparent,#c09045,transparent)}
.dd{width:5px;height:5px;background:#c09045;transform:rotate(45deg);flex-shrink:0}

.to-label{
  font-size:7pt;letter-spacing:.18em;text-transform:uppercase;color:#c09045;
  margin-bottom:2mm;font-family:'Lora',serif
}
.guest-name{
  font-family:'Cormorant Garamond',serif;font-size:28pt;font-style:italic;
  font-weight:400;color:#2d2520;margin-bottom:7mm;line-height:1.2
}
.intro{
  font-size:9.5pt;line-height:1.85;color:#4a3f35;max-width:135mm;margin-bottom:6mm
}
.personal{
  background:rgba(192,144,69,.07);border-left:2.5px solid #c09045;
  padding:4mm 6mm;max-width:135mm;width:100%;text-align:left;
  font-style:italic;font-size:9.5pt;line-height:1.8;color:#4a3f35;margin-bottom:7mm
}
.wedding-box{
  display:flex;flex-direction:column;align-items:center;gap:2.5mm;margin-bottom:7mm
}
.wd-date{
  font-family:'Cormorant Garamond',serif;font-size:20pt;font-weight:600;
  color:#2d2520;letter-spacing:.04em
}
.wd-times{font-size:9pt;color:#c09045;letter-spacing:.08em}
.wd-venue{
  font-family:'Cormorant Garamond',serif;font-size:14pt;font-weight:600;color:#2d2520
}
.wd-address{font-size:8.5pt;color:#7a6a5a;font-style:italic}

.link-box{
  background:white;border:1px solid rgba(192,144,69,.45);border-radius:4px;
  padding:5mm 8mm;max-width:148mm;width:100%;text-align:center;margin-bottom:4mm
}
.link-label-txt{
  font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:#c09045;
  margin-bottom:2.5mm;font-family:'Lora',serif
}
.link-url{font-family:monospace;font-size:8pt;color:#2d2520;word-break:break-all;line-height:1.55}
.link-hint{font-size:7.5pt;color:#9a8a7a;font-style:italic;margin-top:2mm}

.footer{
  margin-top:auto;padding-top:8mm;
  font-size:7.5pt;color:#9a8a7a;letter-spacing:.08em;text-align:center
}

@media print{
  html,body,.page{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#f6f1e9}
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

  <div class="content">
    <p class="label-top">Invitación de Boda</p>
    <div class="monogram">${coupleNames}</div>
    <div class="ornament">✦ ✦ ✦</div>

    <div class="divider"><div class="dl"></div><div class="dd"></div><div class="dl"></div></div>

    <p class="to-label">Para</p>
    <div class="guest-name">${guestName}</div>

    <p class="intro">Con todo nuestro amor, tenemos el placer de invitarte a celebrar con nosotros el día más especial de nuestras vidas. Tu presencia hará de este momento algo aún más mágico.</p>

    ${personalMessage ? `<div class="personal">${personalMessage.replace(/\n/g, '<br>')}</div>` : ''}

    <div class="wedding-box">
      <div class="wd-date">${weddingDate}</div>
      <div class="wd-times">Ceremonia ${ceremonyTime} hrs · Recepción ${receptionTime} hrs</div>
      <div class="wd-venue">${venueName}</div>
      ${venueAddress ? `<div class="wd-address">${venueAddress}</div>` : ''}
    </div>

    <div class="divider" style="margin-bottom:7mm"><div class="dl"></div><div class="dd"></div><div class="dl"></div></div>

    <div class="link-box">
      <div class="link-label-txt">Tu invitación personalizada</div>
      <div class="link-url">${link}</div>
      <div class="link-hint">Ingresa al enlace para confirmar tu asistencia y ver todos los detalles</div>
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
