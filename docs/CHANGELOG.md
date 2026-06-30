# Changelog — notable fixes

Referenced from `docs/TRD.md`. Full commit history has more detail; this captures only the changes worth explaining *why*, not just *what*.

---

### Realtime echo caused full page reload on every favourite toggle
**Symptom:** Tapping the ⭐ on any property reloaded the whole list.
**Cause:** `upsertProperty()` writes to Supabase → Supabase Realtime fires a change event → the subscription callback refetched everything, including the change the user just made locally.
**Fix:** `localChangeIds` Set in `App.jsx` — every local mutation marks its property ID before writing; the realtime callback checks this set and skips the refetch if the change was self-inflicted. See TRD §3.3.
**Commit:** `307ddd7`

---

### "Recently Deleted" filter showed every property, not just deleted ones
**Symptom:** Selecting the 🗑️ Deleted filter pill showed the full list.
**Cause:** Filter logic only special-cased deleted properties when *no other filter* was active; with no verdict/favourite filter selected, non-deleted properties had nothing to fail against and passed by default.
**Fix:** Made "Deleted" mutually exclusive with all other filters — selecting it clears everything else and shows only `deleted: true` rows.
**Commit:** `804a1c7`

---

### Pasted JSON with nested objects crashed the entire detail page
**Symptom:** A deep-dive JSON paste with `priceHistory: [{date, price}, ...]` instead of a flat string caused a blank white screen.
**Cause:** React throws `Objects are not valid as a React child` when a component tries to render an object/array directly in JSX. Several components (`DataGrid`, `Prose`, `VerdictBadge`) rendered property values with no type guard.
**Fix:** Two-layer defense — `safeDisplay()` render-time guard (always produces a string, never throws) plus `normalizeParsedJson()` parse-time correction (flattens the actual bad shapes before they're even previewed). See TRD §5.
**Commit:** `f76ddec`

---

### Detail page opened scrolled to the bottom instead of the top
**Symptom:** Navigating to `/property/:id` landed the viewport at the bottom of a long report.
**Cause:** Two compounding issues — (1) the browser's default scroll restoration re-applied the previous page's scroll position after React's `scrollTo(0,0)` ran, and (2) `CollabPanel` fetched comments/votes on mount, causing a second render *after* the scroll fix that shifted page height and effectively re-scrolled.
**Fix:** `history.scrollRestoration = 'manual'` globally, a three-attempt `scrollTo(0,0)` (immediate + `requestAnimationFrame` + 120ms timeout) to survive async re-renders, and making `CollabPanel` lazy (`Section lazyChildren` prop) so it isn't mounted — and doesn't fetch — until the user actually opens the Team Notes section.
**Commits:** `c5d356b`, `7e9fa2f`

---

### Property tax field showed garbage numbers in the mortgage calculator
**Symptom:** A tax value like `"$4,171/yr (2024)"` was parsed as `41712024` — the dollar amount mashed together with the year in parentheses.
**Cause:** The original parser stripped every non-digit character with a single regex, which doesn't distinguish "the number I want" from "any other number in the string" (years, ranges).
**Fix:** Rewrote the extractor to grab only the first `$`-prefixed number, with sanity bounds (`200 < tax < 100,000`) to reject obviously-wrong parses and fall back to a 1%-of-price estimate, clearly labeled as an estimate in the UI.
**Commit:** `f6d2e69`

---

### PWA "Update available" reload button did nothing
**Symptom:** Tapping Reload on the update banner had no effect; the app stayed on the old version.
**Cause:** `vite-plugin-pwa`'s `useRegisterSW` React hook (via `virtual:pwa-register/react`) wasn't reliably wiring up to the generated Workbox service worker in this setup — `updateServiceWorker(true)` was effectively a no-op.
**Fix:** Bypassed the hook entirely. `UpdatePrompt.jsx` now talks to `navigator.serviceWorker` directly: listens for `updatefound`/`statechange`, and on tap sends `postMessage({ type: 'SKIP_WAITING' })` to the waiting worker, which triggers `controllerchange` → `window.location.reload()`. Workbox config sets `clientsClaim: true` so the new worker takes over immediately.
**Commit:** `5c894f6`

---

### Listing photos never displayed
**Symptom:** Image URLs stored in `property.images[]` (sourced from Zillow during research) rendered as broken images.
**Cause:** Zillow and Redfin CDN images return `403 Forbidden` when loaded cross-origin via `<img src=...>` — both sites enforce hotlink protection. No client-side workaround exists without a proxy.
**Fix:** Replaced the photo strip with an embedded Google Maps iframe (toggle between street map and satellite view) — no API key required, no hotlink issue, and arguably more useful for evaluating yard/lot than static listing photos. Image URLs are still stored and rendered as "open in browser" links rather than inline `<img>` tags.
**Commit:** `b61a340`

---

### Wrong location used for a commute anchor
**Symptom:** "Amazon Nitro North, Bothell" was used as a commute destination throughout the app and buyer profile.
**Cause:** Incorrect assumption carried over from early skill drafts — never verified.
**Fix:** Confirmed via search that Amazon Nitro North (SEA43) is at 2250 7th Ave, Seattle, WA 98121 (Belltown/South Lake Union), not Bothell. Corrected in the skill, all commute labels, seed data, and the auto-generated Google Maps directions URL.
**Commit:** `8e609cc`
