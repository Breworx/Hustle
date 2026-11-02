import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, ItemThumb, Rarity, Scarce, Countdown } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { CAT, CATN, FILT, RAR, IT } from "../game/catalog.js";
import { useSupply } from "../lib/supply.js";
import * as Ic from "../ui/icons.js";
import { perkList, dailyText } from "../lib/perks.js";

// ---------------- Home ----------------
export const HOME_ICON = { rough: Ic.DoorOpen, box: Ic.Package, tent: Ic.Tent, shelter: Ic.BedSingle, caravan: Ic.Caravan, van: Ic.Bus, couch: Ic.Sofa,
  student: Ic.GraduationCap, bedsit: Ic.Bed, boarding: Ic.DoorClosed, flat: Ic.Armchair, container: Ic.Container, unit: Ic.House, townhouse: Ic.HousePlus,
  villa: Ic.Trees, houseboat: Ic.Anchor, apartment: Ic.Building, loft: Ic.Warehouse, bungalow: Ic.Mountain, penthouse: Ic.Hotel, gated: Ic.Fence,
  mansion: Ic.Castle, vineyard: Ic.Grape, estate: Ic.TreePalm, lodge: Ic.MountainSnow, yacht: Ic.Ship, castle: Ic.Crown, tower: Ic.Building2,
  lighthouse: Ic.Waves, bridge: Ic.Landmark, moon: Ic.Rocket };
// Groups along the ladder, by position (1-based, inclusive).
export const HOME_STAGES = [["The street", 1, 6], ["A roof, sort of", 7, 12], ["Moving up", 13, 19], ["Serious money", 20, 25], ["Legend", 26, 31]];
export { perkList, dailyText };

export function Home() {
  const { me, run, busy, toast, refresh, showSheet } = useGame();
  const [d, setD] = useState(null);
  const load = () => call("property_list").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const cur = d.homes.find(h => h.id === d.current), idx = d.homes.indexOf(cur);
  const next = d.homes[idx + 1];
  const netFor = h => h.price - Math.floor(cur.price * 0.7);
  const CurIcon = HOME_ICON[cur.id] || Ic.House;
  const move = h => run("property_move", { p_id: h.id }, r => {
    load();
    if (h.sort > cur.sort) showSheet({ verdict: "Moved in", title: h.name, story: h.blurb, lines: perkList(h).map(x => x[0]), pic: <span className="thumb homepic">{React.createElement(HOME_ICON[h.id] || Ic.House)}</span> });
    else toast(`Moved to ${h.name.toLowerCase()}. You pocketed ${money(-r.paid)}.`, "good");
  });
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Home</h1><p>Everyone starts with nothing. Every step up the ladder raises your mood and stamina limits and brings its own perks. When you move, your old place sells for 70% of what it cost.</p></div></div>

      <div className={`panel homehero tier-${cur.sort}`}><div className="body">
        <span className="bigicon"><CurIcon /></span>
        <div className="stack-sm grow">
          <span className="tiny">You live in</span>
          <h2>{cur.name}</h2>
          <p className="muted small">{cur.blurb}</p>
          <div className="chips">{perkList(cur).map(([t, tone]) => <span key={t} className={`pill ${tone}`}>{t}</span>)}{perkList(cur).length === 0 && <span className="pill">No perks yet</span>}</div>
          {cur.perks?.daily && <div className="row" style={{ marginTop: 4 }}>
            <button className="btn good" disabled={busy || d.collected_today} onClick={() => run("home_collect", {}, r => { load(); refresh(); toast(`Collected ${dailyText(r)}.`, "good"); })}>
              {d.collected_today ? <>Collected. More in <Countdown until={d.next_collect} onDone={load} /></> : <><Ic.Gift />Collect {dailyText(cur.perks.daily)}</>}</button></div>}
        </div>
      </div></div>

      {next && <Panel title="Next step up" note={me.level < next.lvl ? `Opens at level ${next.lvl}` : null}>
        <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
          <span className="thumb homepic">{React.createElement(HOME_ICON[next.id] || Ic.House)}</span>
          <div className="grow" style={{ minWidth: 200 }}><b>{next.name}</b>
            <div className="xpbar" style={{ marginTop: 6 }}><i style={{ width: Math.min(100, (me.cash / Math.max(1, netFor(next))) * 100) + "%" }} /></div>
            <div className="tiny" style={{ marginTop: 4 }}>{me.cash >= netFor(next) ? "You can afford it now." : `${money(netFor(next) - me.cash)} to go. It costs ${money(netFor(next))} after selling your current place.`}</div></div>
          <button className="btn" data-tour="home" disabled={busy || me.level < next.lvl || me.cash < netFor(next) || me.status !== "ok"} onClick={() => move(next)}>Move in for {money(netFor(next))}</button>
        </div>
      </Panel>}

      <Panel title="The ladder" note={`${d.homes.length} homes, from a doorway to the Moon. You’re on step ${idx + 1}.`} flush>
        <ol className="ladder">{d.homes.map((h, i) => { const stage = HOME_STAGES.find(st => st[1] === i + 1); const here = h.id === cur.id, past = i < idx, locked = me.level < h.lvl, net = netFor(h); const Icon = HOME_ICON[h.id] || Ic.House; return (
          <React.Fragment key={h.id}>{stage && <li className="stage">{stage[0]}</li>}
          <li className={`rung ${here ? "here" : ""} ${past ? "past" : ""} ${locked ? "locked" : ""}`}>
            <span className="step">{i + 1}</span>
            <span className="thumb homepic"><Icon /></span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{h.name}</b>
                <span className="tiny">{h.price ? money(h.price) : "Free"}{h.lvl > 1 ? `, level ${h.lvl}` : ""}</span></div>
              <div className="chips" style={{ marginTop: 6 }}>{perkList(h).map(([t, tone]) => <span key={t} className={`pill ${tone}`}>{t}</span>)}</div>
              {h.names?.length > 0 && <div className="tiny" style={{ marginTop: 6 }}>{h.id === "tower" ? "Name on the tower: " : "Owned by "}{h.names.join(", ")}</div>}
            </div>
            <div className="act">{here ? <span className="pill good"><Ic.Check />You live here</span> : locked ? <span className="pill"><Ic.Lock />Level {h.lvl}</span> :
              <button className={`btn sm ${net < 0 ? "ghost" : ""}`} disabled={busy || net > me.cash || me.status !== "ok"} onClick={() => move(h)}>{net >= 0 ? `Move in for ${money(net)}` : `Downsize, get ${money(-net)}`}</button>}</div>
          </li></React.Fragment>); })}</ol>
      </Panel>
    </div>
  );
}

// ---------------- Collection ----------------
const ALL = CAT.filter(it => it.id !== "token");

export function Collection() {
  const [owned, setOwned] = useState(null); const [f, setF] = useState("all"); const [missing, setMissing] = useState(false); const [sel, setSel] = useState(null);
  useEffect(() => { call("my_collection").then(ids => setOwned(new Set(ids))).catch(() => setOwned(new Set())); }, []);
  const cats = FILT.find(x => x[0] === f)[2];
  const shown = useMemo(() => ALL.filter(it => (!cats || cats.includes(it.cat)) && (!missing || !owned?.has(it.id))).sort((a, b) => b.r - a.r || a.n.localeCompare(b.n)), [f, missing, owned]);
  const sup = useSupply(shown.map(it => it.id));
  if (!owned) return <Empty title="Loading…" />;
  const have = ALL.filter(it => owned.has(it.id)).length;
  const byCat = Object.keys(CATN).map(c => { const all = ALL.filter(it => it.cat === c); return [c, all.filter(it => owned.has(it.id)).length, all.length]; }).filter(x => x[2] > 0);
  const it = sel && IT[sel];
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Collection</h1><p>Every item you've ever owned is ticked off here, even if you've since sold it. {num(have)} of {num(ALL.length)} found.</p></div>
        <div className="collect-ring" style={{ "--p": (have / ALL.length) * 100 }}><b>{Math.round((have / ALL.length) * 100)}%</b></div></div>
      <div className="catbars">{byCat.map(([c, h, n]) => (
        <div key={c} className="catbar"><div className="row" style={{ justifyContent: "space-between" }}><span className="small">{CATN[c]}</span><span className="tiny">{h}/{n}</span></div>
          <div className="xpbar"><i style={{ width: (h / n) * 100 + "%" }} /></div></div>))}</div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="chips">{FILT.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
        <button className="chip" aria-pressed={missing} onClick={() => setMissing(!missing)} style={{ marginLeft: "auto" }}>Missing only</button>
      </div>
      {it && <div className="panel"><div className="body row" style={{ gap: 14, flexWrap: "wrap" }}>
        <ItemThumb id={it.id} lg />
        <div className="grow"><div className="small" style={{ color: RAR[it.r][1], fontWeight: 700 }}>{RAR[it.r][0]} {CATN[it.cat].toLowerCase()}</div><h2>{it.n}</h2><p className="muted small">{it.d}</p>
          <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>{owned.has(it.id) ? <span className="pill good"><Ic.Check />In your collection</span> : <span className="pill">Not found yet</span>}<Scarce s={sup[it.id]} /></div></div>
        <button className="btn ghost" onClick={() => go("market/" + it.id)}><Ic.Store />On the market</button>
      </div></div>}
      <div className="cgrid">{shown.map(x => (
        <button key={x.id} className={`cell ${owned.has(x.id) ? "got" : "missing"} ${sel === x.id ? "sel" : ""}`} onClick={() => setSel(x.id)} title={owned.has(x.id) ? x.n : "Not found yet"} aria-label={owned.has(x.id) ? x.n : `${RAR[x.r][0]} item, not found yet`}>
          <ItemThumb id={x.id} />{sup[x.id]?.[0] <= 10 && <span className="dot" />}
        </button>))}</div>
      {shown.length === 0 && <Empty title="You've found every one of these." />}
    </div>
  );
}
