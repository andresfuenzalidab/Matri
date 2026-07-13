import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children, token, guest, rsvp, giftReservation }) {
  const [content, setContent] = useState({})
  const [contentLoaded, setContentLoaded] = useState(false)

  const loadContent = useCallback(async () => {
    if (contentLoaded) return
    try {
      const res = await fetch('/api/content', {
        headers: { 'X-Invite-Token': token }
      })
      if (res.ok) {
        const data = await res.json()
        setContent(data)
        setContentLoaded(true)
      }
    } catch {
      // fail silently — show defaults
    }
  }, [token, contentLoaded])

  function get(key, fallback = '') {
    const val = content[key]
    if (val === undefined || val === null || val === '') return fallback
    return val
  }

  function updateContent(key, value) {
    setContent(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AppContext.Provider value={{
      token,
      guest,
      rsvp,
      giftReservation,
      content,
      contentLoaded,
      loadContent,
      setContent,
      updateContent,
      get
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
