const SYSTEM_PROMPT = `You are a data extractor for a real estate property tracker.
The user will paste a home deep-dive research report. Extract ALL fields into a JSON object.

Return ONLY valid JSON, no markdown, no backticks, no explanation. Use exactly these keys:
address, propertyType, price (number string, no $), beds, baths, sqft (number string), lotSize,
yearBuilt, pricePerSqft (number string), dom, lastSoldPrice, lastSoldDate, propertyTaxes,
heating, parking, priceHistory,
verdict (must be exactly one of: "Strong fit", "Worth a look", "Probably pass"),
criteria (object with keys: beds, backyard, school, budget, yearBuilt — values must be exactly "✅", "⚠️", or "❌"),
backyardRead, school, schoolRating (just the number e.g. "9"), schoolDist, schoolDistance,
commuteLaPetite, commuteBothell, compsRead, marketTrend,
hoaDues (number string if known, else descriptive text), hoaCovers, hoaOwnershipType, hoaLayered,
hoaManagement, hoaManagementPhone, hoaManagementWeb,
hoaReserveStudy, hoaSpecialAssessments, hoaRentalCap, hoaHO6Required, hoaFlags,
offerRangeLow (number string, no $), offerRangeHigh (number string, no $),
negotiationRead, watchOuts, notes.

For missing fields use "". For price/sqft/offer fields extract just digits (e.g. "750000" not "$750,000").
Combine all HOA must-know flags into hoaFlags as a single numbered string.
Put the full negotiation strategy in negotiationRead.
Put watch-outs and must-get docs in watchOuts.
Put the overall verdict summary in notes.`

export async function parseReportWithClaude(reportText) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Extract all fields from this home deep-dive report:\n\n${reportText}` }],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Anthropic API error')
  }

  const data = await response.json()
  const text = data.content?.find(b => b.type === 'text')?.text || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
