-- =====================================================================
-- US Stock Dashboard - DB schema
-- Paste into Supabase Dashboard > SQL Editor and Run.
-- Auth uses Supabase built-in auth.users.
-- Safe to run multiple times (idempotent).
-- =====================================================================

-- helper: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) holdings: user-owned positions
-- ---------------------------------------------------------------------
create table if not exists public.holdings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  ticker      text not null,
  quantity    numeric(18, 6) not null check (quantity > 0),
  avg_price   numeric(18, 4) not null check (avg_price >= 0),
  buy_fx_rate numeric(12, 4), -- 매수 시점 환율(1 USD = ? KRW), 환차손익 계산용
  created_at  timestamptz not null default now()
);
-- 기존 테이블에도 컬럼 추가 (이미 있으면 무시)
alter table public.holdings add column if not exists buy_fx_rate numeric(12, 4);
create index if not exists holdings_user_idx on public.holdings (user_id);

alter table public.holdings enable row level security;

drop policy if exists "holdings_select_own" on public.holdings;
create policy "holdings_select_own" on public.holdings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "holdings_insert_own" on public.holdings;
create policy "holdings_insert_own" on public.holdings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "holdings_update_own" on public.holdings;
create policy "holdings_update_own" on public.holdings
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "holdings_delete_own" on public.holdings;
create policy "holdings_delete_own" on public.holdings
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2) watchlist: user-owned watched tickers
-- ---------------------------------------------------------------------
create table if not exists public.watchlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  ticker     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);
create index if not exists watchlist_user_idx on public.watchlist (user_id);

alter table public.watchlist enable row level security;

drop policy if exists "watchlist_all_own" on public.watchlist;
create policy "watchlist_all_own" on public.watchlist
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) portfolio_snapshots: daily asset snapshot (batch)
-- ---------------------------------------------------------------------
create table if not exists public.portfolio_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  total_usd     numeric(18, 2) not null,
  total_krw     numeric(18, 2) not null,
  fx_rate       numeric(12, 4) not null,
  unique (user_id, snapshot_date)
);
create index if not exists snapshots_user_date_idx
  on public.portfolio_snapshots (user_id, snapshot_date);

alter table public.portfolio_snapshots enable row level security;

-- users read own snapshots only (writes handled by service_role batch)
drop policy if exists "snapshots_select_own" on public.portfolio_snapshots;
create policy "snapshots_select_own" on public.portfolio_snapshots
  for select to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4) quotes_cache: shared quote cache (server updates)
-- ---------------------------------------------------------------------
create table if not exists public.quotes_cache (
  ticker     text primary key,
  price      numeric(18, 4) not null,
  prev_close numeric(18, 4),
  currency   text not null default 'USD',
  updated_at timestamptz not null default now()
);

alter table public.quotes_cache enable row level security;

-- any logged-in user can read; writes only via service_role (no write policy)
drop policy if exists "quotes_select_auth" on public.quotes_cache;
create policy "quotes_select_auth" on public.quotes_cache
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- 5) feed_items: shared news/filing/earnings cache (server updates)
-- ---------------------------------------------------------------------
create table if not exists public.feed_items (
  id           uuid primary key default gen_random_uuid(),
  ticker       text not null,
  type         text not null check (type in ('news', 'filing', 'earnings')),
  title        text not null,
  url          text,
  source       text,
  published_at timestamptz not null,
  created_at   timestamptz not null default now(),
  unique (ticker, type, url)
);
create index if not exists feed_ticker_time_idx
  on public.feed_items (ticker, published_at desc);

alter table public.feed_items enable row level security;

drop policy if exists "feed_select_auth" on public.feed_items;
create policy "feed_select_auth" on public.feed_items
  for select to authenticated using (true);

-- =====================================================================
-- Notes
-- - quotes_cache / feed_items have no INSERT/UPDATE policy, so anon and
--   authenticated cannot write. Only service_role (admin client) updates them.
-- - Add a tickers master table later if you need company names, etc.
-- =====================================================================
