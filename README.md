# 🏡 Home Hunt Tracker

A personal property research tracker built for house-hunting in the Seattle/Snohomish area, designed to work hand-in-hand with a Claude-driven deep-dive research workflow.

**Live app:** home-hunt-omega.vercel.app
**Stack:** React + Vite, Supabase, Vercel

## Docs

- [`docs/PRD.md`](docs/PRD.md) — what this is for and who it's for
- [`docs/TRD.md`](docs/TRD.md) — how it's built, and why specific technical decisions were made
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — notable bugs and what fixed them
- [`SETUP.md`](SETUP.md) — Supabase + Vercel setup instructions for a fresh deploy
- [`SUPABASE_MIGRATION.sql`](SUPABASE_MIGRATION.sql) — full database schema (run once in the Supabase SQL editor)
- [`SKILL_v4.md`](SKILL_v4.md) — the Claude project skill that defines the buyer profile and the research workflow this app is built to receive data from

## Quick start (local dev)

```bash
git clone https://github.com/pnaika/home-hunt
cd home-hunt
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

## How it fits together

1. Claude runs a property deep-dive in chat (per `SKILL_v4.md`) and outputs a JSON block.
2. That JSON is pasted into this app (single property, or in bulk for a multi-property recheck) and saved to Supabase.
3. The app is the source of truth from then on — list, compare, share, and track changes over time.

See `docs/PRD.md` for the full flow and `docs/TRD.md` for implementation detail.
