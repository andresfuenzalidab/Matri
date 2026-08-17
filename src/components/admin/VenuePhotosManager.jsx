import { useApp } from '../../context/AppContext'
import PhotoCarouselManager from './PhotoCarouselManager'

export default function VenuePhotosManager() {
  const { venuePhotos, setVenuePhotos, loadVenuePhotos } = useApp()
  return (
    <PhotoCarouselManager
      endpoint="/api/admin/venue-photos"
      introText='Fotos del carrusel en "El lugar".'
      confirmNoun="esta foto del lugar"
      aspectRatio="16/9"
      photos={venuePhotos}
      setPhotos={setVenuePhotos}
      loadPhotos={loadVenuePhotos}
    />
  )
}
