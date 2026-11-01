-- =====================================================================
-- BACKSTREET · multiplayer game database
-- Step 1 of 3. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to re-run: tables use IF NOT EXISTS, functions use OR REPLACE.
--
-- Security model: all game tables live in the private "game" schema,
-- which the public API cannot reach. Players act only through the
-- public.* functions below. Each one checks who is calling (auth.uid())
-- and applies the rules on the server, so the browser cannot cheat.
-- =====================================================================

create schema if not exists game;

-- ---------- tables ----------
create table if not exists game.players(
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null unique check (char_length(name) between 3 and 20 and name ~ '^[A-Za-z0-9 _.''-]+$'),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  level int not null default 1,
  xp numeric not null default 0,
  cash bigint not null default 500 check (cash >= 0),
  bank bigint not null default 0 check (bank >= 0),
  str numeric not null default 10, def numeric not null default 10, spd numeric not null default 10, dex numeric not null default 10,
  stamina numeric not null default 100, grit numeric not null default 10, mood numeric not null default 250, health numeric not null default 100,
  max_stamina int not null default 100, max_grit int not null default 10, max_mood int not null default 250, max_health int not null default 100,
  heat numeric not null default 0,
  bars_at timestamptz not null default now(),
  jail_until timestamptz, jail_reason text,
  hosp_until timestamptz, hosp_reason text,
  district text not null default 'water',
  travel_to text, travel_until timestamptz,
  crime_xp int not null default 0,
  skills jsonb not null default '{}'::jsonb,
  luck int not null default 0,
  weapon text, armour text,
  wins int not null default 0, losses int not null default 0,
  jobs_done int not null default 0, busts int not null default 0,
  last_chat timestamptz
);
create unique index if not exists players_name_ci on game.players (lower(name));
alter table game.players add column if not exists founder int unique;
-- Tokens: "Regular" status (faster regen) and the once-a-day refills you can buy with them.
alter table game.players add column if not exists regular_until timestamptz;
alter table game.players add column if not exists refill_at jsonb not null default '{}'::jsonb;
create index if not exists players_seen on game.players (last_seen desc);

create table if not exists game.items(
  id text primary key, name text not null, cat text not null, rarity int not null,
  value bigint not null, fx int not null default 0, effect jsonb not null default '{}'::jsonb, shop boolean not null default false);
-- Limited supply: "supply" is how many of an item can ever be found (null = unlimited, for food and consumables).
-- "minted" counts how many have been found so far. Once minted reaches supply, the only way to get one is from another player.
alter table game.items add column if not exists supply int check (supply is null or supply > 0);
alter table game.items add column if not exists minted int not null default 0;

create table if not exists game.inventory(
  player_id uuid not null references game.players(id) on delete cascade,
  item_id text not null references game.items(id),
  qty int not null check (qty >= 0),
  primary key (player_id, item_id));

create table if not exists game.districts(id text primary key, name text not null, lvl int not null, fare int not null, sort int not null);
create table if not exists game.jobs(id text primary key, name text not null, district text not null, lvl int not null, grit int not null,
  base numeric not null, cash_min int not null, cash_max int not null, xp int not null, loot text[] not null default '{}', sort int not null default 0);
create table if not exists game.foes(id text primary key, name text not null, district text not null, lvl int not null, power numeric not null,
  cash_min int not null, cash_max int not null, xp int not null, loot text[] not null default '{}', sort int not null default 0);

create table if not exists game.listings(
  id bigint generated always as identity primary key,
  seller uuid not null references game.players(id) on delete cascade,
  item_id text not null references game.items(id),
  qty int not null check (qty > 0),
  price bigint not null check (price between 1 and 10000000000),
  created_at timestamptz not null default now());
create index if not exists listings_item_price on game.listings (item_id, price);
create index if not exists listings_seller on game.listings (seller);

create table if not exists game.sales(
  id bigint generated always as identity primary key,
  item_id text not null, qty int not null, price bigint not null,
  seller uuid, buyer uuid, at timestamptz not null default now());
create index if not exists sales_item_at on game.sales (item_id, at desc);

create table if not exists game.stocks(
  ticker text primary key, name text not null, sector text not null, twin text not null,
  vol numeric not null default 1, price numeric not null, prev numeric not null,
  real_close numeric, real_date date,
  history jsonb not null default '[]'::jsonb,
  perk_shares int not null default 100, perk text not null default '', perk_desc text not null default '',
  sort int not null default 0);

create table if not exists game.holdings(
  player_id uuid not null references game.players(id) on delete cascade,
  ticker text not null references game.stocks(ticker),
  shares bigint not null default 0 check (shares >= 0),
  cost numeric not null default 0,
  perk_at timestamptz,
  primary key (player_id, ticker));

create table if not exists game.messages(
  id bigint generated always as identity primary key,
  player_id uuid references game.players(id) on delete set null,
  name text not null, body text not null,
  created_at timestamptz not null default now());

create table if not exists game.events(
  id bigint generated always as identity primary key,
  player_id uuid not null references game.players(id) on delete cascade,
  kind text not null, body text not null,
  created_at timestamptz not null default now(),
  seen boolean not null default false);
create index if not exists events_player on game.events (player_id, id desc);

-- ---------- crews, messages, homes, collection, moderation ----------
create table if not exists game.crews(
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 3 and 24 and name ~ '^[A-Za-z0-9 ''&.-]+$'),
  tag text not null check (tag ~ '^[A-Z0-9]{2,4}$'),
  leader uuid,
  motto text not null default '',
  vault bigint not null default 0 check (vault >= 0),
  respect bigint not null default 0,
  created_at timestamptz not null default now());
create unique index if not exists crews_name_ci on game.crews (lower(name));
create unique index if not exists crews_tag on game.crews (tag);
create table if not exists game.crew_apps(crew_id bigint not null references game.crews(id) on delete cascade, player_id uuid not null references game.players(id) on delete cascade,
  note text not null default '', at timestamptz not null default now(), primary key (crew_id, player_id));
create table if not exists game.crew_log(id bigint generated always as identity primary key, crew_id bigint not null references game.crews(id) on delete cascade,
  body text not null, at timestamptz not null default now());
create table if not exists game.dms(id bigint generated always as identity primary key,
  sender uuid references game.players(id) on delete set null, recipient uuid references game.players(id) on delete cascade,
  body text not null, at timestamptz not null default now(), read boolean not null default false);
create index if not exists dms_pair on game.dms (recipient, sender, id desc);
create index if not exists dms_pair2 on game.dms (sender, recipient, id desc);
create table if not exists game.contacts(player_id uuid not null references game.players(id) on delete cascade, contact uuid not null references game.players(id) on delete cascade,
  primary key (player_id, contact));
create table if not exists game.reports(id bigint generated always as identity primary key, reporter uuid references game.players(id) on delete set null,
  target uuid references game.players(id) on delete set null, message_id bigint, body text not null, reason text not null default '',
  at timestamptz not null default now(), resolved boolean not null default false);
create table if not exists game.admin_log(id bigint generated always as identity primary key, admin uuid, target uuid, action text not null, detail text not null default '',
  at timestamptz not null default now());
create table if not exists game.properties(id text primary key, name text not null, price bigint not null, mood int not null, stamina int not null, lvl int not null,
  blurb text not null, sort int not null);
-- Homes: from a doorway to a penthouse on the Moon. Each step raises your mood and stamina limits and brings its own perks
-- (see src/game/homes.js for what each perk key does).
alter table game.properties add column if not exists perks jsonb not null default '{}'::jsonb;
-- The homes themselves are listed in src/game/homes.js and loaded by 02_content.sql.


-- Every item a player has ever owned, for the collection log.
create table if not exists game.collection(player_id uuid not null references game.players(id) on delete cascade, item_id text not null, first_at timestamptz not null default now(),
  primary key (player_id, item_id));
insert into game.collection(player_id, item_id) select player_id, item_id from game.inventory on conflict do nothing;

alter table game.players add column if not exists look jsonb;
alter table game.players add column if not exists name_color text;
alter table game.players add column if not exists backdrop text;
alter table game.players add column if not exists tagline text not null default '';
alter table game.players add column if not exists stall_until timestamptz;
alter table game.players add column if not exists banned_until timestamptz;
alter table game.players add column if not exists ban_reason text;
alter table game.players add column if not exists muted_until timestamptz;
alter table game.players add column if not exists is_admin boolean not null default false;
alter table game.players add column if not exists crew_id bigint references game.crews(id) on delete set null;
alter table game.players add column if not exists crew_role text;
alter table game.players add column if not exists crew_joined timestamptz;
alter table game.players add column if not exists streak int not null default 0;
alter table game.players add column if not exists streak_day date;
alter table game.players add column if not exists guide jsonb not null default '{"done":{},"claimed":{}}'::jsonb;
alter table game.players add column if not exists daily jsonb not null default '{}'::jsonb;
alter table game.players add column if not exists property text not null default 'rough';
alter table game.players alter column property set default 'rough';
alter table game.players add column if not exists home_at timestamptz;
-- ---------- careers, vehicles, medals, missions, seasons, turf ----------
-- The lists themselves are loaded by 02_content.sql from the files in src/game.
create table if not exists game.careers(id text primary key, name text not null, perk text not null, max numeric not null, wage int not null,
  blurb text not null, ranks text[] not null, sort int not null);
create table if not exists game.career_ranks(rank int primary key, shifts int not null, lvl int not null);
create table if not exists game.vehicles(id text primary key, name text not null, price bigint not null, lvl int not null, blurb text not null,
  sort int not null, perks jsonb not null default '{}'::jsonb);
create table if not exists game.medals(id text primary key, stat text not null, at numeric not null, name text not null, what text not null,
  tier int not null, tiers int not null, sort int not null);
create table if not exists game.medals_earned(player_id uuid not null references game.players(id) on delete cascade, medal_id text not null,
  at timestamptz not null default now(), primary key (player_id, medal_id));
create table if not exists game.missions(chain text not null, step int not null, chain_name text not null, who text not null, lvl int not null,
  blurb text not null, title text not null, story text not null, done_text text not null, k text not null, n numeric not null,
  reward jsonb not null, sort int not null, primary key (chain, step));
create table if not exists game.seasons(id text primary key, name text not null, blurb text not null, from_m int not null, from_d int not null,
  to_m int not null, to_d int not null, points jsonb not null, icon text not null default 'Sparkles');
create table if not exists game.season_points(season text not null, year int not null, player_id uuid not null references game.players(id) on delete cascade,
  points numeric not null default 0, primary key (season, year, player_id));
create table if not exists game.season_claims(season text not null, year int not null, player_id uuid not null references game.players(id) on delete cascade,
  at timestamptz not null default now(), primary key (season, year, player_id));
-- Crew influence in each district. Control goes to the crew with the most influence over the last seven days.
create table if not exists game.turf(id bigint generated always as identity primary key, district text not null, crew_id bigint not null references game.crews(id) on delete cascade,
  pts numeric not null, at timestamptz not null default now());
create index if not exists turf_recent on game.turf (district, at desc);
alter table game.items add column if not exists season text;
alter table game.players add column if not exists career text;
alter table game.players add column if not exists career_rank int not null default 0;
alter table game.players add column if not exists career_shifts int not null default 0;
alter table game.players add column if not exists career_at timestamptz;
alter table game.players add column if not exists vehicle text not null default 'foot';
alter table game.players add column if not exists title text;
alter table game.players add column if not exists best_streak int not null default 0;
alter table game.players add column if not exists mission jsonb not null default '{}'::jsonb;
alter table game.players add column if not exists missions_done int not null default 0;
alter table game.players add column if not exists chains_done text[] not null default '{}';
do $$ declare t text; begin
  foreach t in array array['careers','career_ranks','vehicles','medals','medals_earned','missions','seasons','season_points','season_claims','turf'] loop
    execute format('alter table game.%I enable row level security', t);
    execute format('revoke all on game.%I from public', t);
  end loop;
end $$;

create or replace function game.pval(j jsonb) returns numeric language sql immutable as $$
  select case jsonb_typeof(j) when 'number' then (j #>> '{}')::numeric when 'boolean' then case when (j #>> '{}')::boolean then 1 else 0 end else 0 end $$;

-- A player's total perk from their home, vehicle and career, capped so nothing becomes free or instant by stacking.
create or replace function game.hperk(pid uuid, k text) returns numeric language sql stable as $$
  select case k when 'mug' then least(0.9, t) when 'hosp' then least(0.6, t) when 'jail' then least(0.6, t) when 'travel_disc' then least(1, t)
                when 'travel_time' then least(0.9, t) when 'heat' then least(1.5, t) when 'travel_free' then least(1, t) when 'travel_fast' then least(1, t) else t end
  from (select coalesce((select game.pval(h.perks->k) from game.players p join game.properties h on h.id = p.property where p.id = pid), 0)
             + coalesce((select game.pval(v.perks->k) from game.players p join game.vehicles v on v.id = p.vehicle where p.id = pid), 0)
             + coalesce((select c.max * p.career_rank / 10.0 from game.players p join game.careers c on c.id = p.career where p.id = pid and c.perk = k), 0) t) x $$;
alter table game.messages add column if not exists channel text not null default 'city';
create index if not exists messages_channel on game.messages (channel, id desc);

create table if not exists game.attacks(
  id bigint generated always as identity primary key,
  attacker uuid references game.players(id) on delete set null,
  defender uuid references game.players(id) on delete set null,
  attacker_won boolean not null, cash bigint not null default 0,
  at timestamptz not null default now());
create index if not exists attacks_defender on game.attacks (defender, at desc);
create index if not exists attacks_attacker on game.attacks (attacker, at desc);

-- ---------- access: lock everything down, then open the realtime feeds ----------
do $$ declare t text; begin
  foreach t in array array['players','items','inventory','districts','jobs','foes','listings','sales','stocks','holdings','messages','events','attacks','crews','crew_apps','crew_log','dms','contacts','reports','admin_log','properties','collection'] loop
    execute format('alter table game.%I enable row level security', t);
  end loop;
end $$;
revoke all on all tables in schema game from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname='anon') then revoke all on all tables in schema game from anon; end if;
end $$;
grant usage on schema game to authenticated;
-- Realtime needs read access to the rows it pushes. Players see chat, their own events, and market listings.
grant select on game.messages, game.events, game.listings to authenticated;
create or replace function game.my_crew() returns bigint language sql stable security definer set search_path = game, public as
$$ select crew_id from game.players where id = auth.uid() $$;
grant execute on function game.my_crew() to authenticated;
drop policy if exists messages_read on game.messages;
create policy messages_read on game.messages for select to authenticated
  using (channel = 'city' or channel = 'crew:' || coalesce(game.my_crew()::text, '-'));
drop policy if exists events_own on game.events;
create policy events_own on game.events for select to authenticated using (player_id = auth.uid());
drop policy if exists listings_read on game.listings;
create policy listings_read on game.listings for select to authenticated using (true);
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['messages','events','listings'] loop
      if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='game' and tablename=t) then
        execute format('alter publication supabase_realtime add table game.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =====================================================================
-- internal helpers (schema game: not callable from the browser)
-- =====================================================================
create or replace function game.fmt(n numeric) returns text language sql immutable as
$$ select '$' || to_char(coalesce(n,0), 'FM999,999,999,999,990') $$;

create or replace function game.skill_lvl(s jsonb, k text) returns int language sql immutable as
$$ select least(50, floor(sqrt(greatest(0, coalesce((s->>k)::numeric, 0)) / 25))::int + 1) $$;

create or replace function game.notify(pid uuid, k text, b text) returns void language sql as
$$ insert into game.events(player_id, kind, body) values (pid, k, b) $$;

create or replace function game.add_skill(pid uuid, k text, x numeric) returns void language plpgsql as $$
declare before int; after int; s jsonb; label text;
begin
  select skills into s from game.players where id = pid;
  before := game.skill_lvl(s, k);
  s := jsonb_set(s, array[k], to_jsonb(coalesce((s->>k)::numeric, 0) + x));
  after := game.skill_lvl(s, k);
  update game.players set skills = s where id = pid;
  if after > before then
    label := case k when 'thief' then 'Thieving' when 'fight' then 'Fighting' when 'fit' then 'Fitness' when 'trade' then 'Trading' else k end;
    perform game.notify(pid, 'skill', format('%s is now level %s.', label, after));
  end if;
end $$;

create or replace function game.gain_xp(pid uuid, x numeric) returns void language plpgsql as $$
declare p game.players; need numeric;
begin
  select * into p from game.players where id = pid for update;
  p.xp := p.xp + x;
  loop
    need := round(100 * power(p.level, 1.5));
    exit when p.xp < need;
    p.xp := p.xp - need; p.level := p.level + 1;
    p.max_health := p.max_health + 10; p.health := p.max_health;
    if p.level % 2 = 0 then p.max_grit := p.max_grit + 1; end if;
    if p.level % 3 = 0 then p.max_mood := p.max_mood + 25; end if;
    perform game.notify(pid, 'level', format('You reached level %s. Health refilled.', p.level));
  end loop;
  update game.players set xp = p.xp, level = p.level, max_health = p.max_health, health = p.health,
    max_grit = p.max_grit, max_mood = p.max_mood where id = pid;
end $$;

-- Load the caller's row, lock it, and apply everything that happens with time passing.
create or replace function game.me() returns game.players language plpgsql as $$
declare p game.players; m numeric; t timestamptz := now(); hr numeric;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into p from game.players where id = auth.uid() for update;
  if not found then raise exception 'NO_PLAYER'; end if;
  if p.banned_until > t then raise exception 'BANNED|%|%', coalesce(p.ban_reason, ''), p.banned_until; end if;
  m := extract(epoch from (t - p.bars_at)) / 60.0;
  if m > 0 then
    -- Regulars (bought with tokens) get stamina and grit back 25% faster.
    hr := 1 + game.hperk(p.id, 'regen');
    if p.stamina < p.max_stamina then p.stamina := least(p.max_stamina, p.stamina + m * 5 / 3.0 * hr * case when p.regular_until > t then 1.25 else 1 end); end if;
    if p.grit < p.max_grit then p.grit := least(p.max_grit, p.grit + m * 0.5 * case when p.regular_until > t then 1.25 else 1 end); end if;
    if p.mood < p.max_mood then p.mood := least(p.max_mood, p.mood + m * 2); end if;
    if p.health < p.max_health then p.health := least(p.max_health, p.health + m * 5 / 3.0 * hr); end if;
    p.heat := greatest(0, p.heat - m * (1 + game.hperk(p.id, 'heat')) * case when game.has_block(p.id, 'UPVT') then 1.25 else 1 end);
    p.bars_at := t;
  end if;
  if p.travel_until is not null and p.travel_until <= t then
    p.district := p.travel_to; p.travel_to := null; p.travel_until := null; p.heat := greatest(0, p.heat - 15);
  end if;
  update game.players set stamina = p.stamina, grit = p.grit, mood = p.mood, health = p.health, heat = p.heat,
    bars_at = p.bars_at, district = p.district, travel_to = p.travel_to, travel_until = p.travel_until, last_seen = t
  where id = p.id;
  p.last_seen := t;
  return p;
end $$;

create or replace function game.status(p game.players) returns text language sql stable as $$
  select case when p.jail_until > now() then 'jail' when p.hosp_until > now() then 'hosp'
              when p.travel_until > now() then 'travel' else 'ok' end $$;

create or replace function game.need_free(p game.players) returns void language plpgsql as $$
begin
  if p.jail_until > now() then raise exception 'You''re in the cells.'; end if;
  if p.hosp_until > now() then raise exception 'You''re in A&E.'; end if;
  if p.travel_until > now() then raise exception 'You''re still in the taxi.'; end if;
end $$;

create or replace function game.dboost(d text) returns numeric language sql immutable as
$$ select case d when 'old' then 0.25 when 'docks' then 0.5 when 'heights' then 0.8 when 'airport' then 1.0 when 'island' then 1.3 else 0 end $$;

create or replace function game.has_block(pid uuid, tk text) returns boolean language sql stable as $$
  select exists (select 1 from game.holdings h join game.stocks s using (ticker)
                 where h.player_id = pid and h.ticker = tk and h.shares >= s.perk_shares) $$;

create or replace function game.power(p game.players) returns numeric language sql stable as $$
  select (p.str + p.def + p.spd + p.dex) / 2.0
    * (1 + coalesce((select i.fx from game.items i join game.inventory v on v.item_id = i.id
                      where i.id = p.weapon and v.player_id = p.id and v.qty > 0), 0) / 100.0)
    * (1 + coalesce((select i.fx from game.items i join game.inventory v on v.item_id = i.id
                      where i.id = p.armour and v.player_id = p.id and v.qty > 0), 0) / 100.0)
    * (1 + (game.skill_lvl(p.skills, 'fight') - 1) / 100.0)
    * (case when game.has_block(p.id, 'RDLN') then 1.05 else 1 end) $$;

create or replace function game.give(pid uuid, iid text, n int) returns void language sql as $$
  insert into game.inventory(player_id, item_id, qty) values (pid, iid, n)
  on conflict (player_id, item_id) do update set qty = game.inventory.qty + excluded.qty;
  insert into game.collection(player_id, item_id) values (pid, iid) on conflict do nothing; $$;

create or replace function game.take(pid uuid, iid text, n int) returns void language plpgsql as $$
declare q int;
begin
  if n < 1 then raise exception 'Quantity must be at least 1.'; end if;
  select qty into q from game.inventory where player_id = pid and item_id = iid for update;
  if coalesce(q, 0) < n then raise exception 'You don''t have enough of that.'; end if;
  if q = n then
    delete from game.inventory where player_id = pid and item_id = iid;
    update game.players set weapon = case when weapon = iid then null else weapon end,
                            armour = case when armour = iid then null else armour end where id = pid;
  else
    update game.inventory set qty = qty - n where player_id = pid and item_id = iid;
  end if;
end $$;

-- Loot roll. Think of one big bag holding every copy of every item that will ever exist: each drop pulls one out.
-- An item's chance is simply how many copies are left, so a one-of-one sits among ~1.8 million copies and a
-- common with 12,000 copies turns up all the time. As copies get found the bag empties and they get rarer still.
-- "boost" (better districts, the casino vault, bigger boxes) multiplies the odds of each rarity step by (1+boost).
-- "cats" narrows the bag to some kinds of item 70% of the time. Food and consumables never run out.
-- Each pick is claimed atomically, so two players can never both get the last copy.
create or replace function game.roll_item(boost numeric default 0, cats text[] default null) returns text language plpgsql volatile as $$
declare use_cats boolean := cats is not null and array_length(cats, 1) > 0 and random() < 0.7; r numeric; pick text; tries int := 0;
begin
  loop
    tries := tries + 1; r := random(); pick := null;
    with wt as (select id, power(1 + boost, rarity) * coalesce(supply - minted, (array[6000,1200,200,30,5])[rarity + 1]) as w
                from game.items
                where (not use_cats or cat = any(cats)) and id not in ('founder', 'token') and season is null and (supply is null or minted < supply)),
         cum as (select id, sum(w) over (order by id) cw, sum(w) over () tw from wt)
    select id into pick from cum where cw >= r * tw order by cw limit 1;
    if pick is not null then
      update game.items set minted = minted + 1 where id = pick and (supply is null or minted < supply);
      if found then return pick; end if;
    end if;
    if use_cats and (pick is null or tries >= 3) then use_cats := false;
    elsif tries >= 8 or pick is null then
      -- Everything in reach is found. Fall back to something that never runs out.
      select id into pick from game.items where supply is null and cat = 'food' order by random() limit 1;
      update game.items set minted = minted + 1 where id = pick;
      return pick;
    end if;
  end loop;
end $$;

create or replace function game.stock_now(t text, base numeric, vol numeric) returns numeric language sql stable as $$
  with h as (select coalesce(sum(ascii(c)), 0)::numeric s from regexp_split_to_table(t, '') c),
       e as (select extract(epoch from now())::numeric x)
  select round((base * (1 + vol * 0.006 * (sin(e.x / 2220.0 + h.s * 0.37) + 0.6 * sin(e.x / 660.0 + h.s * 1.13)
                                           + 0.3 * sin(e.x / 180.0 + h.s * 2.71))))::numeric, 2) from h, e $$;

create or replace function game.networth(pid uuid) returns bigint language sql stable as $$
  select (select cash + bank from game.players where id = pid)
       + coalesce((select sum(v.qty * i.value) from game.inventory v join game.items i on i.id = v.item_id where v.player_id = pid), 0)
       + coalesce((select sum(l.qty * i.value) from game.listings l join game.items i on i.id = l.item_id where l.seller = pid), 0)
       + coalesce((select sum(h.shares * game.stock_now(s.ticker, s.price, s.vol)) from game.holdings h join game.stocks s using (ticker) where h.player_id = pid), 0)
$$;

create or replace function game.card(p game.players) returns jsonb language sql stable as $$
  select jsonb_build_object('id', p.id, 'name', p.name, 'level', p.level, 'district', p.district,
    'status', game.status(p), 'last_seen', p.last_seen, 'wins', p.wins, 'losses', p.losses,
    'created_at', p.created_at, 'founder', p.founder, 'regular', coalesce(p.regular_until > now(), false),
    'look', p.look, 'name_color', p.name_color, 'backdrop', p.backdrop, 'tagline', p.tagline, 'title', p.title,
    'crew', (select jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag) from game.crews c where c.id = p.crew_id),
    'protected', (p.level < 3 or p.created_at > now() - interval '1 day')) $$;

-- =====================================================================
-- public API (what the web app calls)
-- =====================================================================
create or replace function public.create_player(p_name text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')); fno int;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if exists (select 1 from game.players where id = auth.uid()) then raise exception 'You already have a character.'; end if;
  if char_length(n) < 3 or char_length(n) > 20 or n !~ '^[A-Za-z0-9 _.''-]+$' then
    raise exception 'Names are 3 to 20 letters, numbers, spaces, dots, dashes or apostrophes.'; end if;
  if exists (select 1 from game.players where lower(name) = lower(n)) then raise exception 'Someone on the street already goes by that name.'; end if;
  insert into game.players(id, name) values (auth.uid(), n);
  perform game.give(auth.uid(), 'med', 1); perform game.give(auth.uid(), 'lager', 2); perform game.give(auth.uid(), 'pie', 1);
  perform game.notify(auth.uid(), 'welcome', 'Welcome to the Waterfront. Try a job, hit the gym, and watch your back.');
  -- The first hundred characters each get a numbered Founder's key.
  update game.items set minted = minted + 1 where id = 'founder' and minted < supply returning minted into fno;
  if fno is not null then
    update game.players set founder = fno where id = auth.uid();
    perform game.give(auth.uid(), 'founder', 1);
    perform game.notify(auth.uid(), 'founder', format('You''re Founder #%s. A Founder''s key is in your stash. Only 100 will ever exist.', fno));
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('%s just arrived on the Waterfront. Founder #%s.', n, fno));
  else
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', n || ' just arrived on the Waterfront.');
  end if;
  return jsonb_build_object('ok', true, 'founder', fno);
end $$;

create or replace function public.get_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  perform game.medal_check(p.id);
  return jsonb_build_object(
    'me', to_jsonb(p) || jsonb_build_object('status', game.status(p), 'power', round(game.power(p)),
          'networth', game.networth(p.id), 'need_xp', round(100 * power(p.level, 1.5)),
          'skill_levels', jsonb_build_object('thief', game.skill_lvl(p.skills,'thief'), 'fight', game.skill_lvl(p.skills,'fight'),
                                             'fit', game.skill_lvl(p.skills,'fit'), 'trade', game.skill_lvl(p.skills,'trade'))),
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('item_id', item_id, 'qty', qty)) from game.inventory where player_id = p.id and qty > 0), '[]'),
    'holdings', coalesce((select jsonb_agg(jsonb_build_object('ticker', ticker, 'shares', shares, 'cost', cost, 'perk_at', perk_at)) from game.holdings where player_id = p.id and shares > 0), '[]'),
    'unseen', (select count(*) from game.events where player_id = p.id and not seen and kind <> 'dm'),
    'unread_dms', (select count(*) from game.dms where recipient = p.id and not read),
    'crew', (select jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag, 'role', p.crew_role,
             'apps', case when p.crew_role in ('leader', 'officer') then (select count(*) from game.crew_apps a where a.crew_id = c.id) else 0 end)
             from game.crews c where c.id = p.crew_id),
    'goals_ready', game.goals_ready(p.id),
    'season', (select jsonb_build_object('id', s.id, 'name', s.name, 'icon', s.icon) from game.seasons s where s.id = game.season_now()),
    'mission_ready', (select (p.mission->>'have')::numeric >= m.n from game.missions m where m.chain = p.mission->>'chain' and m.step = (p.mission->>'step')::int),
    'shift_ready', p.career is not null and (p.career_at is null or p.career_at < now() - interval '20 hours'),
    'home_ready', (select (h.perks ? 'daily') and (p.home_at is null or p.home_at < now() - interval '20 hours') from game.properties h where h.id = p.property),
    'tower', (select jsonb_agg(name) from (select x.name from game.players x join game.properties h on h.id = x.property where h.perks ? 'skyline' order by h.sort desc, x.name limit 5) x),
    'online', (select count(*) from game.players where last_seen > now() - interval '5 minutes'),
    'server_time', now());
end $$;

create or replace function public.get_events(p_limit int default 40) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; out jsonb;
begin
  p := game.me();
  select coalesce(jsonb_agg(e order by e.id desc), '[]') into out from
    (select id, kind, body, created_at, seen from game.events where player_id = p.id order by id desc limit least(p_limit, 100)) e;
  update game.events set seen = true where player_id = p.id and not seen;
  return out;
end $$;

-- ---------- jobs ----------
create or replace function public.do_job(p_job text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; j game.jobs; ch numeric; g bigint := 0; loot text; outcome text; secs int := 0; r numeric; ev text;
begin
  p := game.me(); perform game.need_free(p);
  select * into j from game.jobs where id = p_job;
  if not found then raise exception 'Unknown job.'; end if;
  if p.level < j.lvl then raise exception 'You need level % for that job.', j.lvl; end if;
  if j.district <> 'any' and j.district <> p.district then raise exception 'That job is in another district.'; end if;
  if p.grit < j.grit then raise exception 'Not enough grit. It comes back with time.'; end if;
  ch := least(96, greatest(5, j.base + sqrt(p.crime_xp) * 2.2 + case when p.luck > 0 then 10 else 0 end
        + least(25, (game.skill_lvl(p.skills, 'thief') - 1) * 0.5) + case when game.has_block(p.id, 'GRCH') then 3 else 0 end + game.hperk(p.id, 'job')
        + case when p.crew_id is not null and game.turf_owner(p.district) = p.crew_id then 3 else 0 end - p.heat * 0.25));
  update game.players set grit = grit - j.grit, jobs_done = jobs_done + 1, luck = greatest(0, luck - 1) where id = p.id;
  if random() * 100 < ch then
    g := floor(j.cash_min + random() * (j.cash_max - j.cash_min + 1));
    if random() < (case when j.id = 'bins' then 0.8 else 0.2 + j.grit * 0.012 end) then
      loot := game.roll_item(game.dboost(p.district) + case when j.id = 'vault' then 1 else 0 end, j.loot);
      perform game.give(p.id, loot, 1);
    end if;
    update game.players set cash = cash + g, crime_xp = crime_xp + j.xp, heat = least(100, heat + j.grit * 1.4) where id = p.id;
    perform game.gain_xp(p.id, j.xp); perform game.add_skill(p.id, 'thief', j.xp * 2);
    perform game.track(p.id, 'jobcash', g);
    perform game.track(p.id, 'job:' || j.id, 1);
    perform game.turf_add(p.id, p.district, j.grit);
    -- The crew that runs this district takes a 3% cut of every job done here (it doesn't come out of your pay).
    update game.crews set vault = vault + floor(g * 0.03) where id = game.turf_owner(p.district);
    ev := game.event_drop(p.id);
    outcome := 'win';
  else
    update game.players set heat = least(100, heat + case when j.id = 'bins' then 1 else j.grit * 3 end) where id = p.id;
    r := random();
    if r < (case when j.id = 'bins' then 0.06 else 0.45 end) then
      secs := round((60 + j.grit * 30) * (0.7 + random() * 0.6) * case when p.heat >= 75 then 2 else 1 end * (1 - game.hperk(p.id, 'jail')));
      update game.players set jail_until = now() + make_interval(secs => secs), jail_reason = 'Caught: ' || lower(j.name) where id = p.id;
      outcome := 'jail';
    elsif r < (case when j.id = 'bins' then 0.16 else 0.62 end) then
      secs := round((60 + j.grit * 20) * (1 - game.hperk(p.id, 'hosp')));
      update game.players set hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Hurt on a job: ' || lower(j.name),
        health = greatest(1, health - 25) where id = p.id;
      outcome := 'hosp';
    else
      update game.players set crime_xp = crime_xp + 1 where id = p.id;
      outcome := 'fail';
    end if;
  end if;
  perform game.track(p.id, 'job', 1);
  return jsonb_build_object('outcome', outcome, 'cash', g, 'item', loot, 'item2', ev, 'secs', secs, 'xp', case when outcome = 'win' then j.xp else 0 end, 'chance', round(ch));
end $$;

-- ---------- gym ----------
create or replace function public.train(p_stat text, p_sets int) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; n int; g numeric := 0; mood numeric; i int;
begin
  p := game.me(); perform game.need_free(p);
  if p_stat not in ('str', 'def', 'spd', 'dex') then raise exception 'Unknown stat.'; end if;
  n := least(greatest(coalesce(p_sets, 1), 1), floor(p.stamina / 5)::int);
  if n < 1 then raise exception 'Out of stamina. Rest up or have an energy drink.'; end if;
  mood := p.mood;
  for i in 1..n loop
    g := g + (1.2 + random() * 1.6) * (0.6 + mood / 500.0) * (1 + p.level * 0.04);
    mood := greatest(0, mood - 2);
  end loop;
  g := g * (1 + (game.skill_lvl(p.skills, 'fit') - 1) / 100.0) * (1 + game.hperk(p.id, 'gym')) * case when game.has_block(p.id, 'CHPW') then 1.05 else 1 end;
  execute format('update game.players set %I = %I + $1, stamina = stamina - $2, mood = $3 where id = $4', p_stat, p_stat)
    using g, n * 5, mood, p.id;
  perform game.gain_xp(p.id, ceil(n / 2.0)); perform game.add_skill(p.id, 'fit', n);
  perform game.track(p.id, 'train', n);
  return jsonb_build_object('stat', p_stat, 'sets', n, 'gain', round(g, 1));
end $$;

-- ---------- fights against city NPCs ----------
create or replace function public.fight_npc(p_foe text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; f game.foes; pw numeric; ch numeric; g bigint := 0; loot text; secs int := 0; lost bigint := 0; ev text;
begin
  p := game.me(); perform game.need_free(p);
  select * into f from game.foes where id = p_foe;
  if not found then raise exception 'Nobody by that name around here.'; end if;
  if f.district <> p.district then raise exception 'They''re in another district.'; end if;
  if p.level < f.lvl then raise exception 'You need level % for that fight.', f.lvl; end if;
  if p.stamina < 25 then raise exception 'You need 25 stamina to start a fight.'; end if;
  if p.health < p.max_health * 0.3 then raise exception 'You''re too beaten up. Heal first.'; end if;
  pw := game.power(p);
  ch := least(0.97, greatest(0.03, 1 / (1 + exp(-8 * (pw / (pw + f.power) - 0.5)))));
  update game.players set stamina = stamina - 25 where id = p.id;
  if random() < ch then
    g := floor(f.cash_min + random() * (f.cash_max - f.cash_min + 1));
    if random() < 0.3 then loot := game.roll_item(game.dboost(p.district) + f.sort * 0.15, f.loot); perform game.give(p.id, loot, 1); end if;
    update game.players set cash = cash + g, wins = wins + 1, health = greatest(1, health - (5 + floor(random() * 16))),
      heat = least(100, heat + 6) where id = p.id;
    perform game.gain_xp(p.id, f.xp); perform game.add_skill(p.id, 'fight', ceil(f.xp / 2.0));
    perform game.track(p.id, 'fight_win', 1); perform game.track(p.id, 'fight:' || f.id, 1);
    perform game.turf_add(p.id, p.district, 3);
    ev := game.event_drop(p.id);
    return jsonb_build_object('won', true, 'cash', g, 'item', loot, 'item2', ev, 'xp', f.xp, 'chance', round(ch * 100));
  else
    lost := floor(p.cash * 0.1 * (1 - game.hperk(p.id, 'mug'))); secs := round((120 + f.lvl * 20) * (1 - game.hperk(p.id, 'hosp')));
    update game.players set losses = losses + 1, cash = cash - lost, health = greatest(1, health - (40 + floor(random() * 31))),
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Lost a fight to the ' || lower(f.name) where id = p.id;
    perform game.add_skill(p.id, 'fight', 2);
    return jsonb_build_object('won', false, 'lost', lost, 'secs', secs, 'chance', round(ch * 100));
  end if;
end $$;

-- ---------- player vs player ----------
create or replace function public.attack(p_target uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players; pa numeric; pd numeric; ch numeric; mug bigint := 0; secs int; xp int;
begin
  p := game.me(); perform game.need_free(p);
  if p_target = p.id then raise exception 'You can''t attack yourself.'; end if;
  if p.level < 3 then raise exception 'You need level 3 before you can attack other players.'; end if;
  select * into t from game.players where id = p_target for update;
  if not found then raise exception 'Nobody by that name.'; end if;
  if game.status(t) <> 'ok' then raise exception '% isn''t around right now.', t.name; end if;
  if t.district <> p.district then raise exception '% is in another district.', t.name; end if;
  if p.crew_id is not null and t.crew_id = p.crew_id then raise exception '% is in your crew.', t.name; end if;
  if t.level < 3 or t.created_at > now() - interval '1 day' then raise exception '% is new to the city. Leave them be for now.', t.name; end if;
  if p.stamina < 25 then raise exception 'You need 25 stamina to start a fight.'; end if;
  if p.health < p.max_health * 0.3 then raise exception 'You''re too beaten up. Heal first.'; end if;
  if exists (select 1 from game.attacks where attacker = p.id and defender = t.id and at > now() - interval '10 minutes') then
    raise exception 'You hit % recently. Give it ten minutes.', t.name; end if;
  pa := game.power(p); pd := game.power(t);
  ch := least(0.95, greatest(0.05, 1 / (1 + exp(-8 * (pa / (pa + pd) - 0.5)))));
  update game.players set stamina = stamina - 25, heat = least(100, heat + 5) where id = p.id;
  if random() < ch then
    mug := floor(t.cash * (0.05 + random() * 0.05) * (1 - game.hperk(t.id, 'mug')));
    secs := round((300 + floor(random() * 600)) * (1 - game.hperk(t.id, 'hosp')))::int;
    update game.players set cash = cash - mug, losses = losses + 1, health = greatest(1, round(health * 0.2)),
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Mugged by ' || p.name where id = t.id;
    update game.players set cash = cash + mug, wins = wins + 1 where id = p.id;
    xp := 10 + t.level * 5;
    perform game.gain_xp(p.id, xp); perform game.add_skill(p.id, 'fight', xp);
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, true, mug);
    perform game.notify(t.id, 'attacked', format('%s attacked you and took %s. You''re in A&E.', p.name, game.fmt(mug)));
    if p.crew_id is not null then
      update game.crews set respect = respect + 1 + t.level / 4 where id = p.crew_id;
      perform game.turf_add(p.id, p.district, case when t.crew_id is not null then 10 else 4 end);
    end if;
    perform game.track(p.id, 'fight_win', 1);
    return jsonb_build_object('won', true, 'cash', mug, 'xp', xp, 'name', t.name, 'secs', secs, 'chance', round(ch * 100));
  else
    secs := round((180 + floor(random() * 300)) * (1 - game.hperk(p.id, 'hosp')))::int;
    update game.players set losses = losses + 1, health = greatest(1, round(health * 0.2)),
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Beaten by ' || t.name where id = p.id;
    update game.players set wins = wins + 1 where id = t.id;
    perform game.gain_xp(t.id, 5); perform game.add_skill(t.id, 'fight', 5); perform game.add_skill(p.id, 'fight', 3);
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, false, 0);
    perform game.notify(t.id, 'defended', format('%s tried to attack you and lost.', p.name));
    return jsonb_build_object('won', false, 'name', t.name, 'secs', secs, 'chance', round(ch * 100));
  end if;
end $$;

create or replace function public.list_players(p_scope text default 'here', p_q text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; out jsonb;
begin
  p := game.me();
  select coalesce(jsonb_agg(game.card(x) || jsonb_build_object('power_hint', case
            when game.power(x) > game.power(p) * 1.5 then 'much stronger' when game.power(x) > game.power(p) * 1.1 then 'stronger'
            when game.power(x) < game.power(p) * 0.66 then 'much weaker' when game.power(x) < game.power(p) * 0.9 then 'weaker' else 'even' end)
          order by x.last_seen desc), '[]') into out
  from game.players x
  where x.id in (select y.id from game.players y
        where y.id <> p.id
          and case p_scope
                when 'search' then y.name ilike '%' || coalesce(p_q, '') || '%'
                when 'online' then y.last_seen > now() - interval '5 minutes'
                when 'contacts' then exists (select 1 from game.contacts k where k.player_id = p.id and k.contact = y.id)
                else y.district = p.district and game.status(y) = 'ok' end
        order by y.last_seen desc limit 60);
  return out;
end $$;

create or replace function public.get_profile(p_id uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare me game.players; t game.players;
begin
  me := game.me();
  select * into t from game.players where id = p_id;
  if not found then raise exception 'Nobody by that name.'; end if;
  return game.card(t) || jsonb_build_object(
    'jobs_done', t.jobs_done, 'busts', t.busts, 'hosp_reason', case when t.hosp_until > now() then t.hosp_reason end,
    'jail_reason', case when t.jail_until > now() then t.jail_reason end,
    'until', coalesce(case when t.jail_until > now() then t.jail_until end, case when t.hosp_until > now() then t.hosp_until end, t.travel_until),
    'is_me', t.id = me.id,
    'is_contact', exists (select 1 from game.contacts k where k.player_id = me.id and k.contact = t.id),
    'property', (select name from game.properties where id = t.property),
    'collection', (select count(*) from game.collection where player_id = t.id),
    'medals', (select count(*) from game.medals_earned where player_id = t.id),
    'vehicle_name', (select name from game.vehicles where id = t.vehicle),
    'career_title', (select c.ranks[t.career_rank] || ', ' || lower(c.name) from game.careers c where c.id = t.career),
    'crew_role', t.crew_role,
    'recent', coalesce((select jsonb_agg(jsonb_build_object('at', a.at, 'won', a.attacker_won, 'cash', a.cash,
                 'attacker', (select name from game.players where id = a.attacker), 'defender', (select name from game.players where id = a.defender)) order by a.at desc)
              from (select * from game.attacks where attacker = t.id or defender = t.id order by at desc limit 8) a), '[]'));
end $$;

-- ---------- the cells and A&E ----------
create or replace function public.jail_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'level', level, 'until', jail_until, 'reason', jail_reason, 'look', look, 'name_color', name_color) order by jail_until)
                   from (select * from game.players where jail_until > now() order by jail_until limit 60) x), '[]');
end $$;

create or replace function public.hosp_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'level', level, 'until', hosp_until, 'reason', hosp_reason, 'look', look, 'name_color', name_color) order by hosp_until)
                   from (select * from game.players where hosp_until > now() order by hosp_until limit 60) x), '[]');
end $$;

create or replace function public.bust(p_target uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players; ch numeric; secs int := 0;
begin
  p := game.me(); perform game.need_free(p);
  if p_target = p.id then raise exception 'Nice try.'; end if;
  select * into t from game.players where id = p_target for update;
  if not found or t.jail_until is null or t.jail_until <= now() then raise exception 'They''re already out.'; end if;
  if p.grit < 5 then raise exception 'Springing someone takes 5 grit.'; end if;
  ch := least(92, greatest(8, 72 + sqrt(p.crime_xp) * 2 - t.level * 3.5 - p.heat * 0.2));
  update game.players set grit = grit - 5 where id = p.id;
  if random() * 100 < ch then
    update game.players set jail_until = null, jail_reason = null where id = t.id;
    update game.players set busts = busts + 1, crime_xp = crime_xp + 2, heat = least(100, heat + 4) where id = p.id;
    perform game.gain_xp(p.id, 3 + t.level); perform game.add_skill(p.id, 'thief', 4);
    perform game.notify(t.id, 'bust', format('%s sprang you from the cells.', p.name));
    perform game.track(p.id, 'bust', 1);
    return jsonb_build_object('ok', true, 'name', t.name, 'chance', round(ch));
  else
    update game.players set heat = least(100, heat + 6) where id = p.id;
    if random() < 0.45 then
      secs := round((120 + floor(random() * 180)) * (1 - game.hperk(p.id, 'jail')))::int;
      update game.players set jail_until = now() + make_interval(secs => secs), jail_reason = 'Caught springing ' || t.name where id = p.id;
    end if;
    return jsonb_build_object('ok', false, 'name', t.name, 'jailed', secs > 0, 'secs', secs, 'chance', round(ch));
  end if;
end $$;

create or replace function public.bail() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; cost bigint;
begin
  p := game.me();
  if p.jail_until is null or p.jail_until <= now() then raise exception 'You''re not in the cells.'; end if;
  cost := ceil(extract(epoch from (p.jail_until - now()))) * p.level * 2;
  if p.cash < cost then raise exception 'Bail is %. You don''t have it on you.', game.fmt(cost); end if;
  update game.players set cash = cash - cost, jail_until = null, jail_reason = null where id = p.id;
  return jsonb_build_object('paid', cost);
end $$;

-- ---------- travel ----------
create or replace function public.travel(p_district text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; d game.districts; fare int; secs int;
begin
  p := game.me(); perform game.need_free(p);
  select * into d from game.districts where id = p_district;
  if not found then raise exception 'No such place.'; end if;
  if d.id = p.district then raise exception 'You''re already there.'; end if;
  if p.level < d.lvl then raise exception '% opens at level %.', d.name, d.lvl; end if;
  fare := case when game.has_block(p.id, 'VOLT') or game.hperk(p.id, 'travel_free') > 0 then 0 else round(d.fare * (1 - game.hperk(p.id, 'travel_disc'))) end;
  if p.cash < fare then raise exception 'The fare is %.', game.fmt(fare); end if;
  secs := case when game.hperk(p.id, 'travel_fast') > 0 then 5 else greatest(5, round((case when game.has_block(p.id, 'TRHD') then 20 else 60 end) * (1 - game.hperk(p.id, 'travel_time')))) end;
  update game.players set cash = cash - fare, travel_to = d.id, travel_until = now() + make_interval(secs => secs) where id = p.id;
  perform game.track(p.id, 'travel', 1); perform game.track(p.id, 'travel:' || d.id, 1);
  return jsonb_build_object('to', d.id, 'secs', secs, 'fare', fare);
end $$;

-- ---------- items ----------
create or replace function public.use_item(p_item text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; it game.items; e jsonb; got text[] := '{}'; x text; c bigint := 0; i int; n int; msg text := null; r numeric;
begin
  p := game.me();
  select * into it from game.items where id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  if not exists (select 1 from game.inventory where player_id = p.id and item_id = it.id and qty > 0) then raise exception 'You don''t have one.'; end if;
  if it.cat in ('weapon', 'armour') then
    if it.cat = 'weapon' then update game.players set weapon = case when weapon = it.id then null else it.id end where id = p.id;
    else update game.players set armour = case when armour = it.id then null else it.id end where id = p.id; end if;
    return jsonb_build_object('equipped', it.id);
  end if;
  e := it.effect;
  if e = '{}'::jsonb then raise exception 'You can''t use that. Sell it or keep it.'; end if;
  if e ? 'hosp' and p.hosp_until > now() then
    update game.players set hosp_until = greatest(now(), hosp_until - make_interval(secs => (e->>'hosp')::int)),
      health = least(max_health, health + coalesce((e->>'health')::numeric, 0)) where id = p.id;
    perform game.take(p.id, it.id, 1);
    return jsonb_build_object('used', it.id, 'msg', 'Patched up. Your stay just got shorter.');
  end if;
  perform game.need_free(p);
  update game.players set
    stamina = case when e ? 'stamina' then least(max_stamina * 1.5, stamina + (e->>'stamina')::numeric) else stamina end,
    mood    = case when e ? 'mood'    then least(max_mood * 3, mood + (e->>'mood')::numeric) else mood end,
    health  = case when e ? 'health'  then least(max_health, health + (e->>'health')::numeric) else health end,
    grit    = case when e ? 'grit'    then least(max_grit, grit + (e->>'grit')::numeric) else grit end,
    heat    = case when e ? 'heat'    then greatest(0, least(100, heat + (e->>'heat')::numeric)) else heat end,
    luck    = luck + coalesce((e->>'luck')::int, 0)
  where id = p.id;
  if e ? 'box' then
    n := coalesce((e->'box'->>'n')::int, 1);
    for i in 1..n loop
      x := game.roll_item(coalesce((e->'box'->>'boost')::numeric, 0),
             case when e->'box' ? 'cats' then array(select jsonb_array_elements_text(e->'box'->'cats')) else null end);
      perform game.give(p.id, x, 1); got := got || x;
    end loop;
  end if;
  if e ? 'cash' then
    c := floor((e->'cash'->>0)::numeric + random() * ((e->'cash'->>1)::numeric - (e->'cash'->>0)::numeric + 1));
    update game.players set cash = cash + c where id = p.id;
  end if;
  if e ? 'lotto' then
    r := random();
    c := case when r < 0.0008 then 250000 when r < 0.012 then 5000 when r < 0.07 then 500 when r < 0.22 then 60 else 0 end;
    update game.players set cash = cash + c where id = p.id;
    msg := case when c >= 250000 then 'Every symbol lines up. JACKPOT.' when c >= 5000 then 'Three gold bars!'
                when c >= 500 then 'Three cherries.' when c > 0 then 'You win your money back, plus a pie''s worth.' else 'No luck. Not even close.' end;
  end if;
  perform game.take(p.id, it.id, 1);
  perform game.track(p.id, 'use', 1);
  return jsonb_build_object('used', it.id, 'items', to_jsonb(got), 'cash', c, 'msg', msg);
end $$;

create or replace function public.shop_buy(p_item text, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; it game.items; cost bigint; q int := greatest(1, least(coalesce(p_qty, 1), 100));
begin
  p := game.me();
  select * into it from game.items where id = p_item and shop;
  if not found then raise exception 'The store doesn''t sell that.'; end if;
  cost := round(it.value * q * (1 - least(0.15, (game.skill_lvl(p.skills, 'trade') - 1) * 0.005)));
  if p.cash < cost then raise exception 'That''s %. You have % on you.', game.fmt(cost), game.fmt(p.cash); end if;
  update game.players set cash = cash - cost where id = p.id;
  perform game.give(p.id, it.id, q);
  return jsonb_build_object('item', it.id, 'qty', q, 'cost', cost);
end $$;

create or replace function public.pawn(p_item text, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; it game.items; q int := greatest(1, coalesce(p_qty, 1)); pay bigint;
begin
  p := game.me();
  select * into it from game.items where id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  if it.id = 'founder' then raise exception 'You can''t pawn your Founder''s key. It''s yours for good.'; end if;
  if it.id = 'token' then raise exception 'The pawn shop won''t touch tokens. Sell them on the market instead.'; end if;
  perform game.take(p.id, it.id, q);
  pay := floor(it.value * q * (0.5 + least(0.1, (game.skill_lvl(p.skills, 'trade') - 1) * 0.003)));
  update game.players set cash = cash + pay where id = p.id;
  return jsonb_build_object('item', it.id, 'qty', q, 'paid', pay);
end $$;

-- ---------- player market ----------
create or replace function public.market_list(p_item text, p_qty int, p_price bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; slots int; new_id bigint;
begin
  p := game.me();
  if coalesce(p_qty, 0) < 1 or coalesce(p_price, 0) < 1 then raise exception 'Enter a quantity and a price.'; end if;
  perform game.market_ok(p);
  if p_item = 'founder' then raise exception 'Founder''s keys stay with the founder. They can''t be sold.'; end if;
  slots := 20 + game.skill_lvl(p.skills, 'trade') / 5 + case when game.has_block(p.id, 'SHWD') then 2 else 0 end
         + case when p.stall_until > now() then 10 else 0 end + game.hperk(p.id, 'listings')::int;
  if (select count(*) from game.listings where seller = p.id) >= slots then raise exception 'You can have % listings. Cancel one first.', slots; end if;
  perform game.take(p.id, p_item, p_qty);
  insert into game.listings(seller, item_id, qty, price) values (p.id, p_item, p_qty, p_price) returning game.listings.id into new_id;
  perform game.track(p.id, 'market', 1);
  return jsonb_build_object('id', new_id);
end $$;

create or replace function public.market_cancel(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l game.listings;
begin
  p := game.me();
  select * into l from game.listings where id = p_id and seller = p.id for update;
  if not found then raise exception 'That listing is gone.'; end if;
  delete from game.listings where id = l.id;
  perform game.give(p.id, l.item_id, l.qty);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.market_buy(p_id bigint, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l game.listings; q int := greatest(1, coalesce(p_qty, 1)); cost bigint; fee bigint; nm text;
begin
  p := game.me();
  select * into l from game.listings where id = p_id for update;
  if not found then raise exception 'Someone beat you to it.'; end if;
  if l.seller = p.id then raise exception 'That''s your own listing.'; end if;
  perform game.market_ok(p);
  if q > l.qty then raise exception 'Only % left.', l.qty; end if;
  cost := l.price * q;
  if p.cash < cost then raise exception 'That''s %. You have % on you.', game.fmt(cost), game.fmt(p.cash); end if;
  fee := floor(cost * 0.03);
  update game.players set cash = cash - cost where id = p.id;
  update game.players set cash = cash + cost - fee where id = l.seller;
  if q = l.qty then delete from game.listings where id = l.id; else update game.listings set qty = qty - q where id = l.id; end if;
  perform game.give(p.id, l.item_id, q);
  insert into game.sales(item_id, qty, price, seller, buyer) values (l.item_id, q, l.price, l.seller, p.id);
  select name into nm from game.items where id = l.item_id;
  perform game.notify(l.seller, 'sale', format('%s bought %s%s from you for %s (after the 3%% market fee: %s).', p.name,
    case when q > 1 then q || '× ' else '' end, nm, game.fmt(cost), game.fmt(cost - fee)));
  perform game.add_skill(p.id, 'trade', 2); perform game.add_skill(l.seller, 'trade', 3);
  perform game.track(p.id, 'market', 1);
  return jsonb_build_object('item', l.item_id, 'qty', q, 'cost', cost);
end $$;

create or replace function public.market_overview(p_cats text[] default null, p_q text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(x order by x.rarity desc, x.min_price desc) from (
    select l.item_id, i.rarity, i.cat, min(l.price) min_price, sum(l.qty) qty, count(*) listings, i.value
    from game.listings l join game.items i on i.id = l.item_id
    where (p_cats is null or i.cat = any(p_cats)) and (p_q is null or i.name ilike '%' || p_q || '%')
    group by l.item_id, i.rarity, i.cat, i.value limit 200) x), '[]');
end $$;

create or replace function public.market_item(p_item text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object(
    'value', (select value from game.items where id = p_item),
    'supply', (select supply from game.items where id = p_item),
    'found', (select minted from game.items where id = p_item),
    'around', coalesce((select sum(qty) from game.inventory where item_id = p_item), 0) + coalesce((select sum(qty) from game.listings where item_id = p_item), 0),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'qty', l.qty, 'price', l.price, 'seller', pl.name, 'mine', l.seller = p.id) order by l.price, l.id)
                 from (select * from game.listings where item_id = p_item order by price, id limit 40) l join game.players pl on pl.id = l.seller), '[]'),
    'sales', coalesce((select jsonb_agg(jsonb_build_object('price', s.price, 'qty', s.qty, 'at', s.at) order by s.at)
                 from (select * from game.sales where item_id = p_item order by at desc limit 30) s), '[]'));
end $$;

create or replace function public.my_listings() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item_id', item_id, 'qty', qty, 'price', price, 'created_at', created_at) order by created_at desc)
                   from game.listings where seller = p.id), '[]');
end $$;

-- ---------- stock exchange ----------
create or replace function public.stock_board() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('ticker', s.ticker, 'name', s.name, 'sector', s.sector, 'vol', s.vol,
      'close', s.price, 'prev', s.prev, 'now', game.stock_now(s.ticker, s.price, s.vol), 'history', s.history,
      'perk_shares', s.perk_shares, 'perk', s.perk, 'perk_desc', s.perk_desc, 'real_date', s.real_date,
      'shares', coalesce(h.shares, 0), 'cost', coalesce(h.cost, 0), 'perk_at', h.perk_at) order by s.sort)
    from game.stocks s left join game.holdings h on h.ticker = s.ticker and h.player_id = p.id), '[]');
end $$;

create or replace function public.stock_trade(p_ticker text, p_shares bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; s game.stocks; px numeric; h game.holdings; amt bigint; fee numeric; basis numeric; q bigint := abs(coalesce(p_shares, 0));
begin
  p := game.me();
  if q < 1 then raise exception 'Enter how many shares.'; end if;
  select * into s from game.stocks where ticker = p_ticker;
  if not found then raise exception 'Unknown company.'; end if;
  px := game.stock_now(s.ticker, s.price, s.vol);
  select * into h from game.holdings where player_id = p.id and ticker = s.ticker for update;
  if p_shares > 0 then
    amt := ceil(q * px);
    if p.cash < amt then raise exception 'That''s %. You have % on you.', game.fmt(amt), game.fmt(p.cash); end if;
    update game.players set cash = cash - amt where id = p.id;
    insert into game.holdings(player_id, ticker, shares, cost) values (p.id, s.ticker, q, amt)
      on conflict (player_id, ticker) do update set shares = game.holdings.shares + q, cost = game.holdings.cost + amt;
    perform game.add_skill(p.id, 'trade', 1 + floor(log((amt + 1)::numeric)));
    perform game.track(p.id, 'stock', 1);
    return jsonb_build_object('bought', q, 'price', px, 'total', amt);
  else
    if h.shares is null or h.shares < q then raise exception 'You only own % shares.', coalesce(h.shares, 0); end if;
    fee := greatest(0.002, 0.01 - 0.0002 * (game.skill_lvl(p.skills, 'trade') - 1));
    amt := floor(q * px * (1 - fee));
    basis := h.cost * q / h.shares;
    update game.holdings set shares = shares - q, cost = cost - basis where player_id = p.id and ticker = s.ticker;
    update game.players set cash = cash + amt where id = p.id;
    perform game.add_skill(p.id, 'trade', 1 + floor(log((q * px + 1)::numeric)) + case when amt > basis then 2 else 0 end);
    return jsonb_build_object('sold', q, 'price', px, 'total', amt, 'gain', round(amt - basis));
  end if;
end $$;

create or replace function public.stock_perk(p_ticker text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; s game.stocks; h game.holdings; got text[] := '{}'; c bigint := 0; x text; i int;
begin
  p := game.me();
  select * into s from game.stocks where ticker = p_ticker;
  select * into h from game.holdings where player_id = p.id and ticker = p_ticker for update;
  if h.shares is null or h.shares < s.perk_shares then raise exception 'You need % shares for this perk.', s.perk_shares; end if;
  if s.perk not like 'daily:%' then raise exception 'That perk is always on while you hold the block.'; end if;
  if h.perk_at is not null and h.perk_at > now() - interval '1 day' then raise exception 'Already collected today.'; end if;
  case s.perk
    when 'daily:cash500' then c := 500;
    when 'daily:cash750' then c := 750;
    when 'daily:smallbox' then got := array['smallbox'];
    when 'daily:burner' then got := array['burner'];
    when 'daily:drink' then got := array['drink'];
    when 'daily:med2' then got := array['med', 'med'];
    when 'daily:coin' then got := array[game.roll_item(1.2, array['coin'])];
    when 'daily:card' then got := array[game.roll_item(0.6, array['card'])];
    when 'daily:elec' then got := array[game.roll_item(0.6, array['elec'])];
    when 'daily:food3' then got := array[game.roll_item(0, array['food']), game.roll_item(0, array['food']), game.roll_item(0, array['food'])];
    when 'daily:food2' then got := array[game.roll_item(0, array['food']), game.roll_item(0, array['food'])];
    else raise exception 'Unknown perk.';
  end case;
  foreach x in array got loop perform game.give(p.id, x, 1); end loop;
  update game.players set cash = cash + c where id = p.id;
  update game.holdings set perk_at = now() where player_id = p.id and ticker = p_ticker;
  return jsonb_build_object('items', to_jsonb(got), 'cash', c);
end $$;

-- ---------- bank ----------
create or replace function public.bank(p_amount bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; a bigint := coalesce(p_amount, 0);
begin
  p := game.me();
  if a = 0 then raise exception 'Enter an amount.'; end if;
  if a > 0 and a > p.cash then raise exception 'You only have % on you.', game.fmt(p.cash); end if;
  if a < 0 and -a > p.bank then raise exception 'You only have % in the bank.', game.fmt(p.bank); end if;
  update game.players set cash = cash - a, bank = bank + a where id = p.id;
  return jsonb_build_object('cash', p.cash - a, 'bank', p.bank + a);
end $$;

-- ---------- chat ----------
drop function if exists public.chat_send(text);
drop function if exists public.chat_recent(int);
create or replace function public.chat_send(p_body text, p_channel text default 'city') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); ch text := coalesce(p_channel, 'city');
begin
  p := game.me();
  if p.muted_until > now() then raise exception 'You''ve been muted until %.', to_char(p.muted_until at time zone 'Pacific/Auckland', 'HH24:MI on DD Mon'); end if;
  if ch = 'crew' then
    if p.crew_id is null then raise exception 'You''re not in a crew.'; end if;
    ch := 'crew:' || p.crew_id;
  elsif ch <> 'city' then raise exception 'Unknown channel.'; end if;
  if char_length(b) < 1 then raise exception 'Say something.'; end if;
  if char_length(b) > 280 then raise exception 'Keep it under 280 characters.'; end if;
  if p.last_chat > now() - interval '3 seconds' then raise exception 'Slow down a little.'; end if;
  update game.players set last_chat = now() where id = p.id;
  insert into game.messages(player_id, name, body, channel) values (p.id, p.name, b, ch);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.chat_recent(p_limit int default 60, p_channel text default 'city') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; ch text := coalesce(p_channel, 'city');
begin
  p := game.me();
  if ch = 'crew' then
    if p.crew_id is null then return '[]'; end if;
    ch := 'crew:' || p.crew_id;
  elsif ch <> 'city' then raise exception 'Unknown channel.'; end if;
  return coalesce((select jsonb_agg(m order by m.id) from
    (select x.id, x.player_id, x.name, x.body, x.created_at, x.channel, pl.look, pl.name_color,
            (select tag from game.crews c where c.id = pl.crew_id) crew_tag
     from game.messages x left join game.players pl on pl.id = x.player_id
     where x.channel = ch order by x.id desc limit least(p_limit, 200)) m), '[]');
end $$;

-- ---------- leaderboard ----------
create or replace function public.leaderboard(p_by text default 'level') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  if p_by = 'crews' then
    return coalesce((select jsonb_agg(x) from (
      select c.id, c.name, c.tag, c.respect, (select count(*) from game.players m where m.crew_id = c.id) members
      from game.crews c order by c.respect desc, c.id limit 50) x), '[]');
  end if;
  return coalesce((select jsonb_agg(x) from (
    select id, name, level, wins, district, look, name_color, case when p_by = 'wealth' then game.networth(id) end networth
    from game.players where banned_until is null or banned_until < now()
    order by case when p_by = 'wealth' then game.networth(id) when p_by = 'fights' then wins else level * 1000000 + xp end desc
    limit 50) x), '[]');
end $$;


-- =====================================================================
-- TOKENS: the premium currency.
-- Tokens are an ordinary stash item ("token"), so they can be traded on the player market for game cash like
-- anything else. That way players who never pay can still earn them. They come into the game in one way only:
-- a real payment confirmed by Stripe, credited by public.credit_purchase(), which only the server can call.
-- =====================================================================
create table if not exists game.token_packs(id text primary key, tokens int not null, price_cents int not null, currency text not null default 'nzd', name text not null, sort int not null default 0);
insert into game.token_packs(id, tokens, price_cents, name, sort) values
  ('handful', 30, 499, 'A handful', 1), ('stack', 100, 1499, 'A stack', 2), ('pile', 220, 2999, 'A pile (10% extra)', 3), ('vault', 600, 7499, 'The vault (25% extra)', 4)
on conflict (id) do update set tokens = excluded.tokens, price_cents = excluded.price_cents, name = excluded.name, sort = excluded.sort;

create table if not exists game.purchases(
  id bigint generated always as identity primary key,
  stripe_session text not null unique,
  player_id uuid references game.players(id) on delete set null,
  pack text not null, tokens int not null, amount_cents int not null, currency text not null,
  created_at timestamptz not null default now());
alter table game.token_packs enable row level security;
alter table game.purchases enable row level security;
revoke all on game.token_packs, game.purchases from public;







-- Called only by the Stripe webhook (with the service key) once Stripe confirms a payment.
-- The session id is unique, so a webhook that arrives twice can never credit twice.
create or replace function public.credit_purchase(p_session text, p_player uuid, p_pack text, p_amount int, p_currency text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare k game.token_packs; new_id bigint;
begin
  select * into k from game.token_packs where id = p_pack;
  if not found then raise exception 'Unknown pack %', p_pack; end if;
  if not exists (select 1 from game.players where id = p_player) then raise exception 'Unknown player %', p_player; end if;
  if p_amount < k.price_cents or lower(p_currency) <> k.currency then raise exception 'Paid % % for pack % (expected % %)', p_amount, p_currency, k.id, k.price_cents, k.currency; end if;
  insert into game.purchases(stripe_session, player_id, pack, tokens, amount_cents, currency)
    values (p_session, p_player, k.id, k.tokens, p_amount, lower(p_currency))
    on conflict (stripe_session) do nothing returning id into new_id;
  if new_id is null then return jsonb_build_object('ok', true, 'duplicate', true); end if;
  perform game.give(p_player, 'token', k.tokens);
  update game.items set minted = minted + k.tokens where id = 'token';
  perform game.notify(p_player, 'tokens', format('Payment received. %s tokens are in your stash. Thank you for supporting Backstreet.', k.tokens));
  return jsonb_build_object('ok', true, 'tokens', k.tokens);
end $$;
revoke all on function public.credit_purchase(text, uuid, text, int, text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then revoke all on function public.credit_purchase(text, uuid, text, int, text) from anon, authenticated; end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.credit_purchase(text, uuid, text, int, text) to service_role; end if;
end $$;


-- =====================================================================
-- ANTI-ABUSE, GOALS, CREWS, MESSAGES, HOMES, COSMETICS AND ADMIN
-- =====================================================================

-- New characters can't trade on the market for their first day. This stops people making throwaway accounts
-- just to pass starting cash and items to their main character.
create or replace function game.market_ok(p game.players) returns void language plpgsql as $$
begin
  if p.created_at > now() - interval '1 day' then
    raise exception 'The market opens to you after your first day in the city. Opens in %.',
      to_char(p.created_at + interval '1 day' - now(), 'HH24"h "MI"m"');
  end if;
end $$;

-- ---------- daily goals, the new-player guide and the daily streak ----------
create or replace function game.today() returns date language sql stable as $$ select (now() at time zone 'Pacific/Auckland')::date $$;

create or replace function game.guide_steps() returns jsonb language sql immutable as $$
  select '[
    {"k":"job","t":"Do your first job","d":"Jobs are how you make money. Start with the bins.","cash":200,"go":"jobs"},
    {"k":"home","t":"Get off the street","d":"A $500 tent beats a doorway. Sleeping rough slows everything down.","cash":300,"go":"home"},
    {"k":"train","t":"Train at the gym","d":"Stronger stats win fights.","cash":200,"go":"gym"},
    {"k":"use","t":"Use something from your stash","d":"A lager lifts your mood, which makes training count for more.","cash":300,"go":"stash"},
    {"k":"travel","t":"Take a taxi somewhere","d":"Each district has its own jobs and trouble.","cash":500,"go":"map"},
    {"k":"market","t":"Buy or sell on the market","d":"Every listing is another player. Opens after your first day.","cash":500,"go":"market"},
    {"k":"stock","t":"Buy some shares","d":"Prices follow real companies every trading day.","cash":500,"go":"exchange"},
    {"k":"crew","t":"Join or start a crew","d":"Crews share a chat, a vault and a reputation.","cash":1000,"go":"crews"}
  ]'::jsonb $$;

create or replace function game.daily_ensure(pid uuid) returns jsonb language plpgsql as $$
declare d jsonb; lvl int; td date := game.today(); pool jsonb; picks jsonb;
begin
  select daily, level into d, lvl from game.players where id = pid;
  if d->>'day' = td::text then return d; end if;
  pool := jsonb_build_array(
    jsonb_build_object('k', 'job', 'n', 6, 't', 'Do 6 jobs'),
    jsonb_build_object('k', 'jobcash', 'n', 300 * lvl, 't', 'Make ' || game.fmt(300 * lvl) || ' from jobs'),
    jsonb_build_object('k', 'train', 'n', 20, 't', 'Train 20 sets at the gym'),
    jsonb_build_object('k', 'fight_win', 'n', 2, 't', 'Win 2 fights'),
    jsonb_build_object('k', 'market', 'n', 1, 't', 'Buy or sell on the market'),
    jsonb_build_object('k', 'bust', 'n', 1, 't', 'Spring someone from the cells'),
    jsonb_build_object('k', 'stock', 'n', 1, 't', 'Buy shares on the exchange'),
    jsonb_build_object('k', 'use', 'n', 2, 't', 'Use 2 items from your stash'),
    jsonb_build_object('k', 'travel', 'n', 1, 't', 'Take a taxi'));
  select jsonb_agg(x || jsonb_build_object('have', 0, 'claimed', false)) into picks
    from (select x from jsonb_array_elements(pool) x order by md5(pid::text || td::text || (x->>'k')) limit 3) s;
  d := jsonb_build_object('day', td, 'goals', picks, 'bonus', false);
  update game.players set daily = d where id = pid;
  return d;
end $$;

-- Record progress towards the guide and today's goals.
create or replace function game.track(pid uuid, k text, n numeric default 1) returns void language plpgsql as $$
declare d jsonb; g jsonb; i int; changed boolean := false;
begin
  if exists (select 1 from jsonb_array_elements(game.guide_steps()) x where x->>'k' = k) then
    update game.players set guide = jsonb_set(guide, array['done', k], 'true') where id = pid and not (guide->'done' ? k);
  end if;
  d := game.daily_ensure(pid);
  for i in 0 .. jsonb_array_length(d->'goals') - 1 loop
    g := d->'goals'->i;
    if g->>'k' = k and (g->>'have')::numeric < (g->>'n')::numeric then
      d := jsonb_set(d, array['goals', i::text, 'have'], to_jsonb(least((g->>'n')::numeric, (g->>'have')::numeric + n)));
      changed := true;
    end if;
  end loop;
  if changed then update game.players set daily = d where id = pid; end if;
  -- Story mission progress
  update game.players p set mission = jsonb_set(p.mission, '{have}', to_jsonb(least(m.n, (p.mission->>'have')::numeric + track.n)))
    from game.missions m where p.id = pid and m.chain = p.mission->>'chain' and m.step = (p.mission->>'step')::int and m.k = track.k
      and (p.mission->>'have')::numeric < m.n;
  -- Seasonal event points
  insert into game.season_points(season, year, player_id, points)
    select s.id, extract(year from game.today())::int, pid, (s.points->>track.k)::numeric * track.n from game.seasons s
    where s.id = game.season_now() and s.points ? track.k
    on conflict (season, year, player_id) do update set points = game.season_points.points + excluded.points;
end $$;

-- How many rewards are waiting to be collected (shown as a badge).
create or replace function game.goals_ready(pid uuid) returns int language sql stable as $$
  select (select count(*) from game.players p, jsonb_array_elements(p.daily->'goals') g
          where p.id = pid and p.daily->>'day' = game.today()::text and (g->>'have')::numeric >= (g->>'n')::numeric and not (g->>'claimed')::boolean)::int
       + (select count(*) from game.players p, jsonb_array_elements(game.guide_steps()) s
          where p.id = pid and (p.guide->'done' ? (s->>'k')) and not (p.guide->'claimed' ? (s->>'k')))::int
       + (select case when streak_day is distinct from game.today() then 1 else 0 end from game.players where id = pid) $$;

create or replace function game.streak_reward(day int, lvl int) returns jsonb language sql immutable as $$
  select case ((day - 1) % 7) + 1
    when 1 then jsonb_build_object('cash', 100 * lvl)
    when 2 then jsonb_build_object('item', 'lager', 'qty', 2)
    when 3 then jsonb_build_object('cash', 200 * lvl)
    when 4 then jsonb_build_object('item', 'drink', 'qty', 1)
    when 5 then jsonb_build_object('cash', 400 * lvl)
    when 6 then jsonb_build_object('item', 'med', 'qty', 2)
    else case when day % 28 = 0 then jsonb_build_object('item', 'crate', 'qty', 1) else jsonb_build_object('item', 'smallbox', 'qty', 1) end end $$;

create or replace function public.goals_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; d jsonb; nxt int;
begin
  p := game.me();
  d := game.daily_ensure(p.id);
  select * into p from game.players where id = p.id;
  nxt := case when p.streak_day = game.today() - 1 then p.streak + 1 when p.streak_day = game.today() then p.streak else 1 end;
  return jsonb_build_object('daily', d, 'guide', p.guide, 'steps', game.guide_steps(),
    'streak', case when p.streak_day >= game.today() - 1 then p.streak else 0 end,
    'checked_in', p.streak_day = game.today(), 'next_day', nxt,
    'week', (select jsonb_agg(game.streak_reward(x, p.level) || jsonb_build_object('day', x)) from generate_series(((nxt - 1) / 7) * 7 + 1, ((nxt - 1) / 7) * 7 + 7) x),
    'reset_at', ((game.today() + 1)::timestamp at time zone 'Pacific/Auckland'));
end $$;

create or replace function public.checkin() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; n int; r jsonb;
begin
  p := game.me();
  if p.streak_day = game.today() then raise exception 'You''ve already collected today''s reward. Come back tomorrow.'; end if;
  n := case when p.streak_day = game.today() - 1 then p.streak + 1 else 1 end;
  r := game.streak_reward(n, p.level);
  update game.players set streak = n, best_streak = greatest(best_streak, n), streak_day = game.today(), cash = cash + coalesce((r->>'cash')::bigint, 0) where id = p.id;
  if r ? 'item' then perform game.give(p.id, r->>'item', (r->>'qty')::int); end if;
  return r || jsonb_build_object('streak', n);
end $$;

create or replace function public.goal_claim(p_index int) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; d jsonb; g jsonb; c bigint; bonus boolean := false;
begin
  p := game.me(); d := game.daily_ensure(p.id);
  g := d->'goals'->p_index;
  if g is null then raise exception 'Unknown goal.'; end if;
  if (g->>'claimed')::boolean then raise exception 'Already collected.'; end if;
  if (g->>'have')::numeric < (g->>'n')::numeric then raise exception 'Not finished yet.'; end if;
  c := 250 * p.level;
  d := jsonb_set(d, array['goals', p_index::text, 'claimed'], 'true');
  if not (d->>'bonus')::boolean and not exists (select 1 from jsonb_array_elements(d->'goals') x where not (x->>'claimed')::boolean) then
    d := jsonb_set(d, '{bonus}', 'true'); bonus := true;
    perform game.give(p.id, 'smallbox', 1); perform game.give(p.id, 'token', 1);
    update game.items set minted = minted + 1 where id = 'token';
  end if;
  update game.players set daily = d, cash = cash + c where id = p.id;
  perform game.gain_xp(p.id, 5 * p.level);
  return jsonb_build_object('cash', c, 'bonus', bonus);
end $$;

create or replace function public.guide_claim(p_step text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; st jsonb; done_all boolean;
begin
  p := game.me();
  select x into st from jsonb_array_elements(game.guide_steps()) x where x->>'k' = p_step;
  if st is null then raise exception 'Unknown step.'; end if;
  if not (p.guide->'done' ? p_step) then raise exception 'Not done yet.'; end if;
  if p.guide->'claimed' ? p_step then raise exception 'Already collected.'; end if;
  update game.players set guide = jsonb_set(guide, array['claimed', p_step], 'true'), cash = cash + (st->>'cash')::bigint where id = p.id
    returning (select count(*) = 0 from jsonb_array_elements(game.guide_steps()) s where not (guide->'claimed' ? (s->>'k'))) into done_all;
  if done_all then perform game.give(p.id, 'smallbox', 2); end if;
  return jsonb_build_object('cash', (st->>'cash')::bigint, 'finished', done_all);
end $$;

-- ---------- crews ----------
create or replace function game.crew_note(cid bigint, b text) returns void language sql as $$
  insert into game.crew_log(crew_id, body) values (cid, b) $$;

create or replace function public.crew_create(p_name text, p_tag text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')); t text := upper(btrim(coalesce(p_tag, ''))); cid bigint;
begin
  p := game.me(); perform game.need_free(p);
  if p.crew_id is not null then raise exception 'Leave your crew first.'; end if;
  if p.level < 5 then raise exception 'You need level 5 to start a crew.'; end if;
  if p.cash < 25000 then raise exception 'Starting a crew costs $25,000.'; end if;
  if char_length(n) < 3 or char_length(n) > 24 or n !~ '^[A-Za-z0-9 ''&.-]+$' then raise exception 'Crew names are 3 to 24 letters, numbers and spaces.'; end if;
  if t !~ '^[A-Z0-9]{2,4}$' then raise exception 'Tags are 2 to 4 letters or numbers.'; end if;
  if exists (select 1 from game.crews where lower(name) = lower(n)) then raise exception 'There''s already a crew called that.'; end if;
  if exists (select 1 from game.crews where tag = t) then raise exception 'That tag is taken.'; end if;
  insert into game.crews(name, tag, leader) values (n, t, p.id) returning id into cid;
  update game.players set cash = cash - 25000, crew_id = cid, crew_role = 'leader', crew_joined = now() where id = p.id;
  delete from game.crew_apps where player_id = p.id;
  perform game.crew_note(cid, p.name || ' started the crew.');
  perform game.track(p.id, 'crew', 1);
  insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('A new crew is in town: %s [%s], led by %s.', n, t, p.name));
  return jsonb_build_object('id', cid);
end $$;

create or replace function public.crew_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(x order by x.respect desc, x.id) from (
    select c.id, c.name, c.tag, c.motto, c.respect, (select count(*) from game.players m where m.crew_id = c.id) members,
           (select name from game.players where id = c.leader) leader,
           exists (select 1 from game.crew_apps a where a.crew_id = c.id and a.player_id = p.id) applied
    from game.crews c limit 200) x), '[]');
end $$;

create or replace function public.crew_get(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.crews; mine boolean; boss boolean;
begin
  p := game.me();
  select * into c from game.crews where id = p_id;
  if not found then raise exception 'That crew has broken up.'; end if;
  mine := p.crew_id = c.id; boss := mine and p.crew_role in ('leader', 'officer');
  return jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag, 'motto', c.motto, 'respect', c.respect, 'created_at', c.created_at,
    'vault', case when mine then c.vault end, 'mine', mine, 'my_role', case when mine then p.crew_role end,
    'applied', exists (select 1 from game.crew_apps where crew_id = c.id and player_id = p.id),
    'rank', (select count(*) + 1 from game.crews x where x.respect > c.respect),
    'members', coalesce((select jsonb_agg(game.card(m) || jsonb_build_object('role', m.crew_role, 'joined', m.crew_joined)
                 order by case m.crew_role when 'leader' then 0 when 'officer' then 1 else 2 end, m.level desc) from game.players m where m.crew_id = c.id), '[]'),
    'apps', case when boss then coalesce((select jsonb_agg(game.card(m) || jsonb_build_object('note', a.note, 'at', a.at) order by a.at)
                 from game.crew_apps a join game.players m on m.id = a.player_id where a.crew_id = c.id), '[]') end,
    'log', case when mine then coalesce((select jsonb_agg(jsonb_build_object('body', body, 'at', at) order by id desc)
                 from (select * from game.crew_log where crew_id = c.id order by id desc limit 25) l), '[]') end);
end $$;

create or replace function public.crew_apply(p_id bigint, p_note text default '') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.crews;
begin
  p := game.me();
  if p.crew_id is not null then raise exception 'You''re already in a crew.'; end if;
  select * into c from game.crews where id = p_id;
  if not found then raise exception 'That crew has broken up.'; end if;
  if (select count(*) from game.crew_apps where player_id = p.id) >= 5 then raise exception 'You can have 5 applications open at once.'; end if;
  insert into game.crew_apps(crew_id, player_id, note) values (c.id, p.id, left(coalesce(p_note, ''), 200)) on conflict do nothing;
  perform game.notify(m.id, 'crew', format('%s wants to join %s.', p.name, c.name)) from game.players m where m.crew_id = c.id and m.crew_role in ('leader', 'officer');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.crew_withdraw(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me(); delete from game.crew_apps where crew_id = p_id and player_id = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.crew_decide(p_player uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players; c game.crews;
begin
  p := game.me();
  if p.crew_role not in ('leader', 'officer') then raise exception 'Only the leader and officers can do that.'; end if;
  select * into c from game.crews where id = p.crew_id;
  if not exists (select 1 from game.crew_apps where crew_id = c.id and player_id = p_player) then raise exception 'That application has been withdrawn.'; end if;
  select * into t from game.players where id = p_player for update;
  delete from game.crew_apps where crew_id = c.id and player_id = p_player;
  if not p_accept then
    perform game.notify(t.id, 'crew', format('%s turned down your application.', c.name));
    return jsonb_build_object('ok', true);
  end if;
  if t.crew_id is not null then raise exception '% has joined another crew.', t.name; end if;
  if (select count(*) from game.players where crew_id = c.id) >= 25 then raise exception 'Your crew is full (25 members).'; end if;
  update game.players set crew_id = c.id, crew_role = 'member', crew_joined = now() where id = t.id;
  delete from game.crew_apps where player_id = t.id;
  perform game.notify(t.id, 'crew', format('Welcome to %s. %s let you in.', c.name, p.name));
  perform game.crew_note(c.id, format('%s joined, let in by %s.', t.name, p.name));
  perform game.track(t.id, 'crew', 1);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.crew_leave() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; nxt uuid; cid bigint;
begin
  p := game.me(); cid := p.crew_id;
  if cid is null then raise exception 'You''re not in a crew.'; end if;
  update game.players set crew_id = null, crew_role = null, crew_joined = null where id = p.id;
  if p.crew_role = 'leader' then
    select id into nxt from game.players where crew_id = cid order by case crew_role when 'officer' then 0 else 1 end, crew_joined limit 1;
    if nxt is null then
      -- Last one out: the crew breaks up and its vault goes to whoever turned off the lights.
      update game.players set cash = cash + (select vault from game.crews where id = cid) where id = p.id;
      delete from game.crews where id = cid;
      return jsonb_build_object('ok', true, 'disbanded', true);
    end if;
    update game.players set crew_role = 'leader' where id = nxt;
    update game.crews set leader = nxt where id = cid;
    perform game.notify(nxt, 'crew', 'You''re the new leader of your crew.');
  end if;
  perform game.crew_note(cid, p.name || ' left the crew.');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.crew_member(p_player uuid, p_action text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players;
begin
  p := game.me();
  select * into t from game.players where id = p_player for update;
  if t.crew_id is distinct from p.crew_id or p.crew_id is null then raise exception 'They''re not in your crew.'; end if;
  if t.id = p.id then raise exception 'Use Leave crew instead.'; end if;
  case p_action
    when 'kick' then
      if not (p.crew_role = 'leader' or (p.crew_role = 'officer' and t.crew_role = 'member')) then raise exception 'You can''t remove them.'; end if;
      update game.players set crew_id = null, crew_role = null, crew_joined = null where id = t.id;
      perform game.notify(t.id, 'crew', format('%s removed you from the crew.', p.name));
      perform game.crew_note(p.crew_id, format('%s removed %s.', p.name, t.name));
    when 'officer' then
      if p.crew_role <> 'leader' then raise exception 'Only the leader can promote.'; end if;
      update game.players set crew_role = 'officer' where id = t.id;
      perform game.crew_note(p.crew_id, format('%s made %s an officer.', p.name, t.name));
    when 'member' then
      if p.crew_role <> 'leader' then raise exception 'Only the leader can demote.'; end if;
      update game.players set crew_role = 'member' where id = t.id;
    when 'leader' then
      if p.crew_role <> 'leader' then raise exception 'Only the leader can hand over the crew.'; end if;
      update game.players set crew_role = 'leader' where id = t.id;
      update game.players set crew_role = 'officer' where id = p.id;
      update game.crews set leader = t.id where id = p.crew_id;
      perform game.notify(t.id, 'crew', format('%s handed you the crew. You''re the leader now.', p.name));
      perform game.crew_note(p.crew_id, format('%s handed leadership to %s.', p.name, t.name));
    else raise exception 'Unknown action.';
  end case;
  return jsonb_build_object('ok', true);
end $$;

-- Anyone in the crew can pay in. Only the leader can pay out, to a member.
create or replace function public.crew_vault(p_amount bigint, p_to uuid default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; a bigint := coalesce(p_amount, 0); t game.players; c game.crews;
begin
  p := game.me();
  if p.crew_id is null then raise exception 'You''re not in a crew.'; end if;
  if a < 1 then raise exception 'Enter an amount.'; end if;
  select * into c from game.crews where id = p.crew_id for update;
  if p_to is null then
    if a > p.cash then raise exception 'You only have % on you.', game.fmt(p.cash); end if;
    update game.players set cash = cash - a where id = p.id;
    update game.crews set vault = vault + a where id = c.id;
    perform game.crew_note(c.id, format('%s paid %s into the vault.', p.name, game.fmt(a)));
  else
    if p.crew_role <> 'leader' then raise exception 'Only the leader can pay out of the vault.'; end if;
    select * into t from game.players where id = p_to;
    if t.crew_id is distinct from c.id then raise exception 'They''re not in your crew.'; end if;
    if a > c.vault then raise exception 'The vault only has %.', game.fmt(c.vault); end if;
    update game.crews set vault = vault - a where id = c.id;
    update game.players set cash = cash + a where id = t.id;
    perform game.notify(t.id, 'crew', format('%s paid you %s from the crew vault.', p.name, game.fmt(a)));
    perform game.crew_note(c.id, format('%s paid %s to %s.', p.name, game.fmt(a), t.name));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.crew_motto(p_motto text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  if p.crew_role <> 'leader' then raise exception 'Only the leader can change that.'; end if;
  update game.crews set motto = left(btrim(coalesce(p_motto, '')), 140) where id = p.crew_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- direct messages and contacts ----------
create or replace function public.dm_send(p_to uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players; b text := btrim(coalesce(p_body, ''));
begin
  p := game.me();
  if p.muted_until > now() then raise exception 'You''ve been muted.'; end if;
  select * into t from game.players where id = p_to;
  if not found or t.id = p.id then raise exception 'Nobody to send that to.'; end if;
  if char_length(b) < 1 then raise exception 'Write something.'; end if;
  if char_length(b) > 1000 then raise exception 'Keep it under 1,000 characters.'; end if;
  if p.last_chat > now() - interval '2 seconds' then raise exception 'Slow down a little.'; end if;
  if p.created_at > now() - interval '1 hour' and (select count(*) from game.dms where sender = p.id and at > now() - interval '1 hour') >= 10 then
    raise exception 'New players can send 10 messages an hour.'; end if;
  update game.players set last_chat = now() where id = p.id;
  insert into game.dms(sender, recipient, body) values (p.id, t.id, b);
  perform game.notify(t.id, 'dm', format('%s: %s', p.name, left(b, 80)));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.dm_threads() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(x order by x.at desc) from (
    select distinct on (other) other id, pl.name, pl.look, pl.name_color, d.body, d.at, d.sender = p.id mine,
           (select count(*) from game.dms u where u.recipient = p.id and u.sender = other and not u.read) unread
    from (select *, case when sender = p.id then recipient else sender end other from game.dms where sender = p.id or recipient = p.id) d
    join game.players pl on pl.id = d.other
    order by other, d.id desc) x), '[]');
end $$;

create or replace function public.dm_thread(p_with uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  update game.dms set read = true where recipient = p.id and sender = p_with and not read;
  update game.events set seen = true where player_id = p.id and kind = 'dm' and not seen;
  return jsonb_build_object('with', (select game.card(x) from game.players x where x.id = p_with),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'mine', sender = p.id, 'body', body, 'at', at) order by id) from
      (select * from game.dms where (sender = p.id and recipient = p_with) or (sender = p_with and recipient = p.id) order by id desc limit 100) m), '[]'));
end $$;

create or replace function public.contact_toggle(p_id uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  if p_id = p.id then raise exception 'That''s you.'; end if;
  if exists (select 1 from game.contacts where player_id = p.id and contact = p_id) then
    delete from game.contacts where player_id = p.id and contact = p_id; return jsonb_build_object('contact', false);
  end if;
  if (select count(*) from game.contacts where player_id = p.id) >= 200 then raise exception 'Your contacts list is full.'; end if;
  insert into game.contacts(player_id, contact) values (p.id, p_id);
  return jsonb_build_object('contact', true);
end $$;

create or replace function public.report(p_target uuid, p_message bigint, p_reason text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; b text;
begin
  p := game.me();
  if (select count(*) from game.reports where reporter = p.id and at > now() - interval '1 hour') >= 10 then raise exception 'You''ve sent a lot of reports. Try again later.'; end if;
  select body into b from game.messages where id = p_message;
  insert into game.reports(reporter, target, message_id, body, reason) values (p.id, p_target, p_message, coalesce(b, ''), left(coalesce(p_reason, ''), 300));
  perform game.notify(a.id, 'report', format('%s reported a player.', p.name)) from game.players a where a.is_admin;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- homes ----------
create or replace function public.property_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('current', p.property, 'collected_today', p.home_at > now() - interval '20 hours',
    'next_collect', p.home_at + interval '20 hours',
    'homes', (select jsonb_agg(to_jsonb(h) || jsonb_build_object('owners', (select count(*) from game.players x where x.property = h.id),
                'names', case when h.price >= 80000000 then (select jsonb_agg(x.name order by x.name) from (select name from game.players where property = h.id limit 12) x) end) order by sort)
              from game.properties h));
end $$;

create or replace function public.property_move(p_id text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; cur game.properties; nw game.properties; net bigint;
begin
  p := game.me(); perform game.need_free(p);
  select * into cur from game.properties where id = p.property;
  select * into nw from game.properties where id = p_id;
  if not found then raise exception 'No such place.'; end if;
  if nw.id = cur.id then raise exception 'You already live there.'; end if;
  if p.level < nw.lvl then raise exception 'You need level % to live there.', nw.lvl; end if;
  -- Your current home sells for 70% of what it cost.
  net := nw.price - floor(cur.price * 0.7);
  if net > p.cash then raise exception 'Moving costs % after selling your current place. You have % on you.', game.fmt(net), game.fmt(p.cash); end if;
  update game.players set cash = cash - net, property = nw.id,
    max_mood = 250 + (level / 3) * 25 + nw.mood, max_stamina = 100 + nw.stamina,
    mood = least(mood, 250 + (level / 3) * 25 + nw.mood), stamina = least(stamina, 100 + nw.stamina * 1.5),
    home_at = case when nw.sort > cur.sort then null else home_at end where id = p.id;
  if nw.sort > cur.sort then perform game.track(p.id, 'home', 1); end if;
  if nw.price >= 8000000 and nw.sort > cur.sort then
    insert into game.messages(player_id, name, body) values (null, 'The Bugle',
      case nw.id when 'tower' then format('%s just bought Backstreet Tower. Their name is going up on the skyline tonight.', p.name)
                 when 'yacht' then format('%s just bought the superyacht Nightjar. Mind the wake.', p.name)
                 when 'bridge' then format('%s just bought the Harbour Bridge. Yes, the whole thing. Tolls go up tomorrow.', p.name)
                 when 'moon' then format('%s just bought a penthouse on the Moon. Wave tonight. They can see you.', p.name)
                 when 'lighthouse' then format('%s just bought the lighthouse island. Every ship now passes under their window.', p.name)
                 else format('%s just moved into %s.', p.name, case when nw.name ~ '^(A |The )' then lower(left(nw.name, 1)) || substr(nw.name, 2) else 'the ' || lower(nw.name) end) end);
  end if;
  return jsonb_build_object('moved', nw.id, 'paid', net);
end $$;

-- Each home's daily perk: collect once every 20 hours.
create or replace function public.home_collect() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; d jsonb;
begin
  p := game.me();
  select perks->'daily' into d from game.properties where id = p.property;
  if d is null then raise exception 'Your home doesn''t come with a daily perk yet. Move up the ladder.'; end if;
  if p.home_at > now() - interval '20 hours' then raise exception 'Already collected. Come back later.'; end if;
  update game.players set home_at = now(), cash = cash + coalesce((d->>'cash')::bigint, 0) where id = p.id;
  if d ? 'item' then perform game.give(p.id, d->>'item', (d->>'qty')::int); end if;
  return d;
end $$;

-- ---------- looks, profile and the collection log ----------
create or replace function public.profile_set(p_look jsonb, p_tagline text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l jsonb := '{}'::jsonb; k text; lim int;
begin
  p := game.me();
  if p_look is not null then
    foreach k in array array['skin', 'hat', 'shirt', 'bg'] loop
      lim := case k when 'skin' then 6 when 'hat' then 9 when 'shirt' then 8 else 7 end;
      if jsonb_typeof(p_look->k) <> 'number' or (p_look->>k)::int < 0 or (p_look->>k)::int >= lim then raise exception 'Pick a %.', k; end if;
      l := l || jsonb_build_object(k, (p_look->>k)::int);
    end loop;
    foreach k in array array['shades', 'glasses', 'beard', 'scar', 'grin', 'chain', 'lips'] loop
      l := l || jsonb_build_object(k, coalesce((p_look->>k)::boolean, false));
    end loop;
    update game.players set look = l where id = p.id;
  end if;
  if p_tagline is not null then
    update game.players set tagline = left(btrim(regexp_replace(p_tagline, '\s+', ' ', 'g')), 80) where id = p.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.my_collection() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(item_id) from game.collection where player_id = p.id), '[]');
end $$;

-- ---------- token shop: cosmetics join the refills ----------
create or replace function game.token_menu() returns jsonb language sql immutable as $$
  select '[
    {"id":"stamina","cost":10,"name":"Refill stamina","desc":"Fill your stamina to the top. Once a day.","group":"boost"},
    {"id":"grit","cost":10,"name":"Refill grit","desc":"Fill your grit to the top. Once a day.","group":"boost"},
    {"id":"heat","cost":5,"name":"Call a lawyer","desc":"Wipe your heat back to zero. Once a day.","group":"boost"},
    {"id":"regular","cost":150,"name":"Regular for 30 days","desc":"Stamina and grit come back 25% faster, and you get a Regular badge. Stacks if you buy it again.","group":"boost"},
    {"id":"stall","cost":40,"name":"Bigger market stall","desc":"Ten more market listings for 30 days. Stacks.","group":"boost"},
    {"id":"colour","cost":60,"name":"Name colour","desc":"Your name in colour everywhere: chat, rankings, your profile. Yours to keep.","group":"style","arg":"colour"},
    {"id":"backdrop","cost":40,"name":"Profile backdrop","desc":"A district skyline across the top of your profile. Yours to keep.","group":"style","arg":"backdrop"},
    {"id":"rename","cost":100,"name":"Change your name","desc":"A fresh start under a new street name.","group":"style","arg":"name"}
  ]'::jsonb $$;

drop function if exists public.token_spend(text);
create or replace function public.token_spend(p_what text, p_arg text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; opt jsonb; cost int; last timestamptz; n text;
begin
  p := game.me();
  select x into opt from jsonb_array_elements(game.token_menu()) x where x->>'id' = p_what;
  if opt is null then raise exception 'Unknown option.'; end if;
  cost := (opt->>'cost')::int;
  if p_what in ('stamina', 'grit', 'heat') then
    last := (p.refill_at->>p_what)::timestamptz;
    if last is not null and last > now() - interval '1 day' then raise exception 'You''ve already used that today.'; end if;
    if p_what = 'stamina' and p.stamina >= p.max_stamina then raise exception 'Your stamina is already full.'; end if;
    if p_what = 'grit' and p.grit >= p.max_grit then raise exception 'Your grit is already full.'; end if;
    if p_what = 'heat' and p.heat < 1 then raise exception 'You''ve got no heat to clear.'; end if;
  end if;
  if p_what = 'colour' and coalesce(p_arg, '') not in ('gold', 'ember', 'seaglass', 'sky', 'violet', 'rose') then raise exception 'Pick a colour.'; end if;
  if p_what = 'backdrop' and not exists (select 1 from game.districts where id = p_arg) then raise exception 'Pick a skyline.'; end if;
  if p_what = 'rename' then
    n := btrim(regexp_replace(coalesce(p_arg, ''), '\s+', ' ', 'g'));
    if char_length(n) < 3 or char_length(n) > 20 or n !~ '^[A-Za-z0-9 _.''-]+$' then
      raise exception 'Names are 3 to 20 letters, numbers, spaces, dots, dashes or apostrophes.'; end if;
    if exists (select 1 from game.players where lower(name) = lower(n) and id <> p.id) then raise exception 'Someone already goes by that name.'; end if;
  end if;
  if not exists (select 1 from game.inventory where player_id = p.id and item_id = 'token' and qty >= cost) then
    raise exception 'That costs % tokens.', cost; end if;
  perform game.take(p.id, 'token', cost);
  case p_what
    when 'stamina' then update game.players set stamina = max_stamina where id = p.id;
    when 'grit' then update game.players set grit = max_grit where id = p.id;
    when 'heat' then update game.players set heat = 0 where id = p.id;
    when 'regular' then update game.players set regular_until = greatest(coalesce(regular_until, now()), now()) + interval '30 days' where id = p.id;
    when 'stall' then update game.players set stall_until = greatest(coalesce(stall_until, now()), now()) + interval '30 days' where id = p.id;
    when 'colour' then update game.players set name_color = p_arg where id = p.id;
    when 'backdrop' then update game.players set backdrop = p_arg where id = p.id;
    when 'rename' then
      insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('%s will be going by %s from now on.', p.name, n));
      update game.players set name = n where id = p.id;
  end case;
  if p_what in ('stamina', 'grit', 'heat') then
    update game.players set refill_at = refill_at || jsonb_build_object(p_what, now()) where id = p.id;
  end if;
  return jsonb_build_object('spent', cost, 'what', p_what);
end $$;

create or replace function public.token_info() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object(
    'packs', (select jsonb_agg(jsonb_build_object('id', id, 'tokens', tokens, 'price_cents', price_cents, 'currency', currency, 'name', name) order by sort) from game.token_packs),
    'menu', game.token_menu(), 'refill_at', p.refill_at, 'regular_until', p.regular_until, 'stall_until', p.stall_until,
    'name_color', p.name_color, 'backdrop', p.backdrop,
    'bought', coalesce((select jsonb_agg(jsonb_build_object('tokens', tokens, 'amount_cents', amount_cents, 'currency', currency, 'at', created_at) order by created_at desc)
                        from (select * from game.purchases where player_id = p.id order by created_at desc limit 10) x), '[]'));
end $$;

-- ---------- admin ----------
-- Make yourself an admin once, in the SQL Editor:  update game.players set is_admin = true where name = 'YourName';
create or replace function game.need_admin() returns game.players language plpgsql as $$
declare p game.players;
begin
  p := game.me();
  if not p.is_admin then raise exception 'Admins only.'; end if;
  return p;
end $$;

create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players;
begin
  a := game.need_admin();
  return jsonb_build_object(
    'players', (select count(*) from game.players),
    'online', (select count(*) from game.players where last_seen > now() - interval '5 minutes'),
    'today', (select count(*) from game.players where last_seen > now() - interval '1 day'),
    'new_today', (select count(*) from game.players where created_at > now() - interval '1 day'),
    'banned', (select count(*) from game.players where banned_until > now()),
    'revenue', coalesce((select jsonb_object_agg(currency, cents) from (select currency, sum(amount_cents) cents from game.purchases group by currency) r), '{}'),
    'revenue_30d', coalesce((select jsonb_object_agg(currency, cents) from (select currency, sum(amount_cents) cents from game.purchases where created_at > now() - interval '30 days' group by currency) r), '{}'),
    'purchases', (select count(*) from game.purchases),
    'tokens_out', coalesce((select sum(qty) from game.inventory where item_id = 'token'), 0) + coalesce((select sum(qty) from game.listings where item_id = 'token'), 0),
    'cash_out', (select sum(cash + bank) from game.players),
    'sold_out', (select count(*) from game.items where supply is not null and minted >= supply),
    'reports', (select count(*) from game.reports where not resolved),
    'recent_purchases', coalesce((select jsonb_agg(jsonb_build_object('name', pl.name, 'tokens', x.tokens, 'amount_cents', x.amount_cents, 'currency', x.currency, 'at', x.created_at, 'session', x.stripe_session) order by x.created_at desc)
        from (select * from game.purchases order by created_at desc limit 15) x left join game.players pl on pl.id = x.player_id), '[]'),
    'log', coalesce((select jsonb_agg(jsonb_build_object('admin', (select name from game.players where id = l.admin), 'target', (select name from game.players where id = l.target), 'action', l.action, 'detail', l.detail, 'at', l.at) order by l.id desc)
        from (select * from game.admin_log order by id desc limit 30) l), '[]'));
end $$;

create or replace function public.admin_find(p_q text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players;
begin
  a := game.need_admin();
  return coalesce((select jsonb_agg(game.card(x) || jsonb_build_object('email', u.email, 'cash', x.cash, 'bank', x.bank, 'banned_until', x.banned_until, 'ban_reason', x.ban_reason,
      'muted_until', x.muted_until, 'is_admin', x.is_admin, 'tokens', coalesce((select qty from game.inventory v where v.player_id = x.id and v.item_id = 'token'), 0),
      'spent_cents', coalesce((select sum(amount_cents) from game.purchases where player_id = x.id), 0), 'networth', game.networth(x.id)) order by x.last_seen desc)
    from (select * from game.players y where coalesce(p_q, '') = '' or y.name ilike '%' || p_q || '%' or y.id::text = p_q order by y.last_seen desc limit 40) x
    left join auth.users u on u.id = x.id), '[]');
end $$;

create or replace function public.admin_act(p_target uuid, p_action text, p_amount bigint default 0, p_item text default null, p_reason text default '') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players; t game.players; why text := left(coalesce(p_reason, ''), 300); have int;
begin
  a := game.need_admin();
  select * into t from game.players where id = p_target for update;
  if not found then raise exception 'No such player.'; end if;
  case p_action
    when 'ban' then
      if t.is_admin then raise exception 'You can''t ban an admin.'; end if;
      update game.players set banned_until = case when p_amount > 0 then now() + make_interval(hours => p_amount::int) else 'infinity'::timestamptz end, ban_reason = why where id = t.id;
      delete from game.listings where seller = t.id;  -- their market listings come down; the items are forfeit
    when 'unban' then update game.players set banned_until = null, ban_reason = null where id = t.id;
    when 'mute' then update game.players set muted_until = now() + make_interval(hours => greatest(1, p_amount)::int) where id = t.id;
      perform game.notify(t.id, 'mod', format('You''ve been muted for %s hours. %s', greatest(1, p_amount), why));
    when 'unmute' then update game.players set muted_until = null where id = t.id;
    when 'cash' then update game.players set cash = greatest(0, cash + p_amount) where id = t.id;
    when 'tokens' then
      if p_amount > 0 then perform game.give(t.id, 'token', p_amount::int); update game.items set minted = minted + p_amount where id = 'token';
      elsif p_amount < 0 then
        have := coalesce((select qty from game.inventory where player_id = t.id and item_id = 'token'), 0);
        if have > 0 then perform game.take(t.id, 'token', least(have, -p_amount)::int); end if;
      end if;
    when 'give' then
      if not exists (select 1 from game.items where id = p_item) then raise exception 'Unknown item.'; end if;
      perform game.give(t.id, p_item, greatest(1, p_amount)::int);
    when 'take' then perform game.take(t.id, p_item, greatest(1, p_amount)::int);
    when 'release' then update game.players set jail_until = null, hosp_until = null, travel_until = now() where id = t.id;
    when 'admin' then update game.players set is_admin = p_amount > 0 where id = t.id;
    else raise exception 'Unknown action.';
  end case;
  insert into game.admin_log(admin, target, action, detail) values (a.id, t.id, p_action, concat_ws(' ', nullif(p_amount, 0)::text, p_item, nullif(why, '')));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_reports() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players;
begin
  a := game.need_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'body', r.body, 'reason', r.reason, 'at', r.at, 'message_id', r.message_id,
      'reporter', (select name from game.players where id = r.reporter), 'target', r.target, 'target_name', (select name from game.players where id = r.target),
      'message_exists', exists (select 1 from game.messages m where m.id = r.message_id)) order by r.id desc)
    from game.reports r where not r.resolved), '[]');
end $$;

create or replace function public.admin_resolve(p_report bigint, p_delete_message boolean) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players; r game.reports;
begin
  a := game.need_admin();
  select * into r from game.reports where id = p_report;
  if p_delete_message and r.message_id is not null then
    delete from game.messages where id = r.message_id;
    insert into game.admin_log(admin, target, action, detail) values (a.id, r.target, 'delete message', left(r.body, 120));
  end if;
  update game.reports set resolved = true where id = p_report;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_delete_message(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players; m game.messages;
begin
  a := game.need_admin();
  delete from game.messages where id = p_id returning * into m;
  insert into game.admin_log(admin, target, action, detail) values (a.id, m.player_id, 'delete message', left(coalesce(m.body, ''), 120));
  return jsonb_build_object('ok', true);
end $$;



-- =====================================================================
-- CAREERS, VEHICLES, MEDALS, STORY MISSIONS, SEASONAL EVENTS AND TURF
-- =====================================================================

-- ---------- turf ----------
create or replace function game.turf_owner(d text) returns bigint language sql stable as $$
  select crew_id from game.turf where district = d and at > now() - interval '7 days'
  group by crew_id having sum(pts) >= 50 order by sum(pts) desc, crew_id limit 1 $$;

create or replace function game.turf_add(pid uuid, d text, n numeric) returns void language sql as $$
  insert into game.turf(district, crew_id, pts) select d, crew_id, n from game.players where id = pid and crew_id is not null $$;

create or replace function public.turf_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('my_crew', p.crew_id, 'districts', (select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name,
      'owner', (select jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag) from game.crews c where c.id = game.turf_owner(d.id)),
      'standings', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag, 'pts', round(x.s)) order by x.s desc)
          from (select crew_id, sum(pts) s from game.turf where district = d.id and at > now() - interval '7 days' group by crew_id order by s desc limit 5) x
          join game.crews c on c.id = x.crew_id), '[]')) order by d.sort) from game.districts d));
end $$;

-- ---------- seasonal events ----------
create or replace function game.season_now() returns text language sql stable as $$
  select id from game.seasons where game.today() between make_date(extract(year from game.today())::int, from_m, from_d)
                                                      and make_date(extract(year from game.today())::int, to_m, to_d) limit 1 $$;

-- A drop of the running event's items, weighted by how many copies are left.
create or replace function game.roll_season(s text) returns text language plpgsql as $$
declare pick text; r numeric := random();
begin
  with wt as (select id, (supply - minted)::numeric w from game.items where season = s and supply > minted),
       cum as (select id, sum(w) over (order by id) cw, sum(w) over () tw from wt)
  select id into pick from cum where cw >= r * tw order by cw limit 1;
  if pick is null then return null; end if;
  update game.items set minted = minted + 1 where id = pick and minted < supply;
  if not found then return null; end if;
  return pick;
end $$;

-- After a job or fight win: a 1 in 8 chance of an event item while an event is on.
create or replace function game.event_drop(pid uuid) returns text language plpgsql as $$
declare s text := game.season_now(); x text;
begin
  if s is null or random() > 0.125 then return null; end if;
  x := game.roll_season(s);
  if x is not null then perform game.give(pid, x, 1); end if;
  return x;
end $$;

create or replace function game.season_end(s game.seasons, y int) returns timestamptz language sql immutable as $$
  select (make_date(y, s.to_m, s.to_d) + 1)::timestamp at time zone 'Pacific/Auckland' $$;

create or replace function public.season_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; s game.seasons; y int := extract(year from game.today())::int; last game.seasons; ly int; lid text; out jsonb := '{}';
begin
  p := game.me();
  select * into s from game.seasons where id = game.season_now();
  if found then
    out := jsonb_build_object('active', to_jsonb(s) || jsonb_build_object('year', y, 'ends_at', game.season_end(s, y),
      'mine', coalesce((select round(points) from game.season_points where season = s.id and year = y and player_id = p.id), 0),
      'rank', (select count(*) + 1 from game.season_points x where x.season = s.id and x.year = y and x.points > coalesce((select points from game.season_points where season = s.id and year = y and player_id = p.id), 0)),
      'top', coalesce((select jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'look', pl.look, 'name_color', pl.name_color, 'points', round(x.points)) order by x.points desc)
               from (select * from game.season_points where season = s.id and year = y order by points desc limit 20) x join game.players pl on pl.id = x.player_id), '[]'),
      'items', (select jsonb_agg(jsonb_build_object('id', id, 'supply', supply, 'found', minted) order by rarity) from game.items where season = s.id)));
  end if;
  -- The most recent event that has finished, and whether you can claim its trophy.
  select x.id, x.yy into lid, ly from (
    select se.*, case when make_date(y, se.to_m, se.to_d) < game.today() then y else y - 1 end yy from game.seasons se) x
    order by make_date(x.yy, x.to_m, x.to_d) desc limit 1;
  select * into last from game.seasons where id = lid;
  if last.id is not null and (s.id is null or last.id <> s.id) then
    out := out || jsonb_build_object('last', jsonb_build_object('id', last.id, 'name', last.name, 'year', ly, 'ended', game.season_end(last, ly),
      'top', coalesce((select jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'points', round(x.points)) order by x.points desc)
               from (select * from game.season_points where season = last.id and year = ly order by points desc limit 10) x join game.players pl on pl.id = x.player_id), '[]'),
      'can_claim', game.season_end(last, ly) > now() - interval '60 days'
         and p.id in (select player_id from game.season_points where season = last.id and year = ly order by points desc limit 10)
         and not exists (select 1 from game.season_claims where season = last.id and year = ly and player_id = p.id)));
  end if;
  return out;
end $$;

create or replace function public.season_claim(p_season text, p_year int) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; s game.seasons;
begin
  p := game.me();
  select * into s from game.seasons where id = p_season;
  if not found then raise exception 'Unknown event.'; end if;
  if game.season_end(s, p_year) > now() then raise exception 'That event hasn''t finished yet.'; end if;
  if game.season_end(s, p_year) < now() - interval '60 days' then raise exception 'Trophies can be claimed for 60 days after an event ends.'; end if;
  if p.id not in (select player_id from game.season_points where season = s.id and year = p_year order by points desc limit 10) then
    raise exception 'Only the top ten can claim a trophy.'; end if;
  insert into game.season_claims(season, year, player_id) values (s.id, p_year, p.id);
  update game.items set minted = minted + 1 where id = 'trophy_' || s.id;
  perform game.give(p.id, 'trophy_' || s.id, 1);
  return jsonb_build_object('item', 'trophy_' || s.id);
end $$;

-- ---------- careers ----------
create or replace function game.career_wage(c game.careers, rank int) returns bigint language sql immutable as $$
  select (round(c.wage * power(1.45, rank - 1) / 10) * 10)::bigint $$;

create or replace function public.career_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('career', p.career, 'rank', p.career_rank, 'shifts', p.career_shifts,
    'next_shift', p.career_at + interval '20 hours', 'can_shift', p.career is not null and (p.career_at is null or p.career_at < now() - interval '20 hours'),
    'steps', (select jsonb_agg(jsonb_build_object('rank', rank, 'shifts', shifts, 'lvl', lvl) order by rank) from game.career_ranks),
    'careers', (select jsonb_agg(to_jsonb(c) || jsonb_build_object('wages', (select jsonb_agg(game.career_wage(c, r) order by r) from generate_series(1, 10) r)) order by c.sort) from game.careers c));
end $$;

create or replace function public.career_join(p_id text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.careers;
begin
  p := game.me();
  select * into c from game.careers where id = p_id;
  if not found then raise exception 'No such career.'; end if;
  if p.career = c.id then raise exception 'You already work there.'; end if;
  update game.players set career = c.id, career_rank = 1, career_shifts = 0 where id = p.id;
  return jsonb_build_object('career', c.id, 'title', c.ranks[1]);
end $$;

create or replace function public.career_shift() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.careers; w bigint; nr game.career_ranks; promoted boolean := false;
begin
  p := game.me(); perform game.need_free(p);
  if p.career is null then raise exception 'Pick a career first.'; end if;
  if p.career_at > now() - interval '20 hours' then raise exception 'You''ve already worked today. Next shift in %.', to_char(p.career_at + interval '20 hours' - now(), 'HH24"h "MI"m"'); end if;
  select * into c from game.careers where id = p.career;
  w := game.career_wage(c, p.career_rank);
  update game.players set cash = cash + w, career_shifts = career_shifts + 1, career_at = now() where id = p.id;
  select * into nr from game.career_ranks where rank = p.career_rank + 1;
  if found and p.career_shifts + 1 >= nr.shifts and p.level >= nr.lvl then
    update game.players set career_rank = nr.rank where id = p.id; promoted := true;
    perform game.notify(p.id, 'level', format('Promoted to %s.', c.ranks[nr.rank]));
  end if;
  perform game.gain_xp(p.id, 2 + p.career_rank);
  perform game.track(p.id, 'shift', 1);
  return jsonb_build_object('wage', w, 'promoted', promoted, 'title', c.ranks[case when promoted then nr.rank else p.career_rank end]);
end $$;

-- ---------- vehicles ----------
create or replace function public.vehicle_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('current', p.vehicle, 'vehicles', (select jsonb_agg(to_jsonb(v) order by sort) from game.vehicles v));
end $$;

create or replace function public.vehicle_buy(p_id text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; cur game.vehicles; nw game.vehicles; net bigint;
begin
  p := game.me();
  select * into cur from game.vehicles where id = p.vehicle;
  select * into nw from game.vehicles where id = p_id;
  if not found then raise exception 'No such vehicle.'; end if;
  if nw.id = cur.id then raise exception 'That''s already yours.'; end if;
  if p.level < nw.lvl then raise exception 'You need level % for that.', nw.lvl; end if;
  net := nw.price - floor(coalesce(cur.price, 0) * 0.7);
  if net > p.cash then raise exception 'That costs % after trading in your current ride. You have % on you.', game.fmt(net), game.fmt(p.cash); end if;
  update game.players set cash = cash - net, vehicle = nw.id where id = p.id;
  if nw.sort > coalesce(cur.sort, 0) then perform game.track(p.id, 'vehicle', 1); end if;
  if nw.price >= 12000000 and nw.sort > coalesce(cur.sort, 0) then
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('Spotted: %s, arriving in %s.', p.name, lower(left(nw.name, 1)) || substr(nw.name, 2)));
  end if;
  return jsonb_build_object('bought', nw.id, 'paid', net);
end $$;

-- ---------- medals ----------
create or replace function game.player_stats(pid uuid) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'level', p.level, 'jobs', p.jobs_done, 'wins', p.wins, 'busts', p.busts,
    'collection', (select count(*) from game.collection where player_id = p.id and item_id <> 'token'),
    'legendary', (select count(*) from game.collection c join game.items i on i.id = c.item_id where c.player_id = p.id and i.rarity = 4 and i.id not in ('token', 'founder')),
    'oneofone', (select count(*) from game.collection c join game.items i on i.id = c.item_id where c.player_id = p.id and i.supply = 1),
    'home', (select sort from game.properties where id = p.property), 'vehicle', (select sort from game.vehicles where id = p.vehicle),
    'networth', game.networth(p.id), 'streak', greatest(p.best_streak, p.streak),
    'sales', (select count(*) from game.sales where seller = p.id),
    'blocks', (select count(*) from game.holdings h join game.stocks s using (ticker) where h.player_id = p.id and h.shares >= s.perk_shares),
    'thief', game.skill_lvl(p.skills, 'thief'), 'fight', game.skill_lvl(p.skills, 'fight'), 'fit', game.skill_lvl(p.skills, 'fit'), 'trade', game.skill_lvl(p.skills, 'trade'),
    'missions', p.missions_done, 'career', p.career_rank,
    'turf', case when p.crew_id is null then 0 else (select count(*) from game.districts d where game.turf_owner(d.id) = p.crew_id) end,
    'days', floor(extract(epoch from now() - p.created_at) / 86400), 'founder', case when p.founder is not null then 1 else 0 end,
    'events', coalesce((select sum(points) from game.season_points where player_id = p.id), 0), 'power', round(game.power(p)))
  from game.players p where p.id = pid $$;

-- Award any medals newly earned, with one notification for the lot.
create or replace function game.medal_check(pid uuid) returns int language plpgsql as $$
declare st jsonb := game.player_stats(pid); names text[];
begin
  with ins as (insert into game.medals_earned(player_id, medal_id)
               select pid, m.id from game.medals m where coalesce((st->>m.stat)::numeric, 0) >= m.at
               on conflict do nothing returning medal_id)
  select array_agg(m.name order by m.sort) into names from ins join game.medals m on m.id = ins.medal_id;
  if names is not null then
    perform game.notify(pid, 'medal', case when array_length(names, 1) = 1 then format('New medal: %s.', names[1])
                                          else format('%s new medals, including %s.', array_length(names, 1), names[array_length(names, 1)]) end);
    return array_length(names, 1);
  end if;
  return 0;
end $$;

create or replace function public.medals_state(p_player uuid default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; who uuid;
begin
  p := game.me(); who := coalesce(p_player, p.id);
  if who = p.id then perform game.medal_check(p.id); end if;
  return jsonb_build_object('title', (select title from game.players where id = who), 'stats', game.player_stats(who),
    'earned', coalesce((select jsonb_object_agg(medal_id, at) from game.medals_earned where player_id = who), '{}'),
    'medals', (select jsonb_agg(to_jsonb(m) || jsonb_build_object('holders', (select count(*) from game.medals_earned e where e.medal_id = m.id)) order by m.sort) from game.medals m),
    'players', (select count(*) from game.players));
end $$;

create or replace function public.title_set(p_medal text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; n text;
begin
  p := game.me();
  if p_medal is null then update game.players set title = null where id = p.id; return jsonb_build_object('title', null); end if;
  select m.name into n from game.medals m join game.medals_earned e on e.medal_id = m.id and e.player_id = p.id where m.id = p_medal;
  if n is null then raise exception 'You haven''t earned that one yet.'; end if;
  update game.players set title = n where id = p.id;
  return jsonb_build_object('title', n);
end $$;

-- ---------- story missions ----------
create or replace function public.missions_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('active', p.mission, 'done', to_jsonb(p.chains_done), 'level', p.level,
    'chains', (select jsonb_agg(c order by c->>'lvl', c->>'sort') from (
      select jsonb_build_object('id', chain, 'name', min(chain_name), 'who', min(who), 'lvl', min(lvl), 'blurb', min(blurb), 'sort', min(sort),
        'steps', jsonb_agg(jsonb_build_object('step', step, 'title', title, 'story', story, 'done_text', done_text, 'k', k, 'n', n, 'reward', reward) order by step)) c
      from game.missions group by chain) x));
end $$;

create or replace function public.mission_start(p_chain text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l int;
begin
  p := game.me();
  select min(lvl) into l from game.missions where chain = p_chain;
  if l is null then raise exception 'No such story.'; end if;
  if p.mission ? 'chain' then raise exception 'Finish or drop your current story first.'; end if;
  if p_chain = any(p.chains_done) then raise exception 'You''ve already finished that story.'; end if;
  if p.level < l then raise exception 'That story opens at level %.', l; end if;
  update game.players set mission = jsonb_build_object('chain', p_chain, 'step', 1, 'have', 0) where id = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.mission_drop() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me(); update game.players set mission = '{}' where id = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.mission_claim() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; m game.missions; r jsonb; last boolean;
begin
  p := game.me();
  if not (p.mission ? 'chain') then raise exception 'You''re not on a story right now.'; end if;
  select * into m from game.missions where chain = p.mission->>'chain' and step = (p.mission->>'step')::int;
  if (p.mission->>'have')::numeric < m.n then raise exception 'Not done yet.'; end if;
  r := m.reward;
  update game.players set cash = cash + coalesce((r->>'cash')::bigint, 0), missions_done = missions_done + 1 where id = p.id;
  if r ? 'item' then perform game.give(p.id, r->>'item', coalesce((r->>'qty')::int, 1)); end if;
  if r ? 'xp' then perform game.gain_xp(p.id, (r->>'xp')::numeric); end if;
  last := not exists (select 1 from game.missions where chain = m.chain and step = m.step + 1);
  if last then
    update game.players set mission = '{}', chains_done = array_append(chains_done, m.chain) where id = p.id;
    perform game.notify(p.id, 'mission', format('Story finished: %s.', m.chain_name));
  else
    update game.players set mission = jsonb_build_object('chain', m.chain, 'step', m.step + 1, 'have', 0) where id = p.id;
  end if;
  return jsonb_build_object('reward', r, 'done_text', m.done_text, 'finished', last, 'title', m.title);
end $$;


-- Only signed-in players may call the public API.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('create_player','get_state','get_events','do_job','train','fight_npc','attack',
             'list_players','get_profile','jail_list','hosp_list','bust','bail','travel','use_item','shop_buy','pawn','market_list',
             'market_cancel','market_buy','market_overview','market_item','my_listings','stock_board','stock_trade','stock_perk',
             'bank','chat_send','chat_recent','leaderboard','item_supply','token_info','token_spend',
             'goals_state','checkin','goal_claim','guide_claim','crew_create','crew_list','crew_get','crew_apply','crew_withdraw','crew_decide',
             'crew_leave','crew_member','crew_vault','crew_motto','dm_send','dm_threads','dm_thread','contact_toggle','report',
             'property_list','property_move','home_collect','turf_state','season_state','season_claim','career_state','career_join','career_shift',
             'vehicle_list','vehicle_buy','medals_state','title_set','missions_state','mission_start','mission_drop','mission_claim','profile_set','my_collection','admin_overview','admin_find','admin_act','admin_reports',
             'admin_resolve','admin_delete_message') loop
    execute format('revoke all on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon', f.sig); end if;
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on all functions in schema game from public;
