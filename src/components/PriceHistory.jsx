import { useState, useEffect } from 'react'
import { fetchPriceChecks } from '../supabase.js'
import { T } from '../theme.js'

export function PriceHistoryChart({ property, householdId }) {
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    fetchPriceChecks(householdId, property.id).then(data => {
      setChecks(data)
      setLoading(false)
    })
  }, [property.id, householdId])

  if (loading) return <div style={{ fontSize: 13, color: T.textSoft }}>Loading...</div>
  if (checks.length < 2) {
    return (
      <div style={{ fontSize: 13, color: T.textSoft, fontStyle: 'italic', padding: '8px 0' }}>
        No price history yet — recheck this property at least twice to see a trend.
      </div>
    )
  }

  const prices = checks.map(c => Number(c.price)).filter(p => !isNaN(p))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const width = 100 // percent-based, scales with container
  const height = 80
  const points = checks.map((c, i) => {
    const x = (i / (checks.length - 1)) * width
    const y = height - ((Number(c.price) - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const latest = checks[checks.length - 1]
  const first = checks[0]
  const totalChange = Number(latest.price) - Number(first.price)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Change</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalChange < 0 ? T.green : totalChange > 0 ? T.red : T.text }}>
            {totalChange < 0 ? '↓' : totalChange > 0 ? '↑' : '—'} ${Math.abs(totalChange).toLocaleString()}
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.textSoft, textAlign: 'right' }}>
          {checks.length} checks<br />since {new Date(first.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 80, display: 'block' }} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={totalChange < 0 ? T.green : totalChange > 0 ? T.red : T.blue}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {checks.map((c, i) => {
          const x = (i / (checks.length - 1)) * width
          const y = height - ((Number(c.price) - min) / range) * height
          return <circle key={i} cx={x} cy={y} r="2" fill={totalChange < 0 ? T.green : totalChange > 0 ? T.red : T.blue} vectorEffect="non-scaling-stroke" />
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSoft, marginTop: 4 }}>
        <span>${min.toLocaleString()}</span>
        <span>${max.toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 12 }}>
        {checks.slice().reverse().map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            borderBottom: i < checks.length - 1 ? `1px solid ${T.borderLight}` : 'none', fontSize: 12,
          }}>
            <span style={{ color: T.textSoft }}>{new Date(c.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style={{ fontWeight: 600, color: T.text }}>${Number(c.price).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
