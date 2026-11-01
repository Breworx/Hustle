import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, ItemThumb, Seg, Countdown, itemName, Rarity } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { loadOutline } from "../lib/outline.js";
import { flag } from "../ui/country.jsx";
import { TOWNS } from "../game/world-data.js";
import { IT } from "../game/catalog.js";
import * as Ic from "../ui/icons.js";

export const MODE_ICON = { walk: Ic.Footprints, bikehire: Ic.Bike, hitch: Ic.ThumbsUp, stow: Ic.Truck, bus: Ic.Bus, train: Ic.TrainFront, rental: Ic.Car, campervan: Ic.Caravan,
  flight: Ic.Plane, charter: Ic.PlaneTakeoff, intl: Ic.Plane, cargo: Ic.Ship, own: Ic.Car };
export const mins = m => { m = Math.round(m); if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; if (h < 48) return r ? `${h} h ${r} min` : `${h} h`; return `${Math.floor(h / 24)} days ${h % 24} h`; };
const TOWN = Object.fromEntries(TOWNS.map(t => [t[0], t]));

// Pins and labels on a country map. Labels that would overlap another are left off (tap the dot to see the name).
function CountryMap({ outline, cities, sel, onSel, me }) {
  const P = c => ({ x: ((outline.shift && c.lon < 0 ? c.lon + 360 : c.lon) - outline.x0) * outline.kx * outline.k, y: (outline.y1 - c.lat) * outline.k });
  const pins = cities.map(c => ({ c, ...P(c) }));
  const order = [...pins].sort((a, b) => (b.c.here - a.c.here) || ((sel?.id === b.c.id) - (sel?.id === a.c.id)) || ((b.c.id === "home") - (a.c.id === "home")) || (a.c.lvl - b.c.lvl));
  const boxes = pins.map(p => [p.x - 5, p.y - 5, 10, 10]); const label = {};
  for (const p of order) {
    const w = p.c.name.length * 5.6 + 4, h = 12;
    for (const side of [1, -1]) {
      const bx = side > 0 ? p.x + 8 : p.x - 8 - w, by = p.y - 7;
      if (bx < -4 || bx + w > outline.w + 4) continue;
      if (!boxes.some(b => bx < b[0] + b[2] && bx + w > b[0] && by < b[1] + b[3] && by + h > b[1])) { boxes.push([bx, by, w, h]); label[p.c.id] = side; break; }
    }
  }
  const here = pins.find(p => p.c.here), s = sel && pins.find(p => p.c.id === sel.id);
  return (
    <svg className="nzmap" viewBox={`-12 -12 ${outline.w + 24} ${outline.h + 24}`} role="group" aria-label="Map">
      <path d={outline.d} className="land" />
      {here && s && s !== here && <line x1={here.x} y1={here.y} x2={s.x} y2={s.y} className="route" />}
      {pins.map(({ c, x, y }) => { const locked = me.level < c.lvl; return (
        <g key={c.id} className={`pin ${c.here ? "here" : ""} ${sel?.id === c.id ? "sel" : ""} ${locked ? "locked" : ""} ${c.id === "home" ? "home" : ""}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
          role="button" tabIndex={0} aria-label={`${c.name}${c.here ? ", you are here" : ""}`} onClick={() => onSel(c)} onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSel(c)}>
          <circle r="11" className="hit" /><circle r={c.id === "home" ? 6.5 : 5} />
          {label[c.id] && <text x={label[c.id] * 8} y="4" textAnchor={label[c.id] > 0 ? "start" : "end"}>{c.name}</text>}
        </g>); })}
    </svg>
  );
}

function WorldMap({ world, countries, sel, onSel }) {
  return (
    <svg className="worldmap" viewBox="0 10 720 300" role="group" aria-label="World map">
      <path d={world.d} className="land" />
      {countries.map(k => { const t = TOWN[k.hub]; if (!t) return null; const x = (t[4] + 180) * 2, y = (90 - t[3]) * 2; return (
        <circle key={k.iso} cx={x} cy={y} r={sel?.iso === k.iso ? 6 : k.here || k.home ? 4.5 : 2.4} className={`wdot ${k.here ? "here" : ""} ${k.home ? "home" : ""} ${sel?.iso === k.iso ? "sel" : ""}`}
          onClick={() => onSel(k)}><title>{k.name}</title></circle>); })}
    </svg>
  );
}

function Options({ list, d, onGo }) {
  const { busy } = useGame();
  if (!list) return <Empty title="Checking the timetables…" />;
  if (!list.length) return <p className="tiny">There's no way to get there from here.</p>;
  return (
    <div className="list">{list.map(o => { const I = MODE_ICON[o.mode] || Ic.Car; return (
      <div key={o.mode} className={`li ${o.ok ? "" : "locked"}`}>
        <span className="thumb modeic"><I /></span>
        <div><div className="t">{o.name}</div>
          <div className="s">{o.mode === "hitch" ? `About ${mins(o.minutes)}, could be quicker or slower` : mins(o.minutes)}, {o.cost ? money(o.cost) : "free"}{o.ferry ? " with the boat across" : ""}. {num(o.km)} km. Carry {o.cap} things back.</div>
          <div className="tiny">{o.why ? <span className="bad">{o.why}</span> : o.risk > 0 ? `${o.blurb.split(".")[0]}. ${o.risk}% chance you're caught and fined.` : o.blurb}
            {o.intl && d.contraband > 0 && <span className="bad"> You're carrying contraband: customs search {o.customs}% of travellers this way.</span>}</div></div>
        <div className="act"><button className="btn sm" disabled={busy || !o.ok} onClick={() => onGo(o)}>Go</button></div>
      </div>); })}</div>
  );
}

export function Travel() {
  const { me, run, toast, showSheet, refresh } = useGame();
  const [d, setD] = useState(null); const [sel, setSel] = useState(null); const [tab, setTab] = useState(me.status === "away" ? "shop" : "go");
  const [outline, setOutline] = useState(null); const [world, setWorld] = useState(null);
  const [abroad, setAbroad] = useState(null); const [quote, setQuote] = useState(null); const [q, setQ] = useState("");
  const load = () => call("travel_state").then(x => { setD(x); setSel(s => (s && x.cities.find(c => c.id === s.id)) || x.cities.find(c => !c.here && c.lvl <= me.level) || x.cities[0]); }).catch(() => {});
  useEffect(() => { load(); }, [me.city, me.status, me.country]);
  useEffect(() => { if (d) loadOutline(d.country).then(setOutline).catch(() => setOutline(null)); }, [d?.country]);
  useEffect(() => { if (tab === "abroad" && !world) loadOutline("world").then(setWorld).catch(() => {}); }, [tab]);
  useEffect(() => { setQuote(null); if (abroad && d && !d.on_road) call("travel_quote", { p_city: abroad.hub }).then(setQuote).catch(() => setQuote({ options: [] })); }, [abroad?.iso, d?.city, d?.on_road]);
  const filtered = useMemo(() => !d ? [] : d.countries.filter(k => !q || k.name.toLowerCase().includes(q.toLowerCase())), [d, q]);
  if (!d) return <Empty title="Loading…" />;
  const here = d.cities.find(c => c.here) || { id: d.city, name: d.trip?.to_name || "", here: true };
  const goTrip = (dest, o) => run("travel_go", { p_city: dest, p_mode: o.mode }, r => {
    load();
    if (r.caught) showSheet({ verdict: "Caught", tone: "bad", title: r.ship ? "Stowing away at sea" : "Stowing away", pic: <span className="thumb modeic">{r.ship ? <Ic.Ship /> : <Ic.Truck />}</span>,
      story: r.ship ? `A deckhand found you behind the containers before the ship left port. The captain handed you to the harbour police, and you paid ${money(r.fine)} to make it go away.`
        : `The driver checked the load at the first stop and found you behind a pallet of milk powder. You paid ${money(r.fine)} to make it go away and walked back into town.` });
    else if (r.searched) showSheet({ verdict: "Searched", tone: "bad", title: "Customs", pic: <span className="thumb modeic"><Ic.ShieldCheck /></span>,
      story: `An officer waved you over and went through every bag. They found ${r.seized} things you shouldn't have had, took the lot, fined you ${money(r.fine)} and kept you in a little room for ${r.held} minutes. You're on your way to ${r.to} now, a lot lighter.` });
    else toast(`On your way to ${r.to}: ${mins(r.minutes)}${r.cost ? `, ${money(r.cost)}` : ""}.`, "good");
  });
  const away = d.city !== "home";
  const inCountry = d.country_name;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Travel</h1><p>Get out of {d.home_name}. Every town sells things you can't get at home, and most of them are worth more back here. How you travel decides how long it takes, what it costs and how much you can carry back. While you're on the road, you can't do anything else.</p></div>
        <Seg label="Travel" value={tab} onChange={setTab} options={[["go", `${flag(d.country)} ${inCountry}`], ["abroad", "Abroad"], ...(away && !d.on_road ? [["shop", `Shop in ${here.name}`]] : []), ["gear", "Gear"]]} /></div>
      {d.on_road && <OnRoad d={d} onDone={() => { refresh(); load(); }} />}
      {tab === "go" && <div className="travelgrid">
        <div className="panel mappanel"><div className="body">{outline ? <CountryMap outline={outline} cities={d.cities} sel={sel} onSel={setSel} me={me} /> : <Empty title="Drawing the map…" />}
          <p className="tiny" style={{ textAlign: "center" }}>{d.on_road ? `On the road to ${d.trip.to_name}.` : `You're in ${here.name}.`} Tap a town.</p></div></div>
        <div className="stack">
          {sel && <Panel title={sel.here ? (d.on_road ? `On your way to ${sel.name}` : sel.id === "home" ? d.home_name : `You're in ${sel.name}`) : sel.name} note={`${sel.blurb}${sel.here ? "" : ` ${num(sel.km)} km away.`}`}>
            {sel.here ? (d.on_road ? <p className="tiny">The shops open when you arrive.</p> : sel.id === "home" ? <p className="tiny">Pick somewhere to go on the map, or fly abroad.</p>
              : <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={() => setTab("shop")}><Ic.ShoppingBag />Shop in {sel.name}</button></div>)
              : d.on_road ? <p className="tiny">You can plan your next move once you arrive.</p> : me.level < sel.lvl ? <p className="tiny"><Ic.Lock style={{ width: 14, verticalAlign: -2 }} /> {sel.name} opens up at level {sel.lvl}.</p>
              : d.blocked ? <p className="tiny">{d.blocked}</p> : <Options list={sel.options} d={d} onGo={o => goTrip(sel.id, o)} />}
          </Panel>}
          <Panel title={`Towns in ${inCountry}`} flush>
            <div className="list">{d.cities.filter(c => !c.here).map(c => { const locked = me.level < c.lvl; const fast = c.options.find(o => o.ok); return (
              <button key={c.id} className={`li click ${locked ? "locked" : ""} ${sel?.id === c.id ? "on" : ""}`} onClick={() => { setSel(c); window.scrollTo?.({ top: 0, behavior: "smooth" }); }}>
                <span className="thumb modeic">{c.id === "home" ? <Ic.House /> : <Ic.MapPin />}</span>
                <div><div className="t">{c.id === "home" ? `${c.name} (home)` : c.name}</div><div className="s">{num(c.km)} km{c.goods ? `, ${c.goods} local goods` : ""}{fast && !d.on_road ? `. Fastest: ${mins(fast.minutes)}` : ""}</div></div>
                <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {c.lvl}</span> : <Ic.ChevronRight style={{ width: 18 }} />}</div>
              </button>); })}</div>
          </Panel>
        </div>
      </div>}
      {tab === "abroad" && <div className="stack">
        <div className="panel"><div className="body">{world ? <WorldMap world={world} countries={d.countries} sel={abroad} onSel={setAbroad} /> : <Empty title="Drawing the world…" />}
          <p className="tiny" style={{ textAlign: "center" }}>International flights from level 8. You land in each country's main town, then get around it like you do at home.</p></div></div>
        <div className="travelgrid flip">
          <Panel title="Countries" flush>
            <div className="body" style={{ paddingBottom: 8 }}><input className="input" placeholder="Search countries" value={q} onChange={e => setQ(e.target.value)} aria-label="Search countries" /></div>
            <div className="list countrylist">{filtered.map(k => (
              <button key={k.iso} className={`li click ${abroad?.iso === k.iso ? "on" : ""}`} onClick={() => setAbroad(k)}>
                <span className="flag" aria-hidden="true">{flag(k.iso)}</span>
                <div><div className="t">{k.name}</div><div className="s">{k.here ? "You're here" : `${num(k.km)} km to ${k.hub_name}`}{k.home ? ". Your country" : ""}</div></div>
                <div className="act"><Ic.ChevronRight style={{ width: 18 }} /></div>
              </button>))}</div>
          </Panel>
          {abroad ? <Panel title={`${flag(abroad.iso)} ${abroad.name}`} note={abroad.here ? "You're already in this country. Use the map to get around." : `Fly into ${abroad.hub_name}, ${num(abroad.km)} km away.`}>
            {abroad.here ? <button className="btn" onClick={() => setTab("go")}>Show the map</button> : d.on_road ? <p className="tiny">You can book once you arrive.</p>
              : d.blocked ? <p className="tiny">{d.blocked}</p> : <Options list={quote?.options} d={d} onGo={o => goTrip(abroad.hub, o)} />}
          </Panel> : <Panel><Empty title="Pick a country">Tap a dot on the map or search the list.</Empty></Panel>}
        </div>
      </div>}
      {tab === "shop" && <CityShop city={here} onBought={load} />}
      {tab === "gear" && <Gear d={d} load={load} />}
    </div>
  );
}

function Gear({ d, load }) {
  const { me, run, busy, toast } = useGame();
  return (
    <Panel title="Travel gear" note="Bought once, kept for good." flush>
      <div className="list">{d.gear.map(g => { const locked = me.level < g.lvl; return (
        <div key={g.id} className={`li ${locked ? "locked" : ""}`}>
          <span className="thumb modeic">{React.createElement({ sign: Ic.ThumbsUp, boots: Ic.Footprints, pack: Ic.Backpack, roofbox: Ic.Package, manifest: Ic.ScrollText, buspass: Ic.Bus, railpass: Ic.TrainFront, airpoints: Ic.Plane }[g.id] || Ic.Package)}</span>
          <div><div className="t">{g.name}</div><div className="s">{g.blurb}</div></div>
          <div className="act">{g.owned ? <span className="pill good"><Ic.Check />Yours</span> : locked ? <span className="pill"><Ic.Lock />Level {g.lvl}</span> :
            <button className="btn sm" disabled={busy || me.cash < g.price} onClick={() => run("travel_gear_buy", { p_gear: g.id }, () => { load(); toast(`${g.name}: yours.`, "good"); })}>{money(g.price)}</button>}</div>
        </div>); })}</div>
    </Panel>
  );
}

function OnRoad({ d, onDone }) {
  const t = d.trip; const I = MODE_ICON[t.mode] || Ic.Car;
  const start = new Date(t.started).getTime(), end = new Date(d.trip_until).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const pct = Math.min(100, Math.max(0, (now - start) / Math.max(1, end - start) * 100));
  return (
    <div className="panel onroad"><div className="body">
      <span className="thumb modeic"><I /></span>
      <div className="grow stack-sm"><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{t.from_name} to {t.to_name}{t.country_name && t.to !== "home" ? `, ${t.country_name}` : ""}</b><span className="tiny">{t.name}, arriving in <Countdown until={d.trip_until} onDone={onDone} /></span></div>
        <div className="track roadbar"><div className="fill" style={{ width: pct + "%" }} /><i style={{ left: pct + "%" }}><I /></i></div>
        <span className="tiny">{t.held ? `Customs held you for ${t.held} minutes. ` : ""}Nothing to do but look out the window until you get there.</span></div>
    </div></div>
  );
}

function CityShop({ city, onBought }) {
  const { me, run, busy, toast, showSheet } = useGame();
  const [s, setS] = useState(null);
  const load = () => call("city_shop").then(setS).catch(() => setS({ items: [] }));
  useEffect(() => { load(); }, [me.city]);
  if (!s) return <Empty title="Loading…" />;
  if (!s.open) return <Panel><Empty title="Not there yet">The shops open when you arrive.</Empty></Panel>;
  const room = s.cap - s.bag;
  const buy = (it, q) => run("city_buy", { p_item: it.item_id, p_qty: q }, r => { load(); onBought(); toast(`Bought ${r.qty > 1 ? r.qty + " × " : ""}${itemName(r.item)} for ${money(r.cost)}.`, "good"); });
  const search = () => run("city_search", {}, r => { load(); onBought();
    showSheet(r.caught ? { verdict: "Moved on", tone: "bad", title: `The back streets of ${r.city}`, story: `A police car pulled up beside you halfway down an alley. They didn't like your answers. You paid ${money(r.fine)} and they let you go.`, pic: <span className="thumb modeic"><Ic.Siren /></span> }
      : r.found ? { verdict: "Found something", tone: "good", title: `The back streets of ${r.city}`, story: `Tucked behind a bin, under a market stall or in a stranger's pocket: ${itemName(r.found)}.`, items: [r.found], pic: <ItemThumb id={r.found} /> }
      : { verdict: "Nothing", title: `The back streets of ${r.city}`, story: "You walked for an hour and saw a lot of closed doors. Nothing worth taking.", pic: <span className="thumb modeic"><Ic.Search /></span> }); });
  const Row = ({ it }) => { const max = Math.min(it.stock, room, Math.floor(me.cash / it.price)); return (
    <div className="li">
      <ItemThumb id={it.item_id} />
      <div><div className="t">{itemName(it.item_id)} <Rarity id={it.item_id} /></div>
        <div className="s">{money(it.price)} here, worth about {money(it.value)} at home. {it.stock ? `${it.stock} left` : "Sold out"}{it.next_at ? <>, next in <Countdown until={it.next_at} onDone={load} /></> : ""}.</div></div>
      <div className="act shopact"><button className="btn sm" disabled={busy || max < 1} onClick={() => buy(it, 1)}>Buy</button>{max > 1 && it.max > 1 && <button className="btn sm ghost" disabled={busy} onClick={() => buy(it, max)}>Buy {max}</button>}</div>
    </div>); };
  const legit = s.items.filter(it => IT[it.item_id]?.cat !== "contraband"), alley = s.items.filter(it => IT[it.item_id]?.cat === "contraband");
  return <>
    <div className="panel"><div className="body stack-sm">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><span className="row" style={{ gap: 6 }}><Ic.Backpack style={{ width: 18 }} /><b>Carrying {s.bag} of {s.cap}</b></span><span className="tiny">How you travelled sets how much you can bring back. Eat or sell something to make room.</span></div>
      <div className="track carry"><div className="fill" style={{ width: Math.min(100, s.bag / Math.max(1, s.cap) * 100) + "%", background: room <= 0 ? "var(--brick)" : "var(--seaglass)" }} /></div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 4 }}><button className="btn ghost sm" disabled={busy || room <= 0 || me.stamina < 10} onClick={search}><Ic.Search />Search the back streets (10 stamina)</button><span className="tiny">You might find something local. The police might find you.</span></div>
    </div></div>
    <Panel title={`Only in ${city.name}`} note="Stock is shared with everyone in town and comes back slowly. The rare things come back very slowly." flush>
      <div className="list">{legit.map(it => <Row key={it.item_id} it={it} />)}</div>
    </Panel>
    {alley.length > 0 && <Panel className="alley" title="Down a back alley" note="Worth several times as much at home. Customs search bags at the border, and they take everything they find." flush>
      <div className="list">{alley.map(it => <Row key={it.item_id} it={it} />)}</div>
    </Panel>}
  </>;
}
