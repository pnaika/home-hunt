import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VerdictBadge } from '../components/VerdictBadge.jsx'
import { CollabPanel } from '../components/CollabPanel.jsx'
import { MortgageCalculator } from '../components/MortgageCalculator.jsx'
import { Modal } from '../components/Modal.jsx'
import { PropertyForm } from '../components/PropertyForm.jsx'
import { DeleteConfirm } from '../components/DeleteConfirm.jsx'
import { Toast } from '../components/Toast.jsx'
import { T } from '../theme.js'

const CRITERIA_LABELS = {
  beds: '3+ Beds', backyard: 'Fenceable Yard',
  school: 'School 7+', budget: '≤$750K', yearBuilt: 'Built 2010+',
}
const SCORE_BG = { '✅': T.greenSoft, '⚠️': T.amberSoft, '❌': T.redSoft }

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true, accent, lazyChildren }) {
  const [open, setOpen] = useState(defaultOpen)
  // lazyChildren: don't mount children until first opened — prevents async fetches on load
  const [everOpened, setEverOpened] = useState(defaultOpen)

  function toggle() {
    setOpen(o => {
      if (!o) setEverOpened(true)
      return !o
    })
  }

  return (
    <div style={{
      marginBottom: 16,
      background: T.card,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(10,22,40,0.06)',
      border: accent ? `1.5px solid ${accent}` : `1px solid ${T.border}`,
    }}>
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '14px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? `1px solid ${T.borderLight}` : 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = T.offWhite}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{title}</span>
        <span style={{
          fontSize: 12, color: T.textSoft, fontWeight: 600,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>▼</span>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '9999px' : '0px',
        transition: open
          ? 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease'
          : 'max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
        opacity: open ? 1 : 0,
      }}>
        <div style={{ padding: '14px 16px' }}>
          {(!lazyChildren || everOpened) ? children : null}
        </div>
      </div>
    </div>
  )
}

// ─── Data rows ────────────────────────────────────────────────────────────────
function DataGrid({ rows }) {
  const valid = rows.filter(([, v]) => v)
  if (!valid.length) return <div style={{ fontSize: 13, color: T.textSoft, fontStyle: 'italic' }}>No data recorded</div>
  return (
    <div>
      {valid.map(([label, value], i) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', padding: '9px 0', gap: 12,
          borderBottom: i < valid.length - 1 ? `1px solid ${T.borderLight}` : 'none',
        }}>
          <span style={{ fontSize: 13, color: T.textSoft, flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function Prose({ text, bg, border }) {
  if (!text) return null
  return (
    <div style={{
      background: bg || 'transparent', border: border ? `1.5px solid ${border}` : 'none',
      borderRadius: 10, padding: bg ? '12px 14px' : 0,
      fontSize: 13, color: T.text, lineHeight: 1.8, whiteSpace: 'pre-wrap',
    }}>{text}</div>
  )
}

// ─── Link button ─────────────────────────────────────────────────────────────
function LinkBtn({ href, label, color }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: color || T.blueSoft,
      color: color ? '#fff' : T.blue,
      border: color ? 'none' : `1.5px solid ${T.blueBorder}`,
      borderRadius: 8, padding: '5px 11px',
      fontSize: 12, fontWeight: 700, textDecoration: 'none',
      whiteSpace: 'nowrap',
    }}>
      {label} ↗
    </a>
  )
}

// ─── Comps table ─────────────────────────────────────────────────────────────
function CompsTable({ comps, label }) {
  if (!comps || comps.length === 0) return null
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
      {comps.map((c, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 0', borderBottom: i < comps.length - 1 ? `1px solid ${T.borderLight}` : 'none',
          gap: 8,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{c.address}</div>
            {c.sqft && <div style={{ fontSize: 11, color: T.textSoft, marginTop: 1 }}>{Number(c.sqft).toLocaleString()} sqft{c.soldDate ? ` · Sold ${c.soldDate}` : ''}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{c.price ? `$${Number(c.price).toLocaleString()}` : '—'}</span>
            {c.url && <LinkBtn href={c.url} label="View" />}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Agent Questions generator ────────────────────────────────────────────────
function AgentQuestions({ property }) {
  const questions = []

  // Always ask
  questions.push({ cat: '🏠 General', q: 'How long has the property been on the market and has there been any previous offers?' })
  questions.push({ cat: '🏠 General', q: 'Why is the seller moving? Are there any flexible timelines?' })
  questions.push({ cat: '🏠 General', q: 'What\'s included in the sale — appliances, fixtures, window treatments?' })
  questions.push({ cat: '🏠 General', q: 'Have there been any major repairs or renovations? Can you provide permits and receipts?' })
  questions.push({ cat: '🏠 General', q: 'What are the utility costs (average monthly electric, gas, water)?' })

  // Yard / fencing
  if (property.backyardRead || property.criteria?.backyard !== '✅') {
    questions.push({ cat: '🌿 Yard & Outdoor', q: 'Is fencing permitted by the HOA/CC&Rs? Any restrictions on fence height or material?' })
    questions.push({ cat: '🌿 Yard & Outdoor', q: 'Who maintains the backyard — owner or HOA? What are the exact property boundaries?' })
  }

  // HOA specific
  if (property.hoaDues || property.hoaManagement) {
    questions.push({ cat: '🏘️ HOA', q: `What is the exact monthly HOA fee for this unit, and when did it last increase?` })
    questions.push({ cat: '🏘️ HOA', q: 'Are there any pending or planned special assessments in the next 2–3 years?' })
    questions.push({ cat: '🏘️ HOA', q: 'What is the current reserve fund balance and when was the last reserve study done?' })
    questions.push({ cat: '🏘️ HOA', q: 'What is the owner-occupancy ratio? Are there any rental caps or restrictions?' })
    questions.push({ cat: '🏘️ HOA', q: 'Are there any active litigation or disputes involving the HOA?' })
    questions.push({ cat: '🏘️ HOA', q: 'What does the master insurance cover vs. what needs an HO-6 walls-in policy?' })
    questions.push({ cat: '🏘️ HOA', q: 'Can I get a copy of the CC&Rs, resale certificate, meeting minutes (last 2 yrs), and reserve study?' })
  }

  // Condo specific
  if (property.hoaOwnershipType?.toLowerCase().includes('condo')) {
    questions.push({ cat: '🏦 Financing', q: 'Has this building been through conventional/FHA/VA warrantability review? What is the owner-occupancy ratio?' })
    questions.push({ cat: '🏦 Financing', q: 'Are there any restrictions on the type of financing accepted?' })
  }

  // No A/C
  if (property.heating?.toLowerCase().includes('no') && property.heating?.toLowerCase().includes('a/c')) {
    questions.push({ cat: '🔧 Systems', q: 'Is there a HVAC rough-in for A/C or would it require a full install? What is the estimated cost?' })
  }

  // Old build
  const yr = parseInt(property.yearBuilt)
  if (yr && yr < 2010) {
    questions.push({ cat: '🔧 Systems', q: 'When were the roof, water heater, furnace, and windows last replaced?' })
    questions.push({ cat: '🔧 Systems', q: 'Has the home been tested for radon, lead paint, or asbestos?' })
  }

  // Price cuts / DOM
  const dom = parseInt(property.dom)
  if (dom > 20 || (property.priceHistory || '').includes('→')) {
    questions.push({ cat: '💰 Negotiation', q: 'The home has had price reductions — is the seller open to further negotiation or closing cost credits?' })
    questions.push({ cat: '💰 Negotiation', q: 'Would the seller consider a rate buydown credit or pre-paid HOA fees as part of the deal?' })
  }

  // School
  if (property.school) {
    questions.push({ cat: '🏫 School', q: `Can you confirm that this address is within the ${property.school} attendance boundary? Any boundary changes expected?` })
  }

  // Inspection
  questions.push({ cat: '🔍 Inspection', q: 'Has the seller done a pre-inspection? Can I see the report?' })
  questions.push({ cat: '🔍 Inspection', q: 'Are there any known issues with the foundation, roof, plumbing, or electrical?' })
  questions.push({ cat: '🔍 Inspection', q: 'Any history of water intrusion, flooding, or pest damage?' })

  // Group by category
  const grouped = {}
  questions.forEach(({ cat, q }) => {
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(q)
  })

  return (
    <div>
      {Object.entries(grouped).map(([cat, qs]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{cat}</div>
          {qs.map((q, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 0',
              borderBottom: i < qs.length - 1 ? `1px solid ${T.borderLight}` : 'none',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💬</span>
              <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{q}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ fontSize: 11, color: T.textSoft, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
        These questions are generated from the property data. Always bring printed copies to the showing and take notes.
      </div>
    </div>
  )
}

// ─── Must-get Documents ───────────────────────────────────────────────────────
function MustGetDocs({ property }) {
  const docs = [
    { doc: 'Resale Certificate', why: 'WA-required. Discloses reserves, CC&Rs, delinquency rate, litigation, budget.', priority: 'high' },
    { doc: 'HOA Reserve Study', why: 'Shows if the fund is healthy or at risk for a special assessment.', priority: 'high' },
    { doc: 'CC&Rs + Rules & Regulations', why: 'Fencing, pets, rentals, parking, architectural restrictions.', priority: 'high' },
    { doc: 'HOA Meeting Minutes (last 2 yrs)', why: 'Reveals planned projects, disputes, complaints, and vote history.', priority: 'high' },
    { doc: 'HOA Budget + Financial Statements', why: 'Check for underfunding, delinquent dues, and operating deficits.', priority: 'medium' },
    { doc: 'Seller Disclosure (Form 17)', why: 'WA-required. Seller must disclose known material defects.', priority: 'high' },
    { doc: 'Pre-inspection Report (if available)', why: 'Head start on known issues before your own inspection.', priority: 'medium' },
    { doc: 'Permit History', why: 'Verify all renovations and additions were properly permitted.', priority: 'medium' },
    { doc: 'Title Report (Preliminary)', why: 'Reveals liens, easements, encumbrances.', priority: 'high' },
    { doc: 'Natural Hazard Disclosure', why: 'Flood zone, landslide, seismic risk for this parcel.', priority: 'medium' },
    { doc: 'Utility Bills (12 months)', why: 'Estimate true carrying cost — especially for older homes without A/C.', priority: 'medium' },
  ]

  const high = docs.filter(d => d.priority === 'high')
  const med = docs.filter(d => d.priority === 'medium')

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>🔴 Must-Get Before Offer</div>
      {high.map((d, i) => <DocRow key={i} {...d} />)}
      <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: 0.8, margin: '14px 0 8px' }}>🟡 Get During Escrow</div>
      {med.map((d, i) => <DocRow key={i} {...d} />)}
    </div>
  )
}

function DocRow({ doc, why }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{doc}</div>
        <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.5 }}>{why}</div>
      </div>
    </div>
  )
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────
export function DetailPage({ properties, onSave, onFav, onDelete, onRestore, onHardDelete, user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')
  const topRef = useRef(null)

  const property = properties.find(p => p.id === id)

  // Scroll to top — fire immediately, then again after async renders settle
  useEffect(() => {
    // Immediate attempt
    window.scrollTo(0, 0)
    // Second attempt after paint
    const t1 = requestAnimationFrame(() => window.scrollTo(0, 0))
    // Third attempt after async data (comments/votes) loads and re-renders
    const t2 = setTimeout(() => window.scrollTo(0, 0), 120)
    return () => {
      cancelAnimationFrame(t1)
      clearTimeout(t2)
    }
  }, [id])

  if (!property) return (
    <div style={{ minHeight: '100vh', background: T.offWhite, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🏚️</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid }}>Property not found</div>
      <button onClick={() => navigate('/')} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>← Back to list</button>
    </div>
  )

  const fmt$ = v => v && !isNaN(v) ? `$${Number(v).toLocaleString()}` : v || null
  const offerText = property.offerRangeLow && property.offerRangeHigh
    ? `${fmt$(property.offerRangeLow)} – ${fmt$(property.offerRangeHigh)}` : null
  const encoded = encodeURIComponent(property.address || '')

  return (
    <div style={{ minHeight: '100vh', background: T.offWhite }}>

      {/* Sticky nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.navy,
        padding: '12px 20px',
        paddingTop: 'max(12px, calc(env(safe-area-inset-top) + 12px))',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 12px rgba(10,22,40,0.3)',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: T.navyMid, border: 'none', color: '#fff',
          borderRadius: 8, padding: '7px 12px', fontWeight: 700,
          fontSize: 14, cursor: 'pointer', flexShrink: 0,
        }}>← Back</button>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.address}
          </div>
        </div>
        <VerdictBadge verdict={property.verdict} size="sm" />
      </div>

      {/* Hero */}
      <div style={{ background: T.navy, padding: '0 20px 28px' }}>
        {/* Map embed — always shown, no API key needed */}
        {(() => {
          const [mapMode, setMapMode] = useState('map')
          const addr = encodeURIComponent(property.address || '')
          const mapSrc = mapMode === 'satellite'
            ? `https://maps.google.com/maps?q=${addr}&t=k&output=embed&z=18`
            : `https://maps.google.com/maps?q=${addr}&output=embed&z=16`
          return (
            <div style={{ marginBottom: 18, marginLeft: -20, marginRight: -20 }}>
              {/* Map/Satellite toggle */}
              <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 8 }}>
                {[['map', '🗺 Map'], ['satellite', '🛰 Satellite']].map(([mode, label]) => (
                  <button key={mode} onClick={() => setMapMode(mode)} style={{
                    background: mapMode === mode ? '#fff' : 'transparent',
                    color: mapMode === mode ? T.text : T.slateLight,
                    border: `1.5px solid ${mapMode === mode ? T.border : 'transparent'}`,
                    borderRadius: 8, padding: '5px 12px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
              <iframe
                key={mapSrc}
                src={mapSrc}
                width="100%"
                height="200"
                style={{ border: 'none', display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Property map"
              />
            </div>
          )
        })()}

        {/* Listing photo links — open in browser */}
        {(property.images || []).length > 0 && (
          <div style={{ marginBottom: 16, padding: '0 0' }}>
            <div style={{ fontSize: 11, color: T.slateLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>📸 Listing Photos</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {property.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" style={{
                  flexShrink: 0, background: T.navyMid, borderRadius: 10,
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
                }}>Photo {i + 1} ↗</a>
              ))}
            </div>
          </div>
        )}

        {/* Address — DM Serif Display */}
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: '#fff', lineHeight: 1.25, marginBottom: 6, letterSpacing: -0.3 }}>
          {property.address}
        </div>
        <div style={{ color: T.slateLight, fontSize: 13, marginBottom: 18 }}>{property.propertyType}</div>

        {/* Key stats */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            property.price && { label: 'Price', value: `$${Number(property.price).toLocaleString()}`, big: true },
            property.beds && { label: 'Beds', value: property.beds },
            property.baths && { label: 'Baths', value: property.baths },
            property.sqft && { label: 'Sqft', value: Number(property.sqft).toLocaleString() },
            property.pricePerSqft && { label: '$/sqft', value: `$${property.pricePerSqft}` },
            property.dom && { label: 'DOM', value: property.dom },
          ].filter(Boolean).map(({ label, value, big }) => (
            <div key={label} style={{ marginRight: 20, marginBottom: 8 }}>
              <div style={{ fontWeight: big ? 800 : 700, fontSize: big ? 22 : 17, color: '#fff', letterSpacing: -0.3 }}>{value}</div>
              <div style={{ fontSize: 10, color: T.slateLight, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Listing links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <a href={property.redfinUrl || `https://www.redfin.com/search#location=${encoded}&searchType=2`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#CC2200', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
            🏠 Redfin
          </a>
          <a href={property.zillowUrl || `https://www.zillow.com/homes/${encoded}_rb/`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1D6196', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
            🔵 Zillow
          </a>
          {property.listingSourceUrl && (
            <a href={property.listingSourceUrl} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.navyMid, color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
              📋 Source
            </a>
          )}
          {property.mlsNumber && (
            <span style={{ display: 'flex', alignItems: 'center', background: T.navyLight, color: T.slateLight, borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>
              MLS #{property.mlsNumber}
            </span>
          )}
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <HeroBtn icon={property.favourite ? '⭐' : '☆'} label={property.favourite ? "Fav'd" : 'Fav'} onClick={() => onFav(property)} yellow={property.favourite} />
          <HeroBtn icon="✏️" label="Edit" onClick={() => setFormOpen(true)} />
          <HeroBtn icon="🗑️" label="Delete" onClick={() => setDeleteTarget(property)} danger />
        </div>
      </div>

      {/* Deleted banner */}
      {property.deleted && (
        <div style={{ background: T.redSoft, border: `1px solid ${T.redBorder}`, margin: '12px 16px 0', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 13, color: T.red, fontWeight: 600 }}>🗑️ In Recently Deleted</div>
          <button onClick={() => onRestore(property)} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Restore</button>
          <button onClick={() => setDeleteTarget({ ...property, hardDelete: true })} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete Forever</button>
        </div>
      )}

      {/* Collapsible sections */}
      <div style={{ padding: '16px 16px 40px' }}>

        <Section title="🎯 Criteria Scorecard">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(property.criteria || {}).map(([key, val]) => (
              <div key={key} style={{ background: SCORE_BG[val] || T.offWhite, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>{CRITERIA_LABELS[key] || key}</span>
                <span style={{ fontSize: 18 }}>{val}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="📋 Property Details">
          <DataGrid rows={[
            ['Year Built', property.yearBuilt],
            ['Lot Size', property.lotSize],
            ['Taxes/yr', property.propertyTaxes],
            ['Heating / Cooling', property.heating],
            ['Parking', property.parking],
            ['Last Sold', property.lastSoldPrice && property.lastSoldDate ? `${property.lastSoldPrice} (${property.lastSoldDate})` : null],
            ['Price History', property.priceHistory],
            ['Parcel #', property.parcelNumber],
          ]} />
          {(property.assessorUrl || property.walkScore) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {property.assessorUrl && <LinkBtn href={property.assessorUrl} label="🏛 County Assessor" />}
              {property.walkScoreUrl && <LinkBtn href={property.walkScoreUrl} label={`🚶 Walk Score ${property.walkScore || ''}`} />}
            </div>
          )}
        </Section>

        <Section title="🧮 Mortgage Calculator" accent={T.blueBorder}>
          <MortgageCalculator property={property} />
        </Section>

        {property.backyardRead && (
          <Section title="🌿 Backyard">
            <Prose text={property.backyardRead} bg={T.greenSoft} border={T.greenBorder} />
          </Section>
        )}

        <Section title="🏫 School">
          <DataGrid rows={[
            ['Elementary', property.school],
            ['GreatSchools Rating', property.schoolRating ? `${property.schoolRating}/10` : null],
            ['District', property.schoolDist],
            ['Distance', property.schoolDistance],
          ]} />
          {(property.schoolUrl || property.schoolDistrictUrl) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {property.schoolUrl && <LinkBtn href={property.schoolUrl} label="⭐ GreatSchools Profile" />}
              {property.schoolDistrictUrl && <LinkBtn href={property.schoolDistrictUrl} label="🏫 District Website" />}
            </div>
          )}
        </Section>

        <Section title="🚗 Commute">
          <div style={{ background: T.blueSoft, border: `1.5px solid ${T.blueBorder}`, borderRadius: 10, padding: '12px 14px' }}>
            <DataGrid rows={[
              ['La Petite, Lynnwood — Primary', property.commuteLaPetite],
              ['Amazon Nitro North, Bothell', property.commuteBothell],
            ]} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <LinkBtn
                href={property.commuteDirectionsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encoded}&destination=20415+Poplar+Way+Lynnwood+WA+98036`}
                label="🗺 Directions to La Petite"
              />
              <LinkBtn
                href={property.commuteBothellUrl || `https://www.google.com/maps/dir/?api=1&origin=${encoded}&destination=Amazon+Nitro+North+Bothell+WA`}
                label="🗺 Directions to Bothell"
              />
            </div>
            <div style={{ fontSize: 11, color: T.textSoft, marginTop: 8 }}>⚠️ Estimates only — I-5 AM peak runs heavier</div>
          </div>
        </Section>

        {(property.compsRead || property.marketTrend || (property.activeComps || []).length > 0 || (property.soldComps || []).length > 0) && (
          <Section title="📊 Comps & Market">
            <DataGrid rows={[['Market Trend', property.marketTrend]]} />
            {property.compsRead && <Prose text={property.compsRead} />}
            {(property.activeComps || []).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <CompsTable comps={property.activeComps} label="🟢 Active — Similar Listings" />
              </div>
            )}
            {(property.soldComps || []).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <CompsTable comps={property.soldComps} label="🔵 Recently Sold" />
              </div>
            )}
          </Section>
        )}

        <Section title="🏘️ HOA">
          <DataGrid rows={[
            ['Monthly Dues', property.hoaDues ? (isNaN(property.hoaDues) ? property.hoaDues : `$${property.hoaDues}/mo`) : null],
            ['What Covers', property.hoaCovers],
            ['Ownership Type', property.hoaOwnershipType],
            ['Layered HOA?', property.hoaLayered],
            ['Management Co.', property.hoaManagement],
            ['Phone', property.hoaManagementPhone],
            ['Website', property.hoaManagementWeb],
            ['Reserve Study', property.hoaReserveStudy],
            ['Special Assessments', property.hoaSpecialAssessments],
            ['Rental Cap', property.hoaRentalCap],
            ['HO-6 Required?', property.hoaHO6Required],
          ]} />
          {(property.hoaPortalUrl || property.hoaResaleDocUrl || property.hoaReputationUrl) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {property.hoaPortalUrl && <LinkBtn href={property.hoaPortalUrl} label="🏠 HOA Portal" />}
              {property.hoaResaleDocUrl && <LinkBtn href={property.hoaResaleDocUrl} label="📄 Order Resale Cert" />}
              {property.hoaReputationUrl && <LinkBtn href={property.hoaReputationUrl} label="⭐ Reviews / BBB" />}
            </div>
          )}
          {property.hoaFlags && (
            <div style={{ background: '#FEFCE8', border: `1.5px solid ${T.amberBorder}`, borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#854D0E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>🔎 Must-Knows</div>
              <Prose text={property.hoaFlags} />
            </div>
          )}
        </Section>

        <Section title="🤝 Negotiation" accent={T.blueBorder}>
          {offerText && (
            <div style={{ background: T.navy, borderRadius: 10, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T.slateLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggested Offer</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{offerText}</span>
            </div>
          )}
          {property.negotiationRead && <Prose text={property.negotiationRead} />}
        </Section>

        {property.watchOuts && (
          <Section title="⚠️ Watch-outs" accent={T.redBorder}>
            <Prose text={property.watchOuts} bg={T.redSoft} border={T.redBorder} />
          </Section>
        )}

        {/* Agent Questions — stored from JSON or auto-generated */}
        <Section title="💬 Questions for Your Realtor / Agent" defaultOpen={false} accent={T.greenBorder}>
          {property.realtorQuestions
            ? <Prose text={property.realtorQuestions} />
            : <AgentQuestions property={property} />}
        </Section>

        {/* Must-Get Documents — stored from JSON or auto-generated */}
        <Section title="📄 Must-Get Documents" defaultOpen={false}>
          {property.mustGetDocs
            ? <Prose text={property.mustGetDocs} />
            : <MustGetDocs property={property} />}
        </Section>

        {property.notes && (
          <Section title="📝 Research Notes" defaultOpen={false}>
            <Prose text={property.notes} bg={T.amberSoft} border={T.amberBorder} />
          </Section>
        )}

        <Section title="👥 Team Notes" defaultOpen={false} lazyChildren>
          <CollabPanel property={property} user={user} />
        </Section>

        <div style={{ fontSize: 11, color: T.slateLight, textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
          Added {property.dateAdded} · Research only, not licensed agent advice
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <PropertyForm initial={property} onSave={p => { onSave(p); setFormOpen(false); setToast('✅ Saved') }} onCancel={() => setFormOpen(false)} />
      </Modal>
      <DeleteConfirm
        property={deleteTarget}
        onConfirm={() => {
          if (deleteTarget?.hardDelete) onHardDelete(deleteTarget)
          else { onDelete(deleteTarget); navigate('/') }
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}

function HeroBtn({ icon, label, onClick, yellow, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: danger ? T.redSoft : yellow ? '#FEF9C3' : T.navyMid,
      color: danger ? T.red : yellow ? '#854D0E' : '#fff',
      border: 'none', borderRadius: 8, padding: '7px 12px',
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>
      <span>{icon}</span><span>{label}</span>
    </button>
  )
}
