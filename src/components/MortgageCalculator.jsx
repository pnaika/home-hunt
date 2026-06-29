import { useState, useMemo } from 'react'
import { T } from '../theme.js'

const DEFAULT_RATE = 6.49 // Freddie Mac 30-yr fixed avg, updated periodically

function extractTaxAmount(raw, fallback) {
  if (!raw) return fallback
  const str = String(raw)
  // Match the first $-prefixed number (with optional commas/decimals), e.g. "$4,171" from "$4,171/yr (2024)"
  // or the first number before a range dash, e.g. "6,500" from "~$6,500–7,000/yr"
  const match = str.match(/\$?\s*([\d,]+(?:\.\d+)?)/)
  if (!match) return fallback
  const num = Number(match[1].replace(/,/g, ''))
  if (!num || isNaN(num)) return fallback
  // Sanity check: property taxes are realistically $500–$50,000/yr.
  // If parsed number looks like a year (e.g. 2024) or is absurdly large/small, use fallback.
  if (num < 200 || num > 100000) return fallback
  return num
}

export function MortgageCalculator({ property }) {
  const price = Number(property.price) || 0
  const taxFallback = Math.round(price * 0.01)
  const defaultTax = extractTaxAmount(property.propertyTaxes, taxFallback)
  const taxIsEstimate = defaultTax === taxFallback && !!price
  const defaultHoa = property.hoaDues && !isNaN(property.hoaDues) ? Number(property.hoaDues) : 0

  const [downPct, setDownPct] = useState(20)
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [years, setYears] = useState(30)
  const [annualTax, setAnnualTax] = useState(defaultTax)
  const [annualInsurance, setAnnualInsurance] = useState(Math.round(price * 0.0035) || 1200)
  const [hoa, setHoa] = useState(defaultHoa)
  const [pmiRate, setPmiRate] = useState(0.6) // % of loan/year, only if <20% down

  const calc = useMemo(() => {
    const downPayment = price * (downPct / 100)
    const loanAmount = price - downPayment
    const monthlyRate = rate / 100 / 12
    const numPayments = years * 12

    const monthlyPI = monthlyRate === 0
      ? loanAmount / numPayments
      : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)

    const monthlyTax = annualTax / 12
    const monthlyInsurance = annualInsurance / 12
    const needsPMI = downPct < 20
    const monthlyPMI = needsPMI ? (loanAmount * (pmiRate / 100)) / 12 : 0

    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + hoa + monthlyPMI
    const totalInterest = (monthlyPI * numPayments) - loanAmount

    return {
      downPayment, loanAmount, monthlyPI, monthlyTax, monthlyInsurance,
      monthlyPMI, needsPMI, totalMonthly, totalInterest,
    }
  }, [price, downPct, rate, years, annualTax, annualInsurance, hoa, pmiRate])

  const fmt = n => `$${Math.round(n).toLocaleString()}`

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: `1.5px solid ${T.border}`,
    borderRadius: 8, padding: '7px 10px', fontSize: 13, color: T.text,
    background: T.offWhite, outline: 'none',
  }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: T.textSoft, marginBottom: 4, display: 'block' }

  if (!price) return (
    <div style={{ fontSize: 13, color: T.textSoft, fontStyle: 'italic', padding: '8px 0' }}>
      Add a list price to use the calculator
    </div>
  )

  return (
    <div>
      {/* Total monthly — big number */}
      <div style={{
        background: T.navy, borderRadius: 14, padding: '20px 18px',
        marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: T.slateLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
          True Monthly Cost
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, fontFamily: "'DM Serif Display', serif" }}>
          {fmt(calc.totalMonthly)}
        </div>
        <div style={{ fontSize: 11, color: T.slateLight, marginTop: 4 }}>
          per month · {rate}% APR · {years}yr fixed
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {[
          ['Principal & Interest', calc.monthlyPI],
          ['Property Tax', calc.monthlyTax],
          ['Home Insurance', calc.monthlyInsurance],
          calc.needsPMI && ['PMI', calc.monthlyPMI],
          hoa > 0 && ['HOA Dues', hoa],
        ].filter(Boolean).map(([label, val], i, arr) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
            borderBottom: i < arr.length - 1 ? `1px solid ${T.borderLight}` : 'none',
          }}>
            <span style={{ fontSize: 13, color: T.textSoft }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(val)}/mo</span>
          </div>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Down Payment %</label>
          <input type="number" value={downPct} onChange={e => setDownPct(Number(e.target.value))} style={inputStyle} />
          <div style={{ fontSize: 11, color: T.textSoft, marginTop: 3 }}>{fmt(calc.downPayment)}</div>
        </div>
        <div>
          <label style={labelStyle}>Interest Rate %</label>
          <input type="number" step="0.01" value={rate} onChange={e => setRate(Number(e.target.value))} style={inputStyle} />
          <div style={{ fontSize: 11, color: T.textSoft, marginTop: 3 }}>Freddie Mac avg: 6.49%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Loan Term</label>
          <select value={years} onChange={e => setYears(Number(e.target.value))} style={inputStyle}>
            <option value={30}>30 years</option>
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Loan Amount</label>
          <div style={{ ...inputStyle, background: T.borderLight, display: 'flex', alignItems: 'center' }}>{fmt(calc.loanAmount)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>
            Annual Property Tax {taxIsEstimate && <span style={{ color: T.amber, fontWeight: 600 }}>(est. 1% of price)</span>}
          </label>
          <input type="number" value={annualTax} onChange={e => setAnnualTax(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Annual Insurance</label>
          <input type="number" value={annualInsurance} onChange={e => setAnnualInsurance(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>HOA Dues / mo</label>
          <input type="number" value={hoa} onChange={e => setHoa(Number(e.target.value))} style={inputStyle} />
        </div>
        {calc.needsPMI && (
          <div>
            <label style={labelStyle}>PMI Rate % /yr</label>
            <input type="number" step="0.1" value={pmiRate} onChange={e => setPmiRate(Number(e.target.value))} style={inputStyle} />
          </div>
        )}
      </div>

      {calc.needsPMI && (
        <div style={{ background: T.amberSoft, border: `1.5px solid ${T.amberBorder}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#854D0E', marginBottom: 12 }}>
          ⚠️ Down payment under 20% — PMI applies (~{fmt(calc.monthlyPMI)}/mo). PMI typically drops off once you reach 20% equity.
        </div>
      )}

      <div style={{ fontSize: 11, color: T.textSoft, lineHeight: 1.6 }}>
        Total interest over {years} years: <strong>{fmt(calc.totalInterest)}</strong><br />
        Rate shown is the national average — your actual rate depends on credit score, down payment, and lender. Not a loan offer or pre-qualification.
      </div>
    </div>
  )
}
