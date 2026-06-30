// Determines how "stale" a property's price data is, so the UI can nudge
// the user to ask Claude for a recheck. Properties under active consideration
// (not Probably Pass, not deleted) older than the threshold get flagged.
const STALE_DAYS = 14

export function daysSince(isoString) {
  if (!isoString) return Infinity
  const then = new Date(isoString).getTime()
  if (isNaN(then)) return Infinity
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
}

export function getStaleness(property) {
  // Use lastCheckedAt if set, otherwise fall back to dateAdded
  const refDate = property.lastCheckedAt || property.dateAddedISO || null
  const days = refDate ? daysSince(refDate) : daysSince(property.dateAdded)
  const isActive = property.verdict !== 'Probably pass' && !property.deleted
  return {
    days: isFinite(days) ? days : null,
    isStale: isActive && isFinite(days) && days >= STALE_DAYS,
  }
}

export function getStaleProperties(properties) {
  return properties.filter(p => getStaleness(p).isStale)
}
