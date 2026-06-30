import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { T } from '../theme.js'
import { VerdictBadge } from '../components/VerdictBadge.jsx'
import { safeDisplay } from '../safeDisplay.js'

const CRITERIA_LABELS = { beds: '3+ Beds', backyard: 'Fenceable Yard', school: 'School 7+', budget: '≤$750K', yearBuilt: 'Built 2010+' }
const SCORE_COLOR = { '✅': T.green, '⚠️': T.amber, '❌': T.red }

const ROW_DEFS = [
  { label: 'Price', get: p => p.price ? `$${Number(p.price).toLocaleString()}` : '—', highlight: 'min' },
  { label: '$/sqft', get: p => p.pricePerSqft ? `$${p.pricePerSqft}` : '—', highlight: 'min' },
  { label: 'Beds / Baths', get: p => `${p.beds || '—'}bd / ${p.baths || '—'}ba` },
  { label: 'Sqft', get: p => p.sqft ? Number(p.sqft).toLocaleString() : '—', highlight: 'max' },
  { label: 'Year Built', get: p => p.yearBuilt || '—', highlight: 'max' },
  { label: 'Lot Size', get: p => safeDisplay(p.lotSize) || '—' },
  { label: 'HOA Dues', get: p => p.hoaDues ? (isNaN(p.hoaDues) ? safeDisplay(p.hoaDues) : `$${p.hoaDues}/mo`) : '—', highlight: 'min' },
  { label: 'Property Taxes', get: p => safeDisplay(p.propertyTaxes) || '—' },
  { label: 'School', get: p => p.school ? `${p.school} (${p.schoolRating || '?'}/10)` : '—' },
  { label: 'School Rating', get: p => p.schoolRating || '—', highlight: 'max', isNumber: true },
  { label: 'Days on Market', get: p => p.dom || '—', highlight: 'max' },
  { label: 'Commute → La Petite', get: p => safeDisplay(p.commuteLaPetite) || '—' },
  { label: 'Commute → Bothell', get: p => safeDisplay(p.commuteBothell) || '—' },
  { label: 'Offer Range', get: p => p.offerRangeLow && p.offerRangeHigh ? `$${Number(p.offerRangeLow).toLocaleString()}–$${Number(p.offerRangeHigh).toLocaleString()}` : '—' },
]

export function ComparePage({ properties }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const idsParam = searchParams.get('ids') || ''
  const selectedIds = useMemo(() => idsParam.split(',').filter(Boolean), [idsParam])

  const [pickerOpen, setPickerOpen] = useState(selectedIds.length === 0)

  const liveProperties = properties.filter(p => !p.deleted)
  const compared = selectedIds.map(id => liveProperties.find(p => p.id === id)).filter(Boolean)

  function toggleId(id) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    setSearchParams(next.length ? { ids: next.join(',') } : {})
  }

  function getNumeric(p, rowDef) {
    const raw = rowDef.isNumber ? p.schoolRating : (rowDef.label === 'Price' ? p.price : rowDef.label === '$/sqft' ? p.pricePerSqft : rowDef.label === 'Sqft' ? p.sqft : rowDef.label === 'Year Built' ? p.yearBuilt : rowDef.label === 'HOA Dues' ? p.hoaDues : rowDef.label === 'Days on Market' ? p.dom : null)
    const n = Number(raw)
    return isNaN(n) ? null : n
  }

  function getBestId(rowDef) {
    if (!rowDef.highlight) return null
    const values = compared.map(p => ({ id: p.id, val: getNumeric(p, rowDef) })).filter(x => x.val !== null)
    if (values.length < 2) return null
    const best = rowDef.highlight === 'min'
      ? values.reduce((a, b) => a.val < b.val ? a : b)
      : values.reduce((a, b) => a.val > b.val ? a : b)
    return best.id
  }

  return (
    <div style={{ minHeight: '100vh', background: T.offWhite }}>
      {/* Sticky nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: T.navy,
        padding: '12px 20px', paddingTop: 'max(12px, calc(env(safe-area-inset-top) + 12px))',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 12px rgba(10,22,40,0.3)',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: T.navyMid, border: 'none', color: '#fff', borderRadius: 8,
          padding: '7px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
        }}>← Back</button>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#fff' }}>⚖️ Compare</div>
        <button onClick={() => setPickerOpen(true)} style={{
          background: T.blue, border: 'none', color: '#fff', borderRadius: 8,
          padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>+ Edit</button>
      </div>

      {/* Picker modal */}
      {pickerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => selectedIds.length > 0 && setPickerOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', padding: 22 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Select properties to compare</div>
            <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 16 }}>Pick 2 or more. Tap again to deselect.</div>
            {liveProperties.length === 0 ? (
              <div style={{ color: T.textSoft, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No properties yet</div>
            ) : liveProperties.map(p => {
              const isSelected = selectedIds.includes(p.id)
              return (
                <div key={p.id} onClick={() => toggleId(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                  background: isSelected ? T.blueSoft : T.offWhite,
                  border: `1.5px solid ${isSelected ? T.blueBorder : T.border}`,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    background: isSelected ? T.blue : '#fff',
                    border: `1.5px solid ${isSelected ? T.blue : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12,
                  }}>{isSelected && '✓'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{safeDisplay(p.address)}</div>
                    <div style={{ fontSize: 11, color: T.textSoft }}>{p.price ? `$${Number(p.price).toLocaleString()}` : '—'} · {p.verdict}</div>
                  </div>
                </div>
              )
            })}
            <button
              onClick={() => setPickerOpen(false)}
              disabled={selectedIds.length === 0}
              style={{
                width: '100%', marginTop: 14,
                background: selectedIds.length ? T.blue : T.border,
                color: selectedIds.length ? '#fff' : T.textSoft,
                border: 'none', borderRadius: 10, padding: '12px 0',
                fontWeight: 800, fontSize: 15, cursor: selectedIds.length ? 'pointer' : 'default',
              }}
            >Compare {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</button>
          </div>
        </div>
      )}

      {/* Comparison table */}
      {compared.length > 0 && (
        <div style={{ padding: '16px 12px 60px', overflowX: 'auto' }}>
          <div style={{ minWidth: compared.length * 180 + 140, display: 'inline-block' }}>

            {/* Header row — addresses + verdict */}
            <div style={{ display: 'flex', marginBottom: 4 }}>
              <div style={{ width: 140, flexShrink: 0 }} />
              {compared.map(p => (
                <div key={p.id} style={{ width: 180, flexShrink: 0, padding: '0 6px' }}>
                  <div
                    onClick={() => navigate(`/property/${p.id}`)}
                    style={{
                      background: T.navy, borderRadius: '12px 12px 0 0', padding: '14px 12px',
                      cursor: 'pointer', minHeight: 92,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {safeDisplay(p.address)}
                    </div>
                    <VerdictBadge verdict={p.verdict} size="sm" />
                  </div>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {ROW_DEFS.map((rowDef, ri) => {
              const bestId = getBestId(rowDef)
              return (
                <div key={rowDef.label} style={{ display: 'flex' }}>
                  <div style={{
                    width: 140, flexShrink: 0, padding: '10px 10px',
                    fontSize: 12, color: T.textSoft, fontWeight: 600,
                    display: 'flex', alignItems: 'center',
                    background: T.card, borderBottom: `1px solid ${T.borderLight}`,
                  }}>{rowDef.label}</div>
                  {compared.map(p => {
                    const isBest = bestId === p.id
                    return (
                      <div key={p.id} style={{ width: 180, flexShrink: 0, padding: '0 6px' }}>
                        <div style={{
                          padding: '10px 12px', fontSize: 13, fontWeight: isBest ? 800 : 600,
                          color: isBest ? T.green : T.text,
                          background: isBest ? T.greenSoft : T.card,
                          borderBottom: `1px solid ${T.borderLight}`,
                          minHeight: 38, display: 'flex', alignItems: 'center',
                        }}>
                          {isBest && '🏆 '}{rowDef.get(p)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Criteria scorecard rows */}
            <div style={{
              width: 140 + compared.length * 192, padding: '14px 10px 6px',
              fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8,
            }}>🎯 Criteria</div>
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex' }}>
                <div style={{
                  width: 140, flexShrink: 0, padding: '10px 10px',
                  fontSize: 12, color: T.textSoft, fontWeight: 600,
                  display: 'flex', alignItems: 'center',
                  background: T.card, borderBottom: `1px solid ${T.borderLight}`,
                }}>{label}</div>
                {compared.map(p => {
                  const val = p.criteria?.[key]
                  const safeVal = typeof val === 'string' ? val : '—'
                  return (
                    <div key={p.id} style={{ width: 180, flexShrink: 0, padding: '0 6px' }}>
                      <div style={{
                        padding: '10px 12px', fontSize: 17,
                        background: T.card, borderBottom: `1px solid ${T.borderLight}`,
                        minHeight: 38, display: 'flex', alignItems: 'center',
                        color: SCORE_COLOR[safeVal] || T.textSoft,
                      }}>{safeVal}</div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Bottom rounding */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: 140, flexShrink: 0 }} />
              {compared.map(p => (
                <div key={p.id} style={{ width: 180, flexShrink: 0, padding: '0 6px' }}>
                  <div style={{ background: T.card, borderRadius: '0 0 12px 12px', height: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {compared.length === 0 && !pickerOpen && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: T.textSoft }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 12 }}>No properties selected</div>
          <button onClick={() => setPickerOpen(true)} style={{
            background: T.blue, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 24px', fontWeight: 700, cursor: 'pointer',
          }}>Select properties</button>
        </div>
      )}
    </div>
  )
}
