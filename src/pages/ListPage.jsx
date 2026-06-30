import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard.jsx'
import { Modal } from '../components/Modal.jsx'
import { PropertyForm } from '../components/PropertyForm.jsx'
import { DeleteConfirm } from '../components/DeleteConfirm.jsx'
import { Toast } from '../components/Toast.jsx'
import { T } from '../theme.js'

const FILTERS = ['All', '⭐', 'Strong fit', 'Worth a look', 'Probably pass', '🗑️ Deleted']

export function ListPage({ properties, onSave, onFav, onDelete, toast, setToast, user, setShowPicker }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(new Set(['All']))
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function toggleFilter(f) {
    setFilters(prev => {
      // "All" always resets to just All
      if (f === 'All') return new Set(['All'])

      // "Deleted" is mutually exclusive — selecting it clears everything else
      if (f === '🗑️ Deleted') {
        return prev.has('🗑️ Deleted') ? new Set(['All']) : new Set(['🗑️ Deleted'])
      }

      const next = new Set(prev)
      next.delete('All')
      next.delete('🗑️ Deleted') // switching to a normal filter exits the Deleted view

      if (next.has(f)) {
        next.delete(f)
        if (next.size === 0) return new Set(['All'])
      } else {
        next.add(f)
      }
      return next
    })
  }

  const wantDeleted = filters.has('🗑️ Deleted')
  const filtered = properties.filter(p => {
    // If "Deleted" filter is active, ONLY show deleted properties — ignore other filters
    if (wantDeleted) return !!p.deleted
    // Otherwise, never show deleted properties
    if (p.deleted) return false
    if (filters.has('All')) return true
    const verdictFilters = ['Strong fit', 'Worth a look', 'Probably pass']
    const activeVerdicts = verdictFilters.filter(v => filters.has(v))
    const wantFav = filters.has('⭐')
    const passesVerdict = activeVerdicts.length === 0 || activeVerdicts.includes(p.verdict)
    const passesFav = !wantFav || !!p.favourite
    return passesVerdict && passesFav
  }).filter(p => !search || p.address.toLowerCase().includes(search.toLowerCase()))

  const live = properties.filter(p => !p.deleted)
  const stats = {
    total: live.length,
    strong: live.filter(p => p.verdict === 'Strong fit').length,
    fav: live.filter(p => p.favourite).length,
  }

  return (
    <div style={{ minHeight: '100vh', background: T.offWhite, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: T.navy, padding: '14px 20px', paddingTop: 'max(14px, calc(env(safe-area-inset-top) + 14px))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: -0.5, lineHeight: 1.1 }}>Home Hunt</div>
            <button onClick={() => setShowPicker(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: T.slateLight, fontSize: 12, fontWeight: 500, marginTop: 3 }}>
              👤 {user || 'Set name'} · Seattle / Snohomish
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
<button onClick={() => navigate('/compare')} style={{ background: T.navyMid, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>⚖️ Compare</button>
            <button onClick={() => { setEditing(null); setFormOpen(true) }} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Property</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[[stats.total, 'tracked'], [stats.strong, 'strong fits'], [stats.fav, 'favourited']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#fff', lineHeight: 1, letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: 11, color: T.slateLight, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address..."
            style={{ width: '100%', background: T.navyLight, border: 'none', borderRadius: 10, padding: '10px 12px 10px 36px', fontSize: 14, color: '#fff', outline: 'none' }} />
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px', background: T.card, borderBottom: `1px solid ${T.border}`, scrollbarWidth: 'none', flexShrink: 0 }}>
        {FILTERS.map(f => {
          const active = filters.has(f)
          return (
            <button key={f} onClick={() => toggleFilter(f)} style={{
              flexShrink: 0,
              background: active ? T.navy : 'transparent',
              color: active ? '#fff' : T.textSoft,
              border: `1.5px solid ${active ? T.navy : T.border}`,
              borderRadius: 99, padding: '5px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>{f}</button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 100px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: T.textSoft }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏡</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 6 }}>
              {filters.has('All') ? 'No properties yet' : 'No matching properties'}
            </div>
            <div style={{ fontSize: 13 }}>{filter === 'All' ? 'Tap "+ Add" or "📋 Save" to start' : 'Try a different filter'}</div>
          </div>
        ) : filtered.map(p => (
          <PropertyCard key={p.id} property={p}
            onEdit={p => { setEditing(p); setFormOpen(true) }}
            onDelete={setDeleteTarget}
            onFav={onFav}
          />
        ))}
      </div>

<Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}>
        <PropertyForm initial={editing} existingProperties={properties} onSave={p => { onSave(p); setFormOpen(false); setEditing(null); setToast('✅ Saved') }} onCancel={() => { setFormOpen(false); setEditing(null) }} />
      </Modal>
      <DeleteConfirm property={deleteTarget} onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
