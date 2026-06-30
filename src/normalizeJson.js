// Self-healing normalizer for pasted Claude JSON.
// Auto-flattens common shape mistakes (nested objects, array-style strings,
// criteria key aliases) BEFORE the data ever reaches the form or storage.
// This is the second layer of defense — the renderer (safeDisplay) is the
// first layer and catches anything this misses.

const CRITERIA_KEY_ALIASES = {
  bedrooms: 'beds', bed: 'beds', beds: 'beds',
  bathroom: 'baths', bathrooms: 'baths', bath: 'baths', baths: 'baths',
  yard: 'backyard', backyard: 'backyard', fence: 'backyard', fencing: 'backyard',
  schools: 'school', school: 'school',
  price: 'budget', budget: 'budget',
  year: 'yearBuilt', built: 'yearBuilt', yearbuilt: 'yearBuilt', yearBuilt: 'yearBuilt',
}

const SCORE_ALIASES = {
  pass: '✅', yes: '✅', good: '✅', true: '✅', '✓': '✅', ok: '✅',
  fail: '❌', no: '❌', bad: '❌', false: '❌', '✗': '❌', x: '❌',
  warn: '⚠️', warning: '⚠️', maybe: '⚠️', partial: '⚠️', unsure: '⚠️',
}

// Flatten a single value: if it's an object, try common nested shapes
// (e.g. { value: "...", note: "..." } or { rating: "...", url: "..." })
// and join the useful parts into one string. Arrays get newline-joined.
function flattenValue(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'

  if (Array.isArray(v)) {
    return v.map(item => {
      if (typeof item === 'object' && item !== null) {
        // e.g. priceHistory as [{date, price}, ...] or watchOuts as [{q}, ...]
        const parts = Object.values(item).filter(x => x !== null && x !== undefined && x !== '')
        return parts.join(' — ')
      }
      return String(item)
    }).join('\n')
  }

  if (typeof v === 'object') {
    // Common nested shapes: { text }, { value }, { note }, { description }, { summary }
    const preferredKeys = ['text', 'value', 'note', 'description', 'summary', 'detail', 'amount']
    for (const k of preferredKeys) {
      if (v[k] !== undefined) return flattenValue(v[k])
    }
    // Otherwise join all primitive entries as "key: value"
    const entries = Object.entries(v).filter(([, val]) => typeof val !== 'object' || val === null)
    if (entries.length > 0) return entries.map(([k, val]) => `${k}: ${val}`).join('\n')
    return JSON.stringify(v)
  }

  return String(v)
}

// Normalize the criteria object: fix key aliases, fix score value aliases,
// and flatten if criteria itself got nested oddly (e.g. {beds: {score: "✅"}})
function normalizeCriteria(raw) {
  if (!raw || typeof raw !== 'object') return null
  const out = {}
  for (const [key, val] of Object.entries(raw)) {
    const normalizedKey = CRITERIA_KEY_ALIASES[key.toLowerCase()] || key
    let normalizedVal = val
    // If the value is itself an object like {score: "✅", note: "..."}, pull the score out
    if (typeof val === 'object' && val !== null) {
      normalizedVal = val.score || val.value || val.rating || flattenValue(val)
    }
    if (typeof normalizedVal === 'string') {
      const lower = normalizedVal.toLowerCase().trim()
      normalizedVal = SCORE_ALIASES[lower] || normalizedVal
    }
    out[normalizedKey] = normalizedVal
  }
  return out
}

// Top-level field aliases — in case Claude or a paste uses slightly different
// key names than the app expects (e.g. "homePrice" instead of "price")
const FIELD_ALIASES = {
  homePrice: 'price', listPrice: 'price', askingPrice: 'price',
  bedroomCount: 'beds', bathroomCount: 'baths',
  squareFeet: 'sqft', sqFt: 'sqft', squareFootage: 'sqft',
  yearbuilt: 'yearBuilt', built: 'yearBuilt',
  daysOnMarket: 'dom', daysOnMkt: 'dom',
  hoaFee: 'hoaDues', hoaMonthlyFee: 'hoaDues', monthlyHoaDues: 'hoaDues',
  elementarySchool: 'school', schoolName: 'school',
  greatSchoolsRating: 'schoolRating', gsRating: 'schoolRating',
  offerLow: 'offerRangeLow', offerHigh: 'offerRangeHigh',
  minOffer: 'offerRangeLow', maxOffer: 'offerRangeHigh',
  agentQuestions: 'realtorQuestions', questionsForAgent: 'realtorQuestions',
  documentsNeeded: 'mustGetDocs', requiredDocs: 'mustGetDocs',
}

// String-shaped fields that should always end up as a single string,
// even if the pasted JSON has them as an array or nested object.
const STRING_FIELDS = [
  'address', 'propertyType', 'price', 'beds', 'baths', 'sqft', 'lotSize',
  'yearBuilt', 'pricePerSqft', 'dom', 'lastSoldPrice', 'lastSoldDate',
  'propertyTaxes', 'heating', 'parking', 'priceHistory', 'verdict',
  'backyardRead', 'school', 'schoolRating', 'schoolDist', 'schoolDistance',
  'commuteLaPetite', 'commuteBothell', 'compsRead', 'marketTrend',
  'hoaDues', 'hoaCovers', 'hoaOwnershipType', 'hoaLayered',
  'hoaManagement', 'hoaManagementPhone', 'hoaManagementWeb',
  'hoaReserveStudy', 'hoaSpecialAssessments', 'hoaRentalCap', 'hoaHO6Required', 'hoaFlags',
  'offerRangeLow', 'offerRangeHigh', 'negotiationRead', 'watchOuts',
  'realtorQuestions', 'mustGetDocs', 'notes',
  'mlsNumber', 'parcelNumber', 'listingSourceUrl', 'assessorUrl',
  'redfinUrl', 'zillowUrl', 'walkScore', 'walkScoreUrl', 'transitScore',
  'schoolUrl', 'schoolDistrictUrl', 'commuteDirectionsUrl', 'commuteBothellUrl',
  'schoolDiggerRating', 'schoolDiggerRank', 'schoolDiggerUrl',
  'schoolNicheGrade', 'schoolNicheUrl',
  'schoolProficiencyMath', 'schoolProficiencyReading', 'schoolProficiencyVsDistrict',
  'schoolParentSentiment', 'schoolContext',
  'hoaPortalUrl', 'hoaResaleDocUrl', 'hoaReputationUrl',
]

// Array-shaped fields — leave as arrays, but make sure each item is at least
// somewhat sane (has an address/price) and not totally malformed.
const ARRAY_FIELDS = ['images', 'activeComps', 'soldComps']

export function normalizeParsedJson(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Parsed JSON is not an object')
  }

  const out = {}

  // 1. Apply top-level field aliases first
  const aliased = {}
  for (const [key, val] of Object.entries(raw)) {
    const mappedKey = FIELD_ALIASES[key] || key
    aliased[mappedKey] = val
  }

  // 2. Normalize criteria specifically
  if (aliased.criteria) {
    out.criteria = normalizeCriteria(aliased.criteria)
  }

  // 3. Flatten all string-shaped fields, even if they arrived as objects/arrays
  for (const field of STRING_FIELDS) {
    if (aliased[field] !== undefined && aliased[field] !== null) {
      out[field] = flattenValue(aliased[field])
    }
  }

  // 4. Pass through array fields, lightly sanitizing each entry
  for (const field of ARRAY_FIELDS) {
    if (Array.isArray(aliased[field])) {
      out[field] = aliased[field].map(item => {
        if (typeof item === 'string') return field === 'images' ? item : { address: item }
        if (typeof item === 'object' && item !== null) {
          // Coerce nested numeric/url-ish fields to strings, drop deeper nesting
          const clean = {}
          for (const [k, v] of Object.entries(item)) {
            clean[k] = (typeof v === 'object' && v !== null) ? flattenValue(v) : v
          }
          return clean
        }
        return item
      }).filter(Boolean)
    }
  }

  // 5. Carry through anything else not explicitly handled (e.g. future fields)
  for (const [key, val] of Object.entries(aliased)) {
    if (out[key] === undefined && key !== 'criteria') {
      out[key] = (typeof val === 'object' && val !== null && !Array.isArray(val))
        ? flattenValue(val)
        : val
    }
  }

  if (!out.address) {
    throw new Error('Missing address field after normalization')
  }

  return out
}
