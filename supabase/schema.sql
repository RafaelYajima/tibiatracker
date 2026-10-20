-- ============================================================
-- TibiaTracker — Schema do banco (rode no Supabase SQL Editor)
-- Dashboard do projeto > SQL Editor > New query > colar > Run
-- ============================================================
-- V4: autenticação local + isolamento por usuário + tipo de registro
-- (`activity_type` para separar Hunt x Rotação de Bosses)
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null unique,
  password_hash text not null
);

create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null
);

create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  world      text,
  vocation   text,
  level      integer not null default 0
);

create table if not exists public.hunts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid not null references public.users(id) on delete cascade,
  activity_type text not null default 'boss_rotation',
  character_id uuid references public.characters(id) on delete set null,
  duration     text not null,
  loot         integer not null default 0,
  supplies     integer not null default 0,
  balance      integer not null default 0,
  xp_gain      integer not null default 0,
  xp_per_hour  integer not null default 0,
  raw_text     text
);

create table if not exists public.hunt_items (
  id      uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.hunts(id) on delete cascade,
  name    text not null,
  qty     integer not null default 0
);

create index if not exists users_email_idx             on public.users (email);
create index if not exists sessions_user_id_idx        on public.sessions (user_id);
create index if not exists sessions_expires_at_idx     on public.sessions (expires_at);
create index if not exists characters_user_id_idx      on public.characters (user_id);
create index if not exists characters_name_idx         on public.characters (name);
create index if not exists hunts_created_at_idx        on public.hunts (created_at desc);
create index if not exists hunts_user_id_idx           on public.hunts (user_id);
create index if not exists hunts_activity_type_idx     on public.hunts (activity_type);
create index if not exists hunts_character_id_idx      on public.hunts (character_id);
create index if not exists hunt_items_hunt_id_idx      on public.hunt_items (hunt_id);
create index if not exists hunt_items_name_idx         on public.hunt_items (name);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.characters enable row level security;
alter table public.hunts enable row level security;
alter table public.hunt_items enable row level security;

drop policy if exists "Allow all" on public.users;
create policy "Allow all" on public.users for all using (true) with check (true);

drop policy if exists "Allow all" on public.sessions;
create policy "Allow all" on public.sessions for all using (true) with check (true);

drop policy if exists "Allow all" on public.characters;
create policy "Allow all" on public.characters for all using (true) with check (true);

drop policy if exists "Allow all" on public.hunts;
create policy "Allow all" on public.hunts for all using (true) with check (true);

drop policy if exists "Allow all" on public.hunt_items;
create policy "Allow all" on public.hunt_items for all using (true) with check (true);

-- ============================================================
-- Se seu projeto antigo não tem `activity_type`, rode este bloco extra:
--
-- alter table public.hunts
--   add column if not exists activity_type text not null default 'boss_rotation';
-- create index if not exists hunts_activity_type_idx on public.hunts (activity_type);
-- ============================================================

-- ------------------------------------------------------------
-- Para começar do zero (apaga tudo):
--   truncate public.hunts cascade;
--   truncate public.characters cascade;
--   truncate public.sessions cascade;
--   truncate public.users cascade;
-- ------------------------------------------------------------
