import { useEffect, useState } from 'react'

/** Nothing may stall the guest behind a broken or slow asset for good. */
const SAFETY_MS = 9000

/**
 * Ready once every listed image has loaded — or failed. A failed image still
 * counts: the page has a fallback for each one, so the wait is over either way.
 * Pass an empty list to be ready immediately.
 */
export function useImagesReady(urls, enabled = true) {
  const key = urls.filter(Boolean).join('|')

  // Starts false even with nothing to load: the effect flips it on the same
  // commit, which avoids a frame of "ready" while `enabled` is still false.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const list = key ? key.split('|') : []
    if (!list.length) { setReady(true); return }

    setReady(false)
    let settled = 0
    let cancelled = false

    function tick() {
      if (cancelled) return
      settled += 1
      if (settled >= list.length) setReady(true)
    }

    list.forEach(src => {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = src
    })

    const timer = setTimeout(() => { if (!cancelled) setReady(true) }, SAFETY_MS)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [key, enabled])

  return ready
}

/**
 * Ready once the webfonts have resolved and every `<img>` currently in the
 * document has finished. Images that appear later (carousels fetched from the
 * API, for instance) are not waited on — this only gates the first paint.
 */
export function usePageAssetsReady(enabled = true) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    function check() {
      if (cancelled) return
      const pending = Array.from(document.images).filter(img => !img.complete)
      if (!pending.length) { setReady(true); return }
      // Re-check as each one settles. `check` is idempotent and the listeners
      // fire once, so re-arming them here is safe.
      pending.forEach(img => {
        img.addEventListener('load', check, { once: true })
        img.addEventListener('error', check, { once: true })
      })
    }

    // Webfonts matter as much as images here: the whole page is set in them,
    // and swapping them in late is the most visible kind of reflow.
    const fonts = document.fonts?.ready || Promise.resolve()
    fonts.then(check).catch(check)
    check()

    const timer = setTimeout(() => { if (!cancelled) setReady(true) }, SAFETY_MS)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [enabled])

  return ready
}
