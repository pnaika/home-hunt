// Shared mortgage math — used by both the full MortgageCalculator (detail page,
// user-adjustable inputs) and the compact estimate shown on PropertyCard
// (list page, fixed defaults, no user interaction).

export const DEFAULT_RATE = 6.49 // Freddie Mac 30-yr fixed avg, updated periodically
export const DEFAULT_DOWN_PCT = 20
export const DEFAULT_YEARS = 30
export const DEFAULT_PMI_RATE = 0.6 // % of loan/year, only applies if down payment < 20%

// Extracts a usable annual tax dollar figure from a free-text field like
// "$4,171/yr (2024)" or "~$6,500–7,000/yr (estimate)". Falls back to the
// given default (typically 1% of price) if nothing parseable is found, or
// if the parsed number looks implausible (e.g. a year, not a tax amount).
export function extractTaxAmount(raw, fallback) {
  if (!raw) return fallback
  const str = String(raw)
  const match = str.match(/\$?\s*([\d,]+(?:\.\d+)?)/)
  if (!match) return fallback
  const num = Number(match[1].replace(/,/g, ''))
  if (!num || isNaN(num)) return fallback
  if (num < 200 || num > 100000) return fallback
  return num
}

// Core P&I + tax + insurance + HOA + PMI calculation. Pure function, no React.
export function calcMortgage({ price, downPct, rate, years, annualTax, annualInsurance, hoa, pmiRate }) {
  const downPayment = price * (downPct / 100)
  const loanAmount = price - downPayment
  const monthlyRate = rate / 100 / 12
  const numPayments = years * 12

  const monthlyPI = loanAmount <= 0 ? 0 : monthlyRate === 0
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
}

// Quick estimate using fixed defaults — for places (like the list page card)
// where there's no room for user-adjustable inputs. Returns null if there's
// no price to calculate from.
export function estimateMonthlyCost(property) {
  const price = Number(property.price) || 0
  if (!price) return null

  const taxFallback = Math.round(price * 0.01)
  const annualTax = extractTaxAmount(property.propertyTaxes, taxFallback)
  const annualInsurance = Math.round(price * 0.0035) || 1200
  const hoa = property.hoaDues && !isNaN(property.hoaDues) ? Number(property.hoaDues) : 0

  const { totalMonthly } = calcMortgage({
    price,
    downPct: DEFAULT_DOWN_PCT,
    rate: DEFAULT_RATE,
    years: DEFAULT_YEARS,
    annualTax,
    annualInsurance,
    hoa,
    pmiRate: DEFAULT_PMI_RATE,
  })

  return Math.round(totalMonthly)
}
