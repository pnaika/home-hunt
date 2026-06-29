import { useEffect, useState } from 'react'

export function UpdatePrompt() {
  const [waiting, setWaiting] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onControllerChange = () => {
      // A new SW just took control — reload to get fresh assets
      window.location.reload()
    }

    const onSWReady = async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return

      // Already a waiting SW when page loaded
      if (reg.waiting) {
        setWaiting(reg.waiting)
        setShow(true)
      }

      // SW finished installing and is now waiting
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(newSW)
            setShow(true)
          }
        })
      })
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    onSWReady()

    // Poll for updates every 60s while app is open
    const poll = setInterval(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) reg.update()
    }, 60 * 1000)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      clearInterval(poll)
    }
  }, [])

  function applyUpdate() {
    if (waiting) {
      // Tell the waiting SW to skip waiting and take control
      waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  if (!show) return null

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
        onClick={applyUpdate}
        style={{
          background: '#3b5bdb', color: '#fff', border: 'none',
          borderRadius: 9, padding: '8px 16px',
          fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
        }}
      >
        Reload
      </button>
      <button
        onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: '0 2px' }}
      >✕</button>
    </div>
  )
}
