import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, ItemThumb, Seg, Countdown, itemName, Rarity } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

export const MODE_ICON = { walk: Ic.Footprints, hitch: Ic.ThumbsUp, stow: Ic.Truck, bus: Ic.Bus, train: Ic.TrainFront, rental: Ic.Car, campervan: Ic.Caravan,
  flight: Ic.Plane, charter: Ic.PlaneTakeoff, own: Ic.Car };
export const mins = m => { m = Math.round(m); if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h} h ${r} min` : `${h} h`; };

// A rough outline of the two main islands (lat, lon), enough to place the cities.
const NORTH = [[-34.43,172.68],[-34.9,173.35],[-35.2,174.1],[-35.75,174.55],[-36.3,174.8],[-36.5,175.45],[-37.0,175.9],[-37.6,176.1],[-37.9,177.0],[-37.65,178.0],[-37.69,178.55],
  [-38.66,178.0],[-39.1,177.9],[-39.3,177.0],[-39.5,176.9],[-40.0,176.75],[-40.6,176.3],[-41.2,175.7],[-41.6,175.25],[-41.35,174.75],[-40.9,175.0],[-40.47,175.23],[-39.93,175.0],
  [-39.75,174.48],[-39.28,173.75],[-39.06,174.08],[-38.7,174.6],[-38.06,174.82],[-37.8,174.87],[-37.2,174.6],[-36.9,174.45],[-36.4,174.1],[-35.5,173.37],[-34.9,173.0],[-34.6,172.75]];
const SOUTH = [[-40.5,172.7],[-41.0,173.1],[-41.27,173.28],[-40.85,173.9],[-41.15,174.3],[-41.73,174.27],[-42.4,173.7],[-43.0,173.1],[-43.6,172.65],[-43.85,173.1],[-43.75,172.4],[-44.1,171.8],
  [-44.4,171.25],[-45.1,170.97],[-45.88,170.6],[-46.45,169.81],[-46.65,169.0],[-46.6,168.35],[-46.25,167.6],[-45.9,166.5],[-45.0,167.0],[-44.6,167.8],[-43.9,168.9],[-43.3,170.0],
  [-42.72,170.95],[-42.45,171.2],[-41.75,171.6],[-41.25,172.1],[-40.78,172.22]];
const RIGHT = new Set(["tga", "rot", "tpo", "npr", "wlg", "kai", "chc", "dud"]);
const X = lon => (lon - 166) * 0.75 * 34, Y = lat => (-lat - 34) * 34;
const path = pts => "M" + pts.map(([la, lo]) => `${X(lo).toFixed(1)} ${Y(la).toFixed(1)}`).join("L") + "Z";

function CountryMap({ cities, sel, onSel, me }) {
  const here = cities.find(c => c.here);
  return (
    <svg className="nzmap" viewBox="-10 -10 360 470" role="group" aria-label="Map of the country">
      <path d={path(NORTH)} className="land" /><path d={path(SOUTH)} className="land" />
      <circle cx={X(167.95)} cy={Y(-47.0)} r="7" className="land" />
      {sel && here && sel.id !== here.id && <line x1={X(here.lon)} y1={Y(here.lat)} x2={X(sel.lon)} y2={Y(sel.lat)} className="route" />}
      {cities.map(c => { const locked = me.level < c.lvl; return (
        <g key={c.id} className={`pin ${c.here ? "here" : ""} ${sel?.id === c.id ? "sel" : ""} ${locked ? "locked" : ""}`} transform={`translate(${X(c.lon)} ${Y(c.lat)})`}
          role="button" tabIndex={0} aria-label={`${c.name}${c.here ? ", you are here" : ""}`} onClick={() => onSel(c)} onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSel(c)}>
          <circle r={c.id === "home" ? 7 : 5.5} /><text x={RIGHT.has(c.id) ? 9 : -9} y="4" textAnchor={RIGHT.has(c.id) ? "start" : "end"}>{c.name}</text>
        </g>); })}
    </svg>
  );
}

function TripOptions({ d, c, onGo }) {
  const { me, busy } = useGame();
  if (me.level < c.lvl) return <p className="tiny"><Ic.Lock style={{ width: 14, verticalAlign: -2 }} /> {c.name} opens up at level {c.lvl}.</p>;
  if (d.blocked) return <p className="tiny">{d.blocked}</p>;
  return (
    <div className="list">{c.options.map(o => { const I = MODE_ICON[o.mode] || Ic.Car; return (
      <div key={o.mode} className={`li ${o.ok ? "" : "locked"}`}>
        <span className="thumb modeic"><I /></span>
        <div><div className="t">{o.name}</div>
          <div className="s">{o.mode === "hitch" ? `About ${mins(o.minutes)}, could be quicker or slower` : mins(o.minutes)}, {o.cost ? money(o.cost) : "free"}{o.ferry ? " with the ferry" : ""}. Carry {o.cap} things back.</div>
          <div className="tiny">{o.why ? <span className="bad">{o.why}</span> : o.risk > 0 ? `${o.blurb.split(".")[0]}. ${o.risk}% chance you're caught and fined.` : o.blurb}</div></div>
        <div className="act"><button className="btn sm" disabled={busy || !o.ok} onClick={() => onGo(c, o)}>Go</button></div>
      </div>); })}</div>
  );
}

export function Travel() {
  const { me, run, busy, toast, showSheet, refresh } = useGame();
  const [d, setD] = useState(null); const [sel, setSel] = useState(null); const [tab, setTab] = useState(me.status === "away" ? "shop" : "go");
  const load = () => call("travel_state").then(x => { setD(x); setSel(s => s ? x.cities.find(c => c.id === s.id) : x.cities.find(c => !c.here && c.lvl <= me.level && c.id !== "home") || x.cities[1]); }).catch(() => {});
  useEffect(() => { load(); }, [me.city, me.status]);
  if (!d) return <Empty title="Loading…" />;
  const here = d.cities.find(c => c.here);
  const goTrip = (c, o) => run("travel_go", { p_city: c.id, p_mode: o.mode }, r => {
    load();
    if (r.caught) showSheet({ verdict: "Caught", tone: "bad", title: "Stowing away", story: `The driver checked the load at the first stop and found you behind a pallet of milk powder. He called it in. You paid ${money(r.fine)} to make it go away and walked back into town.`, pic: <span className="thumb modeic"><Ic.Truck /></span> });
    else toast(`On your way to ${r.to}: ${mins(r.minutes)}${r.cost ? `, ${money(r.cost)}` : ""}.`, "good");
  });
  const away = !!me.city && me.city !== "home";
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Travel</h1><p>Get out of the city. Every town sells things you can't get at home, and most of them are worth more back here. How you travel decides how long it takes, what it costs and how much you can carry back.</p></div>
        <Seg label="Travel" value={tab} onChange={setTab} options={[["go", "Where to"], ...(away && !d.on_road ? [["shop", `Shop in ${here.name}`]] : []), ["gear", "Travel gear"]]} /></div>
      {d.on_road && <OnRoad d={d} onDone={() => { refresh(); load(); }} />}
      {tab === "go" && <div className="travelgrid">
        <div className="panel mappanel"><div className="body"><CountryMap cities={d.cities} sel={sel} onSel={setSel} me={me} />
          <p className="tiny" style={{ textAlign: "center" }}>{d.on_road ? `On the road to ${d.trip.to_name}.` : `You're in ${here.id === "home" ? "the city" : here.name}.`} Tap a town.</p></div></div>
        <div className="stack">
          {sel && <Panel title={sel.here ? (d.on_road ? `On your way to ${sel.name}` : sel.id === "home" ? "Home" : `You're in ${sel.name}`) : sel.name} note={`${sel.blurb}${sel.here ? "" : ` ${num(sel.km)} km away.`}`}>
            {sel.here ? (d.on_road ? <p className="tiny">The shops open when you arrive.</p> : sel.id === "home" ? <p className="tiny">Pick somewhere to go on the map.</p> : <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={() => setTab("shop")}><Ic.ShoppingBag />Shop in {sel.name}</button><button className="btn ghost" onClick={() => setSel(d.cities.find(c => c.id === "home"))}>Head home</button></div>)
              : d.on_road ? <p className="tiny">You can plan your next move once you arrive.</p> : <TripOptions d={d} c={sel} onGo={goTrip} />}
          </Panel>}
          <Panel title="Every town" flush>
            <div className="list">{d.cities.filter(c => !c.here).map(c => { const locked = me.level < c.lvl; return (
              <button key={c.id} className={`li click ${locked ? "locked" : ""} ${sel?.id === c.id ? "on" : ""}`} onClick={() => { setSel(c); window.scrollTo?.({ top: 0, behavior: "smooth" }); }}>
                <span className="thumb modeic"><Ic.MapPin /></span>
                <div><div className="t">{c.name}</div><div className="s">{num(c.km)} km{c.goods ? `, ${c.goods} local goods` : ""}{c.options[0] && !d.on_road ? `. Fastest: ${mins(c.options.find(o => o.ok)?.minutes ?? c.options[0].minutes)}` : ""}</div></div>
                <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {c.lvl}</span> : <Ic.ChevronRight style={{ width: 18 }} />}</div>
              </button>); })}</div>
          </Panel>
        </div>
      </div>}
      {tab === "shop" && <CityShop city={here} onBought={load} />}
      {tab === "gear" && <Panel title="Travel gear" note="Bought once, kept for good." flush>
        <div className="list">{d.gear.map(g => { const locked = me.level < g.lvl; return (
          <div key={g.id} className={`li ${locked ? "locked" : ""}`}>
            <span className="thumb modeic">{React.createElement({ sign: Ic.ThumbsUp, boots: Ic.Footprints, pack: Ic.Backpack, roofbox: Ic.Package, manifest: Ic.ScrollText, buspass: Ic.Bus, railpass: Ic.TrainFront, airpoints: Ic.Plane }[g.id] || Ic.Package)}</span>
            <div><div className="t">{g.name}</div><div className="s">{g.blurb}</div></div>
            <div className="act">{g.owned ? <span className="pill good"><Ic.Check />Yours</span> : locked ? <span className="pill"><Ic.Lock />Level {g.lvl}</span> :
              <button className="btn sm" disabled={busy || me.cash < g.price} onClick={() => run("travel_gear_buy", { p_gear: g.id }, () => { load(); toast(`${g.name}: yours.`, "good"); })}>{money(g.price)}</button>}</div>
          </div>); })}</div>
      </Panel>}
    </div>
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
      <div className="grow stack-sm"><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{t.from_name} to {t.to_name}</b><span className="tiny">{t.name}, arriving in <Countdown until={d.trip_until} onDone={onDone} /></span></div>
        <div className="track roadbar"><div className="fill" style={{ width: pct + "%" }} /><i style={{ left: pct + "%" }}><I /></i></div></div>
    </div></div>
  );
}

function CityShop({ city, onBought }) {
  const { me, run, busy, toast } = useGame();
  const [s, setS] = useState(null);
  const load = () => call("city_shop").then(setS).catch(() => setS({ items: [] }));
  useEffect(() => { load(); }, [me.city]);
  if (!s) return <Empty title="Loading…" />;
  if (!s.open) return <Panel><Empty title="Not there yet">The shops open when you arrive.</Empty></Panel>;
  const room = s.cap - s.bag;
  const buy = (it, q) => run("city_buy", { p_item: it.item_id, p_qty: q }, r => { load(); onBought(); toast(`Bought ${r.qty > 1 ? r.qty + " × " : ""}${itemName(r.item)} for ${money(r.cost)}.`, "good"); });
  return <>
    <div className="panel"><div className="body stack-sm">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><span className="row" style={{ gap: 6 }}><Ic.Backpack style={{ width: 18 }} /><b>Carrying {s.bag} of {s.cap}</b></span><span className="tiny">How you travelled sets how much you can bring back. Eat or sell something to make room.</span></div>
      <div className="track carry"><div className="fill" style={{ width: Math.min(100, s.bag / Math.max(1, s.cap) * 100) + "%", background: room <= 0 ? "var(--brick)" : "var(--seaglass)" }} /></div>
    </div></div>
    <Panel title={`Only in ${city.name}`} note="Stock is shared with everyone in town and comes back slowly. The rare things come back very slowly." flush>
      <div className="list">{s.items.map(it => { const max = Math.min(it.stock, room, Math.floor(me.cash / it.price)); return (
        <div key={it.item_id} className="li">
          <ItemThumb id={it.item_id} />
          <div><div className="t">{itemName(it.item_id)} <Rarity id={it.item_id} /></div>
            <div className="s">{money(it.price)} here, worth about {money(it.value)} at home. {it.stock ? `${it.stock} left` : "Sold out"}{it.next_at ? <>, next in <Countdown until={it.next_at} onDone={load} /></> : ""}.</div></div>
          <div className="act shopact"><button className="btn sm" disabled={busy || max < 1} onClick={() => buy(it, 1)}>Buy</button>{max > 1 && it.max > 1 && <button className="btn sm ghost" disabled={busy} onClick={() => buy(it, max)}>Buy {max}</button>}</div>
        </div>); })}</div>
    </Panel>
  </>;
}
