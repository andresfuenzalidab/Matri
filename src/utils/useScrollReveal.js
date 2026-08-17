import { useEffect } from 'react'

export function useScrollReveal(active) {
  useEffect(() => {
    if (!active) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    function register(el) {
      const rect = el.getBoundingClientRect()
      // Synchronously reveal elements already in the viewport
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible')
      } else {
        observer.observe(el)
      }
    }

    document.querySelectorAll('.reveal-on-scroll').forEach(register)

    // Sections whose content loads asynchronously (gifts, venue photos, the
    // story carousel) mount their `.reveal-on-scroll` element after this
    // effect's initial scan — a fetch that's still in flight the moment the
    // guest opens the envelope. Without this, that element never gets
    // registered and stays invisible until a reload happens to win the race.
    const mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.matches?.('.reveal-on-scroll')) register(node)
          node.querySelectorAll?.('.reveal-on-scroll').forEach(register)
        }
      }
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => { observer.disconnect(); mutationObserver.disconnect() }
  }, [active])
}
