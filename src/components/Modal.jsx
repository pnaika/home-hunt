export function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        zIndex: 100, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580,
          maxHeight: '92vh', overflow: 'auto', padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
