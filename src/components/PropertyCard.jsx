import { useNavigate } from 'react-router-dom'
import { VerdictBadge } from './VerdictBadge.jsx'
import { T } from '../theme.js'
import { safeDisplay } from '../safeDisplay.js'

const SCORE_COLOR = { '✅': T.green, '⚠️': T.amber, '❌': T.red }

export function PropertyCard({ property, onEdit, onDelete, onFav }) {
  const navigate = useNavigate()
  const v = T.verdict[property.verdict] || T.verdict['Worth a look']

  return (
    <div
      onClick={() => navigate(`/property/${property.id}`)}
      style={{
        background: T.card,
        borderRadius: 16,
        marginBottom: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(10,22,40,0.08), 0 1px 2px rgba(10,22,40,0.06)',
        transition: 'box-shadow 0.2s, transform 0.15s',
        borderLeft: `4px solid ${v.color}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,22,40,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,22,40,0.08)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ padding: '14px 16px 12px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.35, marginBottom: 2 }}>
              {safeDisplay(property.address)}
            </div>
            <div style={{ color: T.textSoft, fontSize: 12 }}>{safeDisplay(property.propertyType)}</div>
          </div>
          <VerdictBadge verdict={property.verdict} size="sm" />
        </div>

        {property.priceChangeFlag && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: T.greenSoft, color: T.green, fontSize: 11, fontWeight: 700,
            borderRadius: 6, padding: '3px 8px', marginBottom: 8,
          }}>{safeDisplay(property.priceChangeFlag)}</div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 800, color: T.text, fontSize: 17, letterSpacing: -0.3 }}>
            {property.price ? `$${Number(property.price).toLocaleString()}` : '—'}
          </span>
          {property.beds && <Stat label="bd" value={property.beds} />}
          {property.baths && <Stat label="ba" value={property.baths} />}
          {property.sqft && <Stat label="sqft" value={Number(property.sqft).toLocaleString()} />}
          {property.pricePerSqft && <Stat label="/sqft" value={`$${property.pricePerSqft}`} />}
        </div>

        {/* Criteria pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(property.criteria || {}).map(([k, v]) => (
            <span key={k} style={{
              fontSize: 11, fontWeight: 600,
              color: SCORE_COLOR[v] || T.textSoft,
              background: v === '✅' ? T.greenSoft : v === '❌' ? T.redSoft : T.amberSoft,
              borderRadius: 6, padding: '2px 7px',
            }}>{v}</span>
          ))}
          {property.dom && (
            <span style={{ fontSize: 11, color: T.textSoft, marginLeft: 'auto' }}>
              {safeDisplay(property.dom)} DOM
            </span>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        borderTop: `1px solid ${T.borderLight}`,
        padding: '8px 14px',
        display: 'flex', justifyContent: 'flex-end', gap: 2,
        background: '#FAFAF9',
      }}>
        <ActionBtn icon={property.favourite ? '⭐' : '☆'} active={property.favourite}
          onClick={e => { e.stopPropagation(); onFav(property) }} title={property.favourite ? 'Unfavourite' : 'Favourite'} />
        <ActionBtn icon="✏️" onClick={e => { e.stopPropagation(); onEdit(property) }} title="Edit" />
        <ActionBtn icon="🗑️" onClick={e => { e.stopPropagation(); onDelete(property) }} title="Delete" />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <span style={{ fontSize: 12, color: T.textSoft }}>
      <span style={{ fontWeight: 600, color: T.textMid }}>{value}</span> {label}
    </span>
  )
}

function ActionBtn({ icon, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 16, padding: '4px 8px', borderRadius: 8,
      opacity: active === false ? 0.35 : 1,
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = T.borderLight}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >{icon}</button>
  )
}
