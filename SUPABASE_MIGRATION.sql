-- Run this in your Supabase SQL Editor

-- 1. Properties table already exists, just need soft delete fields
--    (data jsonb already stores everything, we just filter on deleted)

-- 2. Comments table
create table if not exists comments (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  author text not null,
  text text not null,
  created_at timestamptz default now()
);

-- 3. Votes table (one row per person per property)
create table if not exists votes (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  author text not null,
  vote text not null check (vote in ('❤️', '👍', '👎', '🤔')),
  created_at timestamptz default now(),
  unique(property_id, author)
);

-- RLS policies (open access — private app)
alter table comments enable row level security;
alter table votes enable row level security;
create policy "Public access" on comments for all using (true);
create policy "Public access" on votes for all using (true);

-- Enable realtime on all three tables
alter publication supabase_realtime add table properties;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table votes;

-- 4. Price check history — tracks every price observation over time
create table if not exists price_checks (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  price numeric,
  dom text,
  checked_at timestamptz default now(),
  source text  -- 'manual' | 'claude_recheck'
);

alter table price_checks enable row level security;
create policy "Public access" on price_checks for all using (true);
alter publication supabase_realtime add table price_checks;

-- ════════════════════════════════════════════════════════════════════════
-- 5. HOUSEHOLD SCOPING — run this once to add shareable household codes
-- ════════════════════════════════════════════════════════════════════════
-- A "household" is a no-login sharing boundary: a short code in the URL
-- (e.g. home-hunt-omega.vercel.app/h/sunny-meadow-42) that scopes every
-- property/comment/vote/price-check. This migration:
--   1. Adds household_id to all four tables
--   2. Assigns ALL EXISTING rows to a single default household so you
--      don't lose any data already in the database
--   3. Prints that default household's code so you can bookmark it
--
-- After running this, update your app's first-visit code (see household.js)
-- or just open the printed default code's URL to keep seeing your existing data.

-- Add the column to all four tables (nullable at first so existing rows don't break)
alter table properties add column if not exists household_id text;
alter table comments add column if not exists household_id text;
alter table votes add column if not exists household_id text;
alter table price_checks add column if not exists household_id text;

-- Migrate ALL existing rows to one default household.
-- Change 'my-existing-home-hunt' to anything memorable before running —
-- this becomes the code you'll use to keep accessing your current data.
update properties set household_id = 'my-existing-home-hunt' where household_id is null;
update comments set household_id = 'my-existing-home-hunt' where household_id is null;
update votes set household_id = 'my-existing-home-hunt' where household_id is null;
update price_checks set household_id = 'my-existing-home-hunt' where household_id is null;

-- Now make it required for all future rows
alter table properties alter column household_id set not null;
alter table comments alter column household_id set not null;
alter table votes alter column household_id set not null;
alter table price_checks alter column household_id set not null;

-- Index for fast filtering (every query will filter by this column)
create index if not exists idx_properties_household on properties(household_id);
create index if not exists idx_comments_household on comments(household_id);
create index if not exists idx_votes_household on votes(household_id);
create index if not exists idx_price_checks_household on price_checks(household_id);

-- The old "id text primary key" on properties stays globally unique, which
-- is fine — IDs are generated client-side with prop_<timestamp>, collision
-- risk across households is negligible and not worth a composite key here.

-- Votes' uniqueness constraint needs household_id added so the same person
-- name in two different households doesn't collide on (property_id, author)
alter table votes drop constraint if exists votes_property_id_author_key;
alter table votes add constraint votes_property_id_household_author_key
  unique (property_id, household_id, author);

-- Reminder: your existing data is now under household_id = 'my-existing-home-hunt'
-- (or whatever you changed it to above). Visit:
--   home-hunt-omega.vercel.app/h/my-existing-home-hunt
-- to see it. The app will also prompt you to enter/confirm this on first
-- load after this migration if no household code is in your browser yet.
