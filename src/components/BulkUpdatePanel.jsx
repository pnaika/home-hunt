import { useState } from 'react'
import { normalizeParsedJson } from '../normalizeJson.js'
import { EMPTY_FORM, VERDICT_CONFIG } from '../constants.js'
import { T } from '../theme.js'

export function BulkUpdatePanel({ existingProperties, onSavedAll, onCancel }) {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const [items, setItems] = useState(null) // array of { normalized, match, error, include }
  const [saving, setSaving] = useState(false)

  function handleParse() {
    setError(''); setItems(null)
    try {
      let raw = json.trim()
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      raw = raw.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')

      // Accept either a JSON array, or multiple {...} objects concatenated/separated by anything
      let parsedArray
      const trimmed = raw.trim()
      if (trimmed.startsWith('[')) {
        parsedArray = JSON.parse(trimmed)
      } else {
        // Extract every top-level {...} block by bracket matching
        const blocks = []
        let depth = 0, start = -1
        for (let i = 0; i < raw.length; i++) {
          if (raw[i] === '{') { if (depth === 0) start = i; depth++ }
          else if (raw[i] === '}') { depth--; if (depth === 0 && start !== -1) { blocks.push(raw.slice(start, i + 1)); start = -1 } }
        }
        if (blocks.length === 0) throw new Error('No JSON objects found — paste one or more {...} blocks, or a JSON array [...]')
        parsedArray = blocks.map(b => JSON.parse(b))
      }

      if (!Array.isArray(parsedArray)) parsedArray = [parsedArray]
      if (parsedArray.length === 0) throw new Error('No properties found in the pasted text')

      const results = parsedArray.map((raw, i) => {
        try {
          const normalized = normalizeParsedJson(raw)
          const match = existingProperties.find(p =>
            p.address?.toLowerCase().trim() === (normalized.address || '').toLowerCase().trim()
          )
          return { id: i, normalized, match, error: null, include: true }
        } catch (e) {
          return { id: i, normalized: null, match: null, error: e.message, include: false }
        }
      })

      setItems(results)
    } catch (e) {
      setError(e.message)
    }
  }

  function toggleInclude(id) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, include: !it.include } : it))
  }

  function buildMergedProperty(item) {
    const { normalized, match } = item
    const changes = Object.fromEntries(
      Object.entries(normalized).filter(([, v]) => {
        if (v === null || v === undefined) return false
        if (typeof v === 'string' && v.trim() === '') return false
        return true
      })
    )
    const mergedCriteria = changes.criteria
      ? { ...(match?.criteria || EMPTY_FORM.criteria), ...changes.criteria }
      : match?.criteria || EMPTY_FORM.criteria
    return {
      ...EMPTY_FORM,
      ...(match || {}),
      ...changes,
      criteria: mergedCriteria,
      id: match?.id || `prop_${Date.now()}_${item.id}`,
      dateAdded: match?.dateAdded || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }

  async function handleSaveAll() {
    const toSave = items.filter(it => it.include && !it.error)
    if (toSave.length === 0) return
    setSaving(true)
    const merged = toSave.map(buildMergedProperty)
    await onSavedAll(merged)
    setSaving(false)
    setJson(''); setItems(null)
  }

  const ta = {
    width: '100%', boxSizing: 'border-box', border: `1.5px solid ${T.border}`,
    borderRadius: 10, padding: '10px 13px', fontSize: 13, color: T.text,
    background: T.offWhite, outline: 'none', fontFamily: 'monospace', resize: 'vertical',
  }

  const includedCount = items?.filter(it => it.include && !it.error).length || 0

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>🔁 Bulk Update</div>
      <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 16, lineHeight: 1.5 }}>
        Paste multiple property JSON blocks at once — works with a JSON array <code>[{'{'}...{'}'},  {'{'}...{'}'}]</code> or
        several <code>{'{'}...{'}'}</code> blocks pasted one after another. Each one updates by matching on address.
      </div>

      {!items && (
        <>
          <textarea
            value={json}
            onChange={e => { setJson(e.target.value); setError('') }}
            placeholder={'{ "address": "123 Main St...", "price": "750000" }\n\n{ "address": "456 Oak Ave...", "price": "599000" }'}
            style={{ ...ta, height: 220 }}
          />
          {error && (
            <div style={{ background: T.redSoft, border: `1.5px solid ${T.redBorder}`, borderRadius: 10, padding: '10px 14px', marginTop: 10, fontSize: 13, color: T.red }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleParse} disabled={!json.trim()} style={{
              flex: 1, background: json.trim() ? T.blue : T.border,
              color: json.trim() ? '#fff' : T.textSoft, border: 'none', borderRadius: 10,
              padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: json.trim() ? 'pointer' : 'default',
            }}>Parse All</button>
            <button onClick={onCancel} style={{
              flex: 1, background: T.borderLight, color: T.textMid, border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </>
      )}

      {items && (
        <>
          <div style={{ fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 12 }}>
            Found {items.length} {items.length === 1 ? 'property' : 'properties'} — {includedCount} will be saved
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
            {items.map(item => {
              if (item.error) {
                return (
                  <div key={item.id} style={{ background: T.redSoft, border: `1.5px solid ${T.redBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 4 }}>⚠️ Item {item.id + 1} — parse error</div>
                    <div style={{ fontSize: 12, color: T.red }}>{item.error}</div>
                  </div>
                )
              }
              const p = item.normalized
              const isUpdate = !!item.match
              const priceChanged = isUpdate && item.match.price && p.price && Number(item.match.price) !== Number(p.price)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleInclude(item.id)}
                  style={{
                    background: item.include ? T.card : T.borderLight,
                    border: `1.5px solid ${item.include ? T.border : T.border}`,
                    borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
                    opacity: item.include ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      background: item.include ? T.blue : '#fff',
                      border: `1.5px solid ${item.include ? T.blue : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12,
                    }}>{item.include && '✓'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>
                        {p.address || '(no address)'}
                      </div>
                      <div style={{ fontSize: 12, color: T.textSoft, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: isUpdate ? T.amberSoft : T.greenSoft,
                          color: isUpdate ? T.amber : T.green,
                          borderRadius: 6, padding: '1px 7px', fontWeight: 700, fontSize: 11,
                        }}>{isUpdate ? 'UPDATE' : 'NEW'}</span>
                        {p.price && (
                          <span style={priceChanged ? { fontWeight: 700, color: T.green } : {}}>
                            {priceChanged && '⬇️ '}${Number(p.price).toLocaleString()}
                            {priceChanged && ` (was $${Number(item.match.price).toLocaleString()})`}
                          </span>
                        )}
                        {p.verdict && <span>{VERDICT_CONFIG[p.verdict]?.icon} {p.verdict}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSaveAll} disabled={includedCount === 0 || saving} style={{
              flex: 1, background: includedCount > 0 ? T.green : T.border,
              color: includedCount > 0 ? '#fff' : T.textSoft, border: 'none', borderRadius: 10,
              padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: includedCount > 0 ? 'pointer' : 'default',
            }}>
              {saving ? '⏳ Saving...' : `💾 Save ${includedCount} ${includedCount === 1 ? 'Property' : 'Properties'}`}
            </button>
            <button onClick={() => { setItems(null); setJson('') }} style={{
              flex: 1, background: T.borderLight, color: T.textMid, border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>← Edit</button>
          </div>
        </>
      )}
    </div>
  )
}
