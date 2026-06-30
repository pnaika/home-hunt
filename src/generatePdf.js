import { jsPDF } from 'jspdf'
import { safeDisplay } from './safeDisplay.js'

const CRITERIA_LABELS = { beds: '3+ Beds', backyard: 'Fenceable Yard', school: 'School 7+', budget: '≤$750K Budget', yearBuilt: 'Built 2010+' }

function s(v) {
  const out = safeDisplay(v)
  return out === null || out === undefined ? '' : String(out)
}

export function generatePropertyPdf(property) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }
  }

  function heading(text, size = 13) {
    checkPageBreak(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(15, 23, 42)
    doc.text(text, margin, y)
    y += size * 0.9
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y, pageWidth - margin, y)
    y += 14
  }

  function row(label, value) {
    if (!value) return
    checkPageBreak(16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(100, 116, 139)
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    const lines = doc.splitTextToSize(String(value), contentWidth - 160)
    doc.text(lines, margin + 160, y)
    y += Math.max(14, lines.length * 12)
  }

  function paragraph(text) {
    if (!text) return
    checkPageBreak(20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)
    const lines = doc.splitTextToSize(String(text), contentWidth)
    lines.forEach(line => {
      checkPageBreak(13)
      doc.text(line, margin, y)
      y += 13
    })
    y += 6
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(10, 22, 40)
  doc.rect(0, 0, pageWidth, 90, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  const addrLines = doc.splitTextToSize(s(property.address) || 'Property', contentWidth)
  doc.text(addrLines, margin, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(148, 163, 184)
  doc.text(s(property.propertyType) || '', margin, 36 + addrLines.length * 16 + 6)
  // Verdict badge text
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(`Verdict: ${s(property.verdict) || '—'}`, pageWidth - margin - 140, 36)
  y = 110

  // ── Snapshot ─────────────────────────────────────────────────────────────────
  heading('Snapshot')
  row('Price', property.price ? `$${Number(property.price).toLocaleString()}` : s(property.price))
  row('Beds / Baths', `${s(property.beds) || '—'} / ${s(property.baths) || '—'}`)
  row('Square Feet', property.sqft ? Number(property.sqft).toLocaleString() : s(property.sqft))
  row('Lot Size', s(property.lotSize))
  row('Year Built', s(property.yearBuilt))
  row('$ / sqft', property.pricePerSqft ? `$${property.pricePerSqft}` : '')
  row('Days on Market', s(property.dom))
  row('Property Taxes', s(property.propertyTaxes))
  row('Heating / Cooling', s(property.heating))
  row('Parking', s(property.parking))
  row('Price History', s(property.priceHistory))
  row('MLS #', s(property.mlsNumber))
  y += 4

  // ── Criteria ─────────────────────────────────────────────────────────────────
  heading('Criteria Scorecard')
  Object.entries(property.criteria || {}).forEach(([key, val]) => {
    const safeVal = typeof val === 'string' ? val : '?'
    row(CRITERIA_LABELS[key] || key, safeVal)
  })
  y += 4

  // ── Backyard ─────────────────────────────────────────────────────────────────
  if (property.backyardRead) { heading('Backyard'); paragraph(s(property.backyardRead)) }

  // ── School ───────────────────────────────────────────────────────────────────
  heading('School')
  row('Elementary', s(property.school))
  row('GreatSchools Rating', property.schoolRating ? `${property.schoolRating}/10` : '')
  row('District', s(property.schoolDist))
  row('Distance', s(property.schoolDistance))
  y += 4

  // ── Commute ──────────────────────────────────────────────────────────────────
  heading('Commute')
  row('La Petite, Lynnwood (primary)', s(property.commuteLaPetite))
  row('Amazon Nitro North, Seattle', s(property.commuteBothell))
  y += 4

  // ── Comps ────────────────────────────────────────────────────────────────────
  if (property.compsRead || property.marketTrend) {
    heading('Comps & Market')
    row('Market Trend', s(property.marketTrend))
    paragraph(s(property.compsRead))
  }

  // ── HOA ──────────────────────────────────────────────────────────────────────
  heading('HOA')
  row('Monthly Dues', property.hoaDues ? (isNaN(property.hoaDues) ? s(property.hoaDues) : `$${property.hoaDues}/mo`) : '')
  row('What Dues Cover', s(property.hoaCovers))
  row('Ownership Type', s(property.hoaOwnershipType))
  row('Layered HOA?', s(property.hoaLayered))
  row('Management Co.', s(property.hoaManagement))
  row('Phone', s(property.hoaManagementPhone))
  row('Reserve Study', s(property.hoaReserveStudy))
  row('Special Assessments', s(property.hoaSpecialAssessments))
  row('Rental Cap', s(property.hoaRentalCap))
  row('HO-6 Required?', s(property.hoaHO6Required))
  if (property.hoaFlags) { y += 4; paragraph('Must-Knows: ' + s(property.hoaFlags)) }
  y += 4

  // ── Negotiation ──────────────────────────────────────────────────────────────
  heading('Negotiation')
  if (property.offerRangeLow && property.offerRangeHigh) {
    row('Suggested Offer Range', `$${Number(property.offerRangeLow).toLocaleString()} – $${Number(property.offerRangeHigh).toLocaleString()}`)
  }
  paragraph(s(property.negotiationRead))

  // ── Watch-outs ───────────────────────────────────────────────────────────────
  if (property.watchOuts) { heading('Watch-outs & Must-Get Documents'); paragraph(s(property.watchOuts)) }

  // ── Realtor questions ────────────────────────────────────────────────────────
  if (property.realtorQuestions) { heading('Questions for Your Realtor'); paragraph(s(property.realtorQuestions)) }
  if (property.mustGetDocs) { heading('Must-Get Documents'); paragraph(s(property.mustGetDocs)) }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (property.notes) { heading('Research Notes'); paragraph(s(property.notes)) }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Home Hunt Tracker · Research only, not licensed agent advice · Page ${i} of ${pageCount}`,
      margin, doc.internal.pageSize.getHeight() - 24
    )
  }

  return doc
}

export function downloadPropertyPdf(property) {
  const doc = generatePropertyPdf(property)
  const filename = (s(property.address) || 'property').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60) + '.pdf'
  doc.save(filename)
}
