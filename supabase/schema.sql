-- ============================================================
-- TibiaTracker — Schema do banco (rode no Supabase SQL Editor)
-- Dashboard do projeto > SQL Editor > New query > colar > Run
-- ============================================================
-- SE VOCÊ JÁ TINHA A TABELA `hunts` CRIADA (versão antiga sem
-- personagens), rode apenas o bloco "MIGRATION v1 -> v2" no fim.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Personagens da conta (dados vêm da TibiaData API)
-- ------------------------------------------------------------
create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null unique,
  world      text,
  vocation   text,
  level      integer not null default 0
);

-- ------------------------------------------------------------
-- Tabela de hunts (uma sessão de boss rotation por linha)
-- `balance` já é o profit/prejuízo calculado pelo Hunt Analyser
-- `character_id` vincula o ganho ao boneco (null = sem vínculo;
-- se o personagem for removido, a hunt sobrevive: ON DELETE SET NULL)
-- ------------------------------------------------------------
create table if not exists public.hunts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  character_id uuid references public.characters(id) on delete set null,
  duration     text not null,
  loot         integer not null default 0,
  supplies     integer not null default 0,
  balance      integer not null default 0,
  xp_gain      integer not null default 0,
  xp_per_hour  integer not null default 0,
  raw_text     text
);

-- ------------------------------------------------------------
-- Itens dropados/usados de cada hunt (cascade delete)
-- ------------------------------------------------------------
create table if not exists public.hunt_items (
  id      uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.hunts(id) on delete cascade,
  name    text not null,
  qty     integer not null default 0
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
create index if not exists characters_name_idx        on public.characters (name);
create index if not exists hunts_created_at_idx       on public.hunts (created_at desc);
create index if not exists hunts_character_id_idx     on public.hunts (character_id);
create index if not exists hunt_items_hunt_id_idx     on public.hunt_items (hunt_id);
create index if not exists hunt_items_name_idx        on public.hunt_items (name);

-- ------------------------------------------------------------
-- RLS habilitado com policy "Allow all" (uso pessoal do grupo)
-- ------------------------------------------------------------
alter table public.characters enable row level security;
alter table public.hunts enable row level security;
alter table public.hunt_items enable row level security;

drop policy if exists "Allow all" on public.characters;
create policy "Allow all" on public.characters
  for all using (true) with check (true);

drop policy if exists "Allow all" on public.hunts;
create policy "Allow all" on public.hunts
  for all using (true) with check (true);

drop policy if exists "Allow all" on public.hunt_items;
create policy "Allow all" on public.hunt_items
  for all using (true) with check (true);

-- ============================================================
-- MIGRATION v1 -> v2  (rode SOMENTE se você já tinha a tabela
-- `hunts` de antes da versão com personagens)
-- ============================================================
-- create extension if not exists "pgcrypto";
--
-- create table if not exists public.characters (
--   id         uuid primary key default gen_random_uuid(),
--   created_at timestamptz not null default now(),
--   name       text not null unique,
--   world      text,
--   vocation   text,
--   level      integer not null default 0
-- );
-- create index if not exists characters_name_idx on public.characters (name);
--
-- alter table public.hunts
--   add column if not exists character_id uuid references public.characters(id) on delete set null;
-- create index if not exists hunts_character_id_idx on public.hunts (character_id);
--
-- alter table public.characters enable row level security;
-- drop policy if exists "Allow all" on public.characters;
-- create policy "Allow all" on public.characters
--   for all using (true) with check (true);
-- ============================================================

-- ------------------------------------------------------------
-- Para começar do zero (apaga tudo):
--   truncate public.hunts cascade;
--   truncate public.characters cascade;
-- ------------------------------------------------------------
