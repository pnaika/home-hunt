import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VerdictBadge } from '../components/VerdictBadge.jsx'
import { CollabPanel } from '../components/CollabPanel.jsx'
import { Modal } from '../components/Modal.jsx'
import { PropertyForm } from '../components/PropertyForm.jsx'
import { DeleteConfirm } from '../components/DeleteConfirm.jsx'
import { Toast } from '../components/Toast.jsx'
import { T } from '../theme.js'

const CRITERIA_LABELS = { beds: '3+ Beds', backyard: 'Fenceable Yard', school: 'School 7+', budget: '≤$750K', yearBuilt: 'Built 2010+' }
const SCORE_COLOR = { '✅': T.green, '⚠️': T.amber, '❌': T.red }
const SCORE_BG = { '✅': T.greenSoft, '⚠️': T.amberSoft, '❌': T.redSoft }

export function DetailPage({ properties, onSave, onFav, onDelete, onRestore, onHardDelete, user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')

  const property = properties.find(p => p.id === id)

  useEffect(() => { window.scrollTo(0, 0) }, [id])

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

      {/* Sticky top nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.navy,
        padding: '12px 20px',
        paddingTop: 'max(12px, calc(env(safe-area-inset-top) + 12px))',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 12px rgba(10,22,40,0.25)',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: T.navyMid, border: 'none', color: '#fff',
          borderRadius: 8, padding: '7px 12px', fontWeight: 700,
          fontSize: 14, cursor: 'pointer', flexShrink: 0,
        }}>← Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.address}
          </div>
        </div>
        <VerdictBadge verdict={property.verdict} size="sm" />
      </div>

      {/* Hero */}
      <div style={{ background: T.navy, padding: '0 20px 28px' }}>
        {/* Photo strip */}
        {(property.images || []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
            {property.images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                <img src={src} alt="" style={{ height: 180, width: 280, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                  onError={e => { e.target.style.display = 'none' }} />
              </a>
            ))}
          </div>
        )}

        {/* Address in serif display */}
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.3 }}>
          {property.address}
        </div>
        <div style={{ color: T.slateLight, fontSize: 13, marginBottom: 16 }}>{property.propertyType}</div>

        {/* Key stats */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
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

        {/* Quick links + actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <a href={property.redfinUrl || `https://www.redfin.com/search#location=${encoded}&searchType=2`}
            target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#CC2200', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
            🏠 Redfin
          </a>
          <a href={property.zillowUrl || `https://www.zillow.com/homes/${encoded}_rb/`}
            target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1D6196', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
            🔵 Zillow
          </a>
          <div style={{ flex: 1 }} />
          <ActionBtn icon={property.favourite ? '⭐' : '☆'} label={property.favourite ? 'Fav\'d' : 'Fav'} onClick={() => onFav(property)} active={property.favourite} />
          <ActionBtn icon="✏️" label="Edit" onClick={() => setFormOpen(true)} />
          <ActionBtn icon="🗑️" label="Delete" onClick={() => setDeleteTarget(property)} danger />
        </div>
      </div>

      {/* Restored banner */}
      {property.deleted && (
        <div style={{ background: T.redSoft, border: `1px solid ${T.redBorder}`, margin: '16px 16px 0', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 13, color: T.red, fontWeight: 600 }}>This property is in Recently Deleted</div>
          <button onClick={() => onRestore(property)} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Restore</button>
          <button onClick={() => setDeleteTarget({ ...property, hardDelete: true })} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete Forever</button>
        </div>
      )}

      {/* Content sections */}
      <div style={{ padding: '20px 16px 40px' }}>

        {/* Scorecard */}
        <Section title="🎯 Criteria">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(property.criteria || {}).map(([key, val]) => (
              <div key={key} style={{
                background: SCORE_BG[val] || T.offWhite,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>{CRITERIA_LABELS[key] || key}</span>
                <span style={{ fontSize: 18 }}>{val}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Snapshot */}
        <Section title="📋 Property Details">
          <DataGrid rows={[
            ['Year Built', property.yearBuilt],
            ['Lot Size', property.lotSize],
            ['Taxes/yr', property.propertyTaxes],
            ['Heating', property.heating],
            ['Parking', property.parking],
            ['Last Sold', property.lastSoldPrice && property.lastSoldDate ? `${property.lastSoldPrice} (${property.lastSoldDate})` : null],
            ['Price History', property.priceHistory],
          ]} />
        </Section>

        {/* Backyard */}
        {property.backyardRead && (
          <Section title="🌿 Backyard">
            <Prose text={property.backyardRead} bg={T.greenSoft} border={T.greenBorder} />
          </Section>
        )}

        {/* School */}
        <Section title="🏫 School">
          <DataGrid rows={[
            ['Elementary', property.school],
            ['GreatSchools', property.schoolRating ? `${property.schoolRating}/10` : null],
            ['District', property.schoolDist],
            ['Distance', property.schoolDistance],
          ]} />
        </Section>

        {/* Commute */}
        <Section title="🚗 Commute">
          <div style={{ background: T.blueSoft, border: `1.5px solid ${T.blueBorder}`, borderRadius: 12, padding: '14px 16px' }}>
            <DataGrid rows={[
              ['La Petite (Primary)', property.commuteLaPetite],
              ['Amazon Nitro, Bothell', property.commuteBothell],
            ]} noBg />
            <div style={{ fontSize: 11, color: T.textSoft, marginTop: 8 }}>⚠️ Estimates only — I-5 AM peak runs heavier</div>
          </div>
        </Section>

        {/* Comps */}
        {(property.compsRead || property.marketTrend) && (
          <Section title="📊 Comps & Market">
            <DataGrid rows={[['Market Trend', property.marketTrend]]} />
            {property.compsRead && <Prose text={property.compsRead} />}
          </Section>
        )}

        {/* HOA */}
        <Section title="🏘️ HOA">
          <DataGrid rows={[
            ['Monthly Dues', property.hoaDues ? (isNaN(property.hoaDues) ? property.hoaDues : `$${property.hoaDues}/mo`) : null],
            ['Covers', property.hoaCovers],
            ['Ownership', property.hoaOwnershipType],
            ['Layered?', property.hoaLayered],
            ['Management', property.hoaManagement],
            ['Phone', property.hoaManagementPhone],
            ['Website', property.hoaManagementWeb],
            ['Reserve Study', property.hoaReserveStudy],
            ['Special Assessments', property.hoaSpecialAssessments],
            ['Rental Cap', property.hoaRentalCap],
            ['HO-6 Required', property.hoaHO6Required],
          ]} />
          {property.hoaFlags && (
            <div style={{ background: '#FEFCE8', border: `1.5px solid ${T.amberBorder}`, borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#854D0E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>🔎 Must-Knows</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{property.hoaFlags}</div>
            </div>
          )}
        </Section>

        {/* Negotiation */}
        <Section title="🤝 Negotiation">
          {offerText && (
            <div style={{ background: T.navy, borderRadius: 12, padding: '16px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.slateLight, fontWeight: 600 }}>Suggested Offer</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{offerText}</span>
            </div>
          )}
          {property.negotiationRead && <Prose text={property.negotiationRead} />}
        </Section>

        {/* Watch-outs */}
        {property.watchOuts && (
          <Section title="⚠️ Watch-outs">
            <Prose text={property.watchOuts} bg={T.redSoft} border={T.redBorder} />
          </Section>
        )}

        {/* Notes */}
        {property.notes && (
          <Section title="📝 Research Notes">
            <Prose text={property.notes} bg={T.amberSoft} border={T.amberBorder} />
          </Section>
        )}

        {/* Collaboration */}
        <Section title="👥 Team Notes">
          <CollabPanel property={property} user={user} />
        </Section>

        <div style={{ color: T.slateLight, fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          Added {property.dateAdded} · Research only, not licensed agent advice
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <PropertyForm initial={property} onSave={p => { onSave(p); setFormOpen(false); setToast('✅ Saved') }} onCancel={() => setFormOpen(false)} />
      </Modal>

      <DeleteConfirm
        property={deleteTarget}
        onConfirm={() => {
          if (deleteTarget?.hardDelete) { onHardDelete(deleteTarget); }
          else { onDelete(deleteTarget); navigate('/') }
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function DataGrid({ rows, noBg }) {
  const valid = rows.filter(([, v]) => v)
  if (!valid.length) return null
  return (
    <div style={{ background: noBg ? 'transparent' : T.card, borderRadius: 12, overflow: 'hidden', border: noBg ? 'none' : `1px solid ${T.border}` }}>
      {valid.map(([label, value], i) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '10px 14px', gap: 12,
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
  return (
    <div style={{
      background: bg || T.card,
      border: border ? `1.5px solid ${border}` : `1px solid ${T.border}`,
      borderRadius: 12, padding: '12px 14px',
      fontSize: 13, color: T.text, lineHeight: 1.75, whiteSpace: 'pre-wrap',
    }}>{text}</div>
  )
}

function ActionBtn({ icon, label, onClick, active, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: danger ? T.redSoft : active ? '#FEF9C3' : T.navyMid,
      color: danger ? T.red : active ? '#854D0E' : '#fff',
      border: 'none', borderRadius: 8, padding: '7px 12px',
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>
      <span>{icon}</span><span>{label}</span>
    </button>
  )
}
