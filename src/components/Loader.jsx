/**
 * Full-screen spinner on the page's own cream, used both before the envelope
 * cover appears and before the page behind it does.
 */
export default function Loader() {
  return (
    <div className="app-loader" role="status" aria-label="Cargando">
      <span className="app-loader-spinner" />
    </div>
  )
}
