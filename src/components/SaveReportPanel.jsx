import { useState } from 'react'
import { parseReportWithClaude } from '../parseReport.js'
import { CRITERIA_LABELS, EMPTY_FORM } from '../constants.js'

export function SaveReportPanel({ onSaved, existingProperties }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | parsing | preview | error
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleParse() {
    if (!text.trim()) return
    setStatus('parsing'); setPreview(null); setErrorMsg('')
    try {
      const extracted = await parseReportWithClaude(text)
      setPreview(extracted)
      setStatus('preview')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Could not parse the report. Paste the full deep-dive text.')
    }
  }

  function handleConfirm() {
    if (!preview) return
    const existing = existingProperties.find(p =>
      p.address?.toLowerCase().trim() === (preview.address || '').toLowerCase().trim()
    )
    const property = {
      ...EMPTY_FORM,
      ...preview,
      id: existing ? existing.id : `prop_${Date.now()}`,
      dateAdded: existing
        ? existing.dateAdded
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    onSaved(property, !!existing)
    setText(''); setPreview(null); setStatus('idle')
  }

  const ta = {
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0',
    borderRadius: 10, padding: '10px 13px', fontSize: 14, color: '#0f172a',
    background: '#f8fafc', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
  }

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 4 }}>
        📋 Save Deep-Dive to Tracker
      </div>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 14, lineHeight: 1.55 }}>
        After Claude generates a deep-dive report in this chat, paste the full text here.
        It will be parsed automatically and saved to your database.
      </div>

      {status !== 'preview' && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste the full deep-dive report here — Snapshot through Verdict..."
            style={{ ...ta, height: 200, marginBottom: 12 }}
          />
          <button
            onClick={handleParse}
            disabled={!text.trim() || status === 'parsing'}
            style={{
              width: '100%',
              background: text.trim() ? '#3b5bdb' : '#94a3b8',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 0', fontWeight: 800, fontSize: 15,
              cursor: text.trim() ? 'pointer' : 'default',
            }}
          >
            {status === 'parsing' ? '⏳ Parsing report...' : '✨ Parse & Preview'}
          </button>
          {status === 'error' && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5',
              borderRadius: 10, padding: '12px 14px', marginTop: 12,
              fontSize: 14, color: '#dc2626',
            }}>⚠️ {errorMsg}</div>
          )}
        </>
      )}

      {status === 'preview' && preview && (
        <div>
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: 12, padding: '14px 16px', marginBottom: 14,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 10 }}>
              ✅ Parsed — review before saving
            </div>
            <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
              <strong>Address:</strong> {preview.address || '—'}<br />
              <strong>Price:</strong> {preview.price ? `$${Number(preview.price).toLocaleString()}` : '—'} ·{' '}
              <strong>Beds:</strong> {preview.beds || '—'} · <strong>Baths:</strong> {preview.baths || '—'}<br />
              <strong>Year:</strong> {preview.yearBuilt || '—'} ·{' '}
              <strong>Sqft:</strong> {preview.sqft ? Number(preview.sqft).toLocaleString() : '—'}<br />
              <strong>School:</strong> {preview.school || '—'} ({preview.schoolRating || '?'}/10 GS)<br />
              <strong>HOA:</strong> {preview.hoaDues ? (isNaN(preview.hoaDues) ? preview.hoaDues : `$${preview.hoaDues}/mo`) : 'Unknown'}<br />
              <strong>Offer range:</strong>{' '}
              {preview.offerRangeLow && preview.offerRangeHigh
                ? `$${Number(preview.offerRangeLow).toLocaleString()} – $${Number(preview.offerRangeHigh).toLocaleString()}`
                : '—'}<br />
              <strong>Verdict:</strong> {preview.verdict || '—'}
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(preview.criteria || {}).map(([k, v]) => (
                <span key={k} style={{
                  background: '#fff', border: '1px solid #bbf7d0',
                  borderRadius: 99, padding: '2px 10px',
                  fontSize: 12, fontWeight: 600, color: '#166534',
                }}>
                  {v} {CRITERIA_LABELS[k] || k}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleConfirm} style={{
              flex: 1, background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>
              💾 Save to Database
            </button>
            <button onClick={() => { setStatus('idle'); setPreview(null) }} style={{
              flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>
              ← Edit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
