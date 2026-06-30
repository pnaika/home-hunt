// A "household" is the sharing/isolation boundary for this app — no login,
// just a short memorable code in the URL (e.g. /h/sunset-meadow-42) that
// scopes every property/comment/vote/price-check to that group. Anyone with
// the link can join; there is no password and no real access control beyond
// "you have to know the code." This is intentionally lightweight — see
// docs/TRD.md for the tradeoffs vs. real auth.

const ADJECTIVES = [
  'sunny', 'quiet', 'cozy', 'golden', 'misty', 'maple', 'cedar', 'willow',
  'amber', 'coral', 'autumn', 'gentle', 'lively', 'merry', 'breezy', 'rustic',
  'sunset', 'meadow', 'harbor', 'pebble', 'hazel', 'birch', 'clover', 'lantern',
]
const NOUNS = [
  'meadow', 'cottage', 'harbor', 'orchard', 'ridge', 'brook', 'porch', 'garden',
  'hollow', 'trail', 'creek', 'grove', 'haven', 'nest', 'cabin', 'glen',
  'house', 'home', 'place', 'corner', 'view', 'path', 'field', 'lane',
]

// Generates a friendly random code like "sunny-meadow-42" — easy to read
// aloud, easy to type, low collision risk for a tool with dozens of users
// not thousands.
export function generateHouseholdCode() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10 // 10-99
  return `${adj}-${noun}-${num}`
}

const STORAGE_KEY = 'home_hunt_household_code'

export function getStoredHouseholdCode() {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

export function setStoredHouseholdCode(code) {
  try { localStorage.setItem(STORAGE_KEY, code) } catch {}
}

// A household code is a lowercase slug: letters, numbers, hyphens only,
// reasonable length bounds. Validated before ever sending to Supabase.
export function isValidHouseholdCode(code) {
  if (!code || typeof code !== 'string') return false
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(code) && code.length >= 3 && code.length <= 64
}

export function normalizeHouseholdCode(code) {
  if (!code) return ''
  return code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}
