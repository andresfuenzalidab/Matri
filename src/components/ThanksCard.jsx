import WaveRule from './WaveRule'

/**
 * The shared "thank you" stationery card. RSVP and Gifts used to each draw
 * their own — a wax-seal circle with a heart on one, a plain italic heart
 * glyph with no seal on the other — so confirming attendance and confirming
 * a gift felt like two different sites. Both now render through this.
 */
export default function ThanksCard({ title, children }) {
  return (
    <div className="thanks-card">
      <h2 className="thanks-title">{title}</h2>
      <WaveRule />
      {children}
    </div>
  )
}
