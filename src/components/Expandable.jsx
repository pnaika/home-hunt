import { useState } from 'react'
import { T } from '../theme.js'

export function Expandable({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      background: T.card, borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${T.border}`, marginBottom: 10,
      boxShadow: '0 1px 3px rgba(10,22,40,0.06)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{
          fontSize: 12, color: T.textSoft, fontWeight: 600, flexShrink: 0, marginLeft: 12,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease',
        }}>▼</span>
      </button>
      <div style={{
        overflow: 'hidden', maxHeight: open ? '9999px' : '0px',
        transition: open ? 'max-height 0.35s ease' : 'max-height 0.2s ease',
      }}>
        <div style={{ padding: '0 16px 16px' }}>{children}</div>
      </div>
    </div>
  )
}
