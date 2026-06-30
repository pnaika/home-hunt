// Parses "303 202nd Pl SE, Bothell, WA 98012" -> { city: "Bothell", state: "WA" }
// Tolerant of minor format variations (extra spaces, missing zip, unit numbers).
export function parseLocation(address) {
  if (!address || typeof address !== 'string') return { city: null, state: null }

  const parts = address.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) return { city: null, state: null }

  // City is typically the second-to-last part before "ST zip"
  const cityPart = parts[parts.length - 2] || null
  const stateZipPart = parts[parts.length - 1] || ''

  // Extract state abbreviation (2 uppercase letters) from the last part
  const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/)
  const state = stateMatch ? stateMatch[1] : null

  const city = cityPart || null

  return { city, state }
}

// Returns a sorted list of unique { city, state } combos across all properties,
// formatted for display (e.g. "Bothell, WA") and for filtering (city only,
// since state is almost always WA in this app but kept for completeness).
export function getUniqueCities(properties) {
  const seen = new Map()
  for (const p of properties) {
    if (p.deleted) continue
    const { city, state } = parseLocation(p.address)
    if (!city) continue
    const key = `${city}|${state || ''}`
    if (!seen.has(key)) seen.set(key, { city, state, label: state ? `${city}, ${state}` : city })
  }
  return Array.from(seen.values()).sort((a, b) => a.city.localeCompare(b.city))
}

export function getUniqueStates(properties) {
  const seen = new Set()
  for (const p of properties) {
    if (p.deleted) continue
    const { state } = parseLocation(p.address)
    if (state) seen.add(state)
  }
  return Array.from(seen).sort()
}
