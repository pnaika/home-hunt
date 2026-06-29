import { useEffect } from 'react'

export function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: '#fff', borderRadius: 12,
      padding: '12px 22px', fontSize: 14, fontWeight: 700,
      zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}
