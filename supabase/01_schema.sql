-- =====================================================================
-- HUSTLE · multiplayer game database
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
-- Crew wars: 48 hours, points for every win against the other crew, loot for the winner.
create table if not exists game.wars(id bigint generated always as identity primary key,
  attacker bigint references game.crews(id) on delete set null, defender bigint references game.crews(id) on delete set null,
  a_name text not null, d_name text not null, a_tag text not null, d_tag text not null,
  started_at timestamptz not null default now(), ends_at timestamptz not null, ended_at timestamptz,
  a_score numeric not null default 0, d_score numeric not null default 0,
  status text not null default 'active', winner bigint, loot bigint not null default 0);
create index if not exists wars_active on game.wars (status, ends_at);
create table if not exists game.war_hits(id bigint generated always as identity primary key, war_id bigint not null references game.wars(id) on delete cascade,
  crew_id bigint, player_id uuid references game.players(id) on delete set null, target uuid references game.players(id) on delete set null,
  pts numeric not null, cash bigint not null default 0, at timestamptz not null default now());
create index if not exists war_hits_war on game.war_hits (war_id, at desc);
create index if not exists war_hits_player on game.war_hits (player_id);
-- Companies: legitimate businesses players start and staff (types are loaded by 02_content.sql).
create table if not exists game.company_types(id text primary key, name text not null, cost bigint not null, lvl int not null, base int not null,
  perk text not null, max numeric not null, blurb text not null, sort int not null);
create table if not exists game.company_stars(stars int primary key, rep int not null);
create table if not exists game.companies(id bigint generated always as identity primary key, type text not null references game.company_types(id),
  name text not null check (char_length(name) between 3 and 30), owner uuid references game.players(id) on delete set null,
  funds bigint not null default 0 check (funds >= 0), rep int not null default 0, created_at timestamptz not null default now());
create unique index if not exists companies_name_ci on game.companies (lower(name));
create table if not exists game.company_apps(company_id bigint not null references game.companies(id) on delete cascade, player_id uuid not null references game.players(id) on delete cascade,
  note text not null default '', at timestamptz not null default now(), primary key (company_id, player_id));
create table if not exists game.company_log(id bigint generated always as identity primary key, company_id bigint not null references game.companies(id) on delete cascade,
  body text not null, at timestamptz not null default now());
alter table game.players add column if not exists company_id bigint references game.companies(id) on delete set null;
alter table game.players add column if not exists company_wage bigint not null default 0;
alter table game.players add column if not exists company_at timestamptz;
alter table game.players add column if not exists company_joined timestamptz;
alter table game.players add column if not exists company_shifts int not null default 0;
-- Selling companies: an asking price anyone can pay, or offers the owner can take.
alter table game.companies add column if not exists sale_price bigint check (sale_price is null or sale_price > 0);
alter table game.companies add column if not exists listed_at timestamptz;
create table if not exists game.company_offers(id bigint generated always as identity primary key, company_id bigint not null references game.companies(id) on delete cascade,
  buyer uuid not null references game.players(id) on delete cascade, amount bigint not null check (amount > 0), at timestamptz not null default now(), unique (company_id, buyer));
create table if not exists game.company_sales(id bigint generated always as identity primary key, company_id bigint references game.companies(id) on delete set null,
  name text not null, type text not null, stars int not null, seller uuid references game.players(id) on delete set null, buyer uuid references game.players(id) on delete set null,
  price bigint not null, at timestamptz not null default now());
do $$ declare t text; begin
  foreach t in array array['company_offers','company_sales'] loop
    execute format('alter table game.%I enable row level security', t); execute format('revoke all on game.%I from public', t);
  end loop;
end $$;
do $$ declare t text; begin
  foreach t in array array['company_types','company_stars','companies','company_apps','company_log'] loop
    execute format('alter table game.%I enable row level security', t); execute format('revoke all on game.%I from public', t);
  end loop;
end $$;
create or replace function game.cstars(r int) returns int language sql stable as $$
  select greatest(1, (select count(*) from game.company_stars where rep <= r))::int $$;
do $$ declare t text; begin
  foreach t in array array['wars','war_hits'] loop
    execute format('alter table game.%I enable row level security', t); execute format('revoke all on game.%I from public', t);
  end loop;
end $$;
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
-- The armoury: fight stats for every weapon, armour piece, throwable and box of ammo (filled by 02_content.sql).
create table if not exists game.arms(
  item_id text primary key, slot text not null, dmg numeric, acc numeric, shots int, ammo text, weight numeric not null default 0,
  lvl int, price bigint, box int, effect text, def numeric);
-- What you carry into a fight: {"melee": id, "sidearm": id, "long": id, "head": id, ..., "throw": [id, id, id]}.
alter table game.players add column if not exists loadout jsonb not null default '{}'::jsonb;
create table if not exists game.fights(id bigint generated always as identity primary key,
  attacker uuid references game.players(id) on delete cascade, defender uuid references game.players(id) on delete cascade,
  a_hp numeric not null, d_hp numeric not null, a_max numeric not null, d_max numeric not null,
  war_id bigint references game.wars(id) on delete set null, turn int not null default 0,
  fx jsonb not null default '{}'::jsonb, log jsonb not null default '[]'::jsonb,
  status text not null default 'on', result jsonb, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), ended_at timestamptz);
create unique index if not exists fights_one_live on game.fights (attacker) where status = 'on';
create index if not exists fights_defender on game.fights (defender) where status = 'on';
create index if not exists fights_attacker on game.fights (attacker, created_at desc);
-- Travelling the country (filled by 02_content.sql).
create table if not exists game.cities(id text primary key, name text not null, island text not null, lat numeric not null, lon numeric not null,
  air boolean not null default false, rail boolean not null default false, lvl int not null default 1, blurb text not null default '', sort int not null default 0);
create table if not exists game.travel_modes(id text primary key, name text not null, spec jsonb not null, sort int not null default 0);
create table if not exists game.travel_gear(id text primary key, name text not null, price bigint not null, lvl int not null default 1, blurb text not null, sort int not null default 0);
-- Each city's shop. Stock is shared by everyone and comes back one at a time every restock_mins.
create table if not exists game.city_shop(city text not null references game.cities(id) on delete cascade, item_id text not null references game.items(id) on delete cascade,
  price bigint not null, max_stock int not null, restock_mins int not null, stock int not null, stocked_at timestamptz not null default now(), primary key (city, item_id));
alter table game.vehicles add column if not exists travel jsonb;
-- Where you are in the country, the trip you're on, what you're carrying back, and your travel gear.
alter table game.players add column if not exists city text not null default 'home';
alter table game.players add column if not exists trip jsonb not null default '{}'::jsonb;
alter table game.players add column if not exists trip_until timestamptz;
alter table game.players add column if not exists bag int not null default 0;
alter table game.players add column if not exists travel_gear text[] not null default '{}';
-- The world: every country, where Greyhaven sits on that country's map, and its main airport town.
create table if not exists game.countries(iso text primary key, name text not null, zone text not null, home_lat numeric not null, home_lon numeric not null,
  home_part text not null default '0', hub text);
alter table game.cities add column if not exists country text;
create index if not exists cities_country on game.cities (country);
alter table game.players add column if not exists country text not null default 'NZ';
alter table game.players add column if not exists search_at timestamptz;
-- Staff accounts play normally but stay out of the competition: hidden from rankings and lists, can't attack or be attacked.
alter table game.players add column if not exists is_staff boolean not null default false;
-- Where things come from (for local goods), and which town each market listing is in.
alter table game.items add column if not exists origin text;
alter table game.items add column if not exists origin_city text;
alter table game.listings add column if not exists city text not null default 'home';
alter table game.sales add column if not exists city text not null default 'home';
create index if not exists listings_city_item on game.listings (city, item_id, price);
create index if not exists sales_city_item on game.sales (city, item_id, at desc);
-- Player feedback. Anonymous rows have no player_id at all.
create table if not exists game.feedback(id bigint generated always as identity primary key, kind text not null, body text not null, page text,
  player_id uuid references game.players(id) on delete set null, player_name text, level int,
  status text not null default 'new', note text, at timestamptz not null default now());
create table if not exists game.feedback_rate(player_id uuid not null, at timestamptz not null default now());
create index if not exists feedback_rate_player on game.feedback_rate (player_id, at);
-- Places players own to rent out. A tenant is another player, or a local (npc) found when the place is advertised.
create table if not exists game.rentals(id bigint generated always as identity primary key,
  owner uuid not null references game.players(id) on delete cascade, property text not null references game.properties(id),
  rent bigint not null, listed boolean not null default true, tenant uuid unique references game.players(id) on delete set null, npc text,
  since timestamptz, paid_to timestamptz, checked_at timestamptz, earned bigint not null default 0, total bigint not null default 0,
  paid bigint not null default 0, bought_at timestamptz not null default now());
create index if not exists rentals_owner on game.rentals (owner);
create index if not exists rentals_market on game.rentals (listed) where tenant is null and npc is null;
-- The home you actually live in: a place you're renting, or your own.
create or replace function game.home_of(pid uuid) returns text language sql stable as $$
  select coalesce((select r.property from game.rentals r where r.tenant = pid), (select property from game.players where id = pid)) $$;
do $$ declare t text; begin
  foreach t in array array['careers','career_ranks','vehicles','medals','medals_earned','missions','seasons','season_points','season_claims','turf','arms','fights','cities','travel_modes','travel_gear','city_shop','countries','rentals','feedback','feedback_rate'] loop
    execute format('alter table game.%I enable row level security', t);
    execute format('revoke all on game.%I from public', t);
  end loop;
end $$;

create or replace function game.pval(j jsonb) returns numeric language sql immutable as $$
  select case jsonb_typeof(j) when 'number' then (j #>> '{}')::numeric when 'boolean' then case when (j #>> '{}')::boolean then 1 else 0 end else 0 end $$;

-- A player's total perk from their home, vehicle and career, capped so nothing becomes free or instant by stacking.
create or replace function game.hperk(pid uuid, k text) returns numeric language sql stable as $$
  select case k when 'mug' then least(0.9, t) when 'hosp' then least(0.6, t) when 'jail' then least(0.6, t) when 'travel_disc' then least(1, t)
                when 'travel_time' then least(0.9, t) when 'heat' then least(1.5, t) when 'travel_free' then least(1, t) when 'travel_fast' then least(1, t) when 'arms' then least(0.5, t) when 'carry' then least(20, t) else t end
  from (select coalesce((select game.pval(h.perks->k) from game.properties h where h.id = game.home_of(pid)), 0)
             + coalesce((select game.pval(v.perks->k) from game.players p join game.vehicles v on v.id = p.vehicle where p.id = pid), 0)
             + coalesce((select c.max * p.career_rank / 10.0 from game.players p join game.careers c on c.id = p.career where p.id = pid and c.perk = k), 0)
             + coalesce((select t.max * game.cstars(co.rep) / 10.0 from game.players p join game.companies co on co.id = p.company_id
                         join game.company_types t on t.id = co.type where p.id = pid and t.perk = k), 0) t) x $$;
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

-- Experience needed to go from one level to the next. Quick at first, then very steep: level 30 takes about 320,000 xp
-- in total, level 100 (the top) about 28 million. Reaching 100 is meant to take a very long time.
create or replace function game.need_xp(lvl int) returns numeric language sql immutable as $$
  select round(100 * power(lvl, 1.5) * (1 + power(lvl / 30.0, 2))) $$;

create or replace function game.gain_xp(pid uuid, x numeric) returns void language plpgsql as $$
declare p game.players; need numeric;
begin
  select * into p from game.players where id = pid for update;
  p.xp := p.xp + x;
  loop
    exit when p.level >= 100;
    need := game.need_xp(p.level);
    exit when p.xp < need;
    p.xp := p.xp - need; p.level := p.level + 1;
    p.max_health := p.max_health + 10; p.health := p.max_health;
    if p.level % 2 = 0 then p.max_grit := p.max_grit + 1; end if;
    if p.level % 3 = 0 then p.max_mood := p.max_mood + 25; end if;
    perform game.notify(pid, 'level', case when p.level = 100 then 'Level 100. The top. There is nowhere higher in Greyhaven.' else format('You reached level %s. Health refilled.', p.level) end);
    if p.level in (25, 50, 75, 100) then
      insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('%s just reached level %s.', p.name, p.level));
    end if;
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
              when p.travel_until > now() then 'travel' when p.trip_until > now() then 'road' when p.city <> 'home' then 'away' else 'ok' end $$;

-- Most things can only be done at home, and not while you're locked up, patched up or on the road.
-- allow_away: things you can also do in another city (eat, use things).
-- On the road you can't do anything but chat and message until you arrive.
create or replace function game.need_still(p game.players) returns void language plpgsql as $$
begin
  if p.trip_until > now() then raise exception 'You''re on the road to %. You can do that when you arrive.', coalesce(p.trip->>'to_name', 'somewhere'); end if;
end $$;

drop function if exists game.need_free(game.players);
create or replace function game.need_free(p game.players, allow_away boolean default false) returns void language plpgsql as $$
begin
  if p.jail_until > now() then raise exception 'You''re in the cells.'; end if;
  if p.hosp_until > now() then raise exception 'You''re in A&E.'; end if;
  if p.travel_until > now() then raise exception 'You''re still in the taxi.'; end if;
  if p.trip_until > now() then raise exception 'You''re on the road to %.', coalesce(p.trip->>'to_name', 'somewhere'); end if;
  if p.city <> 'home' and not allow_away then
    raise exception 'You''re in %. Head home first.', coalesce((select name from game.cities where id = p.city), 'another city'); end if;
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
  else
    update game.inventory set qty = qty - n where player_id = pid and item_id = iid;
  end if;
  -- Eat it, sell it or drop it while you're away, and there's more room in your bag.
  if iid like 'c\_%' or iid like 'w\_%' then update game.players set bag = greatest(0, bag - n) where id = pid and city <> 'home'; end if;
  -- Anything you no longer own comes out of your loadout.
  if exists (select 1 from game.arms where item_id = iid and slot <> 'ammo') then perform game.loadout_clean(pid); end if;
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
                where (not use_cats or cat = any(cats)) and id not in ('founder', 'token', 'war_trophy') and id not like 'arm\_%' and id not like 'ammo\_%' and id not like 'c\_%' and season is null and (supply is null or minted < supply)),
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
    'status', game.status(p), 'city', p.city, 'country', p.country, 'last_seen', p.last_seen, 'wins', p.wins, 'losses', p.losses,
    'created_at', p.created_at, 'founder', p.founder, 'regular', coalesce(p.regular_until > now(), false),
    'look', p.look, 'name_color', p.name_color, 'backdrop', p.backdrop, 'tagline', p.tagline, 'title', p.title,
    'crew', (select jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag) from game.crews c where c.id = p.crew_id),
    'protected', (p.level < 3 or p.created_at > now() - interval '1 day' or p.is_staff), 'staff', p.is_staff) $$;

-- =====================================================================
-- public API (what the web app calls)
-- =====================================================================
drop function if exists public.create_player(text);
create or replace function public.create_player(p_name text, p_country text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')); fno int;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if exists (select 1 from game.players where id = auth.uid()) then raise exception 'You already have a character.'; end if;
  if char_length(n) < 3 or char_length(n) > 20 or n !~ '^[A-Za-z0-9 _.''-]+$' then
    raise exception 'Names are 3 to 20 letters, numbers, spaces, dots, dashes or apostrophes.'; end if;
  if exists (select 1 from game.players where lower(name) = lower(n)) then raise exception 'Someone on the street already goes by that name.'; end if;
  insert into game.players(id, name, country) values (auth.uid(), n, coalesce((select iso from game.countries where iso = upper(p_country)), 'NZ'));
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
  perform game.wars_tick();
  p := game.me();
  -- Rent comes out of a tenant's money as the days go by.
  if exists (select 1 from game.rentals where tenant = p.id) then
    perform game.rental_settle((select id from game.rentals where tenant = p.id)); select * into p from game.players where id = p.id;
  end if;
  perform game.medal_check(p.id);
  return jsonb_build_object(
    'me', to_jsonb(p) || jsonb_build_object('status', game.status(p), 'power', round(game.power(p)),
          'networth', game.networth(p.id), 'need_xp', case when p.level >= 100 then null else game.need_xp(p.level) end,
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
    'company', (select jsonb_build_object('id', c.id, 'name', c.name, 'owner', c.owner = p.id,
                  'apps', case when c.owner = p.id then (select count(*) from game.company_apps a where a.company_id = c.id) else 0 end,
                  'ready', p.company_at is null or p.company_at < now() - interval '20 hours') from game.companies c where c.id = p.company_id),
    'war', (select jsonb_build_object('id', w.id, 'us', case when w.attacker = p.crew_id then w.a_tag else w.d_tag end, 'them', case when w.attacker = p.crew_id then w.d_tag else w.a_tag end,
              'them_name', case when w.attacker = p.crew_id then w.d_name else w.a_name end,
              'ours', case when w.attacker = p.crew_id then w.a_score else w.d_score end, 'theirs', case when w.attacker = p.crew_id then w.d_score else w.a_score end, 'ends_at', w.ends_at)
            from game.wars w where w.status = 'active' and p.crew_id in (w.attacker, w.defender) limit 1),
    'season', (select jsonb_build_object('id', s.id, 'name', s.name, 'icon', s.icon) from game.seasons s where s.id = game.season_now()),
    'mission_ready', (select (p.mission->>'have')::numeric >= m.n from game.missions m where m.chain = p.mission->>'chain' and m.step = (p.mission->>'step')::int),
    'shift_ready', p.career is not null and (p.career_at is null or p.career_at < now() - interval '20 hours'),
    'home_ready', (select (h.perks ? 'daily') and (p.home_at is null or p.home_at < now() - interval '20 hours') from game.properties h where h.id = p.property),
    'tower', (select jsonb_agg(name) from (select x.name from game.players x join game.properties h on h.id = x.property where h.perks ? 'skyline' order by h.sort desc, x.name limit 5) x),
    'online', (select count(*) from game.players where last_seen > now() - interval '5 minutes' and not is_staff),
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
        where y.id <> p.id and (not y.is_staff or p_scope in ('search', 'contacts'))
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
    'until', coalesce(case when t.jail_until > now() then t.jail_until end, case when t.hosp_until > now() then t.hosp_until end, case when t.trip_until > now() then t.trip_until end, t.travel_until),
    'is_me', t.id = me.id,
    'is_contact', exists (select 1 from game.contacts k where k.player_id = me.id and k.contact = t.id),
    'property', (select name from game.properties where id = t.property),
    'collection', (select count(*) from game.collection where player_id = t.id),
    'medals', (select count(*) from game.medals_earned where player_id = t.id),
    'vehicle_name', (select name from game.vehicles where id = t.vehicle),
    'career_title', (select c.ranks[t.career_rank] || ', ' || lower(c.name) from game.careers c where c.id = t.career),
    'company', (select jsonb_build_object('id', c.id, 'name', c.name, 'owner', c.owner = t.id, 'stars', game.cstars(c.rep)) from game.companies c where c.id = t.company_id),
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
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
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
  p := game.me(); perform game.need_still(p);
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
    if exists (select 1 from game.fights where attacker = p.id and status = 'on') then raise exception 'Not mid-fight.'; end if;
    return game.loadout_put(p.id, it.id) || jsonb_build_object('equipped', it.id);
  end if;
  e := it.effect;
  if e = '{}'::jsonb then raise exception 'You can''t use that. Sell it or keep it.'; end if;
  if e ? 'hosp' and p.hosp_until > now() then
    update game.players set hosp_until = greatest(now(), hosp_until - make_interval(secs => (e->>'hosp')::int)),
      health = least(max_health, health + coalesce((e->>'health')::numeric, 0)) where id = p.id;
    perform game.take(p.id, it.id, 1);
    return jsonb_build_object('used', it.id, 'msg', 'Patched up. Your stay just got shorter.');
  end if;
  perform game.need_free(p, true);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
  if coalesce(p_qty, 0) < 1 or coalesce(p_price, 0) < 1 then raise exception 'Enter a quantity and a price.'; end if;
  perform game.market_ok(p);
  if p_item = 'founder' then raise exception 'Founder''s keys stay with the founder. They can''t be sold.'; end if;
  slots := 20 + game.skill_lvl(p.skills, 'trade') / 5 + case when game.has_block(p.id, 'SHWD') then 2 else 0 end
         + case when p.stall_until > now() then 10 else 0 end + game.hperk(p.id, 'listings')::int;
  if (select count(*) from game.listings where seller = p.id) >= slots then raise exception 'You can have % listings. Cancel one first.', slots; end if;
  perform game.take(p.id, p_item, p_qty);
  -- Listings go up on the market in the town you're in.
  insert into game.listings(seller, item_id, qty, price, city) values (p.id, p_item, p_qty, p_price, p.city) returning game.listings.id into new_id;
  perform game.track(p.id, 'market', 1);
  return jsonb_build_object('id', new_id);
end $$;

create or replace function public.market_cancel(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l game.listings;
begin
  p := game.me(); perform game.need_still(p);
  select * into l from game.listings where id = p_id and seller = p.id for update;
  if not found then raise exception 'That listing is gone.'; end if;
  if l.city <> p.city then raise exception 'That listing is in %. You''ll have to go there to take it down.', (select name from game.cities where id = l.city); end if;
  delete from game.listings where id = l.id;
  perform game.give(p.id, l.item_id, l.qty);
  if p.city <> 'home' then update game.players set bag = bag + l.qty where id = p.id; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.market_buy(p_id bigint, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; l game.listings; q int := greatest(1, coalesce(p_qty, 1)); cost bigint; fee bigint; nm text;
begin
  p := game.me(); perform game.need_still(p);
  select * into l from game.listings where id = p_id for update;
  if not found then raise exception 'Someone beat you to it.'; end if;
  if l.seller = p.id then raise exception 'That''s your own listing.'; end if;
  perform game.market_ok(p);
  if q > l.qty then raise exception 'Only % left.', l.qty; end if;
  if l.city <> p.city then raise exception 'That''s for sale in %. You''ll have to go there to buy it.', (select name from game.cities where id = l.city); end if;
  if p.city <> 'home' and p.bag + q > coalesce((p.trip->>'cap')::int, 0) then raise exception 'You can''t carry that many more.'; end if;
  cost := l.price * q;
  if p.cash < cost then raise exception 'That''s %. You have % on you.', game.fmt(cost), game.fmt(p.cash); end if;
  fee := floor(cost * 0.03);
  update game.players set cash = cash - cost where id = p.id;
  update game.players set cash = cash + cost - fee where id = l.seller;
  if q = l.qty then delete from game.listings where id = l.id; else update game.listings set qty = qty - q where id = l.id; end if;
  perform game.give(p.id, l.item_id, q);
  if p.city <> 'home' then update game.players set bag = bag + q where id = p.id; end if;
  insert into game.sales(item_id, qty, price, seller, buyer, city) values (l.item_id, q, l.price, l.seller, p.id, l.city);
  select name into nm from game.items where id = l.item_id;
  perform game.notify(l.seller, 'sale', format('%s bought %s%s from you for %s (after the 3%% market fee: %s).', p.name,
    case when q > 1 then q || '× ' else '' end, nm, game.fmt(cost), game.fmt(cost - fee)));
  perform game.add_skill(p.id, 'trade', 2); perform game.add_skill(l.seller, 'trade', 3);
  perform game.track(p.id, 'market', 1);
  return jsonb_build_object('item', l.item_id, 'qty', q, 'cost', cost);
end $$;

drop function if exists public.market_overview(text[], text);
create or replace function public.market_overview(p_cats text[] default null, p_q text default null, p_city text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; cid text;
begin
  p := game.me(); cid := coalesce(p_city, p.city);
  return coalesce((select jsonb_agg(x order by x.rarity desc, x.min_price desc) from (
    select l.item_id, i.rarity, i.cat, min(l.price) min_price, sum(l.qty) qty, count(*) listings, i.value
    from game.listings l join game.items i on i.id = l.item_id
    where l.city = cid and (p_cats is null or i.cat = any(p_cats)) and (p_q is null or i.name ilike '%' || p_q || '%')
    group by l.item_id, i.rarity, i.cat, i.value limit 200) x), '[]');
end $$;

drop function if exists public.market_item(text);
create or replace function public.market_item(p_item text, p_city text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; cid text; it game.items; here game.cities;
begin
  p := game.me(); cid := coalesce(p_city, p.city);
  select * into it from game.items where id = p_item;
  select * into here from game.cities where id = cid;
  return jsonb_build_object(
    'city', cid, 'city_name', here.name, 'here', p.city,
    'value', it.value, 'supply', it.supply, 'found', it.minted,
    'around', coalesce((select sum(qty) from game.inventory where item_id = p_item), 0) + coalesce((select sum(qty) from game.listings where item_id = p_item), 0),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'qty', l.qty, 'price', l.price, 'seller', pl.name, 'mine', l.seller = p.id) order by l.price, l.id)
                 from (select * from game.listings where item_id = p_item and city = cid order by price, id limit 40) l join game.players pl on pl.id = l.seller), '[]'),
    'sales', coalesce((select jsonb_agg(jsonb_build_object('price', s.price, 'qty', s.qty, 'at', s.at) order by s.at)
                 from (select * from game.sales where item_id = p_item and city = cid order by at desc limit 30) s), '[]'),
    -- Where else it's listed, and which towns' traders pay the most for it.
    'elsewhere', coalesce((select jsonb_agg(jsonb_build_object('city', c.id, 'name', c.name, 'country', c.country, 'price', z.lo, 'qty', z.n) order by z.lo)
                 from (select city, min(price) lo, sum(qty) n from game.listings where item_id = p_item and city <> cid group by city order by min(price) limit 8) z join game.cities c on c.id = z.city), '[]'),
    'trader_here', case when cid = 'home' then floor(it.value * 0.5) else game.trader_price(it, here) end,
    'traders', coalesce((select jsonb_agg(jsonb_build_object('city', z.id, 'name', z.name, 'country', z.country, 'price', z.price) order by z.price desc)
                 from (select c.id, c.name, c.country, game.trader_price(it, c) price from game.cities c where c.id <> 'home' order by 4 desc limit 6) z), '[]'),
    'origin', it.origin, 'origin_city', (select name from game.cities where id = it.origin_city));
end $$;

create or replace function public.my_listings() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'item_id', l.item_id, 'qty', l.qty, 'price', l.price, 'created_at', l.created_at, 'city', l.city, 'city_name', c.name) order by l.created_at desc)
                   from game.listings l left join game.cities c on c.id = l.city where l.seller = p.id), '[]');
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
    from game.players where (banned_until is null or banned_until < now()) and not is_staff
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
  perform game.notify(p_player, 'tokens', format('Payment received. %s tokens are in your stash. Thank you for supporting Hustle.', k.tokens));
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
    {"k":"fight_win","t":"Win a fight","d":"Pick a local your own size and take their cash.","cash":300,"go":"fights"},
    {"k":"trip","t":"Take a trip out of Greyhaven","d":"Every town sells things you can''t get at home.","cash":1000,"go":"travel"},
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
    where s.id = game.season_now() and s.points ? track.k and not (select is_staff from game.players where id = pid)
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p); d := game.daily_ensure(p.id);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
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
    'war', (select jsonb_build_object('id', w.id, 'vs', case when w.attacker = c.id then w.d_name else w.a_name end, 'ends_at', w.ends_at) from game.wars w where w.status = 'active' and c.id in (w.attacker, w.defender) limit 1),
    'can_declare', not mine and p.crew_role = 'leader' and game.war_block(p.crew_id, c.id) is null,
    'declare_block', case when not mine and p.crew_role = 'leader' then game.war_block(p.crew_id, c.id) end,
    'wars', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'vs', case when w.attacker = c.id then w.d_name else w.a_name end,
              'ours', case when w.attacker = c.id then w.a_score else w.d_score end, 'theirs', case when w.attacker = c.id then w.d_score else w.a_score end,
              'result', case when w.status = 'active' then 'active' when w.winner is null then 'draw' when w.winner = c.id then 'won' else 'lost' end,
              'surrendered', w.status = 'surrendered', 'loot', w.loot, 'at', coalesce(w.ended_at, w.started_at)) order by w.id desc)
            from (select * from game.wars where c.id in (attacker, defender) order by id desc limit 10) w), '[]'),
    'log', case when mine then coalesce((select jsonb_agg(jsonb_build_object('body', body, 'at', at) order by id desc)
                 from (select * from game.crew_log where crew_id = c.id order by id desc limit 25) l), '[]') end);
end $$;

create or replace function public.crew_apply(p_id bigint, p_note text default '') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.crews;
begin
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p); cid := p.crew_id;
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
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
  -- If you're renting somewhere else, that's still where you live.
  if exists (select 1 from game.rentals where tenant = p.id) then perform game.home_apply(p.id); end if;
  if nw.price >= 8000000 and nw.sort > cur.sort then
    insert into game.messages(player_id, name, body) values (null, 'The Bugle',
      case nw.id when 'tower' then format('%s just bought Greyhaven Tower. Their name is going up on the skyline tonight.', p.name)
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
  p := game.me(); perform game.need_still(p);
  select perks->'daily' into d from game.properties where id = game.home_of(p.id);
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
  p := game.me(); perform game.need_still(p);
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
    'online', (select count(*) from game.players where last_seen > now() - interval '5 minutes' and not is_staff),
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
      'muted_until', x.muted_until, 'is_admin', x.is_admin, 'is_staff', x.is_staff, 'tokens', coalesce((select qty from game.inventory v where v.player_id = x.id and v.item_id = 'token'), 0),
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
    when 'staff' then update game.players set is_staff = p_amount > 0 where id = t.id;
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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
    'events', coalesce((select sum(points) from game.season_points where player_id = p.id), 0), 'power', round(game.power(p)),
    'warhits', (select count(*) from game.war_hits where player_id = p.id and pts > 1),
    'company', coalesce((select game.cstars(rep) from game.companies where owner = p.id), 0),
    'company_sold', (select count(*) from game.company_sales where seller = p.id),
    'warwins', (select count(distinct h.war_id) from game.war_hits h join game.wars w on w.id = h.war_id where h.player_id = p.id and w.winner = h.crew_id))
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
  p := game.me(); perform game.need_still(p);
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
  p := game.me(); perform game.need_still(p);
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



-- ---------- crew wars ----------
create or replace function game.war_between(a bigint, b bigint) returns game.wars language sql stable as $$
  select * from game.wars where status = 'active' and ends_at > now() and a is not null and b is not null
    and ((attacker = a and defender = b) or (attacker = b and defender = a)) limit 1 $$;

-- Why a crew can't declare war on another right now (null if it can).
create or replace function game.war_block(a bigint, b bigint) returns text language sql stable as $$
  select case
    when a is null or b is null or a = b then 'Not possible.'
    when exists (select 1 from game.wars where status = 'active' and (attacker in (a, b) or defender in (a, b))) then 'One of the crews is already at war.'
    when exists (select 1 from game.wars where ((attacker = a and defender = b) or (attacker = b and defender = a)) and ended_at > now() - interval '3 days') then 'You fought them in the last three days. Give it time.'
    when exists (select 1 from game.wars where b in (attacker, defender) and ended_at > now() - interval '12 hours') then 'They''ve just come out of a war. They get 12 hours of peace.'
    when (select count(*) from game.players where crew_id = a) < 2 or (select count(*) from game.players where crew_id = b) < 2 then 'Both crews need at least two members.'
    when (select vault from game.crews where id = a) < 100000 then 'Declaring war costs $100,000 from your crew vault.'
  end $$;

-- Close any wars whose time is up.
create or replace function game.wars_tick() returns void language plpgsql as $$
declare w game.wars;
begin
  for w in select * from game.wars where status = 'active' and ends_at <= now() for update skip locked loop
    perform game.war_finish(w.id, case when w.a_score > w.d_score then w.attacker when w.d_score > w.a_score then w.defender end, 'over');
  end loop;
end $$;

create or replace function game.war_finish(wid bigint, win bigint, how text) returns void language plpgsql as $$
declare w game.wars; lose bigint; spoils bigint := 0; wn text; ln text; m record;
begin
  select * into w from game.wars where id = wid for update;
  if w.status <> 'active' then return; end if;
  lose := case when win = w.attacker then w.defender when win = w.defender then w.attacker end;
  if win is not null then
    -- The winners take 20% of the losers' vault and a lot of respect.
    select floor(vault * 0.2) into spoils from game.crews where id = lose;
    update game.crews set vault = vault - coalesce(spoils, 0), respect = greatest(0, respect - 50) where id = lose;
    update game.crews set vault = vault + coalesce(spoils, 0), respect = respect + 100 where id = win;
    wn := case when win = w.attacker then w.a_name else w.d_name end; ln := case when win = w.attacker then w.d_name else w.a_name end;
    -- Every winner who landed a hit gets a war trophy.
    for m in select distinct player_id from game.war_hits where war_id = wid and crew_id = win and pts > 1 and player_id is not null loop
      perform game.give(m.player_id, 'war_trophy', 1);
    end loop;
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', case when how = 'surrender' then format('%s have surrendered to %s. The winners walk off with %s.', ln, wn, game.fmt(coalesce(spoils, 0)))
      else format('The war is over: %s beat %s, %s to %s, and take %s from their vault.', wn, ln, round(greatest(w.a_score, w.d_score)), round(least(w.a_score, w.d_score)), game.fmt(coalesce(spoils, 0))) end);
  else
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('The war between %s and %s ended in a draw. Nobody is happy.', w.a_name, w.d_name));
  end if;
  update game.wars set status = case when how = 'surrender' then 'surrendered' else 'over' end, winner = win, loot = coalesce(spoils, 0), ended_at = now() where id = wid;
  for m in select id, crew_id from game.players where crew_id in (w.attacker, w.defender) loop
    perform game.notify(m.id, 'war', case when win is null then 'The war ended in a draw.' when m.crew_id = win then format('You won the war. Your crew takes %s.', game.fmt(coalesce(spoils, 0)))
      else format('You lost the war. They take %s from your vault.', game.fmt(coalesce(spoils, 0))) end);
  end loop;
end $$;

create or replace function public.war_declare(p_crew bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; a game.crews; d game.crews; why text; wid bigint; m record;
begin
  perform game.wars_tick();
  p := game.me(); perform game.need_still(p);
  if p.crew_role is distinct from 'leader' then raise exception 'Only a crew leader can declare war.'; end if;
  why := game.war_block(p.crew_id, p_crew);
  if why is not null then raise exception '%', why; end if;
  select * into a from game.crews where id = p.crew_id for update;
  select * into d from game.crews where id = p_crew;
  update game.crews set vault = vault - 100000 where id = a.id;
  insert into game.wars(attacker, defender, a_name, d_name, a_tag, d_tag, ends_at) values (a.id, d.id, a.name, d.name, a.tag, d.tag, now() + interval '48 hours') returning id into wid;
  perform game.crew_note(a.id, format('%s declared war on %s.', p.name, d.name));
  perform game.crew_note(d.id, format('%s declared war on you.', a.name));
  for m in select id, crew_id from game.players where crew_id in (a.id, d.id) loop
    perform game.notify(m.id, 'war', case when m.crew_id = a.id then format('%s declared war on %s. You have 48 hours.', p.name, d.name)
                                      else format('%s have declared war on your crew. You have 48 hours.', a.name) end);
  end loop;
  insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('War! %s [%s] have declared war on %s [%s]. 48 hours. Stay off the streets.', a.name, a.tag, d.name, d.tag));
  return jsonb_build_object('war', wid);
end $$;

create or replace function public.war_surrender() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; w game.wars;
begin
  p := game.me(); perform game.need_still(p);
  if p.crew_role is distinct from 'leader' then raise exception 'Only the leader can surrender.'; end if;
  select * into w from game.wars where status = 'active' and p.crew_id in (attacker, defender) limit 1;
  if not found then raise exception 'You''re not at war.'; end if;
  perform game.war_finish(w.id, case when w.attacker = p.crew_id then w.defender else w.attacker end, 'surrender');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.war_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; w game.wars; them bigint;
begin
  perform game.wars_tick();
  p := game.me();
  select * into w from game.wars where status = 'active' and p.crew_id is not null and p.crew_id in (attacker, defender) limit 1;
  if not found then
    return jsonb_build_object('war', null, 'role', p.crew_role, 'crew', p.crew_id,
      'last', (select jsonb_build_object('vs', case when x.attacker = p.crew_id then x.d_name else x.a_name end, 'ours', case when x.attacker = p.crew_id then x.a_score else x.d_score end,
                 'theirs', case when x.attacker = p.crew_id then x.d_score else x.a_score end, 'result', case when x.winner is null then 'draw' when x.winner = p.crew_id then 'won' else 'lost' end, 'loot', x.loot, 'at', x.ended_at)
               from game.wars x where p.crew_id in (x.attacker, x.defender) and x.status <> 'active' order by x.id desc limit 1),
      'targets', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'tag', c.tag, 'respect', c.respect,
                   'members', (select count(*) from game.players m where m.crew_id = c.id), 'block', game.war_block(p.crew_id, c.id)) order by c.respect desc)
                 from game.crews c where p.crew_role = 'leader' and c.id <> p.crew_id), '[]'));
  end if;
  them := case when w.attacker = p.crew_id then w.defender else w.attacker end;
  return jsonb_build_object('role', p.crew_role, 'war', jsonb_build_object('id', w.id, 'ends_at', w.ends_at, 'started_at', w.started_at,
      'us', jsonb_build_object('name', case when w.attacker = p.crew_id then w.a_name else w.d_name end, 'tag', case when w.attacker = p.crew_id then w.a_tag else w.d_tag end,
                               'score', case when w.attacker = p.crew_id then w.a_score else w.d_score end),
      'them', jsonb_build_object('id', them, 'name', case when w.attacker = p.crew_id then w.d_name else w.a_name end, 'tag', case when w.attacker = p.crew_id then w.d_tag else w.a_tag end,
                               'score', case when w.attacker = p.crew_id then w.d_score else w.a_score end),
      'we_declared', w.attacker = p.crew_id),
    'enemies', coalesce((select jsonb_agg(game.card(m) || jsonb_build_object('power_hint', case
            when game.power(m) > game.power(p) * 1.5 then 'much stronger' when game.power(m) > game.power(p) * 1.1 then 'stronger'
            when game.power(m) < game.power(p) * 0.66 then 'much weaker' when game.power(m) < game.power(p) * 0.9 then 'weaker' else 'even' end,
            'worth', round(3 + m.level / 3.0, 1),
            'cooldown', (select max(at) + interval '3 minutes' from game.attacks where attacker = p.id and defender = m.id and at > now() - interval '3 minutes'),
            'until', coalesce(case when m.jail_until > now() then m.jail_until end, case when m.hosp_until > now() then m.hosp_until end, case when m.trip_until > now() then m.trip_until end, m.travel_until)) order by m.level desc)
          from game.players m where m.crew_id = them), '[]'),
    'board', coalesce((select jsonb_agg(x order by x.pts desc) from (
        select pl.id, pl.name, pl.look, pl.name_color, h.crew_id = p.crew_id ours, sum(h.pts) pts, count(*) filter (where h.pts > 1) hits
        from game.war_hits h join game.players pl on pl.id = h.player_id where h.war_id = w.id group by pl.id, pl.name, pl.look, pl.name_color, h.crew_id order by sum(h.pts) desc limit 20) x), '[]'),
    'feed', coalesce((select jsonb_agg(jsonb_build_object('who', (select name from game.players where id = h.player_id), 'target', (select name from game.players where id = h.target),
          'ours', h.crew_id = p.crew_id, 'pts', h.pts, 'cash', h.cash, 'at', h.at) order by h.id desc)
        from (select * from game.war_hits where war_id = w.id order by id desc limit 30) h), '[]'));
end $$;


-- ---------- companies ----------
create or replace function game.company_note(cid bigint, b text) returns void language sql as $$ insert into game.company_log(company_id, body) values (cid, b) $$;
create or replace function game.company_cap(stars int) returns int language sql immutable as $$ select 3 + stars * 2 $$;
create or replace function game.company_revenue(t game.company_types, stars int, lvl int) returns bigint language sql immutable as $$
  select round(t.base * (1 + 0.15 * (stars - 1)) * (0.8 + least(0.7, lvl / 40.0)))::bigint $$;

create or replace function public.company_list() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('mine', p.company_id,
    'recent_sales', coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'type', x.type, 'stars', x.stars, 'price', x.price, 'at', x.at,
        'seller', (select name from game.players where id = x.seller), 'buyer', (select name from game.players where id = x.buyer)) order by x.id desc)
      from (select * from game.company_sales order by id desc limit 10) x), '[]'),
    'types', (select jsonb_agg(to_jsonb(t) || jsonb_build_object('count', (select count(*) from game.companies c where c.type = t.id)) order by t.sort) from game.company_types t),
    'stars', (select jsonb_agg(rep order by stars) from game.company_stars),
    'companies', coalesce((select jsonb_agg(x order by x.stars desc, x.staff desc) from (
      select c.id, c.name, c.type, game.cstars(c.rep) stars, (select count(*) from game.players m where m.company_id = c.id) staff, c.sale_price, game.company_value(c.id) value,
             game.company_cap(game.cstars(c.rep)) + 1 cap, (select name from game.players where id = c.owner) owner,
             exists (select 1 from game.company_apps a where a.company_id = c.id and a.player_id = p.id) applied
      from game.companies c limit 300) x), '[]'));
end $$;

create or replace function public.company_get(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; t game.company_types; mine boolean; boss boolean; st int;
begin
  p := game.me();
  select * into c from game.companies where id = p_id;
  if not found then raise exception 'That company has closed down.'; end if;
  select * into t from game.company_types where id = c.type;
  mine := p.company_id = c.id; boss := c.owner = p.id; st := game.cstars(c.rep);
  return jsonb_build_object('id', c.id, 'name', c.name, 'type', to_jsonb(t), 'stars', st, 'rep', c.rep,
    'next_rep', (select rep from game.company_stars where stars = st + 1), 'cap', game.company_cap(st) + 1, 'created_at', c.created_at,
    'mine', mine, 'boss', boss, 'funds', case when mine then c.funds end,
    'perk_now', t.max * st / 10.0,
    'revenue_me', case when mine then game.company_revenue(t, st, p.level) end,
    'can_shift', mine and (p.company_at is null or p.company_at < now() - interval '20 hours'), 'next_shift', case when mine then p.company_at + interval '20 hours' end,
    'applied', exists (select 1 from game.company_apps where company_id = c.id and player_id = p.id),
    'sale_price', c.sale_price, 'listed_at', c.listed_at, 'value', game.company_value(c.id),
    'my_offer', (select jsonb_build_object('id', id, 'amount', amount, 'at', at) from game.company_offers where company_id = c.id and buyer = p.id),
    'offers', case when boss then coalesce((select jsonb_agg(game.card(b) || jsonb_build_object('offer_id', o.id, 'amount', o.amount, 'at', o.at, 'cash', b.cash, 'can_afford', b.cash >= o.amount) order by o.amount desc)
               from game.company_offers o join game.players b on b.id = o.buyer where o.company_id = c.id), '[]') end,
    'sales', coalesce((select jsonb_agg(jsonb_build_object('price', x.price, 'at', x.at, 'seller', (select name from game.players where id = x.seller),
               'buyer', (select name from game.players where id = x.buyer)) order by x.id desc) from game.company_sales x where x.company_id = c.id), '[]'),
    'owner', (select game.card(o) from game.players o where o.id = c.owner),
    'staff', coalesce((select jsonb_agg(game.card(m) || jsonb_build_object('wage', case when mine then m.company_wage end, 'shifts', m.company_shifts,
               'worked_today', m.company_at > now() - interval '20 hours', 'joined', m.company_joined, 'is_owner', m.id = c.owner,
               'earns', game.company_revenue(t, st, m.level)) order by (m.id = c.owner) desc, m.company_shifts desc) from game.players m where m.company_id = c.id), '[]'),
    'apps', case when boss then coalesce((select jsonb_agg(game.card(m) || jsonb_build_object('note', a.note, 'at', a.at) order by a.at)
               from game.company_apps a join game.players m on m.id = a.player_id where a.company_id = c.id), '[]') end,
    'log', case when mine then coalesce((select jsonb_agg(jsonb_build_object('body', body, 'at', at) order by id desc)
               from (select * from game.company_log where company_id = c.id order by id desc limit 25) l), '[]') end);
end $$;

create or replace function public.company_start(p_type text, p_name text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.company_types; n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')); cid bigint;
begin
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
  if p.company_id is not null then raise exception 'You already work at a company. Leave it first.'; end if;
  select * into t from game.company_types where id = p_type;
  if not found then raise exception 'No such kind of business.'; end if;
  if p.level < t.lvl then raise exception 'You need level % to start one of these.', t.lvl; end if;
  if p.cash < t.cost then raise exception 'Starting one costs %. You have % on you.', game.fmt(t.cost), game.fmt(p.cash); end if;
  if char_length(n) < 3 or char_length(n) > 30 or n !~ '^[A-Za-z0-9 ''&.,!-]+$' then raise exception 'Company names are 3 to 30 letters, numbers and spaces.'; end if;
  if exists (select 1 from game.companies where lower(name) = lower(n)) then raise exception 'There''s already a company with that name.'; end if;
  insert into game.companies(type, name, owner) values (t.id, n, p.id) returning id into cid;
  update game.players set cash = cash - t.cost, company_id = cid, company_wage = 0, company_joined = now(), company_shifts = 0, company_at = null where id = p.id;
  delete from game.company_apps where player_id = p.id;
  perform game.company_note(cid, format('%s opened the doors.', p.name));
  perform game.track(p.id, 'company', 1);
  insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('Now open: %s, a new %s owned by %s. They''re hiring.', n, lower(t.name), p.name));
  return jsonb_build_object('id', cid);
end $$;

create or replace function public.company_apply(p_id bigint, p_note text default '') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies;
begin
  p := game.me(); perform game.need_still(p);
  if p.company_id is not null then raise exception 'You already work at a company.'; end if;
  select * into c from game.companies where id = p_id;
  if not found then raise exception 'That company has closed down.'; end if;
  if (select count(*) from game.company_apps where player_id = p.id) >= 5 then raise exception 'You can have 5 job applications open at once.'; end if;
  insert into game.company_apps(company_id, player_id, note) values (c.id, p.id, left(coalesce(p_note, ''), 200)) on conflict do nothing;
  perform game.notify(c.owner, 'company', format('%s applied for a job at %s.', p.name, c.name));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_withdraw(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me(); delete from game.company_apps where company_id = p_id and player_id = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_decide(p_player uuid, p_accept boolean, p_wage bigint default 0) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; t game.players;
begin
  p := game.me(); perform game.need_still(p);
  select * into c from game.companies where owner = p.id;
  if not found then raise exception 'You don''t own a company.'; end if;
  if not exists (select 1 from game.company_apps where company_id = c.id and player_id = p_player) then raise exception 'That application has been withdrawn.'; end if;
  select * into t from game.players where id = p_player for update;
  delete from game.company_apps where company_id = c.id and player_id = p_player;
  if not p_accept then perform game.notify(t.id, 'company', format('%s turned down your application.', c.name)); return jsonb_build_object('ok', true); end if;
  if t.company_id is not null then raise exception '% already took another job.', t.name; end if;
  if (select count(*) from game.players where company_id = c.id) - 1 >= game.company_cap(game.cstars(c.rep)) then
    raise exception 'You''re fully staffed. More stars mean room for more staff.'; end if;
  update game.players set company_id = c.id, company_wage = greatest(0, least(coalesce(p_wage, 0), 1000000)), company_joined = now(), company_shifts = 0, company_at = null where id = t.id;
  delete from game.company_apps where player_id = t.id;
  perform game.notify(t.id, 'company', format('You got the job at %s. Your first shift is waiting.', c.name));
  perform game.company_note(c.id, format('%s hired %s.', p.name, t.name));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_staff(p_player uuid, p_action text, p_wage bigint default 0) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; t game.players;
begin
  p := game.me(); perform game.need_still(p);
  select * into c from game.companies where owner = p.id;
  if not found then raise exception 'You don''t own a company.'; end if;
  select * into t from game.players where id = p_player for update;
  if t.company_id is distinct from c.id or t.id = p.id then raise exception 'They don''t work for you.'; end if;
  if p_action = 'fire' then
    update game.players set company_id = null, company_wage = 0, company_joined = null, company_shifts = 0 where id = t.id;
    perform game.notify(t.id, 'company', format('%s let you go.', c.name));
    perform game.company_note(c.id, format('%s let %s go.', p.name, t.name));
  elsif p_action = 'wage' then
    if p_wage < 0 or p_wage > 1000000 then raise exception 'Wages are between $0 and $1,000,000 a shift.'; end if;
    update game.players set company_wage = p_wage where id = t.id;
    perform game.notify(t.id, 'company', format('Your wage at %s is now %s a shift.', c.name, game.fmt(p_wage)));
  else raise exception 'Unknown action.'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_funds(p_amount bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; a bigint := coalesce(p_amount, 0);
begin
  p := game.me(); perform game.need_still(p);
  select * into c from game.companies where owner = p.id for update;
  if not found then raise exception 'You don''t own a company.'; end if;
  if a = 0 then raise exception 'Enter an amount.'; end if;
  if a > 0 and a > p.cash then raise exception 'You only have % on you.', game.fmt(p.cash); end if;
  if a < 0 and -a > c.funds then raise exception 'The company only has %.', game.fmt(c.funds); end if;
  update game.players set cash = cash - a where id = p.id;
  update game.companies set funds = funds + a where id = c.id;
  perform game.company_note(c.id, case when a > 0 then format('%s put %s into the company.', p.name, game.fmt(a)) else format('%s took %s out of the company.', p.name, game.fmt(-a)) end);
  return jsonb_build_object('funds', c.funds + a);
end $$;

-- Work a shift: the company earns money, and pays your wage from its funds.
create or replace function public.company_shift() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; t game.company_types; st int; st2 int; rev bigint; paid boolean := false; w bigint; m record;
begin
  p := game.me(); perform game.need_free(p);
  if p.company_id is null then raise exception 'You don''t work at a company.'; end if;
  if p.company_at > now() - interval '20 hours' then raise exception 'You''ve already worked today. Next shift in %.', to_char(p.company_at + interval '20 hours' - now(), 'HH24"h "MI"m"'); end if;
  select * into c from game.companies where id = p.company_id for update;
  select * into t from game.company_types where id = c.type;
  st := game.cstars(c.rep);
  rev := game.company_revenue(t, st, p.level);
  w := case when c.owner = p.id then 0 else p.company_wage end;
  update game.companies set funds = funds + rev, rep = rep + 1 where id = c.id;
  if w > 0 and c.funds + rev >= w then
    update game.companies set funds = funds - w where id = c.id;
    update game.players set cash = cash + w where id = p.id; paid := true;
  elsif w > 0 then
    perform game.notify(c.owner, 'company', format('%s couldn''t be paid: the company is out of money.', p.name));
  end if;
  update game.players set company_at = now(), company_shifts = company_shifts + 1 where id = p.id;
  perform game.gain_xp(p.id, 2 + st);
  perform game.track(p.id, 'company_shift', 1);
  st2 := game.cstars(c.rep + 1);
  if st2 > st then
    perform game.company_note(c.id, format('%s reached %s stars.', c.name, st2));
    for m in select id from game.players where company_id = c.id loop perform game.notify(m.id, 'company', format('%s just reached %s stars.', c.name, st2)); end loop;
  end if;
  return jsonb_build_object('revenue', rev, 'wage', w, 'paid', paid, 'stars', st2, 'star_up', st2 > st);
end $$;

create or replace function public.company_leave() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; refund bigint; m record;
begin
  p := game.me(); perform game.need_still(p);
  if p.company_id is null then raise exception 'You don''t work at a company.'; end if;
  select * into c from game.companies where id = p.company_id for update;
  if c.owner = p.id then
    -- Closing down: the owner gets the company's funds back plus half of what it cost to start.
    refund := c.funds + floor((select cost from game.company_types where id = c.type) * 0.5);
    for m in select id from game.players where company_id = c.id and id <> p.id loop perform game.notify(m.id, 'company', format('%s has closed down.', c.name)); end loop;
    update game.players set company_id = null, company_wage = 0, company_joined = null, company_shifts = 0 where company_id = c.id;
    update game.players set cash = cash + refund where id = p.id;
    delete from game.companies where id = c.id;
    return jsonb_build_object('closed', true, 'refund', refund);
  end if;
  update game.players set company_id = null, company_wage = 0, company_joined = null, company_shifts = 0 where id = p.id;
  perform game.company_note(c.id, format('%s quit.', p.name));
  perform game.notify(c.owner, 'company', format('%s quit %s.', p.name, c.name));
  return jsonb_build_object('ok', true);
end $$;


-- ---------- buying and selling companies ----------
-- A rough guide to what a company is worth: half its start-up cost, its money in the bank, its stars and its staff.
create or replace function game.company_value(cid bigint) returns bigint language sql stable as $$
  select (floor(t.cost * 0.5) + c.funds + floor(t.cost * 0.12 * (game.cstars(c.rep) - 1))
          + (select count(*) from game.players m where m.company_id = c.id and m.id <> c.owner) * t.base * 5)::bigint
  from game.companies c join game.company_types t on t.id = c.type where c.id = cid $$;

create or replace function game.company_transfer(cid bigint, nb uuid, price bigint) returns void language plpgsql as $$
declare c game.companies; t game.company_types; b game.players; sel game.players; m record; st int;
begin
  select * into c from game.companies where id = cid for update;
  select * into t from game.company_types where id = c.type;
  select * into b from game.players where id = nb for update;
  select * into sel from game.players where id = c.owner for update;
  if b.id = c.owner then raise exception 'You already own it.'; end if;
  if b.level < t.lvl then raise exception '% needs level % to own a %.', b.name, t.lvl, lower(t.name); end if;
  if b.company_id is not null and b.company_id <> cid then raise exception '% works at another company. They''d need to leave first.', b.name; end if;
  if b.cash < price then raise exception '% doesn''t have % on them.', b.name, game.fmt(price); end if;
  st := game.cstars(c.rep);
  -- The seller gets the price less a 5% broker's fee. The company's funds and staff go with it.
  update game.players set cash = cash - price, company_id = cid, company_wage = 0, company_joined = coalesce(case when company_id = cid then company_joined end, now()) where id = b.id;
  update game.players set cash = cash + floor(price * 0.95) where id = sel.id;
  update game.players set company_id = null, company_wage = 0, company_joined = null, company_shifts = 0 where id = sel.id and company_id = cid;
  update game.companies set owner = b.id, sale_price = null, listed_at = null where id = cid;
  delete from game.company_offers where company_id = cid;
  delete from game.company_offers where buyer = b.id;
  delete from game.company_apps where player_id = b.id;
  insert into game.company_sales(company_id, name, type, stars, seller, buyer, price) values (cid, c.name, c.type, st, sel.id, b.id, price);
  perform game.company_note(cid, format('%s sold the company to %s for %s.', sel.name, b.name, game.fmt(price)));
  perform game.notify(sel.id, 'company', format('You sold %s to %s for %s. After the 5%% broker''s fee you got %s.', c.name, b.name, game.fmt(price), game.fmt(floor(price * 0.95))));
  perform game.notify(b.id, 'company', format('%s is yours. The staff and the %s in the bank come with it.', c.name, game.fmt(c.funds)));
  for m in select id from game.players where company_id = cid and id <> b.id loop perform game.notify(m.id, 'company', format('%s has a new owner: %s.', c.name, b.name)); end loop;
  perform game.track(b.id, 'company', 1);
  if price >= 1000000 then
    insert into game.messages(player_id, name, body) values (null, 'The Bugle', format('Business news: %s has bought %s from %s for %s.', b.name, c.name, sel.name, game.fmt(price)));
  end if;
end $$;

create or replace function public.company_sell(p_price bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies;
begin
  p := game.me(); perform game.need_still(p);
  select * into c from game.companies where owner = p.id for update;
  if not found then raise exception 'You don''t own a company.'; end if;
  if p_price is null then
    update game.companies set sale_price = null, listed_at = null where id = c.id;
    perform game.company_note(c.id, format('%s took the company off the market.', p.name));
    return jsonb_build_object('listed', false);
  end if;
  if p_price < 1000 or p_price > 100000000000 then raise exception 'Pick an asking price between $1,000 and $100 billion.'; end if;
  update game.companies set sale_price = p_price, listed_at = coalesce(listed_at, now()) where id = c.id;
  perform game.company_note(c.id, format('%s put the company up for sale at %s.', p.name, game.fmt(p_price)));
  perform game.notify(x.id, 'company', format('%s is up for sale. If someone buys it, they''ll be your new boss.', c.name)) from game.players x where x.company_id = c.id and x.id <> p.id;
  return jsonb_build_object('listed', true, 'price', p_price);
end $$;

create or replace function public.company_buy(p_id bigint, p_price bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies;
begin
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
  select * into c from game.companies where id = p_id for update;
  if not found then raise exception 'That company has closed down.'; end if;
  if c.sale_price is null then raise exception 'It''s not for sale. You could make an offer.'; end if;
  -- The price you saw has to match, so a last-second price rise can't catch you out.
  if c.sale_price <> p_price then raise exception 'The asking price just changed to %. Have another look.', game.fmt(c.sale_price); end if;
  perform game.company_transfer(c.id, p.id, c.sale_price);
  return jsonb_build_object('bought', c.id, 'price', c.sale_price);
end $$;

create or replace function public.company_offer(p_id bigint, p_amount bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.companies; t game.company_types;
begin
  p := game.me(); perform game.need_still(p);
  select * into c from game.companies where id = p_id;
  if not found then raise exception 'That company has closed down.'; end if;
  select * into t from game.company_types where id = c.type;
  if c.owner = p.id then raise exception 'That''s your company.'; end if;
  if p.level < t.lvl then raise exception 'You need level % to own one of these.', t.lvl; end if;
  if coalesce(p_amount, 0) < 1000 then raise exception 'Offers start at $1,000.'; end if;
  if p_amount > p.cash then raise exception 'You''d need % on you for that offer to stand.', game.fmt(p_amount); end if;
  insert into game.company_offers(company_id, buyer, amount) values (c.id, p.id, p_amount)
    on conflict (company_id, buyer) do update set amount = excluded.amount, at = now();
  perform game.notify(c.owner, 'company', format('%s offered %s for %s.', p.name, game.fmt(p_amount), c.name));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_offer_cancel(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me(); delete from game.company_offers where company_id = p_id and buyer = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.company_offer_decide(p_offer bigint, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; o game.company_offers; c game.companies;
begin
  p := game.me(); perform game.need_still(p);
  select * into o from game.company_offers where id = p_offer;
  if not found then raise exception 'That offer has been withdrawn.'; end if;
  select * into c from game.companies where id = o.company_id;
  if c.owner <> p.id then raise exception 'That''s not your company.'; end if;
  if not p_accept then
    delete from game.company_offers where id = o.id;
    perform game.notify(o.buyer, 'company', format('%s turned down your offer for %s.', p.name, c.name));
    return jsonb_build_object('ok', true);
  end if;
  perform game.company_transfer(c.id, o.buyer, o.amount);
  return jsonb_build_object('sold', true, 'price', o.amount);
end $$;

-- =====================================================================
-- THE ARMOURY, LOADOUTS AND TURN-BY-TURN FIGHTS
-- =====================================================================

-- How much you can carry (kg): more strength, more kit.
create or replace function game.carry_limit(p game.players) returns numeric language sql stable as $$
  select round((12 + sqrt(greatest(0, p.str)) + game.hperk(p.id, 'carry'))::numeric, 1) $$;

-- Total weight of everything in your loadout (each throwable counts).
create or replace function game.loadout_weight(lo jsonb) returns numeric language sql stable as $$
  select coalesce((select sum(a.weight) from jsonb_each_text(lo - 'throw') e join game.arms a on a.item_id = e.value), 0)
       + coalesce((select sum(a.weight) from jsonb_array_elements_text(coalesce(lo->'throw', '[]')) t join game.arms a on a.item_id = t), 0) $$;

-- Keep the old single weapon/armour columns (used for overall fight power) in step with the loadout.
create or replace function game.loadout_sync(pid uuid) returns void language sql as $$
  update game.players p set
    weapon = (select a.item_id from game.arms a join game.items i on i.id = a.item_id
              where a.item_id in (p.loadout->>'melee', p.loadout->>'sidearm', p.loadout->>'long') order by i.fx desc limit 1),
    armour = p.loadout->>'body'
  where p.id = pid $$;

-- Drop anything from the loadout you no longer own (sold, pawned, thrown).
create or replace function game.loadout_clean(pid uuid) returns void language plpgsql as $$
declare lo jsonb; k text; th jsonb := '[]'; x text; owned int;
begin
  select loadout into lo from game.players where id = pid;
  if lo is null or lo = '{}'::jsonb then return; end if;
  for k in select jsonb_object_keys(lo - 'throw') loop
    if not exists (select 1 from game.inventory where player_id = pid and item_id = lo->>k and qty > 0) then lo := lo - k; end if;
  end loop;
  for x in select jsonb_array_elements_text(coalesce(lo->'throw', '[]')) loop
    select coalesce(qty, 0) into owned from game.inventory where player_id = pid and item_id = x;
    if coalesce(owned, 0) > (select count(*) from jsonb_array_elements_text(th) t where t = x) then th := th || to_jsonb(x); end if;
  end loop;
  lo := jsonb_set(lo, '{throw}', th);
  update game.players set loadout = lo where id = pid;
  perform game.loadout_sync(pid);
end $$;

-- Put an item into its slot (or take it out, if it's already there). Throwables stack up to three.
create or replace function game.loadout_put(pid uuid, iid text, remove boolean default false) returns jsonb language plpgsql as $$
declare p game.players; a game.arms; lo jsonb; th jsonb; owned int; w numeric; lim numeric; was text;
begin
  select * into p from game.players where id = pid for update;
  select * into a from game.arms where item_id = iid;
  if not found or a.slot = 'ammo' then raise exception 'That isn''t something you can carry into a fight.'; end if;
  select coalesce(qty, 0) into owned from game.inventory where player_id = pid and item_id = iid;
  if coalesce(owned, 0) < 1 then raise exception 'You don''t have one.'; end if;
  lo := coalesce(p.loadout, '{}'::jsonb);
  if a.slot = 'throw' then
    th := coalesce(lo->'throw', '[]');
    if remove then
      lo := jsonb_set(lo, '{throw}', coalesce((select jsonb_agg(x order by o) from jsonb_array_elements_text(th) with ordinality t(x, o)
             where o <> (select min(o2) from jsonb_array_elements_text(th) with ordinality u(x2, o2) where x2 = iid)), '[]'));
    else
      if jsonb_array_length(th) >= 3 then raise exception 'You can only carry three throwables.'; end if;
      if (select count(*) from jsonb_array_elements_text(th) t where t = iid) >= owned then raise exception 'You don''t have any more of those.'; end if;
      lo := jsonb_set(lo, '{throw}', th || to_jsonb(iid));
    end if;
  else
    was := lo->>a.slot;
    if remove or was = iid then lo := lo - a.slot; else lo := jsonb_set(lo, array[a.slot], to_jsonb(iid)); end if;
  end if;
  w := game.loadout_weight(lo); lim := game.carry_limit(p);
  if w > lim and not remove and coalesce(was, '') <> iid then
    raise exception 'That would take you to % kg. You can carry % kg. Train strength to carry more.', round(w, 1), lim; end if;
  update game.players set loadout = lo where id = pid;
  perform game.loadout_sync(pid);
  return jsonb_build_object('loadout', lo, 'weight', w, 'limit', lim);
end $$;

create or replace function public.loadout_set(p_item text, p_remove boolean default false) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me(); perform game.need_still(p);
  if exists (select 1 from game.fights where attacker = p.id and status = 'on') then raise exception 'Not mid-fight.'; end if;
  return game.loadout_put(p.id, p_item, coalesce(p_remove, false));
end $$;

create or replace function public.armoury() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  perform game.loadout_clean(p.id);
  select * into p from game.players where id = p.id;
  return jsonb_build_object('loadout', p.loadout, 'weight', game.loadout_weight(p.loadout), 'limit', game.carry_limit(p), 'level', p.level,
    'arms', (select jsonb_agg(to_jsonb(a) || jsonb_build_object('owned', coalesce((select qty from game.inventory v where v.player_id = p.id and v.item_id = a.item_id), 0))
             order by a.slot, coalesce(a.price, 0), a.dmg, a.def)
             from game.arms a where a.price is not null or exists (select 1 from game.inventory v where v.player_id = p.id and v.item_id = a.item_id and v.qty > 0)));
end $$;

create or replace function public.arms_buy(p_item text, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; a game.arms; q int := greatest(1, least(coalesce(p_qty, 1), 100)); cost bigint; units int;
begin
  p := game.me(); perform game.need_still(p);
  select * into a from game.arms where item_id = p_item and price is not null;
  if not found then raise exception 'The armoury doesn''t sell that.'; end if;
  if p.level < a.lvl then raise exception 'You need level % to buy that.', a.lvl; end if;
  -- Trade skill and an armoury discount from your company stack, up to 60% off.
  cost := round(a.price * q * (1 - least(0.6, least(0.15, (game.skill_lvl(p.skills, 'trade') - 1) * 0.005) + game.hperk(p.id, 'arms'))));
  if p.cash < cost then raise exception 'That''s %. You have % on you.', game.fmt(cost), game.fmt(p.cash); end if;
  units := q * coalesce(a.box, 1);
  update game.players set cash = cash - cost where id = p.id;
  perform game.give(p.id, a.item_id, units);
  return jsonb_build_object('item', a.item_id, 'qty', units, 'cost', cost);
end $$;

-- ---------- fights ----------
-- Whether p may attack t right now; returns the war between them, if any.
create or replace function game.pvp_check(p game.players, t game.players) returns game.wars language plpgsql as $$
declare w game.wars;
begin
  if t.id = p.id then raise exception 'You can''t attack yourself.'; end if;
  if t.is_staff then raise exception '% runs the game and can''t be attacked.', t.name; end if;
  if p.is_staff then raise exception 'Staff accounts don''t attack players.'; end if;
  if p.level < 3 then raise exception 'You need level 3 before you can attack other players.'; end if;
  if game.status(t) <> 'ok' then raise exception '% isn''t around right now.', t.name; end if;
  w := game.war_between(p.crew_id, t.crew_id);
  if t.district <> p.district and w.id is null then raise exception '% is in another district.', t.name; end if;
  if p.crew_id is not null and t.crew_id = p.crew_id then raise exception '% is in your crew.', t.name; end if;
  if t.level < 3 or t.created_at > now() - interval '1 day' then raise exception '% is new to the city. Leave them be for now.', t.name; end if;
  if p.stamina < 25 then raise exception 'You need 25 stamina to start a fight.'; end if;
  if p.health < p.max_health * 0.3 then raise exception 'You''re too beaten up. Heal first.'; end if;
  if exists (select 1 from game.attacks where attacker = p.id and defender = t.id
             and at > now() - case when w.id is not null then interval '3 minutes' else interval '10 minutes' end) then
    raise exception 'You hit % recently. Give it % minutes.', t.name, case when w.id is not null then 'three' else 'ten' end; end if;
  if exists (select 1 from game.fights where defender = t.id and status = 'on') then raise exception '% is already in a fight.', t.name; end if;
  return w;
end $$;

-- One swing or shot. Accuracy leans on dexterity against speed; damage on strength against defence.
-- Where it lands matters: head shots hurt most, and armour on that spot soaks up its share.
create or replace function game.strike(a game.players, d game.players, w game.arms, blind boolean, dodge numeric) returns jsonb language plpgsql as $$
declare ch numeric; r numeric; loc text; m numeric; dm numeric; arm numeric;
begin
  ch := least(95, greatest(5, w.acc * least(1.4, greatest(0.6, sqrt((a.dex + 1) / (d.spd + 1)))) * case when blind then 0.6 else 1 end * dodge));
  if random() * 100 >= ch then return jsonb_build_object('hit', false); end if;
  r := random();
  loc := case when r < 0.15 then 'head' when r < 0.6 then 'body' when r < 0.7 then 'hands' when r < 0.9 then 'legs' else 'feet' end;
  m := case loc when 'head' then 1.4 when 'body' then 1 when 'hands' then 0.7 when 'legs' then 0.9 else 0.7 end;
  select ar.def into arm from game.arms ar where ar.item_id = d.loadout->>loc
    and exists (select 1 from game.inventory v where v.player_id = d.id and v.item_id = ar.item_id and v.qty > 0);
  dm := round((w.dmg * least(1.6, greatest(0.6, sqrt((a.str + 1) / (d.def + 1)))) * (0.85 + random() * 0.3) * m * (1 - coalesce(arm, 0) / 100.0))::numeric, 1);
  return jsonb_build_object('hit', true, 'dmg', greatest(1, dm), 'loc', loc, 'armour', coalesce(arm, 0) > 0);
end $$;

create or replace function game.fists() returns game.arms language sql immutable as $$
  select row('fists', 'melee', 6, 85, 1, null, 0, null, null, 1, null, null)::game.arms $$;

-- The equipped weapon in a slot, if you still own it.
create or replace function game.weapon_in(p game.players, p_slot text) returns game.arms language sql stable as $$
  select a.* from game.arms a where a.item_id = p.loadout->>p_slot and a.slot = p_slot
    and exists (select 1 from game.inventory v where v.player_id = p.id and v.item_id = a.item_id and v.qty > 0) $$;

-- What the computer does for a defender (or for a quick attack): the best weapon it can fire, sometimes a throwable first.
create or replace function game.fight_ai(p game.players, first boolean) returns text language plpgsql as $$
declare best text := 'fists'; bestv numeric := 6 * 0.85; s text; w game.arms; v numeric; th text;
begin
  th := p.loadout->'throw'->>0;
  if first and th is not null and random() < 0.4 then return 'throw:' || th; end if;
  foreach s in array array['melee', 'sidearm', 'long'] loop
    w := game.weapon_in(p, s);
    if w.item_id is null then continue; end if;
    if w.ammo is not null and coalesce((select qty from game.inventory where player_id = p.id and item_id = w.ammo), 0) < 1 then continue; end if;
    v := w.dmg * w.acc / 100.0 * coalesce(w.shots, 1);
    if v > bestv then bestv := v; best := s; end if;
  end loop;
  return best;
end $$;

-- One side's move. Applies damage and effects to the fight row and returns what happened.
create or replace function game.fight_act(fid bigint, side text, act text) returns jsonb language plpgsql as $$
declare f game.fights; me game.players; op game.players; w game.arms; other text := case side when 'a' then 'd' else 'a' end;
  myfx jsonb; opfx jsonb; s jsonb; n int := 1; i int; have int; total numeric := 0; hits int := 0; locs text[] := '{}'; th jsonb; itm text; burn numeric := 0; line jsonb;
begin
  select * into f from game.fights where id = fid for update;
  select * into me from game.players where id = case side when 'a' then f.attacker else f.defender end;
  select * into op from game.players where id = case side when 'a' then f.defender else f.attacker end;
  myfx := coalesce(f.fx->side, '{}'); opfx := coalesce(f.fx->other, '{}');
  -- Burning hurts at the start of your turn.
  if coalesce((myfx->>'burn')::int, 0) > 0 then
    burn := 7; myfx := jsonb_set(myfx, '{burn}', to_jsonb((myfx->>'burn')::int - 1));
    if side = 'a' then f.a_hp := f.a_hp - burn; else f.d_hp := f.d_hp - burn; end if;
  end if;
  if coalesce((myfx->>'stun')::int, 0) > 0 then
    myfx := myfx - 'stun';
    line := jsonb_build_object('side', side, 'stunned', true, 'burn', burn);
  elsif act like 'flee%' then
    line := jsonb_build_object('side', side, 'flee', true, 'escaped', act = 'flee:ok', 'burn', burn);
  else
    if act like 'throw:%' then
      itm := substr(act, 7);
      th := coalesce(me.loadout->'throw', '[]');
      if not exists (select 1 from jsonb_array_elements_text(th) t where t = itm) then raise exception 'You''re not carrying one of those.'; end if;
      select * into w from game.arms where item_id = itm;
      perform game.take(me.id, itm, 1);   -- also drops it from the loadout
    elsif act in ('melee', 'sidearm', 'long') then
      w := game.weapon_in(me, act);
      if w.item_id is null then raise exception 'Nothing in that slot.'; end if;
      if w.ammo is not null then
        have := coalesce((select qty from game.inventory where player_id = me.id and item_id = w.ammo), 0);
        if have < 1 then raise exception 'Out of ammo for that.'; end if;
        n := least(coalesce(w.shots, 1), have);
        perform game.take(me.id, w.ammo, n);
      else n := coalesce(w.shots, 1); end if;
    else
      w := game.fists();
    end if;
    for i in 1..n loop
      if w.effect = 'smoke' then exit; end if;
      s := game.strike(me, op, w, coalesce((myfx->>'blind')::int, 0) > 0, case when coalesce((opfx->>'smoke')::int, 0) > 0 then 0.35 else 1 end);
      if (s->>'hit')::boolean then
        hits := hits + 1; total := total + (s->>'dmg')::numeric; locs := locs || (s->>'loc');
      end if;
    end loop;
    if w.effect = 'smoke' then myfx := jsonb_set(myfx, '{smoke}', '2');
    elsif hits > 0 and w.effect = 'stun' and (w.item_id <> 'fists' and (w.slot = 'throw' or random() < 0.25)) then opfx := jsonb_set(opfx, '{stun}', '1');
    elsif hits > 0 and w.effect = 'blind' then opfx := jsonb_set(opfx, '{blind}', '2');
    elsif hits > 0 and w.effect = 'burn' then opfx := jsonb_set(opfx, '{burn}', '2');
    end if;
    if coalesce((opfx->>'smoke')::int, 0) > 0 then opfx := jsonb_set(opfx, '{smoke}', to_jsonb((opfx->>'smoke')::int - 1)); end if;
    if side = 'a' then f.d_hp := f.d_hp - total; else f.a_hp := f.a_hp - total; end if;
    line := jsonb_build_object('side', side, 'weapon', w.item_id, 'shots', n, 'hits', hits, 'dmg', total, 'locs', to_jsonb(locs), 'effect', w.effect, 'burn', burn);
  end if;
  if coalesce((myfx->>'blind')::int, 0) > 0 then myfx := jsonb_set(myfx, '{blind}', to_jsonb((myfx->>'blind')::int - 1)); end if;
  update game.fights set a_hp = f.a_hp, d_hp = f.d_hp, fx = jsonb_build_object(side, myfx, other, opfx), log = log || jsonb_build_array(line) where id = fid;
  return line;
end $$;

-- Rewards and consequences once a fight is decided.
create or replace function game.fight_end(fid bigint, outcome text) returns void language plpgsql as $$
declare f game.fights; p game.players; t game.players; mug bigint := 0; secs int := 0; xp int := 0; wp numeric; w game.wars; res jsonb;
begin
  select * into f from game.fights where id = fid for update;
  if f.status <> 'on' then return; end if;
  select * into p from game.players where id = f.attacker for update;
  select * into t from game.players where id = f.defender for update;
  select * into w from game.wars where id = f.war_id and status = 'active';
  if outcome = 'win' then
    mug := floor(t.cash * (0.05 + random() * 0.05) * (1 - game.hperk(t.id, 'mug')));
    secs := round((300 + floor(random() * 600)) * (1 - game.hperk(t.id, 'hosp')))::int;
    update game.players set cash = cash - mug, losses = losses + 1, health = 1,
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Mugged by ' || p.name where id = t.id;
    update game.players set cash = cash + mug, wins = wins + 1, health = greatest(1, round(f.a_hp)) where id = p.id;
    xp := 10 + t.level * 5;
    perform game.gain_xp(p.id, xp); perform game.add_skill(p.id, 'fight', xp);
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, true, mug);
    perform game.notify(t.id, 'attacked', format('%s attacked you and took %s. You''re in A&E.', p.name, game.fmt(mug)));
    if p.crew_id is not null then
      update game.crews set respect = respect + 1 + t.level / 4 where id = p.crew_id;
      perform game.turf_add(p.id, p.district, case when t.crew_id is not null then 10 else 4 end);
    end if;
    perform game.track(p.id, 'fight_win', 1);
    if w.id is not null then
      wp := round(3 + t.level / 3.0, 1);
      insert into game.war_hits(war_id, crew_id, player_id, target, pts, cash) values (w.id, p.crew_id, p.id, t.id, wp, mug);
      update game.wars set a_score = a_score + case when attacker = p.crew_id then wp else 0 end, d_score = d_score + case when defender = p.crew_id then wp else 0 end where id = w.id;
      perform game.track(p.id, 'war_hit', 1);
    end if;
    res := jsonb_build_object('won', true, 'cash', mug, 'xp', xp, 'name', t.name, 'secs', secs, 'war_pts', wp);
  elsif outcome = 'loss' then
    secs := round((180 + floor(random() * 300)) * (1 - game.hperk(p.id, 'hosp')))::int;
    update game.players set losses = losses + 1, health = 1,
      hosp_until = now() + make_interval(secs => secs), hosp_reason = 'Beaten by ' || t.name where id = p.id;
    update game.players set wins = wins + 1, health = greatest(1, round(f.d_hp)) where id = t.id;
    perform game.gain_xp(t.id, 5); perform game.add_skill(t.id, 'fight', 5); perform game.add_skill(p.id, 'fight', 3);
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, false, 0);
    perform game.notify(t.id, 'defended', format('%s tried to attack you and lost.', p.name));
    if w.id is not null then
      insert into game.war_hits(war_id, crew_id, player_id, target, pts) values (w.id, t.crew_id, t.id, p.id, 1);
      update game.wars set a_score = a_score + case when attacker = t.crew_id then 1 else 0 end, d_score = d_score + case when defender = t.crew_id then 1 else 0 end where id = w.id;
    end if;
    res := jsonb_build_object('won', false, 'name', t.name, 'secs', secs);
  else
    -- A draw, or you ran: both walk away with the damage they took.
    update game.players set health = greatest(1, round(f.a_hp)) where id = p.id;
    update game.players set health = greatest(1, round(f.d_hp)) where id = t.id;
    insert into game.attacks(attacker, defender, attacker_won, cash) values (p.id, t.id, false, 0);
    perform game.notify(t.id, 'defended', case when outcome = 'fled' then format('%s attacked you, then ran for it.', p.name) else format('You and %s fought to a standstill.', p.name) end);
    res := jsonb_build_object('won', false, 'draw', true, 'fled', outcome = 'fled', 'name', t.name);
  end if;
  update game.fights set status = outcome, ended_at = now(), result = res where id = fid;
end $$;

-- Close fights left hanging for more than ten minutes (the attacker walked off).
create or replace function game.fights_tick() returns void language plpgsql as $$
declare f record;
begin
  for f in select id from game.fights where status = 'on' and updated_at < now() - interval '10 minutes' for update skip locked loop
    perform game.fight_end(f.id, 'fled');
  end loop;
end $$;

create or replace function game.fight_view(fid bigint) returns jsonb language plpgsql as $$
declare f game.fights; p game.players; t game.players; acts jsonb := '[]'; s text; w game.arms; ammo int;
begin
  select * into f from game.fights where id = fid;
  select * into p from game.players where id = f.attacker;
  select * into t from game.players where id = f.defender;
  foreach s in array array['melee', 'sidearm', 'long'] loop
    w := game.weapon_in(p, s);
    if w.item_id is not null then
      ammo := case when w.ammo is null then null else coalesce((select qty from game.inventory where player_id = p.id and item_id = w.ammo), 0) end;
      acts := acts || jsonb_build_object('act', s, 'item', w.item_id, 'dmg', w.dmg, 'acc', w.acc, 'shots', coalesce(w.shots, 1), 'ammo', ammo, 'ammo_item', w.ammo, 'effect', w.effect);
    end if;
  end loop;
  acts := acts || coalesce((select jsonb_agg(jsonb_build_object('act', 'throw:' || x, 'item', x, 'dmg', a.dmg, 'acc', a.acc, 'effect', a.effect, 'count', c))
            from (select x, count(*) c from jsonb_array_elements_text(coalesce(p.loadout->'throw', '[]')) x group by x) z join game.arms a on a.item_id = z.x), '[]');
  return jsonb_build_object('id', f.id, 'status', f.status, 'turn', f.turn, 'max_turns', 25, 'log', f.log, 'result', f.result, 'fx', f.fx, 'war', f.war_id is not null,
    'me', game.card(p) || jsonb_build_object('hp', greatest(0, round(f.a_hp, 1)), 'max', f.a_max, 'loadout', p.loadout),
    'them', game.card(t) || jsonb_build_object('hp', greatest(0, round(f.d_hp, 1)), 'max', f.d_max, 'loadout', t.loadout,
       'power_hint', case when game.power(t) > game.power(p) * 1.5 then 'much stronger' when game.power(t) > game.power(p) * 1.1 then 'stronger'
         when game.power(t) < game.power(p) * 0.66 then 'much weaker' when game.power(t) < game.power(p) * 0.9 then 'weaker' else 'even' end),
    'actions', acts);
end $$;

create or replace function public.fight_start(p_target uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t game.players; w game.wars; fid bigint;
begin
  perform game.wars_tick(); perform game.fights_tick();
  p := game.me(); perform game.need_free(p);
  select id into fid from game.fights where attacker = p.id and status = 'on';
  if fid is not null then return game.fight_view(fid); end if;
  perform game.loadout_clean(p.id); perform game.loadout_clean(p_target);
  select * into p from game.players where id = p.id;
  select * into t from game.players where id = p_target for update;
  if not found then raise exception 'Nobody by that name.'; end if;
  w := game.pvp_check(p, t);
  update game.players set stamina = stamina - 25, heat = least(100, heat + 5) where id = p.id;
  insert into game.fights(attacker, defender, a_hp, d_hp, a_max, d_max, war_id)
    values (p.id, t.id, p.health, t.health, p.max_health, t.max_health, w.id) returning id into fid;
  return game.fight_view(fid);
end $$;

create or replace function public.fight_turn(p_fight bigint, p_action text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; f game.fights; t game.players; ok boolean;
begin
  p := game.me();
  select * into f from game.fights where id = p_fight for update;
  if not found or f.attacker <> p.id then raise exception 'That isn''t your fight.'; end if;
  if f.status <> 'on' then return game.fight_view(f.id); end if;
  if p_action = 'flee' then
    -- Running works half the time, always if you're hidden in smoke.
    ok := (random() < 0.5 or coalesce((f.fx->'a'->>'smoke')::int, 0) > 0) and coalesce((f.fx->'a'->>'stun')::int, 0) = 0;
    perform game.fight_act(f.id, 'a', case when ok then 'flee:ok' else 'flee:no' end);
    select * into f from game.fights where id = p_fight;
    if f.a_hp <= 0 then perform game.fight_end(f.id, 'loss'); return game.fight_view(f.id); end if;
    if ok then perform game.fight_end(f.id, 'fled'); return game.fight_view(f.id); end if;
  else
    perform game.fight_act(f.id, 'a', p_action);
    select * into f from game.fights where id = p_fight;
    if f.d_hp <= 0 then perform game.fight_end(f.id, 'win'); return game.fight_view(f.id); end if;
    if f.a_hp <= 0 then perform game.fight_end(f.id, 'loss'); return game.fight_view(f.id); end if;
  end if;
  select * into t from game.players where id = f.defender;
  perform game.fight_act(f.id, 'd', game.fight_ai(t, f.turn = 0));
  select * into f from game.fights where id = p_fight;
  if f.a_hp <= 0 then perform game.fight_end(f.id, 'loss'); return game.fight_view(f.id); end if;
  if f.d_hp <= 0 then perform game.fight_end(f.id, 'win'); return game.fight_view(f.id); end if;
  update game.fights set turn = turn + 1, updated_at = now() where id = f.id returning * into f;
  if f.turn >= 25 then perform game.fight_end(f.id, 'draw'); end if;
  return game.fight_view(f.id);
end $$;

create or replace function public.fight_get(p_fight bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  perform game.fights_tick();
  p := game.me();
  if not exists (select 1 from game.fights where id = p_fight and attacker = p.id) then raise exception 'That isn''t your fight.'; end if;
  return game.fight_view(p_fight);
end $$;

-- A quick attack: the computer picks your moves too. Same rules, same rewards.
create or replace function public.attack(p_target uuid) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare v jsonb; fid bigint; p game.players; i int := 0;
begin
  v := public.fight_start(p_target); fid := (v->>'id')::bigint;
  while (select status from game.fights where id = fid) = 'on' and i < 30 loop
    select * into p from game.players where id = (select attacker from game.fights where id = fid);
    v := public.fight_turn(fid, game.fight_ai(p, false)); i := i + 1;
  end loop;
  return (select result || jsonb_build_object('fight', fid, 'turns', turn + 1) from game.fights where id = fid);
end $$;

-- =====================================================================
-- TRAVELLING THE COUNTRY, AND THE WORLD
-- =====================================================================
-- Real minutes per hour on the road (02_content.sql sets it from MINUTES_PER_HOUR in src/game/travel.js).
create or replace function game.travel_scale() returns numeric language sql immutable as $$ select 20::numeric $$;

-- Straight-line distance between two places in km.
create or replace function game.km(a game.cities, b game.cities) returns numeric language sql immutable as $$
  select round((2 * 6371 * asin(least(1, sqrt(power(sin(radians(b.lat - a.lat) / 2), 2)
         + cos(radians(a.lat)) * cos(radians(b.lat)) * power(sin(radians(b.lon - a.lon) / 2), 2)))))::numeric, 1) $$;

-- A place, as seen by this player. Greyhaven is the same city for everyone, but it sits inside your own country on your map.
create or replace function game.place(p game.players, cid text) returns game.cities language plpgsql stable as $$
declare c game.cities; k game.countries;
begin
  select * into c from game.cities where id = cid;
  if c.id = 'home' then
    select * into k from game.countries where iso = p.country;
    if found then c.lat := k.home_lat; c.lon := k.home_lon; c.island := k.home_part; end if;
    c.country := p.country;
  end if;
  return c;
end $$;

-- Whether you're carrying anything customs would take an interest in.
create or replace function game.contraband(pid uuid) returns int language sql stable as $$
  select coalesce(sum(v.qty), 0)::int from game.inventory v join game.items i on i.id = v.item_id where v.player_id = pid and i.cat = 'contraband' $$;

-- One way of getting from here to there: how long it takes, what it costs, how much you can carry, and whether you can.
-- Returns null when that way doesn't go there at all (you can't take the coach to another country).
create or replace function game.trip_option(p game.players, here game.cities, dest game.cities, m game.travel_modes) returns jsonb language plpgsql stable as $$
declare s jsonb := m.spec; nm text := m.name; v game.vehicles; air boolean; sea boolean; road boolean; intl boolean; strait boolean;
  dist numeric; kph numeric; hrs numeric; cost numeric; cap int; why text := null; ferry numeric := 0; g text[] := coalesce(p.travel_gear, '{}'); km numeric := game.km(here, dest);
  scope text; vid text := null; customs int := null;
begin
  if (s->>'own')::boolean then
    select * into v from game.vehicles where id = p.vehicle;
    if v.id is null or v.travel is null then return null; end if;
    vid := v.id;
    s := v.travel || jsonb_build_object('ferry', case when v.id in ('bike', 'scooter', 'moped') then 'foot' else 'vehicle' end, 'road', not coalesce((v.travel->>'air')::boolean, false) and not coalesce((v.travel->>'sea')::boolean, false));
    nm := 'Your ' || regexp_replace(v.name, '^(A|An) ', '');
  end if;
  intl := coalesce(here.country, p.country) <> coalesce(dest.country, p.country);
  scope := coalesce(s->>'scope', 'dom');
  if (intl and scope = 'dom') or (not intl and scope = 'intl') then return null; end if;
  air := coalesce((s->>'air')::boolean, false); sea := coalesce((s->>'sea')::boolean, false); road := not air and not sea;
  strait := not intl and here.island <> dest.island;
  dist := case when air then km when sea then km * 1.5 else km * 1.3 end;
  kph := (s->>'kph')::numeric;
  if m.id = 'walk' and 'boots' = any(g) then kph := kph * 1.4; end if;
  if m.id = 'hitch' and 'sign' = any(g) then kph := kph * 1.25; end if;
  hrs := dist / kph + coalesce((s->>'wait')::numeric, 0) * case when m.id in ('flight', 'intl') and 'airpoints' = any(g) then 0.5 else 1 end;
  if strait and road then
    -- Another island: the ferry, or a few hours on a boat.
    hrs := hrs + greatest(3.5, km * 0.004);
    ferry := case s->>'ferry' when 'vehicle' then 250 when 'foot' then 75 else 0 end;
  end if;
  cost := coalesce((s->>'base')::numeric, 0) + coalesce((s->>'km')::numeric, (s->>'fuel')::numeric, 0) * dist;
  if (m.id = 'bus' and 'buspass' = any(g)) or (m.id = 'train' and 'railpass' = any(g)) then cost := 0; end if;
  if m.id in ('flight', 'intl') and 'airpoints' = any(g) then cost := cost * 0.7; end if;
  cost := round(cost + ferry);
  cap := (s->>'cap')::int
    + case when m.id in ('walk', 'hitch', 'bus', 'bikehire') and 'pack' = any(g) then 6 else 0 end
    + case when (m.id in ('rental', 'campervan') or ((s->>'road')::boolean and m.id = 'own')) and 'roofbox' = any(g) then 10 else 0 end
    + case when m.id in ('flight', 'intl') and 'airpoints' = any(g) then 6 else 0 end;
  if intl then customs := coalesce(case m.id when 'intl' then 25 when 'cargo' then 20 when 'charter' then 10 end, case vid when 'jet' then 5 when 'seaplane' then 8 when 'sub' then 2 end, 15); end if;
  if p.level < coalesce((s->>'lvl')::int, 1) then why := format('From level %s.', s->>'lvl');
  elsif s->>'needs' = 'rail' and not (here.rail and dest.rail) then why := 'No train line between these two.';
  elsif s->>'needs' = 'rail' and strait then why := 'No train across the water.';
  elsif s->>'needs' = 'air' and not (here.air and dest.air) then why := 'No airport at one end.';
  elsif (s->>'range') is not null and dist > (s->>'range')::numeric then why := format('Out of range (%s km).', s->>'range');
  elsif p.bag > cap then why := format('You''re carrying %s things. This only fits %s.', p.bag, cap);
  elsif p.cash < cost then why := 'You can''t afford it.';
  end if;
  return jsonb_build_object('mode', m.id, 'name', nm, 'ok', why is null, 'why', why, 'minutes', greatest(1, round(hrs * game.travel_scale())), 'cost', cost, 'cap', cap,
    'ferry', strait and road, 'km', round(dist), 'blurb', coalesce(case when (m.spec->>'own')::boolean then v.blurb end, s->>'blurb'), 'intl', intl, 'customs', customs,
    'risk', case when m.id in ('stow', 'cargo') then case when m.id = 'stow' and 'manifest' = any(g) then 5 when m.id = 'cargo' then 20 else 20 end when m.id = 'hitch' then -1 end);
end $$;

create or replace function game.trip_options(p game.players, here game.cities, dest game.cities) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(o order by (o->>'minutes')::int), '[]') from (select game.trip_option(p, here, dest, m) o from game.travel_modes m) z where o is not null $$;

create or replace function game.city_restock(c text) returns void language sql as $$
  update game.city_shop s set stock = least(s.max_stock, s.stock + x.n),
    stocked_at = case when s.stock + x.n >= s.max_stock then now() else s.stocked_at + make_interval(mins => x.n * s.restock_mins) end
  from (select item_id, floor(extract(epoch from now() - stocked_at) / 60 / restock_mins)::int n from game.city_shop where city = c) x
  where s.city = c and s.item_id = x.item_id and x.n > 0 $$;

-- Everything the travel page needs: where you are, the towns in this country with every way to reach them, and every other country.
create or replace function public.travel_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; here game.cities; onroad boolean; ctry text; hubs jsonb;
begin
  p := game.me();
  here := game.place(p, p.city);
  ctry := coalesce(here.country, p.country);
  onroad := p.trip_until > now();
  return jsonb_build_object('city', p.city, 'country', ctry, 'country_name', (select name from game.countries where iso = ctry), 'home_country', p.country,
    'home_name', (select name from game.cities where id = 'home'),
    'trip', p.trip, 'trip_until', p.trip_until, 'on_road', onroad, 'bag', p.bag, 'contraband', game.contraband(p.id), 'bribes', jsonb_build_array(0, game.bribe_cost(p.id, 1), game.bribe_cost(p.id, 2)),
    'cap', coalesce((p.trip->>'cap')::int, 0), 'blocked', case when p.jail_until > now() then 'You''re in the cells.' when p.hosp_until > now() then 'You''re in A&E.'
      when p.travel_until > now() then 'You''re still in the taxi.' when onroad then null
      when exists (select 1 from game.fights where attacker = p.id and status = 'on') then 'You''re in the middle of a fight.' end,
    'gear', (select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'price', g.price, 'lvl', g.lvl, 'blurb', g.blurb, 'owned', g.id = any(p.travel_gear)) order by g.sort) from game.travel_gear g),
    'cities', (select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'island', c.island, 'lat', c.lat, 'lon', c.lon, 'air', c.air, 'rail', c.rail, 'lvl', c.lvl, 'blurb', c.blurb,
        'km', round(game.km(here, c)), 'here', c.id = p.city,
        'options', case when c.id = p.city or onroad then '[]'::jsonb else game.trip_options(p, here, c) end,
        'goods', (select count(*) from game.city_shop s where s.city = c.id)) order by c.sort)
      from game.cities x cross join lateral game.place(p, x.id) c where x.country = ctry or (x.id = 'home' and p.country = ctry)),
    -- Abroad, your own country's way in is Greyhaven itself.
    'countries', (select jsonb_agg(jsonb_build_object('iso', k.iso, 'name', k.name, 'zone', k.zone, 'hub', h.id, 'hub_name', h.name,
        'km', round(game.km(here, h)), 'home', k.iso = p.country, 'here', k.iso = ctry) order by k.name)
      from game.countries k cross join lateral game.place(p, case when k.iso = p.country then 'home' else k.hub end) h));
end $$;

-- Every way to reach one place, anywhere in the world.
create or replace function public.travel_quote(p_city text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; dest game.cities;
begin
  p := game.me();
  dest := game.place(p, p_city);
  if dest.id is null then raise exception 'No such place.'; end if;
  return jsonb_build_object('city', dest.id, 'name', dest.name, 'country', dest.country, 'lvl', dest.lvl, 'blurb', dest.blurb,
    'options', case when dest.id = p.city or p.trip_until > now() then '[]'::jsonb else game.trip_options(p, game.place(p, p.city), dest) end);
end $$;

-- Customs bribes: a small one or a big one, paid up front, makes a search less likely. It never makes it impossible.
create or replace function game.bribe_cost(pid uuid, tier int) returns bigint language sql stable as $$
  select case tier when 1 then greatest(200, round(v * 0.12)) when 2 then greatest(500, round(v * 0.3)) else 0 end::bigint
  from (select coalesce(sum(x.qty * i.value), 0) v from game.inventory x join game.items i on i.id = x.item_id where x.player_id = pid and i.cat = 'contraband') z $$;
create or replace function game.bribe_odds(base int, tier int) returns int language sql immutable as $$
  select greatest(1, round(base * case tier when 1 then 0.5 when 2 then 0.2 else 1 end))::int $$;

drop function if exists public.travel_go(text, text);
create or replace function public.travel_go(p_city text, p_mode text, p_bribe int default 0) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; here game.cities; dest game.cities; m game.travel_modes; o jsonb; mins numeric; fine bigint; held int := 0; seized int := 0; seized_value bigint := 0;
  tier int := greatest(0, least(2, coalesce(p_bribe, 0))); bribe bigint := 0; odds int;
begin
  perform game.fights_tick();
  p := game.me();
  if p.jail_until > now() then raise exception 'You''re in the cells.'; end if;
  if p.hosp_until > now() then raise exception 'You''re in A&E.'; end if;
  if p.travel_until > now() then raise exception 'You''re still in the taxi.'; end if;
  if p.trip_until > now() then raise exception 'You''re already on the road.'; end if;
  if exists (select 1 from game.fights where attacker = p.id and status = 'on') then raise exception 'Finish your fight first.'; end if;
  dest := game.place(p, p_city);
  if dest.id is null then raise exception 'No such place.'; end if;
  if dest.id = p.city then raise exception 'You''re already here.'; end if;
  if p.level < dest.lvl then raise exception '% opens up at level %.', dest.name, dest.lvl; end if;
  here := game.place(p, p.city);
  select * into m from game.travel_modes where id = p_mode;
  if not found then raise exception 'You can''t get there that way.'; end if;
  o := game.trip_option(p, here, dest, m);
  if o is null then raise exception 'You can''t get there that way.'; end if;
  if not (o->>'ok')::boolean then raise exception '%', o->>'why'; end if;
  if m.id = 'stow' and random() * 100 < (o->>'risk')::int then
    -- The driver checked the load.
    fine := least(p.cash, 200 + round((o->>'km')::numeric * 2));
    update game.players set cash = cash - fine, heat = least(100, heat + 10) where id = p.id;
    return jsonb_build_object('caught', true, 'fine', fine, 'to', dest.name);
  end if;
  if m.id = 'cargo' and random() * 100 < (o->>'risk')::int then
    fine := least(p.cash, 500 + round((o->>'km')::numeric * 0.2));
    update game.players set cash = cash - fine, heat = least(100, heat + 15) where id = p.id;
    return jsonb_build_object('caught', true, 'ship', true, 'fine', fine, 'to', dest.name);
  end if;
  mins := (o->>'minutes')::numeric;
  if m.id = 'hitch' then mins := greatest(1, round(mins * (0.6 + random() * 0.8))); end if;
  -- Crossing a border with contraband: customs might search you. They take it all, fine you, and hold you for a while.
  if (o->>'intl')::boolean and game.contraband(p.id) > 0 then
    if tier > 0 then
      bribe := game.bribe_cost(p.id, tier);
      if p.cash < (o->>'cost')::bigint + bribe then raise exception 'You can''t afford the fare and the bribe.'; end if;
      update game.players set cash = cash - bribe where id = p.id;
    end if;
    odds := game.bribe_odds((o->>'customs')::int, tier);
  end if;
  if odds is not null and random() * 100 < odds then
    select coalesce(sum(v.qty), 0), coalesce(sum(v.qty * i.value), 0) into seized, seized_value
      from game.inventory v join game.items i on i.id = v.item_id where v.player_id = p.id and i.cat = 'contraband';
    delete from game.inventory v using game.items i where i.id = v.item_id and v.player_id = p.id and i.cat = 'contraband';
    fine := least(p.cash - (o->>'cost')::bigint - bribe, round(seized_value * 0.5));
    held := 20 + floor(random() * 40)::int;
    mins := mins + held;
    update game.players set cash = cash - greatest(0, fine), heat = least(100, heat + 25), bag = greatest(0, bag - seized) where id = p.id;
    perform game.notify(p.id, 'customs', format('Customs found %s things in your bags. They took the lot, fined you %s and held you for %s minutes.', seized, game.fmt(greatest(0, fine)), held));
  end if;
  update game.players set cash = cash - (o->>'cost')::bigint, city = dest.id, trip_until = now() + make_interval(mins => mins::int),
    trip = jsonb_build_object('from', here.id, 'from_name', here.name, 'to', dest.id, 'to_name', dest.name, 'mode', m.id, 'name', o->>'name',
      'cap', (o->>'cap')::int, 'minutes', mins, 'cost', (o->>'cost')::bigint, 'started', now(), 'country', dest.country,
      'country_name', (select name from game.countries where iso = dest.country), 'held', held),
    bag = case when dest.id = 'home' then 0 else bag end where id = p.id;
  if m.id = 'train' and 'railpass' = any(p.travel_gear) then perform game.give(p.id, 'pie', 1); end if;
  perform game.track(p.id, 'trip', 1); perform game.track(p.id, 'trip:' || dest.id, 1);
  if (o->>'intl')::boolean then perform game.track(p.id, 'abroad', 1); end if;
  return jsonb_build_object('to', dest.name, 'minutes', mins, 'cost', (o->>'cost')::bigint, 'mode', o->>'name', 'ferry', (o->>'ferry')::boolean,
    'searched', seized > 0, 'seized', seized, 'fine', case when seized > 0 then greatest(0, fine) end, 'held', held, 'bribe', bribe, 'odds', odds);
end $$;

-- Pick your country (at sign-up, or later from your account while you're home).
create or replace function public.country_set(p_country text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; k game.countries;
begin
  p := game.me();
  select * into k from game.countries where iso = upper(p_country);
  if not found then raise exception 'Pick a country from the list.'; end if;
  if p.city <> 'home' or p.trip_until > now() then raise exception 'Change it when you''re back home.'; end if;
  update game.players set country = k.iso where id = p.id;
  return jsonb_build_object('country', k.iso, 'name', k.name);
end $$;

-- Wander the back streets of a town: you might turn up something local, or the police might turn up you.
create or replace function public.city_search() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.cities; r numeric; it text; fine bigint; cap int;
begin
  p := game.me();
  if p.city = 'home' then raise exception 'Try a job instead. This is for when you''re out of town.'; end if;
  if p.trip_until > now() then raise exception 'You haven''t arrived yet.'; end if;
  if p.jail_until > now() or p.hosp_until > now() then raise exception 'Not right now.'; end if;
  if p.stamina < 10 then raise exception 'You need 10 stamina.'; end if;
  if p.search_at > now() - interval '90 seconds' then raise exception 'Give it a minute. The locals are watching.'; end if;
  cap := coalesce((p.trip->>'cap')::int, 0);
  if p.bag >= cap then raise exception 'Your bags are full.'; end if;
  c := game.place(p, p.city);
  update game.players set stamina = stamina - 10, search_at = now() where id = p.id;
  r := random();
  if r < 0.15 then
    fine := least(p.cash, 50 + p.level * 40);
    update game.players set cash = cash - fine, heat = least(100, heat + 8) where id = p.id;
    return jsonb_build_object('caught', true, 'fine', fine, 'city', c.name);
  elsif r < 0.5 then
    return jsonb_build_object('found', null, 'city', c.name);
  end if;
  -- Mostly cheap local things; contraband only turns up in the main town.
  select s.item_id into it from game.city_shop s join game.items i on i.id = s.item_id
    where s.city = p.city order by case when i.rarity >= 3 then random() * 20 when i.cat = 'contraband' then random() * 4 else random() end limit 1;
  if it is null then return jsonb_build_object('found', null, 'city', c.name); end if;
  perform game.give(p.id, it, 1);
  update game.players set bag = bag + 1 where id = p.id;
  return jsonb_build_object('found', it, 'city', c.name);
end $$;

create or replace function public.city_shop() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  if p.city = 'home' then return jsonb_build_object('city', 'home', 'items', '[]'::jsonb); end if;
  perform game.city_restock(p.city);
  return jsonb_build_object('city', p.city, 'open', p.trip_until is null or p.trip_until <= now(), 'bag', p.bag, 'cap', coalesce((p.trip->>'cap')::int, 0),
    'items', (select jsonb_agg(jsonb_build_object('item_id', s.item_id, 'price', s.price, 'stock', s.stock, 'max', s.max_stock,
       'next_at', case when s.stock < s.max_stock then s.stocked_at + make_interval(mins => s.restock_mins) end, 'value', i.value) order by i.rarity, s.price)
     from game.city_shop s join game.items i on i.id = s.item_id where s.city = p.city));
end $$;

create or replace function public.city_buy(p_item text, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; s game.city_shop; q int := greatest(1, least(coalesce(p_qty, 1), 100)); cap int; cost bigint;
begin
  p := game.me();
  if p.city = 'home' then raise exception 'There''s nothing special for sale here. Travel to another city.'; end if;
  if p.trip_until > now() then raise exception 'You haven''t arrived yet.'; end if;
  if p.jail_until > now() or p.hosp_until > now() then raise exception 'Not right now.'; end if;
  perform game.city_restock(p.city);
  select * into s from game.city_shop where city = p.city and item_id = p_item for update;
  if not found then raise exception 'They don''t sell that here.'; end if;
  if s.stock < q then raise exception '%', case when s.stock = 0 then 'Sold out. More comes in later.' else format('Only %s left.', s.stock) end; end if;
  cap := coalesce((p.trip->>'cap')::int, 0);
  if p.bag + q > cap then raise exception 'You can''t carry any more. You came by %, which fits % things, and you''ve got %.', lower(p.trip->>'name'), cap, p.bag; end if;
  cost := s.price * q;
  if p.cash < cost then raise exception 'That''s %. You have % on you.', game.fmt(cost), game.fmt(p.cash); end if;
  update game.city_shop set stock = stock - q, stocked_at = case when stock = max_stock then now() else stocked_at end where city = s.city and item_id = s.item_id;
  update game.players set cash = cash - cost, bag = bag + q where id = p.id;
  perform game.give(p.id, s.item_id, q);
  perform game.track(p.id, 'city_buy', q);
  return jsonb_build_object('item', s.item_id, 'qty', q, 'cost', cost, 'bag', p.bag + q, 'cap', cap);
end $$;

create or replace function public.travel_gear_buy(p_gear text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; g game.travel_gear;
begin
  p := game.me(); perform game.need_still(p);
  select * into g from game.travel_gear where id = p_gear;
  if not found then raise exception 'No such thing.'; end if;
  if g.id = any(p.travel_gear) then raise exception 'You already have one.'; end if;
  if p.level < g.lvl then raise exception 'You need level % for that.', g.lvl; end if;
  if p.cash < g.price then raise exception 'That''s %. You have % on you.', game.fmt(g.price), game.fmt(p.cash); end if;
  update game.players set cash = cash - g.price, travel_gear = travel_gear || g.id where id = p.id;
  return jsonb_build_object('gear', g.id, 'cost', g.price);
end $$;

-- =====================================================================
-- PROPERTY PORTFOLIO AND RENTALS
-- =====================================================================
-- What a place would normally rent for, per day: about 0.5% of what it costs, so it pays for itself in roughly 200 days.
create or replace function game.market_rent(price bigint) returns bigint language sql immutable as $$
  select greatest(5, round(price * 0.005))::bigint $$;
-- How many places you can own to rent out.
create or replace function game.rental_limit(lvl int) returns int language sql immutable as $$ select least(25, 1 + lvl / 4) $$;
-- Mood and stamina limits follow the home you live in.
create or replace function game.home_apply(pid uuid) returns void language sql as $$
  update game.players p set max_mood = 250 + (p.level / 3) * 25 + h.mood, max_stamina = 100 + h.stamina,
    mood = least(p.mood, 250 + (p.level / 3) * 25 + h.mood), stamina = least(p.stamina, 100 + h.stamina * 1.5)
  from game.properties h where p.id = pid and h.id = game.home_of(pid) $$;

-- Bring one rental up to date: charge the tenant, find or lose a local tenant, pay the owner.
create or replace function game.rental_settle(rid bigint) returns void language plpgsql as $$
declare r game.rentals; h game.properties; days numeric; hrs numeric; due bigint; ratio numeric; d numeric; t game.players; paid bigint;
  names text[] := array['a nurse and her two kids', 'a retired fisherman', 'three uni students', 'a young couple', 'a quiet accountant', 'a tattooist and his dog',
    'a family of five', 'a man who says he''s in imports', 'two chefs who work nights', 'a widow and a lot of cats', 'a touring musician', 'a builder from up north'];
begin
  select * into r from game.rentals where id = rid for update;
  if not found then return; end if;
  select * into h from game.properties where id = r.property;
  ratio := r.rent::numeric / game.market_rent(h.price);
  days := extract(epoch from now() - coalesce(r.paid_to, now())) / 86400.0;
  if r.tenant is not null and days > 0 then
    due := round(r.rent * days);
    select * into t from game.players where id = r.tenant for update;
    if t.cash + t.bank >= due then
      update game.players set cash = cash - least(cash, due), bank = bank - greatest(0, due - cash) where id = t.id;
      update game.rentals set earned = earned + due, paid_to = now() where id = rid;
    else
      -- Can't pay: they lose the place and the owner keeps what they had.
      paid := t.cash + t.bank;
      update game.players set cash = 0, bank = 0 where id = t.id;
      update game.rentals set earned = earned + paid, tenant = null, since = null, paid_to = null, checked_at = now() where id = rid;
      perform game.home_apply(t.id);
      perform game.notify(t.id, 'rent', format('You fell behind on the rent for %s and got evicted.', h.name));
      perform game.notify(r.owner, 'rent', format('%s couldn''t pay the rent on your %s and has been evicted.', t.name, lower(h.name)));
    end if;
  elsif r.npc is not null and days > 0 then
    update game.rentals set earned = earned + round(r.rent * days), paid_to = now() where id = rid;
    -- Locals move out now and then, and fast if the rent's gone up past what's fair.
    if random() < 1 - power(1 - least(0.9, 0.03 + greatest(0, ratio - 1) * 0.4), days) then
      update game.rentals set npc = null, since = null, paid_to = null, checked_at = now() where id = rid;
      perform game.notify(r.owner, 'rent', format('Your tenants (%s) moved out of your %s.', r.npc, lower(h.name)));
    end if;
  elsif r.tenant is null and r.npc is null and r.listed then
    -- Empty and advertised: the cheaper it is against the going rate, the quicker someone moves in.
    hrs := extract(epoch from now() - coalesce(r.checked_at, now())) / 3600.0;
    d := 0.2 * power(greatest(0, 1.6 - ratio) / 0.6, 2.2);
    if hrs > 0 and random() < 1 - power(1 - least(0.95, d), hrs) then
      update game.rentals set npc = names[1 + floor(random() * array_length(names, 1))::int], since = now(), paid_to = now(), checked_at = now() where id = rid;
    else
      update game.rentals set checked_at = now() where id = rid;
    end if;
  end if;
end $$;

create or replace function game.rentals_settle_owner(pid uuid) returns void language plpgsql as $$
declare x record;
begin
  for x in select id from game.rentals where owner = pid loop perform game.rental_settle(x.id); end loop;
end $$;

create or replace function public.rentals_state() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; mine bigint;
begin
  p := game.me();
  perform game.rentals_settle_owner(p.id);
  select id into mine from game.rentals where tenant = p.id;
  if mine is not null then perform game.rental_settle(mine); end if;
  return jsonb_build_object('limit', game.rental_limit(p.level), 'level', p.level,
    'owned', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'property', r.property, 'name', h.name, 'price', h.price, 'rent', r.rent, 'market', game.market_rent(h.price),
        'listed', r.listed, 'npc', r.npc, 'tenant', case when t.id is not null then jsonb_build_object('id', t.id, 'name', t.name, 'look', t.look, 'name_color', t.name_color) end,
        'since', r.since, 'earned', r.earned, 'total', r.total, 'bought_at', r.bought_at, 'value', floor(h.price * 0.7)) order by h.sort desc, r.id)
      from game.rentals r join game.properties h on h.id = r.property left join game.players t on t.id = r.tenant where r.owner = p.id), '[]'),
    'renting', (select jsonb_build_object('id', r.id, 'property', r.property, 'name', h.name, 'rent', r.rent, 'since', r.since, 'owner', o.name, 'owner_id', o.id,
        'perks', h.perks, 'mood', h.mood, 'stamina', h.stamina)
      from game.rentals r join game.properties h on h.id = r.property join game.players o on o.id = r.owner where r.tenant = p.id),
    'own_home', p.property,
    'market', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'property', r.property, 'name', h.name, 'rent', r.rent, 'market', game.market_rent(h.price), 'lvl', h.lvl,
        'owner', o.name, 'owner_id', o.id, 'perks', h.perks, 'mood', h.mood, 'stamina', h.stamina, 'price', h.price) order by h.sort desc, r.rent)
      from game.rentals r join game.properties h on h.id = r.property join game.players o on o.id = r.owner
      where r.listed and r.tenant is null and r.npc is null and r.owner <> p.id), '[]'),
    'catalogue', (select jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'price', h.price, 'lvl', h.lvl, 'market', game.market_rent(h.price), 'blurb', h.blurb) order by h.sort)
      from game.properties h where h.price > 0));
end $$;

create or replace function public.rental_buy(p_property text) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; h game.properties; n int; rid bigint;
begin
  p := game.me(); perform game.need_still(p);
  select * into h from game.properties where id = p_property and price > 0;
  if not found then raise exception 'You can''t buy that.'; end if;
  if p.level < h.lvl then raise exception 'You need level % to buy there.', h.lvl; end if;
  select count(*) into n from game.rentals where owner = p.id;
  if n >= game.rental_limit(p.level) then raise exception 'You can own % rentals at your level. Level up for more.', game.rental_limit(p.level); end if;
  if p.cash < h.price then raise exception 'That''s %. You have % on you.', game.fmt(h.price), game.fmt(p.cash); end if;
  update game.players set cash = cash - h.price where id = p.id;
  insert into game.rentals(owner, property, rent, listed, checked_at, paid) values (p.id, h.id, game.market_rent(h.price), true, now(), h.price) returning id into rid;
  perform game.track(p.id, 'rental', 1);
  return jsonb_build_object('id', rid, 'name', h.name, 'rent', game.market_rent(h.price));
end $$;

create or replace function public.rental_set(p_id bigint, p_rent bigint, p_listed boolean) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; r game.rentals;
begin
  p := game.me(); perform game.need_still(p);
  select * into r from game.rentals where id = p_id and owner = p.id;
  if not found then raise exception 'That''s not yours.'; end if;
  if p_rent is null or p_rent < 1 or p_rent > 100000000 then raise exception 'Pick a rent between $1 and $100,000,000 a day.'; end if;
  perform game.rental_settle(r.id);
  update game.rentals set rent = p_rent, listed = coalesce(p_listed, listed), checked_at = case when not listed and coalesce(p_listed, listed) then now() else checked_at end where id = r.id;
  if r.tenant is not null and p_rent <> r.rent then
    perform game.notify(r.tenant, 'rent', format('%s changed your rent to %s a day.', p.name, game.fmt(p_rent)));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.rental_evict(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; r game.rentals; h game.properties;
begin
  p := game.me(); perform game.need_still(p);
  select * into r from game.rentals where id = p_id and owner = p.id;
  if not found then raise exception 'That''s not yours.'; end if;
  perform game.rental_settle(r.id);
  select * into r from game.rentals where id = p_id;
  select * into h from game.properties where id = r.property;
  if r.tenant is null and r.npc is null then raise exception 'Nobody lives there.'; end if;
  update game.rentals set tenant = null, npc = null, since = null, paid_to = null, checked_at = now() where id = r.id;
  if r.tenant is not null then
    perform game.home_apply(r.tenant);
    perform game.notify(r.tenant, 'rent', format('%s evicted you from %s.', p.name, lower(h.name)));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.rental_collect() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; amt bigint;
begin
  p := game.me(); perform game.need_still(p);
  perform game.rentals_settle_owner(p.id);
  select coalesce(sum(earned), 0) into amt from game.rentals where owner = p.id;
  if amt < 1 then raise exception 'No rent to collect yet.'; end if;
  update game.rentals set total = total + earned, earned = 0 where owner = p.id;
  update game.players set cash = cash + amt where id = p.id;
  return jsonb_build_object('collected', amt);
end $$;

create or replace function public.rental_sell(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; r game.rentals; h game.properties; got bigint;
begin
  p := game.me(); perform game.need_still(p);
  perform game.rental_settle(p_id);
  select * into r from game.rentals where id = p_id and owner = p.id;
  if not found then raise exception 'That''s not yours.'; end if;
  select * into h from game.properties where id = r.property;
  got := floor(h.price * 0.7) + r.earned;
  delete from game.rentals where id = r.id;
  if r.tenant is not null then
    perform game.home_apply(r.tenant);
    perform game.notify(r.tenant, 'rent', format('%s sold the place you were renting. You''ll need to find somewhere else.', p.name));
  end if;
  update game.players set cash = cash + got where id = p.id;
  return jsonb_build_object('sold', h.name, 'got', got);
end $$;

-- Renting somewhere to live: you get its perks and limits while you pay rent each day (from cash, then the bank).
create or replace function public.rental_rent(p_id bigint) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; r game.rentals; h game.properties;
begin
  p := game.me(); perform game.need_still(p); perform game.need_free(p);
  if exists (select 1 from game.rentals where tenant = p.id) then raise exception 'You''re already renting somewhere. Move out first.'; end if;
  select * into r from game.rentals where id = p_id for update;
  if not found or r.tenant is not null or r.npc is not null or not r.listed then raise exception 'Someone beat you to it.'; end if;
  if r.owner = p.id then raise exception 'That''s yours. You can''t rent it from yourself.'; end if;
  select * into h from game.properties where id = r.property;
  if p.level < h.lvl then raise exception 'You need level % to live there.', h.lvl; end if;
  if p.cash + p.bank < r.rent then raise exception 'You need at least one day''s rent, %.', game.fmt(r.rent); end if;
  update game.rentals set tenant = p.id, since = now(), paid_to = now() where id = r.id;
  perform game.home_apply(p.id);
  perform game.notify(r.owner, 'rent', format('%s moved into your %s at %s a day.', p.name, lower(h.name), game.fmt(r.rent)));
  return jsonb_build_object('name', h.name, 'rent', r.rent);
end $$;

create or replace function public.rental_leave() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; r game.rentals; h game.properties;
begin
  p := game.me(); perform game.need_still(p);
  select * into r from game.rentals where tenant = p.id;
  if not found then raise exception 'You''re not renting anywhere.'; end if;
  perform game.rental_settle(r.id);
  select * into h from game.properties where id = r.property;
  update game.rentals set tenant = null, since = null, paid_to = null, checked_at = now() where id = r.id and tenant = p.id;
  perform game.home_apply(p.id);
  perform game.notify(r.owner, 'rent', format('%s moved out of your %s.', p.name, lower(h.name)));
  return jsonb_build_object('left', h.name);
end $$;

-- =====================================================================
-- TRADING ACROSS THE WORLD: a market in every city, and local traders
-- =====================================================================
-- What a town's trader pays for something. Fixed for each item in each town, and it depends on where the item comes from:
-- next to nothing where it's made, a bit more elsewhere in that country, more in the same part of the world,
-- and the most on the other side of it. Ordinary things without a home country fetch a middling price anywhere.
create or replace function game.trader_price(i game.items, c game.cities) returns bigint language plpgsql stable as $$
declare u numeric; oz text; cz text; m numeric;
begin
  if c.id = 'home' or c.id is null then return floor(i.value * 0.5); end if;
  u := ('x' || substr(md5(i.id || '/' || c.id), 1, 7))::bit(28)::int / 268435456.0;
  if i.origin is null then m := 0.35 + 0.3 * u;
  elsif i.origin_city = c.id then m := 0.22;
  elsif i.origin = c.country then m := 0.3 + 0.2 * u;
  else
    select zone into oz from game.countries where iso = i.origin;
    select zone into cz from game.countries where iso = c.country;
    m := case when oz = cz then 0.55 + 0.35 * u else 0.75 + 0.5 * u end;
    -- Some countries just want certain kinds of thing more than others.
    m := m * (0.8 + 0.45 * ('x' || substr(md5(i.cat || '/' || c.country), 1, 7))::bit(28)::int / 268435456.0);
    if i.cat = 'contraband' then m := m * 1.25; end if;
  end if;
  return greatest(1, floor(i.value * m));
end $$;

-- Sell to the trader in the town you're in.
create or replace function public.city_sell(p_item text, p_qty int default 1) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; it game.items; c game.cities; q int := greatest(1, coalesce(p_qty, 1)); pay bigint;
begin
  p := game.me(); perform game.need_still(p);
  if p.city = 'home' then raise exception 'In Greyhaven, use the pawn shop.'; end if;
  if p.jail_until > now() or p.hosp_until > now() then raise exception 'Not right now.'; end if;
  select * into it from game.items where id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  if it.id in ('founder', 'token') then raise exception 'The trader won''t touch that.'; end if;
  select * into c from game.cities where id = p.city;
  perform game.take(p.id, it.id, q);
  pay := floor(game.trader_price(it, c) * q * (1 + least(0.1, (game.skill_lvl(p.skills, 'trade') - 1) * 0.003)));
  update game.players set cash = cash + pay where id = p.id;
  perform game.add_skill(p.id, 'trade', 1);
  return jsonb_build_object('item', it.id, 'qty', q, 'paid', pay, 'city', c.name);
end $$;

-- What the trader here would pay for everything you're carrying, best first.
create or replace function public.city_trader() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; c game.cities;
begin
  p := game.me();
  select * into c from game.cities where id = p.city;
  return jsonb_build_object('city', c.id, 'name', c.name, 'items', coalesce((select jsonb_agg(jsonb_build_object('item_id', z.id, 'qty', z.qty, 'price', z.price, 'value', z.value) order by z.price desc) from (
    select i.id, v.qty, i.value, game.trader_price(i, c) price
    from game.inventory v join game.items i on i.id = v.item_id where v.player_id = p.id and v.qty > 0 and i.id not in ('founder', 'token')
    order by 4 desc limit 60) z), '[]'));
end $$;

-- Towns with something on their market.
create or replace function public.market_cities() returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players;
begin
  p := game.me();
  return jsonb_build_object('here', p.city, 'cities', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'country', c.country, 'listings', z.n) order by c.id <> 'home', z.n desc)
    from (select city, count(*) n from game.listings group by city) z join game.cities c on c.id = z.city), '[]'));
end $$;

-- =====================================================================
-- FEEDBACK
-- =====================================================================
-- Anonymous feedback really is anonymous: the row stores no player at all. A separate counter (with no link to the
-- feedback) stops one person flooding the box. Players can choose to sign their feedback instead.
create or replace function public.feedback_send(p_kind text, p_text text, p_page text default null, p_anon boolean default true) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare p game.players; t text := btrim(coalesce(p_text, '')); recent int;
begin
  p := game.me();
  if char_length(t) < 5 then raise exception 'Tell us a little more.'; end if;
  if char_length(t) > 2000 then raise exception 'Keep it under 2,000 characters.'; end if;
  if coalesce(p_kind, '') not in ('bug', 'idea', 'balance', 'love', 'other') then raise exception 'Pick what kind of feedback it is.'; end if;
  delete from game.feedback_rate where at < now() - interval '1 day';
  select count(*) into recent from game.feedback_rate where player_id = p.id and at > now() - interval '1 hour';
  if recent >= 5 then raise exception 'Thanks! That''s plenty for one hour. Send more later.'; end if;
  insert into game.feedback_rate(player_id) values (p.id);
  insert into game.feedback(kind, body, page, player_id, player_name, level)
    values (p_kind, t, left(p_page, 60), case when p_anon then null else p.id end, case when p_anon then null else p.name end, case when p_anon then null else p.level end);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_feedback(p_status text default 'new') returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players;
begin
  a := game.need_admin();
  return jsonb_build_object('counts', (select jsonb_object_agg(status, n) from (select status, count(*) n from game.feedback group by status) z),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'kind', f.kind, 'body', f.body, 'page', f.page, 'at', f.at, 'status', f.status, 'note', f.note,
      'player_id', f.player_id, 'player_name', f.player_name, 'level', f.level) order by f.id desc)
      from (select * from game.feedback where status = coalesce(p_status, status) order by id desc limit 200) f), '[]'));
end $$;

create or replace function public.admin_feedback_set(p_id bigint, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = game, public as $$
declare a game.players;
begin
  a := game.need_admin();
  if p_status not in ('new', 'read', 'done') then raise exception 'Unknown status.'; end if;
  update game.feedback set status = p_status, note = coalesce(p_note, note) where id = p_id;
  return jsonb_build_object('ok', true);
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
             'property_list','property_move','home_collect','turf_state','season_state','season_claim','war_declare','war_surrender','war_state','company_list','company_get','company_start','company_apply','company_withdraw',
             'company_decide','company_staff','company_funds','company_shift','company_leave',
             'company_sell','company_buy','company_offer','company_offer_cancel','company_offer_decide','career_state','career_join','career_shift',
             'vehicle_list','vehicle_buy','medals_state','title_set','missions_state','mission_start','mission_drop','mission_claim','profile_set','my_collection','admin_overview','admin_find','admin_act','admin_reports',
             'admin_resolve','admin_delete_message','armoury','arms_buy','loadout_set','fight_start','fight_turn','fight_get','travel_state','travel_go','city_shop','city_buy','travel_gear_buy','travel_quote','country_set','city_search','rentals_state','rental_buy','rental_set','rental_evict','rental_collect','rental_sell','rental_rent','rental_leave','city_sell','city_trader','market_cities','feedback_send','admin_feedback','admin_feedback_set') loop
    execute format('revoke all on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon', f.sig); end if;
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on all functions in schema game from public;
