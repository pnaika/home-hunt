import { VERDICT_CONFIG } from '../constants.js'

export function VerdictBadge({ verdict }) {
  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['Worth a look']
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 99, padding: '4px 13px',
      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {verdict}
    </span>
  )
}
