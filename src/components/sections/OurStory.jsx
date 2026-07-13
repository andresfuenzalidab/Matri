import { useApp } from '../../context/AppContext'
import PhotoPlaceholder from '../PhotoPlaceholder'

export default function OurStory() {
  const { get } = useApp()

  return (
    <section id="historia" className="section">
      <h2 className="section-title">Nuestra Historia</h2>
      <p className="section-subtitle">El camino que nos trajo hasta aquí</p>

      <hr className="hr" />

      {/* How we met */}
      <div className="story-section">
        <div className="story-text">
          {get('story_how_we_met_date') && (
            <span className="story-date">{get('story_how_we_met_date')}</span>
          )}
          <h3>Cómo nos conocimos</h3>
          <p>{get('story_how_we_met', 'Todo comenzó en una tarde de otoño, cuando el destino quiso que nuestros caminos se cruzaran. Desde ese primer momento, supimos que algo especial había comenzado. Lo que empezó como una amistad fue creciendo, conversación a conversación, hasta convertirse en el amor más grande de nuestras vidas.')}</p>
        </div>
        <PhotoPlaceholder
          size="lg"
          url={get('story_image_1')}
          label="Foto juntos"
          alt="Andrés y Catalina"
        />
      </div>

      {/* Proposal */}
      <div className="story-section reverse">
        <div className="story-text">
          {get('story_proposal_date') && (
            <span className="story-date">{get('story_proposal_date')}</span>
          )}
          <h3>El compromiso</h3>
          <p>{get('story_proposal', 'Después de años de aventuras juntos, Andrés eligió el momento perfecto para pedirle a Catalina que fuera su compañera de vida para siempre. Con el corazón en la mano y mucho amor, le propuso matrimonio en un lugar que ambos guardan en el corazón. Ese «sí» fue el comienzo de un nuevo capítulo, el más emocionante de todos.')}</p>
        </div>
        <PhotoPlaceholder
          size="lg"
          url={get('proposal_image')}
          label="El compromiso"
          alt="La propuesta"
        />
      </div>

      <hr className="hr" />

      {/* Family — pets */}
      <div className="pets-intro">
        <h3>Nuestra familia peluda</h3>
        <p>{get('story_family', 'Nuestra familia no estaría completa sin nuestros tres peludos. Ellos también son parte de esta historia de amor.')}</p>
      </div>

      <div className="pets-row">
        {[
          { key: 'pet1', defaultName: 'Nuestro perro' },
          { key: 'pet2', defaultName: 'Nuestra gata' },
          { key: 'pet3', defaultName: 'Nuestra otra gata' },
        ].map(({ key, defaultName }) => (
          <div key={key} className="pet-item">
            <PhotoPlaceholder
              size="sm"
              url={get(`${key}_image`)}
              label={get(`${key}_name`, defaultName)}
              alt={get(`${key}_name`, defaultName)}
            />
            <div className="pet-name">{get(`${key}_name`, defaultName)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
