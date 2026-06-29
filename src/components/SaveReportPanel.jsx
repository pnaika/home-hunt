import { useState } from 'react'
import { EMPTY_FORM, VERDICT_CONFIG, CRITERIA_LABELS } from '../constants.js'

const TABS = ['📋 From Claude JSON', '✏️ Manual Entry']

export function SaveReportPanel({ onSaved, existingProperties, onCancel }) {
  const [tab, setTab] = useState(0)
  const [json, setJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const sc = (k, v) => setForm(f => ({ ...f, criteria: { ...f.criteria, [k]: v } }))

  function handleParse() {
    setJsonError(''); setPreview(null)
    try {
      const raw = json.trim().replace(/^```json|^```|```$/gm, '').trim()
      const parsed = JSON.parse(raw)
      if (!parsed.address) throw new Error('Missing address field')
      setPreview(parsed)
    } catch (e) {
      setJsonError(`Invalid JSON: ${e.message}`)
    }
  }

  function buildProperty(data) {
    const existing = existingProperties.find(p =>
      p.address?.toLowerCase().trim() === (data.address || '').toLowerCase().trim()
    )
    return {
      ...EMPTY_FORM,
      ...data,
      id: existing?.id || data.id || `prop_${Date.now()}`,
      dateAdded: existing?.dateAdded ||
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }

  function handleConfirmJson() {
    if (!preview) return
    onSaved(buildProperty(preview), !!existingProperties.find(p =>
      p.address?.toLowerCase().trim() === preview.address?.toLowerCase().trim()
    ))
  }

  function handleManualSave() {
    if (!form.address.trim()) return alert('Address is required.')
    onSaved(buildProperty(form), !!existingProperties.find(p =>
      p.address?.toLowerCase().trim() === form.address.toLowerCase().trim()
    ))
  }

  const s = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0',
    borderRadius: 8, padding: '8px 11px', fontSize: 14, color: '#0f172a',
    background: '#f8fafc', outline: 'none', fontFamily: 'inherit', ...extra,
  })
  const L = t => <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</div>
  const TA = (k, ph, h = 70) => <textarea value={form[k] || ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={s({ height: h, resize: 'vertical' })} />
  const G2 = c => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{c}</div>
  const G3 = c => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>{c}</div>
  const Sec = t => <div style={{ fontSize: 12, fontWeight: 800, color: '#3b5bdb', marginTop: 22, marginBottom: 2, paddingBottom: 6, borderBottom: '2px solid #e0e7ff', textTransform: 'uppercase', letterSpacing: 0.8 }}>{t}</div>

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 16 }}>💾 Save Property</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); setPreview(null); setJsonError('') }} style={{
            flex: 1, padding: '10px 0', fontWeight: 700, fontSize: 14,
            border: 'none', background: 'none', cursor: 'pointer',
            color: tab === i ? '#3b5bdb' : '#94a3b8',
            borderBottom: tab === i ? '2px solid #3b5bdb' : '2px solid transparent',
            marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB 0: From Claude JSON ── */}
      {tab === 0 && (
        <div>
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
            After a deep-dive, Claude outputs a <strong>JSON block</strong> at the bottom of the report. Paste it here and tap Parse.
          </div>

          {!preview && (
            <>
              <textarea
                value={json}
                onChange={e => { setJson(e.target.value); setJsonError('') }}
                placeholder={'{\n  "address": "123 Main St, Bothell WA 98012",\n  "price": "750000",\n  ...\n}'}
                style={s({ height: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 })}
              />
              {jsonError && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 12px', marginTop: 8, fontSize: 13, color: '#dc2626' }}>
                  ⚠️ {jsonError}
                </div>
              )}
              <button
                onClick={handleParse}
                disabled={!json.trim()}
                style={{
                  width: '100%', marginTop: 12,
                  background: json.trim() ? '#3b5bdb' : '#94a3b8',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '12px 0', fontWeight: 800, fontSize: 15,
                  cursor: json.trim() ? 'pointer' : 'default',
                }}
              >Parse JSON</button>
            </>
          )}

          {preview && (
            <div>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 10 }}>✅ Parsed — review before saving</div>
                <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
                  <strong>Address:</strong> {preview.address || '—'}<br />
                  <strong>Price:</strong> {preview.price ? `$${Number(preview.price).toLocaleString()}` : '—'} · <strong>Beds:</strong> {preview.beds || '—'} · <strong>Baths:</strong> {preview.baths || '—'}<br />
                  <strong>Year:</strong> {preview.yearBuilt || '—'} · <strong>Sqft:</strong> {preview.sqft ? Number(preview.sqft).toLocaleString() : '—'}<br />
                  <strong>School:</strong> {preview.school || '—'} ({preview.schoolRating || '?'}/10 GS)<br />
                  <strong>HOA:</strong> {preview.hoaDues ? (isNaN(preview.hoaDues) ? preview.hoaDues : `$${preview.hoaDues}/mo`) : 'Unknown'}<br />
                  <strong>Offer range:</strong> {preview.offerRangeLow && preview.offerRangeHigh ? `$${Number(preview.offerRangeLow).toLocaleString()} – $${Number(preview.offerRangeHigh).toLocaleString()}` : '—'}<br />
                  <strong>Verdict:</strong> {preview.verdict || '—'}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(preview.criteria || {}).map(([k, v]) => (
                    <span key={k} style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: '#166534' }}>
                      {v} {CRITERIA_LABELS[k] || k}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleConfirmJson} style={{
                  flex: 1, background: '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                }}>💾 Save to Database</button>
                <button onClick={() => { setPreview(null); setJson('') }} style={{
                  flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
                  borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>← Edit</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: Manual Entry ── */}
      {tab === 1 && (
        <div>
          {Sec('1 · Snapshot')}
          {L('Address *')}<input value={form.address} onChange={e => set('address', e.target.value)} placeholder="1234 Main St, Bothell WA 98012" style={s()} />
          {G2(<>
            <div>{L('List Price')}<input value={form.price} onChange={e => set('price', e.target.value)} placeholder="749000" style={s()} /></div>
            <div>{L('Type')}<select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} style={s()}>
              {['Single-Family', 'Townhouse', 'Condo', 'New Construction'].map(t => <option key={t}>{t}</option>)}
            </select></div>
          </>)}
          {G3(<>
            {[['beds','Beds','3'],['baths','Baths','2.5'],['sqft','Sqft','1800']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {G3(<>
            {[['lotSize','Lot','3,200 sqft'],['yearBuilt','Year Built','2018'],['pricePerSqft','$/sqft','415']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {G3(<>
            {[['dom','DOM','12'],['propertyTaxes','Taxes/yr','$6,200'],['parking','Parking','1-car garage']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {L('Heating / Cooling')}<input value={form.heating} onChange={e => set('heating', e.target.value)} placeholder="Forced air, no A/C" style={s()} />
          {L('Price History')}{TA('priceHistory', '$800K → $775K (cut $25K, 30 DOM)', 52)}

          {Sec('2 · Criteria Scorecard')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(CRITERIA_LABELS).map(([key, display]) => (
              <div key={key} style={{ background: '#f8fafc', borderRadius: 8, padding: '7px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{display}</span>
                {['✅','⚠️','❌'].map(v => (
                  <button key={v} onClick={() => sc(key, v)} style={{
                    background: form.criteria?.[key] === v ? '#e0e7ff' : 'transparent',
                    border: form.criteria?.[key] === v ? '2px solid #3b5bdb' : '1.5px solid #e2e8f0',
                    borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: 14,
                  }}>{v}</button>
                ))}
              </div>
            ))}
          </div>

          {Sec('3 · Backyard')}{L('Backyard Read')}{TA('backyardRead', 'Lot vs footprint, fencing situation...')}
          {Sec('4 · School')}
          {G2(<>
            {[['school','School Name','Cedar Wood Elem'],['schoolRating','GS Rating /10','8']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {G2(<>
            {[['schoolDist','District','Northshore SD'],['schoolDistance','Distance','~0.8 mi']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}

          {Sec('5 · Commute')}
          {L('La Petite, Lynnwood (primary)')}{TA('commuteLaPetite', '~15 min via I-5 N off-peak...', 52)}
          {L('Amazon Nitro North, Bothell')}{TA('commuteBothell', '~8 min...', 52)}

          {Sec('6 · Comps & Pricing')}
          {L('Comps Read')}{TA('compsRead', 'At $XXX/sqft vs area median...', 70)}
          {L('Market Trend')}<input value={form.marketTrend} onChange={e => set('marketTrend', e.target.value)} placeholder="Neutral / Cooling / Hot" style={s()} />

          {Sec('7 · HOA')}
          {G2(<>
            {[['hoaDues','Monthly Dues ($)','250'],['hoaOwnershipType','Ownership Type','Fee-simple / Condo']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {L('What Dues Cover')}{TA('hoaCovers', 'Exterior, roof, lawn...', 52)}
          {L('Layered HOA?')}<input value={form.hoaLayered} onChange={e => set('hoaLayered', e.target.value)} placeholder="Master + sub-HOA?" style={s()} />
          {G3(<>
            {[['hoaManagement','Mgmt Co.','Navigate Mgmt'],['hoaManagementPhone','Phone','360-512-3820'],['hoaManagementWeb','Website','navigatemgmt.com']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {G2(<>
            {[['hoaReserveStudy','Reserve Study','Healthy / Low'],['hoaSpecialAssessments','Special Assessments','None / $X planned']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {G2(<>
            {[['hoaRentalCap','Rental Cap','10% / None'],['hoaHO6Required','HO-6 Required?','Yes / No']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {L('HOA Must-Knows / Flags')}{TA('hoaFlags', '1) Reserve study...\n2) Resale cert...', 80)}

          {Sec('8 · Negotiation')}
          {G2(<>
            {[['offerRangeLow','Offer Low','720000'],['offerRangeHigh','Offer High','740000']].map(([k,l,p]) =>
              <div key={k}>{L(l)}<input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} style={s()} /></div>)}
          </>)}
          {L('Negotiation Read')}{TA('negotiationRead', 'DOM + price history + strategy...', 70)}

          {Sec('9 · Watch-outs')}
          {L('Watch-outs & Must-Get Docs')}{TA('watchOuts', '1) Confirm fencing in CC&Rs...', 70)}

          {Sec('10 · Verdict & Notes')}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
            {Object.keys(VERDICT_CONFIG).map(v => (
              <button key={v} onClick={() => set('verdict', v)} style={{
                border: form.verdict === v ? '2px solid #3b5bdb' : '1.5px solid #e2e8f0',
                background: form.verdict === v ? '#e0e7ff' : '#f8fafc',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, color: form.verdict === v ? '#3b5bdb' : '#475569',
              }}>{VERDICT_CONFIG[v].icon} {v}</button>
            ))}
          </div>
          {L('Research Notes')}{TA('notes', 'Key findings, agent questions, next steps...', 90)}

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button onClick={handleManualSave} style={{
              flex: 1, background: '#059669', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>💾 Save to Database</button>
            <button onClick={onCancel} style={{
              flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
              borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
