import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

/** One fetch-once, shared-everywhere resource — the same pattern as `content`
 *  below. Both the live carousel and the admin editor read (and the editor
 *  writes) the same state, so an edit in admin is visible immediately instead
 *  of only after the live view's own independent fetch happens to re-run. */
function useSharedList(endpoint, token) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (loaded) return
    try {
      const res = await fetch(endpoint, { headers: { 'X-Invite-Token': token } })
      if (res.ok) {
        setItems(await res.json())
        setLoaded(true)
      }
    } catch {
      // fail silently — the section just shows nothing
    }
  }, [endpoint, token, loaded])

  return { items, setItems, loaded, load }
}

export function AppProvider({ children, token, guest, rsvp, giftReservation }) {
  const [content, setContent] = useState({})
  const [contentLoaded, setContentLoaded] = useState(false)

  // Auto-load content on mount so all sections (music, venue, etc.) work immediately
  useEffect(() => {
    if (!token || contentLoaded) return
    fetch('/api/content', { headers: { 'X-Invite-Token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setContent(data); setContentLoaded(true) } })
      .catch(() => {})
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const storyPhotos = useSharedList('/api/story-photos', token)
  const venuePhotos = useSharedList('/api/venue-photos', token)

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
      get,
      storyPhotos: storyPhotos.items,
      setStoryPhotos: storyPhotos.setItems,
      loadStoryPhotos: storyPhotos.load,
      venuePhotos: venuePhotos.items,
      setVenuePhotos: venuePhotos.setItems,
      loadVenuePhotos: venuePhotos.load,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
