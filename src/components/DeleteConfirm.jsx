export function DeleteConfirm({ property, onConfirm, onCancel }) {
  if (!property) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        maxWidth: 340, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
        <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
          Remove this property?
        </div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 22, lineHeight: 1.5 }}>
          <strong>{property.address?.split(',')[0]}</strong>
          <br />This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: '#f1f5f9', color: '#475569',
            border: 'none', borderRadius: 10, padding: '12px 0',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: 10, padding: '12px 0',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
