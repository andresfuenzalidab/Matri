import { useEffect } from 'react'

export function useScrollReveal(active) {
  useEffect(() => {
    if (!active) return
    const els = document.querySelectorAll('.reveal-on-scroll')
    if (!els.length) return

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

    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [active])
}
