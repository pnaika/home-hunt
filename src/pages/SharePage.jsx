import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { T } from '../theme.js'
import { VerdictBadge } from '../components/VerdictBadge.jsx'
import { safeDisplay } from '../safeDisplay.js'
import { downloadPropertyPdf } from '../generatePdf.js'

const CRITERIA_LABELS = { beds: '3+ Beds', backyard: 'Fenceable Yard', school: 'School 7+', budget: '≤$750K', yearBuilt: 'Built 2010+' }
const SCORE_BG = { '✅': T.greenSoft, '⚠️': T.amberSoft, '❌': T.redSoft }

function Row({ label, value }) {
  const v = safeDisplay(value)
  if (!v) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderLight}`, gap: 12 }}>
      <span style={{ fontSize: 13, color: T.textSoft, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, textAlign: 'right', whiteSpace: 'pre-wrap' }}>{v}</span>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '4px 16px' }}>{children}</div>
    </div>
  )
}

export function SharePage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/get-property?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setProperty(d.property)
      })
      .catch(() => setError('Could not load this property'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: T.slateLight, fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
    </div>
  )

  if (error || !property) return (
    <div style={{ minHeight: '100vh', background: T.offWhite, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontWeight: 700, color: T.textMid }}>{error || 'Property not found'}</div>
      <div style={{ fontSize: 13, color: T.textSoft }}>This link may be invalid or the property was removed.</div>
    </div>
  )

  const offerText = property.offerRangeLow && property.offerRangeHigh
    ? `$${Number(property.offerRangeLow).toLocaleString()} – $${Number(property.offerRangeHigh).toLocaleString()}`
    : null

  return (
    <div style={{ minHeight: '100vh', background: T.offWhite }}>
      <div style={{ background: T.navy, padding: '24px 20px 28px' }}>
        <div style={{ fontSize: 11, color: T.slateLight, marginBottom: 8, fontWeight: 600 }}>🏡 HOME HUNT — SHARED REPORT</div>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: '#fff', lineHeight: 1.25, marginBottom: 8 }}>
          {safeDisplay(property.address)}
        </div>
        <div style={{ color: T.slateLight, fontSize: 13, marginBottom: 14 }}>{safeDisplay(property.propertyType)}</div>
        <VerdictBadge verdict={property.verdict} />
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', marginTop: 16 }}>
          {[
            property.price && { l: 'Price', v: `$${Number(property.price).toLocaleString()}`, big: true },
            property.beds && { l: 'Beds', v: property.beds },
            property.baths && { l: 'Baths', v: property.baths },
            property.sqft && { l: 'Sqft', v: Number(property.sqft).toLocaleString() },
          ].filter(Boolean).map(({ l, v, big }) => (
            <div key={l} style={{ marginRight: 20, marginTop: 8 }}>
              <div style={{ fontWeight: big ? 800 : 700, fontSize: big ? 22 : 17, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 10, color: T.slateLight, textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => downloadPropertyPdf(property)} style={{
          marginTop: 16, background: T.navyMid, color: '#fff', border: 'none',
          borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>📄 Download PDF</button>
      </div>

      <div style={{ padding: '20px 16px 50px', maxWidth: 600, margin: '0 auto' }}>
        <Block title="🎯 Criteria">
          {Object.entries(property.criteria || {}).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ fontSize: 13, color: T.textMid }}>{CRITERIA_LABELS[key] || key}</span>
              <span style={{ fontSize: 17 }}>{typeof val === 'string' ? val : '—'}</span>
            </div>
          ))}
        </Block>

        <Block title="📋 Property Details">
          <Row label="Year Built" value={property.yearBuilt} />
          <Row label="Lot Size" value={property.lotSize} />
          <Row label="Taxes/yr" value={property.propertyTaxes} />
          <Row label="Heating/Cooling" value={property.heating} />
          <Row label="Price History" value={property.priceHistory} />
        </Block>

        {property.backyardRead && (
          <Block title="🌿 Backyard"><Row value={property.backyardRead} /></Block>
        )}

        <Block title="🏫 School">
          <Row label="Elementary" value={property.school} />
          <Row label="GreatSchools Rating" value={property.schoolRating ? `${property.schoolRating}/10` : null} />
          <Row label="District" value={property.schoolDist} />
        </Block>

        <Block title="🏘️ HOA">
          <Row label="Monthly Dues" value={property.hoaDues} />
          <Row label="Ownership Type" value={property.hoaOwnershipType} />
          <Row label="Management" value={property.hoaManagement} />
          <Row label="Reserve Study" value={property.hoaReserveStudy} />
        </Block>

        {offerText && (
          <Block title="🤝 Negotiation">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 13, color: T.textMid, fontWeight: 600 }}>Suggested Offer</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{offerText}</span>
            </div>
          </Block>
        )}

        {property.watchOuts && (
          <Block title="⚠️ Watch-outs"><Row value={property.watchOuts} /></Block>
        )}

        <div style={{ fontSize: 11, color: T.slateLight, textAlign: 'center', marginTop: 20 }}>
          Generated by Home Hunt Tracker · Research only, not licensed agent advice
        </div>
      </div>
    </div>
  )
}
