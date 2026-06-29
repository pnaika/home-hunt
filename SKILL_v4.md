# 🏡 Home Deep-Dive — Realtor Skill (v4)

Project operating instructions for Claude.

## ▶️ Trigger & intake

When the user pastes an address or URL, run the full deep-dive immediately using defaults below.
Ask at most one clarifying question, and only if truly needed.

- **Prefer a listing URL.** Always fetch the live listing page — price, bed count, yard, and HOA data go stale in search snippets.
- If only an address is given, search it, then fetch the Zillow or Redfin listing detail page directly.
- Pull the **county parcel record** (Snohomish or King County Assessor) when lot size or taxes are unclear.

---

## 1. Buyer Profile

| Criterion | Target | Hard / Soft |
|---|---|---|
| Bedrooms | **3+** | Hard |
| Backyard | **Small usable/fenceable yard** | Hard |
| Elementary school | **GreatSchools 7+** | Hard |
| Budget | **≤ $750K** | Soft |
| Year built | **2010+** | Soft |
| Area | Bothell, Mill Creek, Woodinville, Redmond, Kirkland, Kenmore, Lynnwood, Snohomish | Soft |
| **Commute (primary)** | **La Petite Academy, 20415 Poplar Way, Lynnwood, WA 98036** | Soft |
| Commute (secondary) | Amazon Nitro North, Bothell | Soft |
| Type | Single-family preferred; townhouse OK if yard + HOA check out | Soft |

---

## 2. Research checklist

**Property — from the LIVE listing + county parcel**
- Beds / baths / sqft / lot size / year built / property type
- List price, $/sqft, full price history (cuts, increases, relistings), DOM, last sold price/date
- Property taxes (annual) + **parcel number + county assessor URL**
- Heating/cooling (flag if no A/C), parking/garage
- **MLS number** (always record — enables direct MLS searches)
- **Listing source URL** (the page you fetched data from)
- Walk Score + Walk Score URL (pull from Zillow listing if shown)

**Criteria checks** — score each ✅ / ⚠️ / ❌

**Backyard** — lot size minus estimated footprint; note fencing language from listing/photos

**School**
- Assigned elementary + GreatSchools rating + **GreatSchools profile URL**
- School district website URL (for boundary confirmation)

**Commute** — estimate to La Petite (primary) + Bothell (secondary); generate Google Maps directions URLs for both

**Comps & pricing**
- 3–5 **active** comparable listings: address, price, sqft, **listing URL**
- 3–5 **recently sold** comps: address, price, sqft, sold date, **listing URL** (Zillow/Redfin)
- Same-complex/same-builder solds = strongest comps; note when price isn't public

**HOA — always run**
- Dues, what covered, ownership type, layered HOAs, special assessments
- Management company name + phone + **website URL**
- **HOA homeowner portal URL** (where residents log in / order resale docs)
- **Resale certificate order page URL** (specific page, not just the homepage)
- Search BBB + Google/Yelp for HOA management reputation → **reputation URL**
- Reserve study status, rental cap, pet/parking/ACC rules

**Negotiation** — suggested offer RANGE (not one number), leverage from DOM + price cuts

**Watch-outs** — inspection flags, must-get documents

**Realtor questions** — property-specific questions to ask at the showing

---

## 3. Report format (10 sections)

1. Snapshot — address, price, beds/baths/sqft/lot, year, $/sqft, MLS #, parcel #
2. Criteria scorecard (✅/⚠️/❌)
3. Backyard read
4. School (with GreatSchools URL + district URL)
5. Commute (with Google Maps directions URLs for both legs)
6. Comps & pricing (active comps + sold comps, each with URL)
7. HOA (dues, coverage, manager + portal URL + resale cert URL + reputation URL)
8. Negotiation + suggested offer range
9. Watch-outs + must-get documents
10. Verdict (Strong fit · Worth a look · Probably pass)

---

## 4. Always end with JSON block + WhatsApp summary

After the report, output:

### A) Full JSON block for the app
```json
{
  "address": "",
  "propertyType": "",
  "price": "",
  "beds": "", "baths": "", "sqft": "", "lotSize": "",
  "yearBuilt": "", "pricePerSqft": "", "dom": "",
  "lastSoldPrice": "", "lastSoldDate": "",
  "propertyTaxes": "", "heating": "", "parking": "",
  "priceHistory": "",
  "mlsNumber": "",
  "parcelNumber": "",
  "listingSourceUrl": "",
  "assessorUrl": "",
  "redfinUrl": "",
  "zillowUrl": "",
  "walkScore": "", "walkScoreUrl": "", "transitScore": "",
  "verdict": "",
  "criteria": { "beds": "", "backyard": "", "school": "", "budget": "", "yearBuilt": "" },
  "backyardRead": "",
  "school": "", "schoolRating": "", "schoolDist": "", "schoolDistance": "",
  "schoolUrl": "",
  "schoolDistrictUrl": "",
  "commuteLaPetite": "", "commuteBothell": "",
  "commuteDirectionsUrl": "",
  "commuteBothellUrl": "",
  "compsRead": "", "marketTrend": "",
  "activeComps": [
    { "address": "", "price": "", "sqft": "", "url": "" }
  ],
  "soldComps": [
    { "address": "", "price": "", "sqft": "", "soldDate": "", "url": "" }
  ],
  "hoaDues": "", "hoaCovers": "", "hoaOwnershipType": "", "hoaLayered": "",
  "hoaManagement": "", "hoaManagementPhone": "", "hoaManagementWeb": "",
  "hoaPortalUrl": "",
  "hoaResaleDocUrl": "",
  "hoaReputationUrl": "",
  "hoaReserveStudy": "", "hoaSpecialAssessments": "", "hoaRentalCap": "", "hoaHO6Required": "",
  "hoaFlags": "",
  "offerRangeLow": "", "offerRangeHigh": "",
  "negotiationRead": "",
  "watchOuts": "",
  "realtorQuestions": "",
  "mustGetDocs": "",
  "notes": ""
}
```

### B) WhatsApp summary (via message-compose tool)
Quick share + Detailed version — plain text, *bold*, _italic_, emoji, no markdown headers/tables.

---

## 5. Always remember
- Fetch live data; never rely on stale search snippets.
- Every section that has a linkable source should have the URL — assessor, GreatSchools, HOA portal, comps listings, directions.
- Note this is research, **not** licensed agent advice — verify with an agent + inspection.

---

## 6. Optional add-ons
- "Draft HOA questions + document list for the open house."
- "Compare these 2–3 addresses side by side."
- "Revised offer range given a price cut."
- "Negotiation/offer strategy for this one."
