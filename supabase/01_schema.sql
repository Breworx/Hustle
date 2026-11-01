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
  foreach t in array array['players','items','inventory','districts','jobs','foes','listings','sales','stocks','holdings','messages','events','attacks'] loop
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
drop policy if exists messages_read on game.messages;
create policy messages_read on game.messages for select to authenticated using (true);
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
declare p game.players; m numeric; t timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into p from game.players where id = auth.uid() for update;
  if not found then raise exception 'NO_PLAYER'; end if;
  m := extract(epoch from (t - p.bars_at)) / 60.0;
  if m > 0 then
    if p.stamina < p.max_stamina then p.stamina := least(p.max_stamina, p.stamina + m * 5 / 3.0); end if;
    if p.grit < p.max_grit then p.grit := least(p.max_grit, p.grit + m * 0.5); end if;
    if p.mood < p.max_mood then p.mood := least(p.max_mood, p.mood + m * 2); end if;
    if p.health < p.max_health then p.health := least(p.max_health, p.health + m * 5 / 3.0); end if;
    p.heat := greatest(0, p.heat - m * case when game.has_block(p.id, 'UPVT') then 1.25 else 1 end);
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
$$ select case d when 'old' then 0.25 when 'docks' then 0.5 else 0 end $$;

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
  on conflict (player_id, item_id) do update set qty = game.inventory.qty + excluded.qty $$;

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
                where (not use_cats or cat = any(cats)) and id <> 'founder' and (supply is null or minted < supply)),
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
    'created_at', p.created_at, 'founder', p.founder,
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
  return jsonb_build_object(
    'me', to_jsonb(p) || jsonb_build_object('status', game.status(p), 'power', round(game.power(p)),
          'networth', game.networth(p.id), 'need_xp', round(100 * power(p.level, 1.5)),
          'skill_levels', jsonb_build_object('thief', game.skill_lvl(p.skills,'thief'), 'fight', game.skill_lvl(p.skills,'fight'),
                                             'fit', game.skill_lvl(p.skills,'fit'), 'trade', game.skill_lvl(p.skills,'trade'))),
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('item_id', item_id, 'qty', qty)) from game.inventory where player_id = p.id and qty > 0), '[]'),
    'holdings', coalesce((select jsonb_agg(jsonb_build_object('ticker', ticker, 'shares', shares, 'cost', cost, 'perk_at', perk_at)) from game.holdings where player_id = p.id and shares > 0), '[]'),
    'unseen', (select count(*) from game.events where player_id = p.id and not seen),
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
declare p game.players; j game.jobs; ch numeric; g bigint := 0; loot text; outcome text; secs int := 0; r numeric;
begin
  p := game.me(); perform game.need_free(p);
  select * into j from game.jobs where id = p_job;
  if not found then raise exception 'Unknown job.'; end if;
  if p.level < j.lvl then raise exception 'You need level % for that job.', j.lvl; end if;
  if j.district <> 'any' and j.district <> p.district then raise exception 'That job is in another district.'; end if;
  if p.grit < j.grit then raise exception 'Not enough grit. It comes back with time.'; end if;
  ch := least(96, greatest(5, j.base + sqrt(p.crime_xp) * 2.2 + case when p.luck > 0 then 10 else 0 end
        + least(25, (game.skill_lvl(p.skills, 'thief') - 1) * 0.5) + case when game.has_block(p.id, 'GRCH') then 3 else 0 end - p.heat * 0.25));
  update game.players set grit = grit - j.grit, jobs_done = jobs_done + 1, luck = greatest(0, luck - 1) where id = p.id;
  if random() * 100 < ch then
    g := floor(j.cash_min + random() * (j.cash_max - j.cash_min + 1));
    if random() < (case when j.id = 'bins' then 0.8 else 0.2 + j.grit * 0.012 end) then
      loot := game.roll_item(game.dboost(p.district) + case when j.id = 'vault' then 1 else 0 end, j.loot);
      perform game.give(p.id, loot, 1);
    end if;
    update game.players set cash = cash + g, crime_xp = crime_xp + j.xp, heat = least(100, heat + j.grit * 1.4) where id = p.id;
    perform game.gain_xp(p.id, j.xp); perform game.add_skill(p.id, 'thief', j.xp * 2);
    outcome := 'win';
  else
    update game.players set heat = least(100, heat + case when j.id = 'bins' then 1 else j.grit * 3 end) where id = p.id;
    r := random();
    if r < (case when j.id = 'bins' then 0.06 else 0.45 end) then
      secs := round((60 + j.grit * 30) * (0.7 + random() * 0.6) * case when p.heat >= 75 then 2 else 1 end);
      update game.players set jail_until = now() + make_interval(secs => secs), jail_reason = 'Caught: ' || lower(j.name) where id = p.id;
      outcome := 'jail';
    elsif r < (case when j.id = 'bins' then 0.16 else 0.62 end) then
      secs := 60 + j.grit * 20;
      update game.players set hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Hurt on a job: ' || lower(j.name),
        health = greatest(1, health - 25) where id = p.id;
      outcome := 'hosp';
    else
      update game.players set crime_xp = crime_xp + 1 where id = p.id;
      outcome := 'fail';
    end if;
  end if;
  return jsonb_build_object('outcome', outcome, 'cash', g, 'item', loot, 'secs', secs, 'xp', case when outcome = 'win' then j.xp else 0 end, 'chance', round(ch));
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
  g := g * (1 + (game.skill_lvl(p.skills, 'fit') - 1) / 100.0) * case when game.has_block(p.id, 'CHPW') then 1.05 else 1 end;
  execute format('update game.players set %I = %I + $1, stamina = stamina - $2, mood = $3 where id = $4', p_stat, p_stat)
    using g, n * 5, mood, p.id;
  perform game.gain_xp(p.id, ceil(n / 2.0)); perform game.add_skill(p.id, 'fit', n);
  return jsonb_build_object('stat', p_stat, 'sets', n, 'gain', round(g, 1));
end $$;

-- ---------- fights against city NPCs ----------
create or replace function public.fight_npc(p_foe text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; f game.foes; pw numeric; ch numeric; g bigint := 0; loot text; secs int := 0; lost bigint := 0;
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
    return jsonb_build_object('won', true, 'cash', g, 'item', loot, 'xp', f.xp, 'chance', round(ch * 100));
  else
    lost := floor(p.cash * 0.1); secs := 120 + f.lvl * 20;
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
  if t.level < 3 or t.created_at > now() - interval '1 day' then raise exception '% is new to the city. Leave them be for now.', t.name; end if;
  if p.stamina < 25 then raise exception 'You need 25 stamina to start a fight.'; end if;
  if p.health < p.max_health * 0.3 then raise exception 'You''re too beaten up. Heal first.'; end if;
  if exists (select 1 from game.attacks where attacker = p.id and defender = t.id and at > now() - interval '10 minutes') then
    raise exception 'You hit % recently. Give it ten minutes.', t.name; end if;
  pa := game.power(p); pd := game.power(t);
  ch := least(0.95, greatest(0.05, 1 / (1 + exp(-8 * (pa / (pa + pd) - 0.5)))));
  update game.players set stamina = stamina - 25, heat = least(100, heat + 5) where id = p.id;
  if random() < ch then
    mug := floor(t.cash * (0.05 + random() * 0.05));
    secs := 300 + floor(random() * 600)::int;
    update game.players set cash = cash - mug, losses = losses + 1, health = greatest(1, round(health * 0.2)),
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Mugged by ' || p.name where id = t.id;
    update game.players set cash = cash + mug, wins = wins + 1 where id = p.id;
    xp := 10 + t.level * 5;
    perform game.gain_xp(p.id, xp); perform game.add_skill(p.id, 'fight', xp);
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, true, mug);
    perform game.notify(t.id, 'attacked', format('%s attacked you and took %s. You''re in A&E.', p.name, game.fmt(mug)));
    return jsonb_build_object('won', true, 'cash', mug, 'xp', xp, 'name', t.name, 'secs', secs, 'chance', round(ch * 100));
  else
    secs := 180 + floor(random() * 300)::int;
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
    'recent', coalesce((select jsonb_agg(jsonb_build_object('at', a.at, 'won', a.attacker_won, 'cash', a.cash,
                 'attacker', (select name from game.players where id = a.attacker), 'defender', (select name from game.players where id = a.defender)) order by a.at desc)
              from (select * from game.attacks where attacker = t.id or defender = t.id order by at desc limit 8) a), '[]'));
end $$;

-- ---------- the cells and A&E ----------
create or replace function public.jail_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'level', level, 'until', jail_until, 'reason', jail_reason) order by jail_until)
                   from (select * from game.players where jail_until > now() order by jail_until limit 60) x), '[]');
end $$;

create or replace function public.hosp_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'level', level, 'until', hosp_until, 'reason', hosp_reason) order by hosp_until)
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
    return jsonb_build_object('ok', true, 'name', t.name, 'chance', round(ch));
  else
    update game.players set heat = least(100, heat + 6) where id = p.id;
    if random() < 0.45 then
      secs := 120 + floor(random() * 180)::int;
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
  fare := case when game.has_block(p.id, 'VOLT') then 0 else d.fare end;
  if p.cash < fare then raise exception 'The fare is %.', game.fmt(fare); end if;
  secs := case when game.has_block(p.id, 'TRHD') then 20 else 60 end;
  update game.players set cash = cash - fare, travel_to = d.id, travel_until = now() + make_interval(secs => secs) where id = p.id;
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
  slots := 20 + game.skill_lvl(p.skills, 'trade') / 5 + case when game.has_block(p.id, 'SHWD') then 2 else 0 end;
  if (select count(*) from game.listings where seller = p.id) >= slots then raise exception 'You can have % listings. Cancel one first.', slots; end if;
  perform game.take(p.id, p_item, p_qty);
  insert into game.listings(seller, item_id, qty, price) values (p.id, p_item, p_qty, p_price) returning game.listings.id into new_id;
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
create or replace function public.chat_send(p_body text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
begin
  p := game.me();
  if char_length(b) < 1 then raise exception 'Say something.'; end if;
  if char_length(b) > 280 then raise exception 'Keep it under 280 characters.'; end if;
  if p.last_chat > now() - interval '3 seconds' then raise exception 'Slow down a little.'; end if;
  update game.players set last_chat = now() where id = p.id;
  insert into game.messages(player_id, name, body) values (p.id, p.name, b);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.chat_recent(p_limit int default 60) returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_agg(m order by m.id) from
    (select id, player_id, name, body, created_at from game.messages order by id desc limit least(p_limit, 200)) m), '[]');
end $$;

-- ---------- supply lookup (for badges on limited items) ----------
create or replace function public.item_supply(p_ids text[]) returns jsonb
language plpgsql security definer set search_path = game, public as $$
begin
  perform game.me();
  return coalesce((select jsonb_object_agg(id, jsonb_build_array(supply, minted)) from game.items
                   where id = any(p_ids[1:1200]) and supply is not null), '{}');
end $$;

-- ---------- leaderboard ----------
create or replace function public.leaderboard(p_by text default 'level') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(x) from (
    select id, name, level, wins, district, case when p_by = 'wealth' then game.networth(id) end networth
    from game.players
    order by case when p_by = 'wealth' then game.networth(id) when p_by = 'fights' then wins else level * 1000000 + xp end desc
    limit 50) x), '[]');
end $$;

-- Only signed-in players may call the public API.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('create_player','get_state','get_events','do_job','train','fight_npc','attack',
             'list_players','get_profile','jail_list','hosp_list','bust','bail','travel','use_item','shop_buy','pawn','market_list',
             'market_cancel','market_buy','market_overview','market_item','my_listings','stock_board','stock_trade','stock_perk',
             'bank','chat_send','chat_recent','leaderboard','item_supply') loop
    execute format('revoke all on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon', f.sig); end if;
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on all functions in schema game from public;
