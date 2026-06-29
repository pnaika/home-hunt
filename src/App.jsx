import { useState, useEffect } from 'react'
import { fetchProperties, upsertProperty, softDeleteProperty, restoreProperty, hardDeleteProperty, subscribeToProperties } from './supabase.js'
import { SEED_PROPERTIES, VERDICT_CONFIG } from './constants.js'
import { PropertyCard } from './components/PropertyCard.jsx'
import { DetailPanel } from './components/DetailPanel.jsx'
import { PropertyForm } from './components/PropertyForm.jsx'
import { SaveReportPanel } from './components/SaveReportPanel.jsx'
import { Modal } from './components/Modal.jsx'
import { Toast } from './components/Toast.jsx'
import { DeleteConfirm } from './components/DeleteConfirm.jsx'
import { InstallPrompt } from './components/InstallPrompt.jsx'
import { UserPicker } from './components/UserPicker.jsx'
import { useUser } from './useUser.js'
import { UpdatePrompt } from './components/UpdatePrompt.jsx'

export default function App() {
  const { user, showPicker, saveName, setShowPicker, clearUser } = useUser()
  const [properties, setProperties] = useState([])
  const [selected, setSelected] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadProperties()
    // Realtime sync — update property list when any client changes data
    const unsub = subscribeToProperties(() => loadProperties())
    return unsub
  }, [])

  async function loadProperties() {
    setLoading(true)
    try {
      const data = await fetchProperties({ includeDeleted: true })
      if (data.length === 0) {
        // First run — seed with historical properties
        for (const p of SEED_PROPERTIES) await upsertProperty(p)
        setProperties(SEED_PROPERTIES)
      } else {
        setProperties(data)
      }
    } catch (e) {
      console.error(e)
      setProperties(SEED_PROPERTIES)
    }
    setLoading(false)
  }

  async function handleSave(property) {
    await upsertProperty(property)
    setProperties(prev =>
      prev.find(x => x.id === property.id)
        ? prev.map(x => x.id === property.id ? property : x)
        : [property, ...prev]
    )
    if (selected?.id === property.id) setSelected(property)
    setFormOpen(false); setEditing(null)
    setToast('✅ Property saved')
  }

  async function handleReportSaved(property, isUpdate) {
    await upsertProperty(property)
    setProperties(prev =>
      prev.find(x => x.id === property.id)
        ? prev.map(x => x.id === property.id ? property : x)
        : [property, ...prev]
    )
    setSaveOpen(false)
    setToast(isUpdate ? `✅ Updated: ${property.address.split(',')[0]}` : `✅ Saved: ${property.address.split(',')[0]}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await softDeleteProperty(deleteTarget.id)
    setProperties(prev => prev.map(p =>
      p.id === deleteTarget.id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p
    ))
    if (selected?.id === deleteTarget.id) setSelected(null)
    setDeleteTarget(null)
    setToast('🗑️ Moved to Recently Deleted')
  }

  async function handleRestore(property) {
    await restoreProperty(property.id)
    setProperties(prev => prev.map(p =>
      p.id === property.id ? { ...p, deleted: false, deletedAt: null } : p
    ))
    setSelected(null)
    setToast('✅ Property restored')
  }

  async function handleHardDelete(property) {
    await hardDeleteProperty(property.id)
    setProperties(prev => prev.filter(p => p.id !== property.id))
    setSelected(null)
    setToast('🗑️ Permanently deleted')
  }

  async function handleFav(property) {
    const updated = { ...property, favourite: !property.favourite }
    await upsertProperty(updated)
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p))
    if (selected?.id === updated.id) setSelected(updated)
    setToast(updated.favourite ? '⭐ Added to favourites' : '☆ Removed from favourites')
  }

  const isDeletedFilter = filter === '🗑️ Recently Deleted'
  const filtered = properties.filter(p => {
    if (isDeletedFilter) return !!p.deleted
    if (p.deleted) return false
    if (filter === '⭐ Favourites') return !!p.favourite
    if (filter !== 'All') return p.verdict === filter
    return true
  }).filter(p => !search || p.address.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: properties.length,
    fav: properties.filter(p => p.favourite).length,
    strong: properties.filter(p => p.verdict === 'Strong fit').length,
    look: properties.filter(p => p.verdict === 'Worth a look').length,
    pass: properties.filter(p => p.verdict === 'Probably pass').length,
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* UserPicker overlay */}
      {showPicker && <UserPicker onSave={saveName} />}

      {/* Header */}
      <div style={{ background: '#1e293b', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>🏡 Home Hunt Tracker</div>
          <div style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <button onClick={() => setShowPicker(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                👤 {user} · Seattle / Snohomish
              </button>
            ) : 'Seattle / Snohomish'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSaveOpen(true)} style={{
            background: '#059669', color: '#fff', border: 'none',
            borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>📋 Save Report</button>
          <button onClick={() => { setEditing(null); setFormOpen(true) }} style={{
            background: '#3b5bdb', color: '#fff', border: 'none',
            borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>+ Add</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 18px', display: 'flex', gap: 20 }}>
        {[['Total', stats.total, '#475569'], ['⭐', stats.fav, '#d97706'], ['✅', stats.strong, '#16a34a'], ['⚠️', stats.look, '#d97706'], ['❌', stats.pass, '#dc2626']].map(([l, v, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: c }}>{v}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ background: '#fff', padding: '12px 16px 10px', borderBottom: '1px solid #e2e8f0' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search address..."
          style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 14, background: '#f8fafc', outline: 'none', marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', '⭐ Favourites', 'Strong fit', 'Worth a look', 'Probably pass', '🗑️ Recently Deleted'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#1e293b' : '#f1f5f9',
              color: filter === f ? '#fff' : '#64748b',
              border: 'none', borderRadius: 99, padding: '5px 13px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 }}>⏳ Loading properties...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No properties yet</div>
            <div style={{ fontSize: 13 }}>Tap "📋 Save Report" after a deep-dive, or "+ Add" to enter manually</div>
          </div>
        ) : (
          filtered.map(p => (
            <PropertyCard
              key={p.id} property={p}
              onEdit={p => { setEditing(p); setFormOpen(true) }}
              onDelete={setDeleteTarget}
              onSelect={setSelected}
              onFav={handleFav}
            />
          ))
        )}
      </div>

      {/* Detail bottom sheet */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 18px 4px' }}>
              <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 99, width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: '0 18px 32px' }}>
              {selected?.deleted && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', margin: '0 0 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>🗑️ This property is in Recently Deleted</div>
                  <button onClick={() => handleRestore(selected)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Restore</button>
                  <button onClick={() => { setSelected(null); setDeleteTarget(selected) }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete Forever</button>
                </div>
              )}
              <DetailPanel
                property={selected}
                onEdit={p => { setSelected(null); setEditing(p); setFormOpen(true) }}
                onDelete={p => { setSelected(null); setDeleteTarget(p) }}
                onFav={handleFav}
                user={user}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save report modal */}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)}>
        <SaveReportPanel onSaved={handleReportSaved} existingProperties={properties} onCancel={() => setSaveOpen(false)} />
      </Modal>

      {/* Manual form modal */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}>
        <PropertyForm initial={editing} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditing(null) }} />
      </Modal>

      {/* Delete confirm */}
      <DeleteConfirm property={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* PWA update prompt */}
      <UpdatePrompt />
    </div>
  )
}
