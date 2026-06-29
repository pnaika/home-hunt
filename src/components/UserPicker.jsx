import { useState } from 'react'

const AVATARS = ['🏠', '🔑', '🏡', '🌟', '🐕', '☕']

export function UserPicker({ onSave }) {
  const [name, setName] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#1e293b',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏡</div>
      <div style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
        Home Hunt Tracker
      </div>
      <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
        Who's searching today?
      </div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSave(name)}
        placeholder="Enter your name..."
        autoFocus
        style={{
          width: '100%', maxWidth: 300, boxSizing: 'border-box',
          background: '#334155', border: '2px solid #475569',
          borderRadius: 12, padding: '14px 18px',
          fontSize: 17, color: '#fff', outline: 'none',
          textAlign: 'center', marginBottom: 16,
        }}
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['Prashanth', 'Partner'].map(n => (
          <button key={n} onClick={() => onSave(n)} style={{
            background: '#334155', color: '#94a3b8',
            border: '1.5px solid #475569', borderRadius: 99,
            padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{n}</button>
        ))}
      </div>
      <button
        onClick={() => onSave(name)}
        disabled={!name.trim()}
        style={{
          width: '100%', maxWidth: 300,
          background: name.trim() ? '#3b5bdb' : '#334155',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: name.trim() ? 'pointer' : 'default',
        }}
      >Start Searching →</button>
    </div>
  )
}
