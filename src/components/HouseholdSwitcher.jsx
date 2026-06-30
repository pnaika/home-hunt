import { useState } from 'react'
import { T } from '../theme.js'
import { CopyButton } from './CopyButton.jsx'
import { isValidHouseholdCode, normalizeHouseholdCode } from '../household.js'

export function HouseholdSwitcher({ householdId, onSwitch, onClose }) {
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  const shareUrl = `${window.location.origin}/h/${householdId}`

  function handleJoin() {
    const normalized = normalizeHouseholdCode(joinCode)
    if (!isValidHouseholdCode(normalized)) {
      setError('That code doesn\'t look right — use letters, numbers, and hyphens only.')
      return
    }
    onSwitch(normalized)
  }

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>👥 Your Household</div>
      <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 18, lineHeight: 1.5 }}>
        This code is what keeps your data separate from anyone else's. Share it with someone to let them see and edit the same property list — there's no login, just this code.
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        Your current household
      </div>
      <div style={{
        background: T.navy, borderRadius: 12, padding: '16px 18px', marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 16, color: '#fff', fontWeight: 700, wordBreak: 'break-all' }}>
          {householdId}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <CopyButton text={householdId} label="Copy code" />
        <CopyButton text={shareUrl} label="Copy link" />
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        Join a different household
      </div>
      <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Got a code from someone else? Paste it here. You can always switch back using the code above.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input
          value={joinCode}
          onChange={e => { setJoinCode(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="e.g. sunny-meadow-42"
          style={{
            flex: 1, border: `1.5px solid ${T.border}`, borderRadius: 10,
            padding: '10px 13px', fontSize: 14, color: T.text,
            background: T.offWhite, outline: 'none', fontFamily: "'SF Mono', Menlo, monospace",
          }}
        />
        <button
          onClick={handleJoin}
          disabled={!joinCode.trim()}
          style={{
            background: joinCode.trim() ? T.blue : T.border,
            color: joinCode.trim() ? '#fff' : T.textSoft,
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontWeight: 700, fontSize: 14, cursor: joinCode.trim() ? 'pointer' : 'default',
          }}
        >Join</button>
      </div>
      {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 6 }}>⚠️ {error}</div>}

      <div style={{
        background: T.amberSoft, border: `1.5px solid ${T.amberBorder}`, borderRadius: 10,
        padding: '12px 14px', marginTop: 18, fontSize: 12, color: '#854D0E', lineHeight: 1.6,
      }}>
        ⚠️ Anyone with this code can view and edit everything in this household — there's no password.
        Only share it with people you trust with this data.
      </div>

      <button onClick={onClose} style={{
        width: '100%', marginTop: 16, background: T.borderLight, color: T.textMid,
        border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
      }}>Close</button>
    </div>
  )
}
