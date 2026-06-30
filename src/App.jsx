import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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

export default function App() {
  const { user, showPicker, saveName, setShowPicker } = useUser()
  const [properties, setProperties] = useState([])
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const localChangeIds = new Set()  // track IDs we just changed locally

  useEffect(() => {
    loadProperties()
    const unsub = subscribeToProperties(payload => {
      const changedId = payload?.new?.id || payload?.old?.id
      // Skip reload if we triggered this change ourselves
      if (changedId && localChangeIds.has(changedId)) {
        localChangeIds.delete(changedId)
        return
      }
      loadProperties()
    })
    return unsub
  }, [])

  async function loadProperties() {
    setLoading(true)
    const VER = 'v9'
    try {
      let ok = false
      try { const v = await window.storage?.get('home_hunt_version'); ok = v?.value === VER } catch {}
      const data = await fetchProperties({ includeDeleted: true })
      if (data.length === 0) {
        for (const p of SEED_PROPERTIES) await upsertProperty(p)
        try { await window.storage?.set('home_hunt_version', VER) } catch {}
        setProperties(SEED_PROPERTIES)
      } else {
        setProperties(data)
      }
    } catch { setProperties(SEED_PROPERTIES) }
    setLoading(false)
  }

  async function handleSave(property) {
    localChangeIds.add(property.id)
    await upsertProperty(property)
    setProperties(prev =>
      prev.find(x => x.id === property.id)
        ? prev.map(x => x.id === property.id ? property : x)
        : [property, ...prev]
    )
  }

  async function handleSaveAll(propertiesArray) {
    for (const property of propertiesArray) {
      localChangeIds.add(property.id)
      await upsertProperty(property)
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
    await upsertProperty(updated)
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p))
    setToast(updated.favourite ? '⭐ Added to favourites' : '☆ Removed')
  }

  async function handleDelete(property) {
    localChangeIds.add(property.id)
    await softDeleteProperty(property.id)
    setProperties(prev => prev.map(p =>
      p.id === property.id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p
    ))
    setToast('🗑️ Moved to Recently Deleted')
  }

  async function handleRestore(property) {
    localChangeIds.add(property.id)
    await restoreProperty(property.id)
    setProperties(prev => prev.map(p =>
      p.id === property.id ? { ...p, deleted: false, deletedAt: null } : p
    ))
    setToast('✅ Property restored')
  }

  async function handleHardDelete(property) {
    localChangeIds.add(property.id)
    await hardDeleteProperty(property.id)
    setProperties(prev => prev.filter(p => p.id !== property.id))
    setToast('🗑️ Permanently deleted')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🏡</div>
      <div style={{ color: '#94A3B8', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Loading your homes...</div>
    </div>
  )

  const shared = { properties, onSave: handleSave, onSaveAll: handleSaveAll, onFav: handleFav, onDelete: handleDelete, onRestore: handleRestore, onHardDelete: handleHardDelete, user, setShowPicker }
  const location = useLocation()

  return (
    <>
      {showPicker && <UserPicker onSave={saveName} />}
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<ListPage {...shared} toast={toast} setToast={setToast} />} />
          <Route path="/property/:id" element={<DetailPage {...shared} />} />
          <Route path="/compare" element={<ComparePage {...shared} />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route path="/getting-started" element={<GettingStartedPage />} />
        </Routes>
      </ErrorBoundary>
      <UpdatePrompt />
      <InstallPrompt />
    </>
  )
}
