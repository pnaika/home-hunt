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
