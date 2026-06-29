import { VerdictBadge } from './VerdictBadge.jsx'

export function PropertyCard({ property, onEdit, onDelete, onSelect, onFav }) {
  return (
    <div
      onClick={() => onSelect(property)}
      style={{
        background: '#fff', border: '1.5px solid #e5e7eb',
        borderRadius: 14, padding: '15px 16px',
        cursor: 'pointer', marginBottom: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', lineHeight: 1.35, marginBottom: 3 }}>
            🏠 {property.address}
          </div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
            {property.propertyType} · {property.beds}bd/{property.baths}ba · {property.sqft ? Number(property.sqft).toLocaleString() : '—'} sqft
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>
              {property.price ? `$${Number(property.price).toLocaleString()}` : '—'}
            </span>
            {property.pricePerSqft && <span style={{ color: '#64748b', fontSize: 12 }}>${property.pricePerSqft}/sqft</span>}
            {property.dom && <span style={{ color: '#64748b', fontSize: 12 }}>· {property.dom} DOM</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <VerdictBadge verdict={property.verdict} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); onFav(property) }}
              title={property.favourite ? 'Remove favourite' : 'Add to favourites'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 5px', opacity: property.favourite ? 1 : 0.3, transition: 'opacity 0.15s' }}
            >{property.favourite ? '⭐' : '☆'}</button>
            <button
              onClick={e => { e.stopPropagation(); onEdit(property) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 5px' }}
            >✏️</button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(property) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 5px' }}
            >🗑️</button>
          </div>
        </div>
      </div>
      {property.dateAdded && (
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 8 }}>Added {property.dateAdded}</div>
      )}
    </div>
  )
}
