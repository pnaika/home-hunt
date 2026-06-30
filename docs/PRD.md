# PRD — Home Hunt Tracker

**Owner:** Prashanth
**Status:** Live / actively used
**Last updated:** June 2026

---

## 1. Problem

Prashanth and his partner are house-hunting in the Seattle/Snohomish area, using Claude as a buyer's-agent-style research assistant. Claude runs a structured "deep-dive" on each address (price, school, HOA, commute, comps, negotiation) and produces a report. The original gap: **that research had nowhere to live.** Each deep-dive was a one-off chat message — there was no way to track properties over time, compare them side by side, share findings with a partner or realtor, or notice when a price changed weeks later.

## 2. Goal

A lightweight, mobile-first tracker that:
- Stores every property Claude researches, with full structured detail (not just a summary)
- Lets two people (Prashanth + partner) collaborate on the same list in real time
- Surfaces what changed (price drops, new comments) without re-reading every property
- Works as an installable phone app, not just a website
- Costs nothing to run at this scale

## 3. Who uses it

Two people: Prashanth and his partner. No public users, no multi-tenant concerns. A future "share" use case exists for sending a single property's summary to an external real estate agent (read-only, no login).

## 4. Core user flows

### 4.1 Research → Save
1. Prashanth pastes an address to Claude in chat.
2. Claude runs the deep-dive (skill in `SKILL_v4.md`) and outputs a structured JSON block at the end.
3. Prashanth opens the app → **Actions → Add Property** → pastes the JSON → reviews preview → saves.
4. If the address already exists, the app updates it (merge by address, not overwrite).

### 4.2 Browse & decide
- List view: cards show address, price, beds/bath/sqft, verdict color, criteria pills, DOM.
- Filters: verdict (Strong fit / Worth a look / Probably pass), Favourites, Recently Deleted — all multi-selectable and combinable.
- City filter: multi-select by city, parsed automatically from the address (no extra data entry).
- Tap a card → full detail page with all 10 research sections, mortgage calculator, price history, comments/reactions.

### 4.3 Compare
- Pick 2+ properties → side-by-side table of every key metric, with the best value per row auto-highlighted.

### 4.4 Recheck (price monitoring)
- No reliable free API exists for Zillow/Redfin price monitoring (confirmed via research — see TRD §7).
- Instead: Prashanth says "recheck prices" to Claude periodically. Claude re-fetches live listings for active properties and reports back.
- The app nudges this: a banner appears once a property hasn't been checked in 14+ days.
- Multiple properties from one recheck session can be pasted at once via **Bulk Update**.

### 4.5 Collaborate
- Each person picks a name on first use (no login/auth).
- Reactions (❤️ 👍 👎 🤔) and threaded comments per property, visible to both in real time via Supabase realtime.

### 4.6 Share externally
- **PDF export**: full report, generated client-side, no server cost.
- **Public share link**: a read-only webpage (no app required) for sending to a realtor.

## 5. Hard requirements carried from the buyer profile
(These live in the Claude skill, not the app — the app is criteria-agnostic and just stores whatever scorecard Claude provides.)
- 3+ bedrooms
- Small usable/fenceable yard
- Elementary school GreatSchools 7+
- Budget ≤ $750K (soft)
- Built 2010+ (soft)
- Commute to La Petite Academy (Lynnwood) primary, Amazon Nitro North (Belltown/SLU) secondary

## 6. Non-goals
- No user accounts/auth beyond a local display name.
- No automated scraping infrastructure (cost/reliability tradeoff — see TRD).
- No support for multiple buyer profiles or multi-tenant use; this is a personal tool for one household.
- Not a substitute for licensed agent advice — every report carries that disclaimer.

## 7. Success criteria
- Every property Claude researches ends up in the app within one paste, no manual re-typing.
- A bad/malformed paste degrades to "ugly but visible" text, never a blank crashed page.
- Both household members can see the same data and each other's reactions without refreshing.
- The app installs and updates cleanly as a PWA on iOS/Android.

## 8. Feature log (chronological, see TRD for implementation detail)
1. Property tracker MVP — list, detail, manual + JSON entry
2. PWA support (installable, offline shell, update banner)
3. Favourites + multi-select filters
4. Full page routing (list / detail / compare / share as real routes)
5. Visual redesign (DM Sans/Serif Display, navy/cream palette)
6. Collaboration — soft delete, named reactions, comments, realtime sync
7. Crash-proofing — safe renderer + self-healing JSON normalizer (after a real production crash)
8. Source links throughout (Redfin/Zillow/assessor/GreatSchools/HOA portal/comps)
9. Mortgage calculator with live-ish national rate default
10. Price-drop monitoring via Claude-initiated recheck + price history chart
11. Compare view, PDF export, public share links
12. Bulk update (multi-property paste for recheck sessions)
13. Actions dropdown (UI cleanup)
14. Multi-select city/location filter (parsed from address, no schema change)
