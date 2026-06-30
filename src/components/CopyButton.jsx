import { useState } from 'react'
import { T } from '../theme.js'

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable — fall back to a visible textarea selection trick
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
      document.body.removeChild(ta)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: copied ? T.green : T.blue, color: '#fff', border: 'none',
        borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12.5,
        cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : `📋 ${label}`}
    </button>
  )
}
