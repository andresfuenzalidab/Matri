/**
 * Curated font choices for the admin's Apariencia tab. Kept short and
 * hand-picked rather than free text, so a guest never lands on a font that
 * fails to load or doesn't carry the italic weights the design leans on.
 */

export const HEADING_FONTS = [
  { name: 'Cormorant Garamond', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap' },
  { name: 'Playfair Display', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap' },
  { name: 'Cormorant', href: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,600;1,400;1,600&display=swap' },
  { name: 'EB Garamond', href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap' },
  { name: 'Crimson Pro', href: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600&display=swap' },
]

export const BODY_FONTS = [
  { name: 'Lora', href: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap' },
  { name: 'EB Garamond', href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&display=swap' },
  { name: 'Karla', href: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;500&display=swap' },
  { name: 'Jost', href: 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=swap' },
  { name: 'Work Sans', href: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500&display=swap' },
]

/** Injects the Google Fonts stylesheet for `name`, once, if it isn't already. */
export function loadGoogleFont(list, name) {
  const font = list.find(f => f.name === name)
  if (!font) return
  const id = `gfont-${font.name.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = font.href
  document.head.appendChild(link)
}
