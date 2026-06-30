# TRD — Home Hunt Tracker

**Repo:** github.com/pnaika/home-hunt
**Hosting:** Vercel (frontend + serverless API routes)
**Database:** Supabase (Postgres + Realtime)
**Last updated:** June 2026 — corresponds to commit `91a782c`

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast dev loop, no framework lock-in needed for this scope |
| Routing | react-router-dom 7 (`BrowserRouter`) | Real URLs for list/detail/compare/share — needed for deep links and the public share page |
| Styling | Inline style objects + `src/theme.js` tokens | No build-time CSS tooling; small enough app that a CSS framework would be overhead |
| PWA | vite-plugin-pwa (Workbox) | Installable on iOS/Android, offline app shell |
| Backend | Vercel serverless functions (`/api/*.js`) | Zero infra, scales to zero, free tier covers this usage easily |
| Database | Supabase (Postgres) | Free tier, built-in Realtime (used for live collaboration), simple REST + JS client |
| PDF | jsPDF (client-side) | No PDF rendering server needed; generated entirely in-browser |

No build step beyond `npm run build` (outputs to `dist/`, deployed by Vercel on every push to `main`).

---

## 2. Data model

### 2.1 `properties` table
```sql
properties (
  id text primary key,
  data jsonb not null,        -- the entire property object lives here
  updated_at timestamptz
)
```
**Design choice:** one wide `jsonb` blob instead of normalized columns. Rationale: the schema has grown ~6 times since launch (new link fields, comps arrays, agent-questions, price tracking) and a `jsonb` column means every new field is additive — no migrations, no backfills, no downtime. The tradeoff (no SQL-level querying on individual fields) is acceptable at this scale (dozens of rows, two users).

Full field list lives in `src/constants.js` → `EMPTY_FORM`. Categories:
- Snapshot (price, beds, baths, sqft, lot, year, $/sqft, DOM, tax, heating, parking, price history, MLS #, parcel #)
- Criteria scorecard (`criteria: { beds, backyard, school, budget, yearBuilt }`, each `✅`/`⚠️`/`❌`)
- School (name, rating, district, distance, GreatSchools URL, district URL)
- Commute (two legs: La Petite Lynnwood primary, Amazon Nitro North Seattle secondary, plus Maps directions URLs)
- Comps (`activeComps[]`, `soldComps[]` — each `{address, price, sqft, url, soldDate?}`)
- HOA (dues, coverage, ownership type, layered flag, management contact, portal/resale-cert/reputation URLs, reserve study, special assessments, rental cap, HO-6 flag, free-text "must-knows")
- Negotiation (offer range low/high, free-text strategy)
- Watch-outs, realtor questions, must-get docs (free text, may be Claude-generated or app-auto-generated fallback)
- Source links (Redfin URL, Zillow URL, listing source URL, assessor URL, walk score + URL, transit score)
- Meta (favourite, deleted, deletedAt, dateAdded, lastCheckedAt, priceChangeFlag, images[])

### 2.2 `comments` table
One row per comment. `property_id` FK, `author` (free-text display name, no auth), `text`, `created_at`.

### 2.3 `votes` table
One row per `(property_id, author)` pair — enforced by a unique constraint, so re-voting upserts rather than duplicating. `vote` is constrained to one of four emoji via a SQL `check`.

### 2.4 `price_checks` table
Append-only log: one row per price observation. `property_id` FK, `price`, `dom`, `checked_at`, `source` (`'manual'` or `'claude_recheck'`). Powers the price-history sparkline on the detail page. Never updated, only inserted — `properties.data.priceChangeFlag` is the derived "latest delta" computed at write time (see §4.1).

### 2.5 RLS
All four tables have RLS enabled with a single permissive policy (`using (true)`) for every operation. This is intentional — there are no user accounts, so per-row access control doesn't apply. The anon key is the only credential, scoped to this Supabase project only.

### 2.6 Realtime
All four tables are added to the `supabase_realtime` publication. The client subscribes via `subscribeToProperties()`, `subscribeToComments(id)`, `subscribeToVotes(id)` in `src/supabase.js`, each returning an unsubscribe function used in `useEffect` cleanup.

---

## 3. Frontend architecture

### 3.1 Routes (`src/App.jsx`)
```
/                 -> ListPage      (card feed, filters, search)
/property/:id     -> DetailPage    (full report, collapsible sections)
/compare          -> ComparePage   (?ids=a,b,c query param drives selection)
/share/:id        -> SharePage     (public, no app shell, fetches via /api/get-property)
```
`SharePage` is deliberately outside the authenticated-feeling app chrome (no nav, no Actions menu) since it's meant to be opened by someone without the app installed.

### 3.2 State management
No Redux/Zustand/Context — a single `properties` array lives in `App.jsx` state, loaded once via `fetchProperties()` and kept in sync three ways:
1. **Local optimistic updates** — every mutation (`handleSave`, `handleFav`, `handleDelete`, etc.) updates local state immediately, then writes to Supabase.
2. **Realtime echo suppression** — see §3.3, prevents the local update from being immediately overwritten by its own realtime echo.
3. **Realtime updates from the *other* user** — when the partner changes something on their device, the subscription callback calls `loadProperties()` to refetch.

`{...shared}` spreads `{ properties, onSave, onSaveAll, onFav, onDelete, onRestore, onHardDelete, user, setShowPicker }` into every route's page component — a lightweight prop-drilling approach that's fine at this component count.

### 3.3 Realtime echo suppression (`App.jsx`)
```js
const localChangeIds = new Set()  // not state — a plain Set, intentionally not reactive
```
Every local mutation adds the property's `id` to this set *before* calling `upsertProperty()`. The realtime subscription callback checks: if the incoming change's ID is in the set, delete it and skip the refetch (it's an echo of our own write). This fixes a real bug (see CHANGELOG) where every favourite-toggle caused a full page reload because the Supabase realtime event fired before the local optimistic update settled.

### 3.4 Component layering
- **`pages/`** — route-level components, own their local UI state (filters, modal-open booleans)
- **`components/`** — reusable, mostly presentational, take data + callbacks as props
- **Root-level `src/*.js`** — pure utility modules with no React dependency, independently testable:
  - `safeDisplay.js` — crash-proof value rendering (§5)
  - `normalizeJson.js` — self-healing JSON paste normalizer (§5)
  - `parseAddress.js` — city/state extraction from address strings (§6.3)
  - `staleness.js` — "needs recheck" calculation
  - `theme.js` — design tokens (no CSS-in-JS library, just exported objects)

### 3.5 Styling approach
No Tailwind, no styled-components. Every component uses inline `style={{...}}` objects referencing `T.*` tokens from `theme.js` (e.g. `T.navy`, `T.greenSoft`, `T.border`). Chosen for zero build configuration and because the component count is small enough that style duplication hasn't become a maintenance problem. Typography: DM Sans (UI) + DM Serif Display (the address headline on `DetailPage`, loaded via Google Fonts `@import` injected in `main.jsx`).

---

## 4. Backend (Vercel serverless functions)

### 4.1 `POST /api/save-property`
**Auth:** `x-api-secret` header checked against `SAVE_API_SECRET` env var. This is the only non-anon-key credential in the system — lets Claude (via the user pasting a curl command, or the user pasting JSON in-app) write without exposing the Supabase service role key.

**Behavior:**
1. Looks up existing row by `data->>address` (JSON path equality — exact string match, case-sensitive).
2. Computes `priceChangeFlag` by diffing `existing.data.price` vs incoming `price` (e.g. `"⬇️ Dropped $20,000 (2.4%)"`).
3. Preserves `favourite`/`deleted` state from the existing row unless explicitly overridden in the payload (prevents a recheck-save from accidentally un-favouriting or un-deleting something).
4. Sets `lastCheckedAt` to now on every save.
5. Upserts to `properties`.
6. Best-effort inserts a row into `price_checks` (failure here doesn't fail the request — it's secondary to the main write).

This endpoint is the integration point for the **recheck workflow**: Claude fetches live listing data in a chat session, then either gives the user a `curl` command to run, or a JSON block to paste into the app's Bulk Update panel (see §6.5) — Claude itself cannot reach `vercel.app` domains from its sandboxed network, so it never calls this directly.

### 4.2 `GET /api/get-property?id=`
Public, unauthenticated read endpoint. Strips `favourite`, `deleted`, `deletedAt` before returning (these are internal-only fields with no meaning to an external viewer). Sets `Cache-Control: public, max-age=60, s-maxage=300` for cheap repeat loads. Powers `SharePage`.

### 4.3 Why no other endpoints
List/detail/comments/votes all go through the Supabase JS client directly from the browser using the anon key + RLS, not through custom API routes — there's no need for a backend intermediary when RLS already permits the open access pattern this app uses.

---

## 5. Crash-proofing (two-layer defense)

This exists because of a real production incident: a JSON paste with nested objects (`priceHistory` as `[{date, price}]` instead of a flat string) caused React to throw `Objects are not valid as a React child` and blank the entire detail page.

### Layer 1 — `safeDisplay()` (render-time guard)
Wraps every value before it reaches JSX. Objects → flattened `"key: value"` lines; arrays → newline-joined; anything else → `String(x)`. Applied in `DataGrid`, `Prose`, `VerdictBadge`, `PropertyCard`, and the `DetailPage` hero. **Guarantees a bad value renders as ugly text, never a crash.**

### Layer 2 — `normalizeParsedJson()` (parse-time correction)
Runs on every pasted JSON blob before it's shown in the preview or saved. Fixes the actual shape problems at the source:
- Nested objects → flattened via a preferred-key search (`text`, `value`, `note`, `description`, `summary`, `amount`) or `"key: value"` join
- Array-style string fields → newline-joined
- Criteria key aliases (`bedrooms`/`bed` → `beds`, `yard`/`fence` → `backyard`, etc.)
- Criteria value aliases (`pass`/`yes`/`good` → `✅`, `fail`/`no`/`bad` → `❌`, `warn`/`maybe` → `⚠️`)
- Top-level field aliases (`homePrice` → `price`, `bedroomCount` → `beds`, etc.)

When normalization does non-trivial work, the UI shows a "Some fields had an unexpected shape and were auto-flattened" warning so the user knows to double-check before saving.

### Layer 3 (belt-and-suspenders) — `ErrorBoundary`
Wraps all routes, keyed by `location.pathname` so navigating to a different property automatically resets it. If something still slips past both layers, shows a recoverable screen instead of a permanently blank app. Has not been triggered since Layers 1–2 shipped, as far as known.

---

## 6. Notable implementation decisions

### 6.1 Soft delete, not hard delete
`properties.data.deleted` + `deletedAt` flags instead of row deletion. The "🗑️ Deleted" filter view is mutually exclusive with other filters (selecting it clears verdict/city filters, and vice versa) — this was a real bug (see CHANGELOG) where the Deleted filter showed *everything* because non-deleted properties had no other active filter to fail against.

### 6.2 PWA update mechanism
`registerType: 'prompt'` (not `'autoUpdate'`) in `vite.config.js`, paired with a hand-rolled `UpdatePrompt.jsx` that talks to the service worker directly via `postMessage({ type: 'SKIP_WAITING' })` rather than using `vite-plugin-pwa`'s `useRegisterSW` hook — the hook's virtual module didn't reliably wire up in this setup, so raw `navigator.serviceWorker` APIs are used instead. `clientsClaim: true` in the Workbox config ensures the new SW takes control of all open tabs immediately after `SKIP_WAITING`.

### 6.3 City filter without a schema change
`parseAddress.js` extracts city/state from the existing free-text `address` field via comma-splitting (`"303 202nd Pl SE, Bothell, WA 98012"` → city is the second-to-last comma-separated segment, state is the first 2-letter uppercase token in the last segment). Chosen over adding `city`/`state` columns because it requires zero backfill — every property added before this feature shipped is immediately filterable.

### 6.4 No automated price-scraping infrastructure
Researched and rejected: Zillow's public API was deprecated years ago; the only working options in 2026 are paid scraper APIs (RealtyAPI, Apify) with free tiers capped around 250 requests/month, each requiring a managed API key. Given this is a 2-person household tool, the cost/complexity of standing up and maintaining that integration wasn't justified.

**Chosen alternative:** price monitoring is **Claude-initiated**, not cron-initiated. The user says "recheck prices," Claude uses its own web-fetch capability (no API key needed, no rate-limit management) to re-pull live listings, and reports changes back. The app's role is to (a) accept the resulting updates via Bulk Update, (b) compute and store the delta, and (c) nudge via a staleness banner after 14 days. This is documented as a formal workflow in `SKILL_v4.md` §7 and saved to Claude's persistent memory so it triggers reliably across sessions.

### 6.5 Bulk update parser
`BulkUpdatePanel.jsx` accepts two paste formats: a proper JSON array `[{...}, {...}]`, or multiple `{...}` blocks pasted back-to-back with arbitrary whitespace between them (handled via bracket-depth matching, not regex, since addresses/notes can contain `{`/`}`-adjacent punctuation that would break a naive split). Each block runs through the same `normalizeParsedJson()` as the single-property flow, so bulk and single paste share all the crash-proofing from §5.

### 6.6 Claude cannot write to the database directly
Claude's tool sandbox has an egress allowlist that does not include `vercel.app`. This was discovered empirically (POST requests to `/api/save-property` returned `403 Host not in allowlist`) and is a hard platform constraint, not a bug. Consequence: every "save this property" or "recheck prices" action requires a human-in-the-loop paste step (manual form, JSON paste, or bulk paste) — there is no fully automated Claude → DB write path, and none is expected to become available.

---

## 7. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel + local `.env.local` | Supabase project URL, public |
| `VITE_SUPABASE_ANON_KEY` | Vercel + local `.env.local` | Supabase anon key, public (RLS-gated) |
| `SAVE_API_SECRET` | Vercel only (server-side) | Auth for `/api/save-property` |

No other secrets. No `VITE_ANTHROPIC_API_KEY` — an earlier version of this app called the Anthropic API client-side for JSON normalization; this was removed in favor of pure client-side `normalizeJson.js` logic, eliminating the need for any LLM API key in the deployed app.

---

## 8. Known constraints / explicitly accepted tradeoffs

- **No automated tests.** Verified manually via `npm run build` after every change, plus ad-hoc Node scripts run against `normalizeJson.js`/`parseAddress.js` during development (not checked into the repo). Acceptable at current scope; would need to change if this grew beyond a 2-person tool.
- **No pagination.** `fetchProperties()` loads the entire table every time. Fine until property count reaches the high hundreds.
- **Address-string matching for upserts.** Case-insensitive exact match on the full address string. A typo'd address creates a duplicate rather than updating the existing row. No fuzzy matching implemented.
- **Image hotlinking doesn't work.** Zillow/Redfin CDN images return 403 on cross-origin `<img>` load (hotlink protection). Worked around with an embedded Google Maps iframe (satellite/street view, no API key) instead of trying to display listing photos directly.
