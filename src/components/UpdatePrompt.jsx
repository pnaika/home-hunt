import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll every 60s for updates when the app is open
      if (r) {
        setInterval(() => r.update(), 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 200,
      background: '#1e293b', borderRadius: 14, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>
          🔄 Update available
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          New version ready — tap to reload
        </div>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#3b5bdb', color: '#fff', border: 'none',
          borderRadius: 9, padding: '8px 16px',
          fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
        }}
      >
        Reload
      </button>
    </div>
  )
}
