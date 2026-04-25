-- ============================================================
-- BriefDev Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> paste -> Run
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. articles  (raw items collected from sources)
-- ============================================================
create table if not exists public.articles (
  id            uuid primary key default uuid_generate_v4(),
  source        text not null,                    -- 'hackernews' | 'rss'
  external_id   text not null,                    -- HN id or RSS guid
  title         text not null,
  url           text not null,
  score         integer default 0,
  author        text,
  published_at  timestamptz,
  comments_count integer default 0,
  collected_at  timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists articles_collected_at_idx on public.articles (collected_at desc);
create index if not exists articles_score_idx on public.articles (score desc);

-- ============================================================
-- 2. bundles  (daily 5-card bundle, 1 row per day)
-- ============================================================
create table if not exists public.bundles (
  id            uuid primary key default uuid_generate_v4(),
  bundle_date   date not null unique,             -- YYYY-MM-DD
  prompt_version text not null default 'v1',      -- track which prompt produced this
  source_count  integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists bundles_date_idx on public.bundles (bundle_date desc);

-- ============================================================
-- 3. cards  (curated 5 cards per bundle)
-- ============================================================
create table if not exists public.cards (
  id            uuid primary key default uuid_generate_v4(),
  bundle_id     uuid not null references public.bundles(id) on delete cascade,
  position      integer not null,                 -- 0..4 (display order)
  category      text not null check (category in ('pick','tool','tip','deep','kr')),
  title         text not null,
  summary       jsonb not null,                   -- string[3]
  why_matters   text not null,
  url           text not null,
  source_title  text,
  created_at    timestamptz not null default now(),
  unique (bundle_id, position)
);

create index if not exists cards_bundle_id_idx on public.cards (bundle_id, position);

-- ============================================================
-- 4. user_views  (analytics: which cards each user opened)
-- ============================================================
create table if not exists public.user_views (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  card_id       uuid not null references public.cards(id) on delete cascade,
  viewed_at     timestamptz not null default now(),
  read_seconds  integer default 0,
  shared        boolean not null default false,
  unique (user_id, card_id)
);

create index if not exists user_views_user_id_idx on public.user_views (user_id, viewed_at desc);
create index if not exists user_views_card_id_idx on public.user_views (card_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- articles, bundles, cards: public read (anyone can read curation)
alter table public.articles enable row level security;
alter table public.bundles enable row level security;
alter table public.cards enable row level security;

drop policy if exists "articles_read_all" on public.articles;
create policy "articles_read_all" on public.articles
  for select using (true);

drop policy if exists "bundles_read_all" on public.bundles;
create policy "bundles_read_all" on public.bundles
  for select using (true);

drop policy if exists "cards_read_all" on public.cards;
create policy "cards_read_all" on public.cards
  for select using (true);

-- Writes happen only via service_role from API routes (bypasses RLS)

-- user_views: users can only see/insert their own
alter table public.user_views enable row level security;

drop policy if exists "user_views_select_own" on public.user_views;
create policy "user_views_select_own" on public.user_views
  for select using (auth.uid() = user_id);

drop policy if exists "user_views_insert_own" on public.user_views;
create policy "user_views_insert_own" on public.user_views
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_views_update_own" on public.user_views;
create policy "user_views_update_own" on public.user_views
  for update using (auth.uid() = user_id);

-- ============================================================
-- Helper view: latest bundle with cards
-- ============================================================
create or replace view public.latest_bundle_view as
select
  b.id as bundle_id,
  b.bundle_date,
  b.prompt_version,
  c.id as card_id,
  c.position,
  c.category,
  c.title,
  c.summary,
  c.why_matters,
  c.url,
  c.source_title
from public.bundles b
join public.cards c on c.bundle_id = b.id
order by b.bundle_date desc, c.position asc;
