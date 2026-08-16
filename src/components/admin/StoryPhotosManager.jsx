import PhotoCarouselManager from './PhotoCarouselManager'

export default function StoryPhotosManager() {
  return (
    <PhotoCarouselManager
      endpoint="/api/admin/story-photos"
      introText='Fotos del carrusel al final de "Nuestra Historia".'
      confirmNoun="esta foto del carrusel"
    />
  )
}
