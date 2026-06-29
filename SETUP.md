# 🏡 Home Hunt Tracker — Setup Guide

## Stack
- **React + Vite** (frontend)
- **Supabase** (Postgres database, free tier)
- **Vercel** (hosting, free tier)
- **Anthropic API** (report parsing)

---

## 1. Supabase Setup (~5 min)

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor** and run:

```sql
create table properties (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (open read/write for now)
alter table properties enable row level security;
create policy "Public access" on properties for all using (true);
```

3. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## 2. Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → copy it → `VITE_ANTHROPIC_API_KEY`

---

## 3. Deploy to Vercel (~3 min)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `pnaika/home-hunt` from GitHub
3. Add these **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Click **Deploy** — done. Your URL will be `home-hunt-xxx.vercel.app`

---

## 4. Local Development

```bash
git clone https://github.com/pnaika/home-hunt
cd home-hunt
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

---

## How it works

- **"📋 Save Report"** — paste a Claude deep-dive report, it auto-parses all 10 sections and saves to Supabase
- **"+ Add"** — manual entry form with all 10 sections
- **Tap any card** — full detail sheet slides up
- Any update writes directly to Supabase and is instantly visible to anyone with the URL
---

## 5. Auto-save from Claude chat (Option 2)

This enables Claude to write directly to your database at the end of every deep-dive.

### Add the secret to Vercel

In Vercel → Project Settings → Environment Variables, add:
```
SAVE_API_SECRET=your-chosen-secret   # pick any strong string, e.g. "homehunt-2026-abc"
```

### Tell Claude your endpoint + secret

Paste this into your Claude chat (this project):
```
My save endpoint: https://your-app.vercel.app/api/save-property
My API secret: your-chosen-secret
```

Claude will call this endpoint automatically at the end of every deep-dive.

### How it works

- Vercel receives the POST request server-side
- Validates the secret header (`x-api-secret`)
- Writes the structured property data to Supabase
- Returns `{ success: true, action: "created" | "updated" }`
- If the address already exists in the DB, it updates instead of duplicating
