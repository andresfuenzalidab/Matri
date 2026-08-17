import { useApp } from '../../context/AppContext'
import PhotoCarouselManager from './PhotoCarouselManager'

export default function StoryPhotosManager() {
  const { storyPhotos, setStoryPhotos, loadStoryPhotos } = useApp()
  return (
    <PhotoCarouselManager
      endpoint="/api/admin/story-photos"
      introText='Fotos del carrusel al final de "Nuestra Historia".'
      confirmNoun="esta foto del carrusel"
      aspectRatio="1/1"
      photos={storyPhotos}
      setPhotos={setStoryPhotos}
      loadPhotos={loadStoryPhotos}
    />
  )
}
