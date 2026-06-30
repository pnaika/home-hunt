// The prompt template users copy into Claude/ChatGPT/Cursor/Gemini etc. to
// generate a deep-dive report + JSON payload shaped for this app.
//
// IMPORTANT: keep this in sync with the actual field list DetailPage.jsx
// reads (grep for `property\.` in that file) and with normalizeJson.js's
// accepted aliases. This is the single source of truth a stranger sees —
// if it drifts from the real schema, their JSON pastes will need manual
// correction even though the app's normalizer is fairly forgiving.

export const BUYER_PROFILE_TEMPLATE = `MY BUYER PROFILE (edit these before sending)
- Bedrooms: 3+ (hard requirement)
- Backyard: small usable/fenceable yard (hard requirement)
- Elementary school: GreatSchools rating 7+ (hard requirement)
- Budget: ≤ $750,000 (soft — flag but don't disqualify)
- Year built: 2010+ (soft)
- Target areas: [your cities/towns here]
- Commute anchor #1 (primary): [address — e.g. a daycare, your office]
- Commute anchor #2 (secondary): [address]
- Property type: single-family preferred, townhouse OK if yard + HOA check out`

export const DEEP_DIVE_PROMPT = `You are my buyer's-agent research assistant. I'll give you a property address or listing URL. Research it thoroughly using live web search (not stale cached data) and produce two things:

1. A readable deep-dive report covering:
   - Snapshot: price, beds/baths/sqft, lot size, year built, $/sqft, days on market, MLS #, parcel #
   - Price history (list price changes, cuts, relistings)
   - Criteria scorecard against my buyer profile below (✅ pass / ⚠️ caution / ❌ fail)
   - Backyard/yard read — is it fenceable, usable, private?
   - School: assigned elementary, GreatSchools rating, district
   - Commute estimates to both of my anchor locations
   - Comps: 2-3 similar ACTIVE listings nearby + 2-3 RECENTLY SOLD comps, with addresses/prices/links
   - HOA (if any): monthly dues, what's covered, ownership type (condo vs fee-simple), management company,
     reserve study status, special assessments, rental cap, anything that affects financing
   - Negotiation read: suggested offer range with reasoning (not a single number)
   - Watch-outs: inspection flags, must-get documents before offering
   - Questions I should ask the listing agent or seller
   - Overall verdict: "Strong fit" / "Worth a look" / "Probably pass"

2. A SINGLE JSON object (not wrapped in markdown, just the raw JSON) using EXACTLY these keys.
   Leave any field "" (empty string) if you don't have that information — never guess or invent numbers.

{
  "address": "",
  "propertyType": "",
  "price": "",
  "beds": "", "baths": "", "sqft": "", "lotSize": "",
  "yearBuilt": "", "pricePerSqft": "", "dom": "",
  "lastSoldPrice": "", "lastSoldDate": "",
  "propertyTaxes": "", "heating": "", "parking": "",
  "priceHistory": "",
  "mlsNumber": "", "parcelNumber": "",
  "listingSourceUrl": "", "assessorUrl": "",
  "redfinUrl": "", "zillowUrl": "",
  "walkScore": "", "walkScoreUrl": "",
  "verdict": "",
  "criteria": { "beds": "", "backyard": "", "school": "", "budget": "", "yearBuilt": "" },
  "backyardRead": "",
  "school": "", "schoolRating": "", "schoolDist": "", "schoolDistance": "",
  "schoolUrl": "", "schoolDistrictUrl": "",
  "commuteLaPetite": "", "commuteBothell": "",
  "commuteDirectionsUrl": "", "commuteBothellUrl": "",
  "compsRead": "", "marketTrend": "",
  "activeComps": [ { "address": "", "price": "", "sqft": "", "url": "" } ],
  "soldComps": [ { "address": "", "price": "", "sqft": "", "soldDate": "", "url": "" } ],
  "hoaDues": "", "hoaCovers": "", "hoaOwnershipType": "", "hoaLayered": "",
  "hoaManagement": "", "hoaManagementPhone": "", "hoaManagementWeb": "",
  "hoaPortalUrl": "", "hoaResaleDocUrl": "", "hoaReputationUrl": "",
  "hoaReserveStudy": "", "hoaSpecialAssessments": "", "hoaRentalCap": "", "hoaHO6Required": "",
  "hoaFlags": "",
  "offerRangeLow": "", "offerRangeHigh": "", "negotiationRead": "",
  "watchOuts": "",
  "realtorQuestions": "", "mustGetDocs": "",
  "notes": ""
}

Notes on field meanings:
- "criteria" values must be exactly one of: "✅" "⚠️" "❌" (or the words pass/fail/warn — I'll auto-convert them)
- "verdict" must be one of: "Strong fit", "Worth a look", "Probably pass"
- "commuteLaPetite" = commute to my PRIMARY anchor, "commuteBothell" = commute to my SECONDARY anchor
  (the field names are leftover from how this app was originally built — just put the right commute info in each)
- Multi-line fields (hoaFlags, watchOuts, negotiationRead, realtorQuestions, mustGetDocs) can use \\n for line breaks
- "activeComps" / "soldComps" are arrays — include as many comps as you found, or omit entirely if none

${BUYER_PROFILE_TEMPLATE}

Now research this address: [PASTE ADDRESS OR LISTING URL HERE]`

export const RECHECK_PROMPT = `I previously researched these properties and want you to check if anything has changed (price drops, status changes, new comps). Re-fetch live data for each address below and tell me what's different. For anything that changed, output an updated JSON object for just that property using the same schema as before (only include fields that changed — you don't need to repeat everything).

If you have a "Bulk Update" feature available, output a JSON array of all updated properties so I can paste them in one go: [ {...}, {...} ]

Properties to recheck:
[PASTE YOUR LIST OF ADDRESSES HERE — ONE PER LINE]`
