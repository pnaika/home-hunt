import { VerdictBadge } from './VerdictBadge.jsx'
import { CRITERIA_LABELS, SCORE_COLOR } from '../constants.js'

function SH({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: 1.1, margin: '20px 0 8px',
    }}>{children}</div>
  )
}

function Row({ label, value, accent }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', padding: '9px 0',
      borderBottom: '1px solid #f1f5f9', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: accent ? 800 : 600,
        color: accent ? '#0f172a' : '#1e293b',
        textAlign: 'right', lineHeight: 1.4,
      }}>{value}</span>
    </div>
  )
}

function Blk({ bg = '#f8fafc', border, children }) {
  return (
    <div style={{
      background: bg, border: border ? `1.5px solid ${border}` : 'none',
      borderRadius: 12, padding: '2px 16px 10px', marginBottom: 2,
    }}>{children}</div>
  )
}

function TextBlk({ bg, border, text }) {
  if (!text) return null
  return (
    <div style={{
      background: bg || '#f8fafc',
      border: border ? `1.5px solid ${border}` : 'none',
      borderRadius: 12, padding: '12px 16px',
      fontSize: 14, color: '#1e293b', lineHeight: 1.75, whiteSpace: 'pre-wrap',
    }}>{text}</div>
  )
}

export function DetailPanel({ property, onEdit, onDelete, onFav }) {
  if (!property) return null

  const fmt$ = v => v && !isNaN(v) ? `$${Number(v).toLocaleString()}` : v || null
  const offerText = property.offerRangeLow && property.offerRangeHigh
    ? `${fmt$(property.offerRangeLow)} – ${fmt$(property.offerRangeHigh)}`
    : '—'

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', lineHeight: 1.3, marginBottom: 4 }}>
            🏠 {property.address}
          </div>
          <div style={{ color: '#64748b', fontSize: 14 }}>{property.propertyType}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {onFav && (
            <button onClick={() => onFav(property)} title={property.favourite ? 'Remove favourite' : 'Add to favourites'} style={{
              background: property.favourite ? '#fefce8' : '#f8fafc',
              border: property.favourite ? '1.5px solid #fde047' : '1.5px solid #e2e8f0',
              borderRadius: 9, padding: '9px 14px', fontSize: 18, cursor: 'pointer',
            }}>{property.favourite ? '⭐' : '☆'}</button>
          )}
          <button onClick={() => onEdit(property)} style={{
            background: '#3b5bdb', color: '#fff', border: 'none',
            borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>✏️ Edit</button>
          {onDelete && (
            <button onClick={() => onDelete(property)} style={{
              background: '#fef2f2', color: '#dc2626',
              border: '1.5px solid #fca5a5', borderRadius: 9,
              padding: '9px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>🗑️</button>
          )}
        </div>
      </div>

      {/* Quick links */}
      {property.address && (() => {
        const encoded = encodeURIComponent(property.address)
        const redfin = `https://www.redfin.com/search#location=${encoded}`
        const zillow = `https://www.zillow.com/homes/${encoded}_rb/`
        return (
          <div style={{ display: 'flex', gap: 8, margin: '10px 0 14px' }}>
            <a href={redfin} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#dc2626', color: '#fff', textDecoration: 'none',
              borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700,
            }}>
              <span>🏠</span> Redfin
            </a>
            <a href={zillow} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#1d4ed8', color: '#fff', textDecoration: 'none',
              borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700,
            }}>
              <span>🔵</span> Zillow
            </a>
          </div>
        )
      })()}
      <VerdictBadge verdict={property.verdict} />

      {/* Photo strip */}
      {(() => {
        const imgs = property.images || []
        const addr = encodeURIComponent(property.address || '')
        const streetView = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${addr}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}`
        const hasGoogle = !!import.meta.env.VITE_GOOGLE_MAPS_KEY
        if (!imgs.length && !hasGoogle) return null
        return (
          <div style={{ margin: '14px 0' }}>
            {/* Listing photos */}
            {imgs.length > 0 && (
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                paddingBottom: 6, marginBottom: hasGoogle ? 8 : 0,
                scrollbarWidth: 'none',
              }}>
                {imgs.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                    <img
                      src={src} alt={`Photo ${i + 1}`}
                      style={{ height: 140, width: 210, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  </a>
                ))}
              </div>
            )}
            {/* Street View */}
            {hasGoogle && (
              <a href={`https://www.google.com/maps/@?api=1&map_action=pano&parameters&query=${addr}`} target="_blank" rel="noreferrer">
                <img
                  src={streetView} alt="Street View"
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>📍 Street View — tap to open in Maps</div>
              </a>
            )}
          </div>
        )
      })()}

      {/* Snapshot */}
      <SH>📋 Snapshot</SH>
      <Blk>
        <Row label="Price" value={fmt$(property.price)} accent />
        <Row label="Beds / Baths" value={`${property.beds || '—'} bd / ${property.baths || '—'} ba`} />
        <Row label="Size" value={property.sqft ? `${Number(property.sqft).toLocaleString()} sqft` : null} />
        <Row label="Lot" value={property.lotSize} />
        <Row label="Year Built" value={property.yearBuilt} />
        <Row label="$/sqft" value={property.pricePerSqft ? `$${property.pricePerSqft}` : null} />
        <Row label="Days on Market" value={property.dom} />
        <Row label="Last Sold" value={property.lastSoldPrice && property.lastSoldDate ? `${property.lastSoldPrice} (${property.lastSoldDate})` : null} />
        <Row label="Property Taxes" value={property.propertyTaxes} />
        <Row label="Heating / Cooling" value={property.heating} />
        <Row label="Parking" value={property.parking} />
        <Row label="Price History" value={property.priceHistory} />
      </Blk>

      {/* Scorecard */}
      <SH>🎯 Criteria Scorecard</SH>
      <Blk>
        {Object.entries(property.criteria || {}).map(([key, val]) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: 15, color: '#334155', fontWeight: 500 }}>
              {CRITERIA_LABELS[key] || key}
            </span>
            <span style={{ fontSize: 20, color: SCORE_COLOR[val] }}>{val}</span>
          </div>
        ))}
      </Blk>

      {/* Backyard */}
      {property.backyardRead && (
        <><SH>🌿 Backyard Read</SH><TextBlk bg="#f0fdf4" border="#86efac" text={property.backyardRead} /></>
      )}

      {/* School */}
      <SH>🏫 School</SH>
      <Blk>
        <Row label="Elementary" value={property.school} accent />
        <Row label="GreatSchools Rating" value={property.schoolRating ? `${property.schoolRating}/10` : null} accent={!!property.schoolRating} />
        <Row label="District" value={property.schoolDist} />
        <Row label="Distance" value={property.schoolDistance} />
      </Blk>

      {/* Commute */}
      <SH>🚗 Commute</SH>
      <Blk bg="#eff6ff" border="#bfdbfe">
        <Row label="La Petite, Lynnwood — Primary" value={property.commuteLaPetite} accent />
        <Row label="Amazon Nitro North, Bothell" value={property.commuteBothell} />
        <div style={{ fontSize: 12, color: '#6b7280', padding: '6px 0 2px' }}>
          ⚠️ Estimates only — not live traffic. I-5 AM peak runs heavier.
        </div>
      </Blk>

      {/* Comps */}
      {(property.compsRead || property.marketTrend) && (
        <><SH>📊 Comps & Pricing</SH>
          <Blk>
            {property.compsRead && (
              <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, padding: '8px 0 4px' }}>
                {property.compsRead}
              </div>
            )}
            <Row label="Market Trend" value={property.marketTrend} />
          </Blk>
        </>
      )}

      {/* HOA */}
      <SH>🏘️ HOA</SH>
      <Blk>
        <Row label="Monthly Dues" value={property.hoaDues ? (isNaN(property.hoaDues) ? property.hoaDues : `$${property.hoaDues}/mo`) : null} accent />
        <Row label="What Dues Cover" value={property.hoaCovers} />
        <Row label="Ownership Type" value={property.hoaOwnershipType} />
        <Row label="Layered HOA?" value={property.hoaLayered} />
        <Row label="Management Co." value={property.hoaManagement} />
        <Row label="Phone" value={property.hoaManagementPhone} />
        <Row label="Website / Portal" value={property.hoaManagementWeb} />
        <Row label="Reserve Study" value={property.hoaReserveStudy} />
        <Row label="Special Assessments" value={property.hoaSpecialAssessments} />
        <Row label="Rental Cap" value={property.hoaRentalCap} />
        <Row label="HO-6 Required?" value={property.hoaHO6Required} />
      </Blk>
      {property.hoaFlags && (
        <div style={{
          background: '#fefce8', border: '1.5px solid #fde047',
          borderRadius: 12, padding: '12px 16px', marginTop: 4,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#854d0e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            🔎 HOA Must-Knows
          </div>
          <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {property.hoaFlags}
          </div>
        </div>
      )}

      {/* Negotiation */}
      <SH>🤝 Negotiation</SH>
      <Blk bg="#eff6ff" border="#bfdbfe">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0', borderBottom: '1px solid #dbeafe',
        }}>
          <span style={{ fontSize: 14, color: '#1e40af', fontWeight: 700 }}>🎯 Suggested Offer Range</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{offerText}</span>
        </div>
        {property.negotiationRead && (
          <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.75, padding: '10px 0 4px' }}>
            {property.negotiationRead}
          </div>
        )}
      </Blk>

      {/* Watch-outs */}
      {property.watchOuts && (
        <><SH>⚠️ Watch-outs & Must-Get Docs</SH>
          <TextBlk bg="#fef2f2" border="#fca5a5" text={property.watchOuts} /></>
      )}

      {/* Notes */}
      {property.notes && (
        <><SH>📝 Research Notes</SH>
          <TextBlk bg="#fffbeb" border="#fde68a" text={property.notes} /></>
      )}

      {property.dateAdded && (
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 20, paddingBottom: 8 }}>
          Added {property.dateAdded}
        </div>
      )}
    </div>
  )
}
