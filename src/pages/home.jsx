import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, ItemThumb, Rarity, Scarce } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { CAT, CATN, FILT, RAR, IT } from "../game/catalog.js";
import { useSupply } from "../lib/supply.js";
import * as Ic from "../ui/icons.js";

// ---------------- Home ----------------
export function Home() {
  const { me, run, busy, toast } = useGame();
  const [d, setD] = useState(null);
  const load = () => call("property_list").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const cur = d.homes.find(h => h.id === d.current);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Home</h1><p>Where you sleep sets your limits. A bigger place means a higher mood ceiling, which makes every gym session count for more, and the best homes add stamina too. When you move, your old place sells for 70% of what it cost.</p></div></div>
      <div className="stats">
        <div className="stat"><div className="k">You live in</div><div className="v" style={{ fontSize: 18 }}>{cur.name}</div></div>
        <div className="stat"><div className="k">Mood ceiling</div><div className="v">{num(me.max_mood)}</div></div>
        <div className="stat"><div className="k">Stamina ceiling</div><div className="v">{num(me.max_stamina)}</div></div>
      </div>
      <div className="homes">{d.homes.map(h => {
        const here = h.id === d.current, locked = me.level < h.lvl, net = h.price - Math.floor(cur.price * 0.7);
        return (
          <div key={h.id} className={`panel home ${here ? "here" : ""}`}>
            <div className="body stack-sm">
              <div className="row" style={{ justifyContent: "space-between" }}><h2>{h.name}</h2>{here ? <span className="pill good"><Ic.Check />You live here</span> : locked ? <span className="pill"><Ic.Lock />Level {h.lvl}</span> : null}</div>
              <p className="muted small">{h.blurb}</p>
              <div className="row small" style={{ flexWrap: "wrap", gap: 6 }}>{h.mood > 0 && <span className="pill">+{num(h.mood)} mood</span>}{h.stamina > 0 && <span className="pill">+{h.stamina} stamina</span>}<span className="pill">{h.price ? money(h.price) : "Free"}</span></div>
              {!here && <button className={`btn ${net < 0 ? "ghost" : ""}`} disabled={busy || locked || net > me.cash || me.status !== "ok"}
                onClick={() => run("property_move", { p_id: h.id }, r => { load(); toast(`Welcome home. ${r.paid >= 0 ? `Moving cost ${money(r.paid)}.` : `You pocketed ${money(-r.paid)} from the move.`}`, "good"); })}>
                {net >= 0 ? `Move in for ${money(net)}` : `Downsize and get ${money(-net)}`}</button>}
            </div>
          </div>); })}</div>
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
