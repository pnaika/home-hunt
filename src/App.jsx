import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import {
  fetchProperties, upsertProperty,
  softDeleteProperty, restoreProperty, hardDeleteProperty,
  subscribeToProperties,
} from './supabase.js'
import { SEED_PROPERTIES } from './constants.js'
import { ListPage } from './pages/ListPage.jsx'
import { DetailPage } from './pages/DetailPage.jsx'
import { ComparePage } from './pages/ComparePage.jsx'
import { SharePage } from './pages/SharePage.jsx'
import { GettingStartedPage } from './pages/GettingStartedPage.jsx'
import { UserPicker } from './components/UserPicker.jsx'
import { UpdatePrompt } from './components/UpdatePrompt.jsx'
import { InstallPrompt } from './components/InstallPrompt.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { useUser } from './useUser.js'
import { useHousehold } from './useHousehold.js'
import { getStoredHouseholdCode, generateHouseholdCode } from './household.js'

// Bare "/" — no code yet known, redirect to a household. If one's stored
// locally, useHousehold inside <HouseholdApp> will pick it up; if not, it
// mints a fresh one. We route through /h/_ as a placeholder param so
// useHousehold's useParams() always has something to read.
function RootRedirect() {
  const stored = getStoredHouseholdCode()
  return <Navigate to={`/h/${stored || generateHouseholdCode()}`} replace />
}

// Everything that depends on a resolved household code lives here —
// the actual property data, list/detail/compare pages, and the
// realtime subscription, all scoped to householdId.
function HouseholdApp() {
  const { householdId, ready, invalidCode, switchHousehold } = useHousehold()
  const { user, showPicker, saveName, setShowPicker } = useUser()
  const [properties, setProperties] = useState([])
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const localChangeIds = new Set()  // track IDs we just changed locally

  useEffect(() => {
    if (!ready || !householdId) return
    loadProperties()
    const unsub = subscribeToProperties(householdId, payload => {
      const changedId = payload?.new?.id || payload?.old?.id
      if (changedId && localChangeIds.has(changedId)) {
        localChangeIds.delete(changedId)
        return
      }
      loadProperties()
    })
    return unsub
  }, [ready, householdId])

  async function loadProperties() {
    setLoading(true)
    try {
      const data = await fetchProperties(householdId, { includeDeleted: true })
      if (data.length === 0) {
        // First time this household has been opened — seed with sample
        // properties so the app isn't a blank page on first visit.
        const seeded = SEED_PROPERTIES.map(p => ({ ...p, id: `${p.id}_${householdId}` }))
        for (const p of seeded) await upsertProperty(householdId, p)
        setProperties(seeded)
      } else {
        setProperties(data)
      }
    } catch { setProperties(SEED_PROPERTIES) }
    setLoading(false)
  }

  async function handleSave(property) {
    localChangeIds.add(property.id)
    await upsertProperty(householdId, property)
    setProperties(prev =>
      prev.find(x => x.id === property.id)
        ? prev.map(x => x.id === property.id ? property : x)
        : [property, ...prev]
    )
  }

  async function handleSaveAll(propertiesArray) {
    for (const property of propertiesArray) {
      localChangeIds.add(property.id)
      await upsertProperty(householdId, property)
    }
    setProperties(prev => {
      let next = [...prev]
      for (const property of propertiesArray) {
        next = next.find(x => x.id === property.id)
          ? next.map(x => x.id === property.id ? property : x)
          : [property, ...next]
      }
      return next
    })
    setToast(`✅ Saved ${propertiesArray.length} ${propertiesArray.length === 1 ? 'property' : 'properties'}`)
  }

  async function handleFav(property) {
    const updated = { ...property, favourite: !property.favourite }
    localChangeIds.add(updated.id)
    await upsertProperty(householdId, updated)
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p))
    setToast(updated.favourite ? '⭐ Added to favourites' : '☆ Removed')
  }

  async function handleDelete(property) {
    localChangeIds.add(property.id)
    await softDeleteProperty(householdId, property.id)
    setProperties(prev => prev.map(p =>
      p.id === property.id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p
    ))
    setToast('🗑️ Moved to Recently Deleted')
  }

  async function handleRestore(property) {
    localChangeIds.add(property.id)
    await restoreProperty(householdId, property.id)
    setProperties(prev => prev.map(p =>
      p.id === property.id ? { ...p, deleted: false, deletedAt: null } : p
    ))
    setToast('✅ Property restored')
  }

  async function handleHardDelete(property) {
    localChangeIds.add(property.id)
    await hardDeleteProperty(householdId, property.id)
    setProperties(prev => prev.filter(p => p.id !== property.id))
    setToast('🗑️ Permanently deleted')
  }

  if (ready && invalidCode) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 44 }}>🔗</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: '#0F172A' }}>That link doesn't look right</div>
      <div style={{ fontSize: 13, color: '#64748B', maxWidth: 280, lineHeight: 1.6 }}>
        Household codes are lowercase letters, numbers, and hyphens only. Double-check the link you were given.
      </div>
      <a href="/" style={{ background: '#2563EB', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, marginTop: 8 }}>Start fresh</a>
    </div>
  )

  if (!ready || loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🏡</div>
      <div style={{ color: '#94A3B8', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Loading your homes...</div>
    </div>
  )

  const shared = {
    properties, onSave: handleSave, onSaveAll: handleSaveAll, onFav: handleFav,
    onDelete: handleDelete, onRestore: handleRestore, onHardDelete: handleHardDelete,
    user, setShowPicker, householdId, switchHousehold,
  }
  const location = useLocation()

  return (
    <>
      {showPicker && <UserPicker onSave={saveName} />}
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<ListPage {...shared} toast={toast} setToast={setToast} />} />
          <Route path="property/:id" element={<DetailPage {...shared} />} />
          <Route path="compare" element={<ComparePage {...shared} />} />
        </Routes>
      </ErrorBoundary>
      <UpdatePrompt />
      <InstallPrompt />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/h/:code/*" element={<HouseholdApp />} />
      {/* Outside household scoping — these don't depend on a resolved code */}
      <Route path="/share/:id" element={<SharePage />} />
      <Route path="/getting-started" element={<GettingStartedPage />} />
    </Routes>
  )
}
