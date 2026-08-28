/**
 * The search/tipo/RSVP/enviado/orden controls shared by the Invitaciones
 * and RSVP admin tabs — pass the object `useInvitationFilters` returns
 * straight through as props (`<InvitationFilterBar {...filters} />`).
 */
export default function InvitationFilterBar({
  search, setSearch, filterType, setFilterType, filterRsvp, setFilterRsvp,
  filterSent, setFilterSent, sortBy, setSortBy, filtersActive, clearFilters,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
      <input
        className="input"
        style={{ flex: '1 1 220px', minWidth: 180 }}
        placeholder="Buscar por nombre, apodo, email, teléfono, nota..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select className="input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
        <option value="all">Todos los tipos</option>
        <option value="all_in">Completa</option>
        <option value="party_only">Solo fiesta</option>
      </select>
      <select className="input" style={{ width: 'auto' }} value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}>
        <option value="all">Todos (RSVP)</option>
        <option value="pending">Sin respuesta</option>
        <option value="yes">Asiste</option>
        <option value="no">No asiste</option>
      </select>
      <select className="input" style={{ width: 'auto' }} value={filterSent} onChange={e => setFilterSent(e.target.value)}>
        <option value="all">Todos (enviado)</option>
        <option value="yes">Enviada</option>
        <option value="no">Pendiente de enviar</option>
      </select>
      <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="default">Orden original</option>
        <option value="name_asc">Nombre (A-Z)</option>
        <option value="name_desc">Nombre (Z-A)</option>
        <option value="created_desc">Más recientes primero</option>
        <option value="created_asc">Más antiguas primero</option>
      </select>
      {filtersActive && (
        <button className="btn btn-ghost" onClick={clearFilters}>Limpiar filtros</button>
      )}
    </div>
  )
}
