import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard.jsx'
import { Modal } from '../components/Modal.jsx'
import { PropertyForm } from '../components/PropertyForm.jsx'
import { DeleteConfirm } from '../components/DeleteConfirm.jsx'
import { Toast } from '../components/Toast.jsx'
import { T } from '../theme.js'
import { getStaleProperties } from '../staleness.js'
import { BulkUpdatePanel } from '../components/BulkUpdatePanel.jsx'
import { ActionsMenu } from '../components/ActionsMenu.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { DropdownPortal } from '../components/DropdownPortal.jsx'
import { parseLocation, getUniqueCities } from '../parseAddress.js'
import { usePersistedSet } from '../usePersistedSet.js'

const FILTERS = ['All', '⭐', 'Strong fit', 'Worth a look', 'Probably pass', '🗑️ Deleted']

export function ListPage({ properties, onSave, onSaveAll, onFav, onDelete, toast, setToast, user, setShowPicker }) {
  const navigate = useNavigate()
  const [filters, setFilters] = usePersistedSet('home_hunt_filters', ['All'])
  const [selectedCities, setSelectedCities] = usePersistedSet('home_hunt_selected_cities', [])
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [filtersPickerOpen, setFiltersPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const cityPickerRef = useRef(null)
  const filtersPickerRef = useRef(null)

  const availableCities = getUniqueCities(properties)

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

  function toggleCity(key) {
    setSelectedCities(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const wantDeleted = filters.has('🗑️ Deleted')
  const filtered = properties.filter(p => {
    // If "Deleted" filter is active, ONLY show deleted properties — ignore other filters
    if (wantDeleted) return !!p.deleted
    // Otherwise, never show deleted properties
    if (p.deleted) return false
    if (selectedCities.size > 0) {
      const { city, state } = parseLocation(p.address)
      const key = `${city}|${state || ''}`
      if (!selectedCities.has(key)) return false
    }
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
<ActionsMenu items={[
              { icon: '➕', label: 'Add Property', onClick: () => { setEditing(null); setFormOpen(true) } },
              { icon: '⚖️', label: 'Compare', onClick: () => navigate('/compare') },
              { icon: '🔁', label: 'Bulk Update', onClick: () => setBulkOpen(true) },
              { icon: '📦', label: 'Export All', onClick: () => setExportOpen(true) },
              { icon: '🚀', label: 'Getting Started', onClick: () => navigate('/getting-started') },
            ]} />
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

      {/* Filter bar — City stays visible, everything else collapses into Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px', background: T.card, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>

        {/* City/location filter — kept prominent, this is the most-used filter */}
        <div ref={cityPickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); availableCities.length > 0 && setCityPickerOpen(o => !o) }}
            disabled={availableCities.length === 0}
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
              background: selectedCities.size > 0 ? T.navy : T.offWhite,
              color: availableCities.length === 0 ? T.border : selectedCities.size > 0 ? '#fff' : T.textMid,
              border: `1.5px solid ${selectedCities.size > 0 ? T.navy : T.border}`,
              borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 700,
              cursor: availableCities.length > 0 ? 'pointer' : 'default',
            }}>
            📍 {selectedCities.size > 0 ? `${selectedCities.size} ${selectedCities.size === 1 ? 'city' : 'cities'}` : 'City'}
            <span style={{ fontSize: 9, transform: cityPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
          </button>

          <DropdownPortal anchorRef={cityPickerRef} open={cityPickerOpen && availableCities.length > 0} onClose={() => setCityPickerOpen(false)}>
            <div style={{
              background: '#fff', borderRadius: 12, minWidth: 220, maxHeight: 320, overflowY: 'auto',
              boxShadow: '0 8px 28px rgba(10,22,40,0.22)', border: `1px solid ${T.border}`,
            }}>
              <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Filter by city
              </div>
              {availableCities.map(({ city, state, label }) => {
                const key = `${city}|${state || ''}`
                const checked = selectedCities.has(key)
                const count = properties.filter(p => {
                  if (p.deleted) return false
                  const loc = parseLocation(p.address)
                  return loc.city === city && (loc.state || '') === (state || '')
                }).length
                return (
                  <button
                    key={key}
                    onClick={e => { e.stopPropagation(); toggleCity(key) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: 'none', border: 'none',
                      fontSize: 13, fontWeight: 600, color: T.text, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.offWhite}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: checked ? T.blue : '#fff',
                      border: `1.5px solid ${checked ? T.blue : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11,
                    }}>{checked && '✓'}</div>
                    <span style={{ flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 11, color: T.textSoft }}>{count}</span>
                  </button>
                )
              })}
              {selectedCities.size > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); setSelectedCities(new Set()) }}
                  style={{
                    width: '100%', padding: '9px 14px', background: T.offWhite, border: 'none',
                    borderTop: `1px solid ${T.borderLight}`, fontSize: 12, fontWeight: 700,
                    color: T.blue, cursor: 'pointer', textAlign: 'center',
                  }}
                >Clear cities</button>
              )}
            </div>
          </DropdownPortal>
        </div>

        {/* Everything else (verdict, favourites, deleted) collapses here */}
        <div ref={filtersPickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          {(() => {
            const activeCount = filters.has('All') ? 0 : filters.size
            return (
              <button
                onClick={e => { e.stopPropagation(); setFiltersPickerOpen(o => !o) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: activeCount > 0 ? T.navy : T.offWhite,
                  color: activeCount > 0 ? '#fff' : T.textMid,
                  border: `1.5px solid ${activeCount > 0 ? T.navy : T.border}`,
                  borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                ⚙️ Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                <span style={{ fontSize: 9, transform: filtersPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              </button>
            )
          })()}

          <DropdownPortal anchorRef={filtersPickerRef} open={filtersPickerOpen} onClose={() => setFiltersPickerOpen(false)}>
            <div style={{
              background: '#fff', borderRadius: 12, minWidth: 200,
              boxShadow: '0 8px 28px rgba(10,22,40,0.22)', border: `1px solid ${T.border}`, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Status & verdict
              </div>
              {FILTERS.map(f => {
                const active = filters.has(f)
                return (
                  <button
                    key={f}
                    onClick={e => { e.stopPropagation(); toggleFilter(f) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: 'none', border: 'none',
                      fontSize: 13, fontWeight: 600, color: T.text, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.offWhite}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: f === 'All' ? 99 : 5, flexShrink: 0,
                      background: active ? T.blue : '#fff',
                      border: `1.5px solid ${active ? T.blue : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11,
                    }}>{active && '✓'}</div>
                    <span style={{ flex: 1 }}>{f}</span>
                  </button>
                )
              })}
            </div>
          </DropdownPortal>
        </div>

        {/* Quick-glance active filter summary */}
        {!filters.has('All') && (
          <div style={{ fontSize: 12, color: T.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {Array.from(filters).join(' · ')}
          </div>
        )}
      </div>

      {/* Stale / recheck banner */}
      {(() => {
        const stale = getStaleProperties(properties)
        if (stale.length === 0) return null
        return (
          <div style={{ background: T.amberSoft, borderBottom: `1px solid ${T.amberBorder}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            <div style={{ flex: 1, fontSize: 13, color: '#854D0E', fontWeight: 600 }}>
              {stale.length} {stale.length === 1 ? 'property' : 'properties'} haven't been rechecked in 2+ weeks — ask Claude to "recheck prices" to catch any drops.
            </div>
          </div>
        )
      })()}

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 100px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: T.textSoft }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏡</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 6 }}>
              {filters.has('All') ? 'No properties yet' : 'No matching properties'}
            </div>
            <div style={{ fontSize: 13, marginBottom: filters.has('All') ? 18 : 0 }}>
              {filters.has('All') ? 'New here? See how this works first.' : 'Try a different filter'}
            </div>
            {filters.has('All') && (
              <button onClick={() => navigate('/getting-started')} style={{
                background: T.blue, color: '#fff', border: 'none', borderRadius: 99,
                padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>🚀 Getting Started</button>
            )}
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

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)}>
        <BulkUpdatePanel
          existingProperties={properties}
          onSavedAll={async (merged) => { await onSaveAll(merged); setBulkOpen(false) }}
          onCancel={() => setBulkOpen(false)}
        />
      </Modal>
      <Modal open={exportOpen} onClose={() => setExportOpen(false)}>
        <ExportPanel properties={properties} onClose={() => setExportOpen(false)} />
      </Modal>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
