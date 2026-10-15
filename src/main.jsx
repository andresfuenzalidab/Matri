import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/stationery.css'
import App from './App.jsx'
import MediaPage from './components/media/MediaPage.jsx'

// `/fotos` is the guest photo album reached from the QR code. It needs no
// invitation token, so it skips the whole invite flow in <App />.
const isAlbum = /^\/fotos\/?$/.test(window.location.pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAlbum ? <MediaPage /> : <App />}
  </StrictMode>
)
