import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { HEADING_FONTS, BODY_FONTS, loadGoogleFont } from '../utils/fontOptions.js'

const STYLE_TAG_ID = 'theme-overrides'
// Read synchronously by the inline bootstrap script in index.html, before
// React (or even the admin's content fetch) has run — see the note below.
const CACHE_KEY = 'matri-theme-css'

/** Darkens a `#rrggbb` color for the wax seal's gradient shadow stop. */
function darken(hex, amount = 0.32) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const [r, g, b] = [1, 2, 3].map(i => Math.round(parseInt(m[i], 16) * (1 - amount)))
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Applies the admin's site-wide color/font choices at runtime, as a single
 * injected `<style>` overriding the design tokens in :root. Every component
 * on the site is already built on these CSS variables, so nothing else needs
 * to change for a new palette or typeface to take effect everywhere at once.
 */
export default function ThemeInjector() {
  const { get } = useApp()
  const bg = get('theme_color_bg')
  const accent = get('theme_color_accent')
  const accentDeep = get('theme_color_accent_deep')
  const onAccent = get('theme_color_on_accent')
  const text = get('theme_color_text')
  const paper = get('theme_color_paper')
  const seal = get('theme_color_seal')
  const fontHeading = get('theme_font_heading')
  const fontBody = get('theme_font_body')

  useEffect(() => {
    const vars = []
    if (bg) vars.push(`--color-bg:${bg}`)
    if (accent) vars.push(`--color-accent:${accent}`, `--color-accent-2:${accent}`)
    if (accentDeep) vars.push(`--color-accent-deep:${accentDeep}`)
    if (onAccent) vars.push(`--color-on-accent:${onAccent}`)
    if (text) vars.push(`--color-text:${text}`)
    if (paper) vars.push(`--paper:${paper}`)
    if (seal) vars.push(`--seal:${seal}`, `--seal-deep:${darken(seal)}`)
    if (fontHeading) vars.push(`--font-heading:'${fontHeading}', serif`)
    if (fontBody) vars.push(`--font-body:'${fontBody}', serif`)

    let tag = document.getElementById(STYLE_TAG_ID)
    if (!vars.length) {
      tag?.remove()
      try { localStorage.removeItem(CACHE_KEY) } catch { /* private browsing, etc. */ }
      return
    }
    if (!tag) {
      tag = document.createElement('style')
      tag.id = STYLE_TAG_ID
      document.head.appendChild(tag)
    }
    const css = `:root{${vars.join(';')}}`
    tag.textContent = css
    // Cached so the *next* load can apply it before the content fetch even
    // starts — this effect itself only runs once `content` has arrived,
    // which is exactly the frame where the spinner used to visibly snap from
    // the default background to the admin's chosen one.
    try { localStorage.setItem(CACHE_KEY, css) } catch { /* private browsing, etc. */ }
  }, [bg, accent, accentDeep, onAccent, text, paper, seal, fontHeading, fontBody])

  useEffect(() => { if (fontHeading) loadGoogleFont(HEADING_FONTS, fontHeading) }, [fontHeading])
  useEffect(() => { if (fontBody) loadGoogleFont(BODY_FONTS, fontBody) }, [fontBody])

  return null
}
