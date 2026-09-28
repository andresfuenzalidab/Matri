import { useState, useId } from 'react'
import { normalizeTags, tagKey, MAX_TAGS } from '../../utils/tags.js'
import '../../styles/tags.css'

/**
 * Chips + a text box to edit an invitation's tags. Enter / comma / blur adds
 * what's typed; Backspace on an empty box removes the last chip. `suggestions`
 * (every tag already in use) feed a native datalist so the same tag keeps the
 * same spelling.
 */
export function TagInput({ value = [], onChange, suggestions = [], placeholder = 'Agregar tag…' }) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const tags = normalizeTags(value)

  function commit(raw) {
    const added = normalizeTags(raw)
    setDraft('')
    if (!added.length) return
    // Reuse the existing spelling of a tag that's already in use.
    const known = new Map(suggestions.map(s => [tagKey(s), s]))
    onChange(normalizeTags([...tags, ...added.map(t => known.get(tagKey(t)) || t)]))
  }

  return (
    <div className="tag-input" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {tags.map(t => (
        <span key={t} className="tag-chip is-on">
          {t}
          <button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(tags.filter(x => x !== t))}>×</button>
        </span>
      ))}
      <input
        list={listId}
        value={draft}
        placeholder={tags.length ? '' : placeholder}
        disabled={tags.length >= MAX_TAGS}
        onChange={e => {
          const v = e.target.value
          if (/[,;]$/.test(v)) commit(v); else setDraft(v)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(draft) }
          else if (e.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1))
        }}
        onBlur={() => commit(draft)}
      />
      <datalist id={listId}>
        {suggestions.filter(s => !tags.some(t => tagKey(t) === tagKey(s))).map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  )
}

/**
 * Toggle chips to filter by tag. With more than one selected, a switch picks
 * whether a guest needs ALL of them or ANY of them.
 */
export function TagFilter({ tags, selected, onChange, mode, onMode, className = '' }) {
  if (!tags.length) return null
  const isOn = t => selected.some(s => tagKey(s) === tagKey(t))
  function toggle(t) {
    onChange(isOn(t) ? selected.filter(s => tagKey(s) !== tagKey(t)) : [...selected, t])
  }
  return (
    <div className={`tag-filter ${className}`}>
      <span className="tag-filter-label">Tags</span>
      {tags.map(t => (
        <button key={t} type="button" className={`tag-chip ${isOn(t) ? 'is-on' : ''}`} aria-pressed={isOn(t)} onClick={() => toggle(t)}>{t}</button>
      ))}
      {selected.length > 1 && (
        <span className="tag-mode" role="group" aria-label="Combinar tags">
          <button type="button" className={mode === 'all' ? 'active' : ''} onClick={() => onMode('all')} title="Debe tener todos los tags elegidos">Todos</button>
          <button type="button" className={mode === 'any' ? 'active' : ''} onClick={() => onMode('any')} title="Basta con uno de los tags elegidos">Cualquiera</button>
        </span>
      )}
      {selected.length > 0 && (
        <button type="button" className="tag-clear" onClick={() => onChange([])}>Quitar</button>
      )}
    </div>
  )
}

/** Read-only chips (list rows). */
export function TagList({ tags, className = '' }) {
  const list = normalizeTags(tags)
  if (!list.length) return null
  return (
    <div className={`tag-list ${className}`}>
      {list.map(t => <span key={t} className="tag-chip is-static">{t}</span>)}
    </div>
  )
}

/**
 * Add / remove one tag on every selected invitation at once — the fast way
 * to tag "everyone from the school" after ticking their rows.
 */
export function BulkTagger({ suggestions, count, onApply, busy }) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const tag = normalizeTags(draft)[0]
  const run = mode => { if (tag) { onApply(tag, mode); setDraft('') } }
  return (
    <span className="bulk-tagger">
      <input
        className="input"
        list={listId}
        value={draft}
        placeholder={`Tag para ${count} seleccionada${count === 1 ? '' : 's'}…`}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run('add') } }}
      />
      <datalist id={listId}>{suggestions.map(s => <option key={s} value={s} />)}</datalist>
      <button type="button" className="btn btn-secondary" disabled={!tag || busy} onClick={() => run('add')}>+ Agregar</button>
      <button type="button" className="btn btn-ghost" disabled={!tag || busy} onClick={() => run('remove')}>Quitar</button>
    </span>
  )
}
