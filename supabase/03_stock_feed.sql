-- =====================================================================
-- BACKSTREET · step 3 of 3: the daily stock feed.
-- After each US market close, the database fetches the real closing price
-- of every company's real-world twin and moves the game price by the same %.
-- Uses two Supabase extensions: pg_net (web requests) and pg_cron (schedules).
-- Safe to re-run.
-- =====================================================================
create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists game.stock_fetch(
  id bigint generated always as identity primary key,
  ticker text not null, req bigint not null,
  at timestamptz not null default now(),
  done boolean not null default false, note text);
alter table game.stock_fetch enable row level security;

-- Ask for today's close of every twin (one small request each, from stooq.com's free CSV quotes).
create or replace function game.stocks_request() returns int language plpgsql security definer set search_path = game, public as $$
declare s record; n int := 0;
begin
  for s in select ticker, twin from game.stocks order by sort loop
    insert into game.stock_fetch(ticker, req)
      values (s.ticker, net.http_get('https://stooq.com/q/l/?s=' || lower(s.twin) || '.us&f=sd2t2ohlcv&h&e=csv'));
    n := n + 1;
  end loop;
  return n;
end $$;

-- Read the answers. The first close we see becomes the baseline; every later trading day moves the price.
create or replace function game.stocks_apply() returns text language plpgsql security definer set search_path = game, public as $$
declare f record; body text; line text; parts text[]; d date; c numeric; st game.stocks; pct numeric; np numeric; moved int := 0;
begin
  for f in select * from game.stock_fetch where not done and at > now() - interval '1 day' order by id loop
    select content into body from net._http_response where id = f.req;
    if body is null then continue; end if;
    update game.stock_fetch set done = true where id = f.id;
    line := split_part(body, E'\n', 2);
    parts := string_to_array(btrim(line, E' \r\n'), ',');
    if array_length(parts, 1) < 7 or parts[2] !~ '^\d{4}-\d{2}-\d{2}$' or parts[7] !~ '^[0-9.]+$' then
      update game.stock_fetch set note = 'no data: ' || left(coalesce(line, ''), 80) where id = f.id; continue;
    end if;
    d := parts[2]::date; c := parts[7]::numeric;
    select * into st from game.stocks where ticker = f.ticker for update;
    if st.real_date is not null and d <= st.real_date then
      update game.stock_fetch set note = 'already have ' || d where id = f.id; continue;
    end if;
    if st.real_close is null then
      update game.stocks set real_close = c, real_date = d where ticker = st.ticker;
      update game.stock_fetch set note = 'baseline ' || c where id = f.id;
    else
      pct := c / st.real_close - 1;
      np := round(st.price * (1 + pct), 2);
      update game.stocks set prev = price, price = np, real_close = c, real_date = d,
        history = (select coalesce(jsonb_agg(x order by (x->>0)::date), '[]'::jsonb) from (
                     select x from jsonb_array_elements(history || jsonb_build_array(jsonb_build_array(d, np, round(pct * 100, 2)))) x
                     order by (x->>0)::date desc limit 60) y)
      where ticker = st.ticker;
      update game.stock_fetch set note = format('moved %s%%', round(pct * 100, 2)) where id = f.id;
      moved := moved + 1;
    end if;
  end loop;
  delete from game.stock_fetch where at < now() - interval '7 days';
  return format('%s companies moved', moved);
end $$;
revoke all on function game.stocks_request(), game.stocks_apply() from public;

-- Schedules (UTC). The US market closes at 21:00 UTC in the NZ summer (20:00 UTC from mid-March to early November).
do $$ begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('backstreet-stocks-request', 'backstreet-stocks-request-late', 'backstreet-stocks-apply');
end $$;
select cron.schedule('backstreet-stocks-request', '40 21 * * 1-5', 'select game.stocks_request()');
select cron.schedule('backstreet-stocks-request-late', '40 23 * * 1-5', 'select game.stocks_request()');
select cron.schedule('backstreet-stocks-apply', '*/10 * * * *', 'select game.stocks_apply()');

-- Grab a baseline right now, so the first real move lands after the next close.
select game.stocks_request();
