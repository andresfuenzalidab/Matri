import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function Home() {
  const { loadContent } = useApp()
  useEffect(() => { loadContent() }, [loadContent])

  return (
    <section id="inicio" className="hero">
      <div className="hero-video-overlay" />
    </section>
  )
}
