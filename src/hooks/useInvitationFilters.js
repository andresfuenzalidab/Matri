import { useState, useMemo } from 'react'

/** Accent/case-insensitive match for the free-text filter below — "jose"
 *  should still find "José", same spirit as `spreadsheet.js`'s `cell()`. */
function normalizeSearch(s) {
  return String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * The filter/sort state shared by the Invitaciones and RSVP admin tabs —
 * one implementation so "the same filters" (as requested) can't drift apart
 * between the two places that use them. Free-text search covers name,
 * nickname, companion, email, phone and internal note all at once, so it
 * doesn't need a dedicated dropdown for every field someone might want to
 * slice by; type/RSVP/enviado get their own since those are small fixed
 * sets people actually filter to a single value. Sort is applied last, so
 * it composes with any filter combination.
 *
 * Takes the full invitation list and returns both the filter controls
 * (for `<InvitationFilterBar>`) and `visible`, the filtered+sorted result —
 * callers derive their own stats/table rows from `visible`.
 */
export function useInvitationFilters(invitations) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterRsvp, setFilterRsvp] = useState('all')
  const [filterSent, setFilterSent] = useState('all')
  const [sortBy, setSortBy] = useState('default')

  const visible = useMemo(() => {
    const q = normalizeSearch(search)
    let list = !q ? invitations : invitations.filter(inv => {
      const haystack = [inv.name, inv.nickname, inv.companion_name, inv.email, inv.phone, inv.notes]
        .filter(Boolean).map(normalizeSearch).join(' | ')
      return haystack.includes(q)
    })
    if (filterType !== 'all') {
      list = list.filter(inv => (inv.invitation_type === 'party_only' ? 'party_only' : 'all_in') === filterType)
    }
    if (filterRsvp !== 'all') {
      list = list.filter(inv => {
        const answered = inv.attending !== null && inv.attending !== undefined
        if (filterRsvp === 'pending') return !answered
        if (filterRsvp === 'yes') return answered && inv.attending
        return answered && !inv.attending // 'no'
      })
    }
    if (filterSent !== 'all') {
      list = list.filter(inv => Boolean(inv.invitation_sent) === (filterSent === 'yes'))
    }
    if (sortBy !== 'default') {
      list = [...list].sort((a, b) => {
        switch (sortBy) {
          case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'es')
          case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'es')
          case 'created_asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0)
          case 'created_desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          default: return 0
        }
      })
    }
    return list
  }, [invitations, search, filterType, filterRsvp, filterSent, sortBy])

  const filtersActive = Boolean(search.trim()) || filterType !== 'all' || filterRsvp !== 'all' || filterSent !== 'all' || sortBy !== 'default'

  function clearFilters() {
    setSearch(''); setFilterType('all'); setFilterRsvp('all'); setFilterSent('all'); setSortBy('default')
  }

  return {
    search, setSearch, filterType, setFilterType, filterRsvp, setFilterRsvp,
    filterSent, setFilterSent, sortBy, setSortBy, filtersActive, clearFilters, visible,
  }
}
