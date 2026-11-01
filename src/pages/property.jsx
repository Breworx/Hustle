import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, Seg, Avatar, Name } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { perkList } from "../lib/perks.js";
import { HOME_ICON } from "./home.jsx";
import * as Ic from "../ui/icons.js";

const Pic = ({ id }) => { const I = HOME_ICON[id] || Ic.Building; return <span className="thumb homepic"><I /></span>; };
const vsMarket = (rent, market) => { const r = rent / market; return r <= 0.85 ? ["Cheap", "good"] : r <= 1.1 ? ["Fair", ""] : r <= 1.4 ? ["Pricey", "warn"] : ["Very pricey", "bad"]; };

function OwnedRow({ r, onChange }) {
  const { run, busy, toast } = useGame();
  const [rent, setRent] = useState(String(r.rent)); const [confirm, setConfirm] = useState(null);
  const [tag, tone] = vsMarket(+rent || r.rent, r.market);
  const status = r.tenant ? <>Rented to <button className="linkish" onClick={() => go("player/" + r.tenant.id)}>{r.tenant.name}</button>, who moved in {ago(r.since)}</>
    : r.npc ? <>Rented to {r.npc}, who moved in {ago(r.since)}</> : r.listed ? "Empty and advertised. Locals move in quicker when the rent's lower" : "Empty and not advertised";
  return (
    <div className="rental">
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <Pic id={r.property} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{r.name}</b>{r.earned > 0 && <span className="pill good">{money(r.earned)} rent waiting</span>}</div>
          <p className="tiny" style={{ marginTop: 2 }}>{status}{r.total ? `. ${money(r.total)} collected so far.` : "."}</p>
        </div>
      </div>
      <div className="rentctl">
        <label className="field">Rent a day
          <span className="row" style={{ gap: 6 }}><input className="input" type="number" inputMode="numeric" min="1" value={rent} onChange={e => setRent(e.target.value)} style={{ maxWidth: 140 }} />
            <span className={`pill ${tone}`}>{tag}</span></span>
          <span className="tiny">Going rate {money(r.market)} a day.</span></label>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", alignSelf: "flex-end" }}>
          <button className="btn sm" disabled={busy || !(+rent >= 1) || +rent === r.rent} onClick={() => run("rental_set", { p_id: r.id, p_rent: Math.floor(+rent), p_listed: r.listed }, () => { onChange(); toast(`Rent set to ${money(+rent)} a day.`, "good"); })}>Set rent</button>
          {!r.tenant && !r.npc && <button className="btn sm ghost" disabled={busy} onClick={() => run("rental_set", { p_id: r.id, p_rent: r.rent, p_listed: !r.listed }, onChange)}>{r.listed ? "Stop advertising" : "Advertise it"}</button>}
          {(r.tenant || r.npc) && (confirm === "evict" ? <button className="btn sm danger" disabled={busy} onClick={() => run("rental_evict", { p_id: r.id }, () => { setConfirm(null); onChange(); })}>Yes, evict</button>
            : <button className="btn sm ghost" onClick={() => setConfirm("evict")}>Evict</button>)}
          {confirm === "sell" ? <button className="btn sm danger" disabled={busy} onClick={() => run("rental_sell", { p_id: r.id }, x => { onChange(); toast(`Sold ${x.sold} for ${money(x.got)}.`, "good"); })}>Sell for {money(r.value + r.earned)}</button>
            : <button className="btn sm ghost" onClick={() => setConfirm("sell")}>Sell</button>}
        </div>
      </div>
    </div>
  );
}

export function Property() {
  const { me, run, busy, toast, showSheet } = useGame();
  const [d, setD] = useState(null); const [tab, setTab] = useState("mine");
  const load = () => call("rentals_state").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const waiting = d.owned.reduce((a, r) => a + r.earned, 0);
  const full = d.owned.length >= d.limit;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Property</h1><p>Buy places and rent them out at whatever you like. Charge less than the going rate and locals move in fast. Charge more and they're slow to come and quick to leave. Other players can rent your places to live in, and you can rent theirs.</p></div>
        <Seg label="Property" value={tab} onChange={setTab} options={[["mine", "Your places"], ["buy", "Buy"], ["rent", "Find a place to rent"]]} /></div>
      {d.renting && <div className="panel"><div className="body row" style={{ gap: 12, flexWrap: "wrap" }}>
        <Pic id={d.renting.property} />
        <div className="grow" style={{ minWidth: 0 }}><b>You're renting {d.renting.name.replace(/^(A|An) /, "a ")}</b>
          <p className="tiny">From <button className="linkish" onClick={() => go("player/" + d.renting.owner_id)}>{d.renting.owner}</button> at {money(d.renting.rent)} a day, taken from your cash then your bank. Fall behind and you're out. You get its perks while you live there.</p></div>
        <button className="btn sm ghost" disabled={busy} onClick={() => run("rental_leave", {}, x => { load(); toast(`You moved out of ${x.left.toLowerCase()}.`, "good"); })}>Move out</button>
      </div></div>}
      {tab === "mine" && <>
        <div className="panel"><div className="body row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="stack-sm"><b>{d.owned.length} of {d.limit} places</b><span className="tiny">You can own more as you level up.</span></div>
          <div className="row" style={{ gap: 10 }}><span><span className="tiny">Rent waiting</span><br /><b className="big-money">{money(waiting)}</b></span>
            <button className="btn good" disabled={busy || waiting < 1} onClick={() => run("rental_collect", {}, x => { load(); showSheet({ verdict: "Rent day", tone: "good", title: "Collected", cash: x.collected, story: "Envelopes under doors, bank transfers with rude references, and one tenant who paid in coins.", pic: <span className="thumb homepic"><Ic.KeyRound /></span> }); })}>Collect</button></div>
        </div></div>
        {d.owned.length === 0 ? <Panel><Empty title="No places yet">Buy your first one and set the rent. <button className="linkish" onClick={() => setTab("buy")}>See what's for sale</button></Empty></Panel>
          : <Panel flush><div className="rentals">{d.owned.map(r => <OwnedRow key={r.id} r={r} onChange={load} />)}</div></Panel>}
      </>}
      {tab === "buy" && <Panel title="For sale" note={full ? `You own ${d.limit}, your limit for now. Level up to buy more.` : "At the going rate, a place pays for itself in about 200 days. Sell it any time for 70% of what you paid."} flush>
        <div className="list">{d.catalogue.map(h => { const locked = me.level < h.lvl; return (
          <div key={h.id} className={`li ${locked ? "locked" : ""}`}>
            <Pic id={h.id} />
            <div><div className="t">{h.name}</div><div className="s">Rents for about {money(h.market)} a day.</div></div>
            <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {h.lvl}</span> :
              <button className="btn sm" disabled={busy || full || me.cash < h.price} onClick={() => run("rental_buy", { p_property: h.id }, x => { load(); setTab("mine"); toast(`You bought ${x.name.replace(/^(A|An) /, "a ")}. It's advertised at ${money(x.rent)} a day.`, "good"); })}>{money(h.price)}</button>}</div>
          </div>); })}</div>
      </Panel>}
      {tab === "rent" && <Panel title="Places to rent" note="Live somewhere better than you can afford to buy. Rent comes out every day, from your cash and then your bank." flush>
        {d.market.length === 0 ? <Empty title="Nothing to rent right now">When other players advertise an empty place, it shows up here.</Empty> :
        <div className="list">{d.market.map(r => { const locked = me.level < r.lvl; const [tag, tone] = vsMarket(r.rent, r.market); return (
          <div key={r.id} className={`li ${locked ? "locked" : ""}`}>
            <Pic id={r.property} />
            <div><div className="t">{r.name}</div>
              <div className="s">{money(r.rent)} a day from {r.owner} <span className={`pill ${tone}`}>{tag}</span></div>
              <div className="chips" style={{ marginTop: 6 }}>{perkList(r).slice(0, 4).map(([t, tn]) => <span key={t} className={`pill ${tn}`}>{t}</span>)}</div></div>
            <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {r.lvl}</span> :
              <button className="btn sm" disabled={busy || !!d.renting} onClick={() => run("rental_rent", { p_id: r.id }, x => { load(); toast(`You moved into ${x.name.replace(/^(A|An) /, "a ").toLowerCase()}.`, "good"); })}>Rent it</button>}</div>
          </div>); })}</div>}
      </Panel>}
    </div>
  );
}
