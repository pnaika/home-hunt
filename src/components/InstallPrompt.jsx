import { useState, useEffect } from 'react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('pwa_install_dismissed')
    if (isStandalone || wasDismissed) return

    // iOS detection — Safari doesn't support beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    if (ios) {
      setIsIOS(true)
      setShow(true)
      return
    }

    // Android / Chrome — capture the install prompt
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa_install_dismissed', '1')
    setShow(false)
  }

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    else dismiss()
  }

  if (!show || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 200,
      background: '#1e293b', borderRadius: 16, padding: '16px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 32 }}>🏡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 3 }}>
          Add to Home Screen
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
          {isIOS
            ? "Tap the Share button below, then 'Add to Home Screen'"
            : 'Install for quick access — works offline too'}
        </div>
      </div>
      {!isIOS && (
        <button onClick={install} style={{
          background: '#3b5bdb', color: '#fff', border: 'none',
          borderRadius: 9, padding: '8px 14px', fontWeight: 700,
          fontSize: 13, cursor: 'pointer', flexShrink: 0,
        }}>Install</button>
      )}
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: '#64748b',
        fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0,
      }}>✕</button>
    </div>
  )
}
