import { T } from '../theme.js'

export function VerdictBadge({ verdict, size = 'md' }) {
  const cfg = T.verdict[verdict] || T.verdict['Worth a look']
  const pad = size === 'sm' ? '3px 10px' : '5px 14px'
  const fs = size === 'sm' ? 11 : 13
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 99, padding: pad,
      fontSize: fs, fontWeight: 700, whiteSpace: 'nowrap',
      letterSpacing: 0.1,
    }}>
      {cfg.icon} {verdict}
    </span>
  )
}
