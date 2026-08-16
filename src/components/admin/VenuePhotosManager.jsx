import PhotoCarouselManager from './PhotoCarouselManager'

export default function VenuePhotosManager() {
  return (
    <PhotoCarouselManager
      endpoint="/api/admin/venue-photos"
      introText='Fotos del carrusel en "El lugar".'
      confirmNoun="esta foto del lugar"
    />
  )
}
