import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, Avatar, Name, Countdown, Seg } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go, DISTRICT_NAMES } from "../lib/nav.js";
import { PERK_TEXT } from "../lib/perks.js";
import { pvpStory } from "../game/stories.js";
import * as Ic from "../ui/icons.js";

const linkBtn = { background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", textAlign: "left", fontWeight: 650 };
const Stars = ({ n }) => <span className="stars" aria-label={`${n} star${n === 1 ? "" : "s"}`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < n ? "on" : ""} />)}</span>;
const TYPE_ICON = { coffee: Ic.Coffee, carwash: Ic.Car, tattoo: Ic.Pencil, boxing: Ic.Dumbbell, clinic: Ic.Stethoscope, lawfirm: Ic.Scale, nightclub: Ic.PartyPopper,
  logistics: Ic.Truck, tech: Ic.Rocket, media: Ic.Megaphone };

// ---------------- Companies ----------------
export function Companies() {
  const { me, state, run, busy, toast } = useGame();
  const [d, setD] = useState(null); const [pick, setPick] = useState(null); const [name, setName] = useState(""); const [tab, setTab] = useState("browse");
  const load = () => call("company_list").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const T = Object.fromEntries(d.types.map(t => [t.id, t]));
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Companies</h1><p>Legitimate businesses run by players. Get a job at one, or start your own and hire. Everyone works one shift a day: the company earns money, the owner pays wages from it, and every shift builds reputation towards the next star. More stars mean more money, more staff and a stronger perk for everyone who works there.</p></div>
        <div className="row" style={{ flexWrap: "wrap" }}>{state.company && <button className="btn" onClick={() => go("company/" + state.company.id)}><Ic.Briefcase />{state.company.name}</button>}
          <Seg label="Companies" value={tab} onChange={setTab} options={[["browse", "Find a job"], ["sale", `For sale (${d.companies.filter(c => c.sale_price).length})`], ["start", "Start a business"]]} /></div></div>
      {tab === "sale" ? (<>
        <Panel flush title="Businesses for sale" note="Buy one and it's yours: the staff, the money in the bank and the stars. The seller pays a 5% broker's fee.">
          {d.companies.filter(c => c.sale_price).length === 0 ? <Empty title="Nothing's for sale right now">You can still make an offer on any company from its page.</Empty> :
          <div className="list">{d.companies.filter(c => c.sale_price).map(c => { const t = T[c.type]; const TI = TYPE_ICON[c.type] || Ic.Briefcase; const deal = c.sale_price < c.value; return (
            <button key={c.id} className="li click" onClick={() => go("company/" + c.id)}>
              <span className="thumb homepic"><TI /></span>
              <div><div className="t">{c.name}</div><div className="s">{t.name}, owned by {c.owner}. {c.staff} staff.</div><Stars n={c.stars} /></div>
              <div className="act" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}><b>{money(c.sale_price)}</b><span className={`tiny ${deal ? "good" : ""}`}>Worth about {money(c.value)}</span></div>
            </button>); })}</div>}
        </Panel>
        {d.recent_sales.length > 0 && <Panel title="Recent deals" flush><div className="list">{d.recent_sales.map((x, i) => (
          <div key={i} className="li"><Ic.Banknote style={{ width: 18, color: "var(--seaglass)" }} /><div><div className="t small">{x.buyer} bought {x.name} from {x.seller}</div><div className="s">{T[x.type]?.name}, {x.stars} star{x.stars === 1 ? "" : "s"}</div></div>
            <div className="act" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}><b>{money(x.price)}</b><span className="tiny">{ago(x.at)}</span></div></div>))}</div></Panel>}
      </>) : tab === "browse" ? (
        <Panel flush title="Companies in the city">
          {d.companies.length === 0 ? <Empty title="No companies yet">Be the first. Start a business and hire the street.</Empty> :
          <div className="list">{d.companies.map(c => { const t = T[c.type]; const TI = TYPE_ICON[c.type] || Ic.Briefcase; return (
            <div key={c.id} className="li">
              <span className="thumb homepic"><TI /></span>
              <div><button style={linkBtn} onClick={() => go("company/" + c.id)}>{c.name}</button>
                <div className="s">{t.name}, owned by {c.owner}. {c.staff} of {c.cap} staff. Perk for staff: {PERK_TEXT[t.perk](t.max * c.stars / 10)}.</div><div className="row" style={{ gap: 8 }}><Stars n={c.stars} />{c.sale_price && <span className="pill warn">For sale, {money(c.sale_price)}</span>}</div></div>
              <div className="act">{d.mine === c.id ? <span className="pill good">You work here</span> : d.mine ? null : c.applied ? <button className="btn ghost sm" disabled={busy} onClick={() => run("company_withdraw", { p_id: c.id }, load)}>Withdraw</button>
                : <button className="btn sm" disabled={busy || c.staff >= c.cap} onClick={() => run("company_apply", { p_id: c.id, p_note: "" }, () => { load(); toast(`Application sent to ${c.name}.`, "good"); })}>{c.staff >= c.cap ? "Full" : "Apply"}</button>}</div>
            </div>); })}</div>}
        </Panel>
      ) : (
        <div className="homes">{d.types.map(t => { const TI = TYPE_ICON[t.id] || Ic.Briefcase; const locked = me.level < t.lvl; return (
          <div key={t.id} className={`panel home ${pick === t.id ? "here" : ""}`}><div className="body stack-sm">
            <div className="row"><span className="thumb homepic"><TI /></span><div className="grow"><h2>{t.name}</h2><div className="tiny">{money(t.cost)} to start{t.lvl > 1 ? `, level ${t.lvl}` : ""}. {t.count} in the city.</div></div></div>
            <p className="muted small">{t.blurb}</p>
            <div className="chips"><span className="pill">About {money(t.base)} a shift per worker</span><span className="pill good">Staff perk up to: {PERK_TEXT[t.perk](t.max)}</span></div>
            {pick === t.id ? <form className="stack-sm" onSubmit={e => { e.preventDefault(); run("company_start", { p_type: t.id, p_name: name }, r => { toast(`${name} is open.`, "good"); go("company/" + r.id); }); }}>
                <label className="field">Name your business<input className="input" maxLength={30} value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. Harbour ${t.name.split(" ").pop()}`} autoFocus /></label>
                <div className="row"><button className="btn" disabled={busy || name.trim().length < 3}>Open for {money(t.cost)}</button><button type="button" className="btn ghost" onClick={() => setPick(null)}>Cancel</button></div></form>
              : <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} disabled={locked || !!state.company || me.cash < t.cost} onClick={() => { setPick(t.id); setName(""); }}>
                  {locked ? `Opens at level ${t.lvl}` : state.company ? "Leave your job first" : me.cash < t.cost ? `You need ${money(t.cost)}` : "Start one"}</button>}
          </div></div>); })}</div>
      )}
    </div>
  );
}

export function Company({ arg }) {
  const { me, state, run, busy, toast, showSheet, refresh } = useGame();
  const [c, setC] = useState(null); const [err, setErr] = useState(""); const [amt, setAmt] = useState(""); const [wages, setWages] = useState({}); const [closing, setClosing] = useState(false);
  const [ask, setAsk] = useState(""); const [offer, setOffer] = useState(""); const [buying, setBuying] = useState(false);
  const load = () => call("company_get", { p_id: +arg }).then(setC).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [arg]);
  if (err) return <Empty title={err} />;
  if (!c) return <Empty title="Loading…" />;
  const t = c.type; const TI = TYPE_ICON[t.id] || Ic.Briefcase;
  const act = (fn, args, msg) => run(fn, args, () => { load(); if (msg) toast(msg, "good"); });
  return (
    <div className="page">
      <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("companies")}>All companies</button>
      <div className="panel homehero tier-7"><div className="body">
        <span className="bigicon"><TI /></span>
        <div className="stack-sm grow"><span className="tiny">{t.name}, owned by {c.owner?.name}</span><h2>{c.name}</h2><Stars n={c.stars} />
          <div className="chips"><span className="pill good">Staff perk: {PERK_TEXT[t.perk](c.perk_now)}</span><span className="pill">{c.staff.length} of {c.cap} staff</span>
            {c.next_rep && <span className="pill">{c.next_rep - c.rep} shifts to the next star</span>}</div>
          {c.mine && <div className="row" style={{ marginTop: 4, flexWrap: "wrap" }}>
            <button className="btn good" disabled={busy || !c.can_shift || me.status !== "ok"} onClick={() => run("company_shift", {}, r => { load(); refresh();
              if (r.star_up) showSheet({ verdict: `${r.stars} stars`, title: c.name, story: "Word is getting round. More customers, more money, and room for more staff.", lines: [`+${money(r.revenue)} for the company`, r.paid ? `+${money(r.wage)} wage` : null].filter(Boolean), pic: <span className="thumb homepic"><TI /></span> });
              else toast(`Shift done. The company made ${money(r.revenue)}${r.wage ? (r.paid ? `, and paid you ${money(r.wage)}` : `, but couldn't pay your wage`) : ""}.`, r.wage && !r.paid ? "bad" : "good"); })}>
              {c.can_shift ? <><Ic.Clock />Work a shift</> : <>Next shift in <Countdown until={c.next_shift} onDone={load} /></>}</button>
            {!c.boss && <button className="btn ghost" disabled={busy} onClick={() => run("company_leave", {}, () => { refresh(); toast(`You quit ${c.name}.`); go("companies"); })}>Quit</button>}
          </div>}
          {!c.mine && !me.company_id && (c.applied ? <span className="pill" style={{ alignSelf: "flex-start" }}>Application sent</span> : <button className="btn" style={{ alignSelf: "flex-start" }} disabled={busy || c.staff.length >= c.cap} onClick={() => act("company_apply", { p_id: c.id, p_note: "" }, "Application sent.")}>Apply for a job</button>)}
        </div>
      </div></div>

      {!c.boss && <Panel title={c.sale_price ? `For sale: ${money(c.sale_price)}` : "Buy this business"}
        note={c.sale_price ? `Worth about ${money(c.value)}, going by its start-up cost, money in the bank, stars and staff.` : `It's not on the market, but you can make the owner an offer. Worth about ${money(c.value)}.`}>
        <div className="stack-sm">
          {c.sale_price && (buying
            ? <div className="row" style={{ flexWrap: "wrap" }}><span className="small">Buy {c.name} for {money(c.sale_price)}? You get its {c.staff.length - 1} staff and everything in its account.</span>
                <button className="btn good" disabled={busy} onClick={() => run("company_buy", { p_id: c.id, p_price: c.sale_price }, () => { setBuying(false); load(); refresh(); showSheet({ verdict: "It's yours", title: c.name, story: `You sign the papers in the back office. The keys are heavier than you expected. ${c.staff.length - 1 ? "The staff are waiting to meet their new boss." : ""}`, pic: <span className="thumb homepic"><TI /></span> }); })}>Buy it</button>
                <button className="btn ghost" onClick={() => setBuying(false)}>Not yet</button></div>
            : <div><button className="btn good" disabled={me.cash < c.sale_price || me.level < t.lvl || (me.company_id && me.company_id !== c.id)} onClick={() => setBuying(true)}><Ic.Banknote />Buy it for {money(c.sale_price)}</button>
                {me.level < t.lvl ? <span className="tiny"> You need level {t.lvl}.</span> : me.company_id && me.company_id !== c.id ? <span className="tiny"> Leave your current job first.</span> : me.cash < c.sale_price ? <span className="tiny"> You have {money(me.cash)} on you.</span> : null}</div>)}
          {me.company_id && me.company_id !== c.id && <p className="tiny">You already {state.company?.owner ? "own a business" : "work somewhere else"}. You can make an offer, but you'll need to {state.company?.owner ? "sell or close yours" : "leave your job"} before the deal can go through.</p>}
          {c.my_offer ? <div className="row" style={{ flexWrap: "wrap" }}><span className="small">You've offered {money(c.my_offer.amount)} ({ago(c.my_offer.at)}).</span><button className="btn ghost sm" disabled={busy} onClick={() => act("company_offer_cancel", { p_id: c.id }, "Offer withdrawn.")}>Withdraw offer</button></div>
            : <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}><label className="field">Your offer<input className="input" type="number" inputMode="numeric" min={1000} value={offer} onChange={e => setOffer(e.target.value)} placeholder={String(Math.round(c.value * 0.9))} style={{ maxWidth: 180 }} /></label>
                <button className="btn ghost" disabled={busy || !(+offer >= 1000) || +offer > me.cash} onClick={() => act("company_offer", { p_id: c.id, p_amount: +offer }, `Offer sent to ${c.owner?.name}.`)}>Make an offer</button></div>}
        </div>
      </Panel>}

      {c.mine && <div className="stats">
        <div className="stat"><div className="k">Company funds</div><div className="v">{money(c.funds)}</div></div>
        <div className="stat"><div className="k">Your shift earns it</div><div className="v">{money(c.revenue_me)}</div></div>
        <div className="stat"><div className="k">Daily wage bill</div><div className="v">{money(c.staff.reduce((a, s) => a + (s.is_owner ? 0 : s.wage || 0), 0))}</div></div>
      </div>}

      {c.boss && c.apps?.length > 0 && <Panel title="Job applications" flush>
        <div className="list">{c.apps.map(a => (
          <div key={a.id} className="li"><Avatar seed={a.id} look={a.look} />
            <div><button style={linkBtn} onClick={() => go("player/" + a.id)}><Name p={a} /></button><div className="s">Level {a.level}. Applied {ago(a.at)}. Would earn the company about {money(Math.round(t.base * (1 + 0.15 * (c.stars - 1)) * (0.8 + Math.min(0.7, a.level / 40))))} a shift.</div></div>
            <div className="act"><input className="input" type="number" min={0} style={{ width: 110 }} placeholder="Wage" value={wages[a.id] ?? Math.round(t.base * 0.5)} onChange={e => setWages({ ...wages, [a.id]: e.target.value })} aria-label={`Wage for ${a.name}`} />
              <button className="btn sm good" disabled={busy} onClick={() => act("company_decide", { p_player: a.id, p_accept: true, p_wage: +(wages[a.id] ?? Math.round(t.base * 0.5)) }, `${a.name} is hired.`)}>Hire</button>
              <button className="btn ghost sm" disabled={busy} onClick={() => act("company_decide", { p_player: a.id, p_accept: false })}>Turn down</button></div>
          </div>))}</div>
      </Panel>}

      <div className="cols-2">
        <Panel title="Staff" note={c.mine ? "Each shift earns the company money based on the worker's level." : null} flush>
          <div className="list">{c.staff.map(s => (
            <div key={s.id} className="li"><Avatar seed={s.id} look={s.look} />
              <div><button style={linkBtn} onClick={() => go("player/" + s.id)}><Name p={s} /></button>
                <div className="s">{s.is_owner ? "Owner" : "Staff"}, level {s.level}. {num(s.shifts)} shift{s.shifts === 1 ? "" : "s"}{s.worked_today ? ", worked today" : ""}.{c.mine && !s.is_owner ? ` Paid ${money(s.wage)} a shift.` : ""}</div></div>
              <div className="act">{c.boss && !s.is_owner && <>
                <input className="input" type="number" min={0} style={{ width: 100 }} value={wages[s.id] ?? s.wage} onChange={e => setWages({ ...wages, [s.id]: e.target.value })} aria-label={`Wage for ${s.name}`} />
                <button className="btn ghost sm" disabled={busy || +(wages[s.id] ?? s.wage) === s.wage} onClick={() => act("company_staff", { p_player: s.id, p_action: "wage", p_wage: +wages[s.id] }, "Wage updated.")}>Set wage</button>
                <button className="btn ghost sm" disabled={busy} onClick={() => act("company_staff", { p_player: s.id, p_action: "fire" })}>Let go</button></>}</div>
            </div>))}</div>
        </Panel>
        {c.mine && <div className="stack">
          {c.boss && <Panel title="Sell the business" note={`Worth about ${money(c.value)}. The buyer gets the staff and the ${money(c.funds)} in the bank. You pay a 5% broker's fee.`}>
            <div className="stack-sm">
              {c.sale_price ? <div className="row" style={{ flexWrap: "wrap" }}><span className="pill warn">Listed at {money(c.sale_price)} {ago(c.listed_at)}</span>
                <button className="btn ghost sm" disabled={busy} onClick={() => act("company_sell", { p_price: null }, "Taken off the market.")}>Take it off the market</button></div> : null}
              <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}><label className="field">{c.sale_price ? "Change the asking price" : "Asking price"}<input className="input" type="number" inputMode="numeric" min={1000} value={ask} onChange={e => setAsk(e.target.value)} placeholder={String(c.value)} style={{ maxWidth: 180 }} /></label>
                <button className="btn" disabled={busy || !(+ask >= 1000)} onClick={() => act("company_sell", { p_price: +ask }, `Listed for ${money(+ask)}.`)}>{c.sale_price ? "Update price" : "Put it up for sale"}</button></div>
              {c.offers?.length > 0 && <div className="list" style={{ borderTop: "1px solid var(--rope)", marginTop: 6 }}>{c.offers.map(o => (
                <div key={o.offer_id} className="li" style={{ paddingLeft: 0, paddingRight: 0 }}><Avatar seed={o.id} look={o.look} />
                  <div><div className="t"><Name p={o} /> offers {money(o.amount)}</div><div className="s">{ago(o.at)}{o.can_afford ? "" : ". They don't have the cash on them right now."}</div></div>
                  <div className="act"><button className="btn sm good" disabled={busy || !o.can_afford} onClick={() => run("company_offer_decide", { p_offer: o.offer_id, p_accept: true }, () => { refresh(); toast(`Sold to ${o.name} for ${money(o.amount)}.`, "good"); go("companies"); })}>Accept</button>
                    <button className="btn ghost sm" disabled={busy} onClick={() => act("company_offer_decide", { p_offer: o.offer_id, p_accept: false })}>Decline</button></div>
                </div>))}</div>}
            </div>
          </Panel>}
          {c.sales?.length > 0 && <Panel title="Ownership history" flush><div className="list">{c.sales.map((x, i) => <div key={i} className="li"><Ic.Banknote style={{ width: 16, color: "var(--mist)" }} /><div className="s" style={{ color: "var(--fog)" }}>{x.buyer} bought it from {x.seller} for {money(x.price)}.</div><div className="act tiny">{ago(x.at)}</div></div>)}</div></Panel>}
          {c.boss && <Panel title="Company money" note="Wages come out of this. If it runs dry, staff go unpaid.">
            <div className="stack-sm">
              <input className="input" type="number" inputMode="numeric" min={1} value={amt} onChange={e => setAmt(e.target.value)} placeholder="Amount" aria-label="Amount" />
              <div className="row"><button className="btn" disabled={busy || !(+amt > 0)} onClick={() => run("company_funds", { p_amount: +amt }, () => { load(); setAmt(""); toast("Paid in.", "good"); })}>Put money in</button>
                <button className="btn ghost" disabled={busy || !(+amt > 0) || +amt > c.funds} onClick={() => run("company_funds", { p_amount: -amt }, () => { load(); setAmt(""); toast("Taken out.", "good"); })}>Take money out</button></div>
            </div>
          </Panel>}
          <Panel title="What's been happening" flush>
            <div className="list">{(c.log || []).map((l, i) => <div key={i} className="li"><Ic.Briefcase style={{ width: 16, color: "var(--mist)" }} /><div className="s" style={{ color: "var(--fog)" }}>{l.body}</div><div className="act tiny">{ago(l.at)}</div></div>)}</div>
          </Panel>
          {c.boss && (closing
            ? <div className="panel"><div className="body stack-sm"><b>Close {c.name}?</b><p className="small muted">Your staff lose their jobs. You get the company's {money(c.funds)} back plus {money(Math.floor(t.cost * 0.5))}, half of what it cost to start.</p>
                <div className="row"><button className="btn danger" disabled={busy} onClick={() => run("company_leave", {}, r => { refresh(); toast(`Closed. You got ${money(r.refund)} back.`); go("companies"); })}>Close it down</button><button className="btn ghost" onClick={() => setClosing(false)}>Keep it open</button></div></div></div>
            : <button className="btn ghost" onClick={() => setClosing(true)}>Close the business</button>)}
        </div>}
      </div>
    </div>
  );
}

// ---------------- Crew war room ----------------
const HINT = { "much weaker": "good", weaker: "good", even: "warn", stronger: "bad", "much stronger": "bad" };
const STATUS = { ok: "Out and about", jail: "In the cells", hosp: "In A&E", travel: "In a taxi" };
export function WarRoom() {
  const { me, state, run, busy, toast, showSheet } = useGame();
  const [d, setD] = useState(null); const [confirm, setConfirm] = useState(null); const [surrender, setSurrender] = useState(false);
  const load = () => call("war_state").then(setD).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  if (!d) return <Empty title="Loading…" />;
  if (!state.crew) return (
    <div className="page"><div className="pagehead"><div><h1>War room</h1><p>Crews go to war over turf, grudges and money. Join or start a crew to take part.</p></div></div>
      <Panel><Empty title="You're not in a crew"><button className="btn" style={{ marginTop: 10 }} onClick={() => go("crews")}>Find a crew</button></Empty></Panel></div>);
  const w = d.war;
  if (!w) return (
    <div className="page">
      <div className="pagehead"><div><h1>War room</h1><p>A crew leader can declare war on another crew for $100,000 from the crew vault. Wars last 48 hours. Members can attack the enemy anywhere in the city, and every win scores points: bigger targets are worth more. The winners take 20% of the losers' vault and a lot of respect, and everyone who landed a hit gets a war trophy.</p></div></div>
      {d.last && <Panel title="Your last war"><p>{d.last.result === "won" ? `You beat ${d.last.vs}, ${Math.round(d.last.ours)} to ${Math.round(d.last.theirs)}, and took ${money(d.last.loot)}.` : d.last.result === "lost" ? `${d.last.vs} beat you, ${Math.round(d.last.theirs)} to ${Math.round(d.last.ours)}, and took ${money(d.last.loot)}.` : `A draw with ${d.last.vs}.`} <span className="tiny">{ago(d.last.at)}</span></p></Panel>}
      {d.role === "leader" ? <Panel title="Declare war" flush>
        {d.targets.length === 0 ? <Empty title="There are no other crews yet" /> : <div className="list">{d.targets.map(c => (
          <div key={c.id} className="li"><span className="crewmark">{c.tag}</span>
            <div><button style={linkBtn} onClick={() => go("crew/" + c.id)}>{c.name}</button><div className="s">{c.members} members, {num(c.respect)} respect.{c.block ? ` ${c.block}` : ""}</div></div>
            <div className="act">{confirm === c.id ? <><button className="btn danger sm" disabled={busy} onClick={() => run("war_declare", { p_crew: c.id }, () => { setConfirm(null); load(); toast(`War declared on ${c.name}.`, "bad"); })}>Yes, $100,000</button><button className="btn ghost sm" onClick={() => setConfirm(null)}>Not yet</button></>
              : <button className="btn danger sm" disabled={busy || !!c.block} onClick={() => setConfirm(c.id)}><Ic.Swords />Declare war</button>}</div>
          </div>))}</div>}
      </Panel> : <Panel><Empty title="No war on">Only your crew's leader can declare war.</Empty></Panel>}
    </div>);
  const lead = w.us.score >= w.them.score;
  const pctUs = (w.us.score + w.them.score) ? (w.us.score / (w.us.score + w.them.score)) * 100 : 50;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>War with {w.them.name}</h1><p>{w.we_declared ? "You declared it." : "They declared it."} Attack their members anywhere in the city. Bigger targets are worth more. You can hit the same person again after three minutes.</p></div>
        <span className="pill bad">Ends in <Countdown until={w.ends_at} onDone={load} /></span></div>
      <div className="panel warscore"><div className="body">
        <div className="side"><span className="crewmark lg">{w.us.tag}</span><div><div className="tiny">{w.us.name}</div><div className="big">{num(Math.round(w.us.score * 10) / 10)}</div></div></div>
        <div className="mid"><div className="bar"><i style={{ width: pctUs + "%" }} /></div><div className="tiny">{w.us.score === w.them.score ? "Level" : lead ? "You're winning" : "You're behind"}</div></div>
        <div className="side right"><div><div className="tiny">{w.them.name}</div><div className="big">{num(Math.round(w.them.score * 10) / 10)}</div></div><span className="crewmark lg enemy">{w.them.tag}</span></div>
      </div></div>
      <div className="cols-2">
        <Panel title="Targets" note="Their members, strongest first." flush>
          <div className="list">{d.enemies.map(t => { const cool = t.cooldown && new Date(t.cooldown) > Date.now(); const can = t.status === "ok" && !t.protected && !cool && me.status === "ok" && me.stamina >= 25 && me.level >= 3; return (
            <div key={t.id} className="li"><Avatar seed={t.id} look={t.look} />
              <div><button style={linkBtn} onClick={() => go("player/" + t.id)}><Name p={t} tag={false} /></button>
                <div className="s">Level {t.level} in {DISTRICT_NAMES[t.district]}. {STATUS[t.status]}{t.status !== "ok" && t.until ? <> for <Countdown until={t.until} onDone={load} /></> : ""}. Looks <span className={HINT[t.power_hint]}>{t.power_hint}</span>. Worth {t.worth} points.</div></div>
              <div className="act">{t.protected ? <span className="pill">New in town</span> : cool ? <span className="tiny">Again in <Countdown until={t.cooldown} onDone={load} /></span> :
                <button className="btn sm danger" disabled={busy || !can} onClick={() => run("attack", { p_target: t.id }, r => { load(); showSheet({ verdict: r.won ? `+${r.war_pts} war points` : "You lost", tone: r.won ? "good" : "bad", title: `You hit ${r.name}`, story: pvpStory(r), cash: r.won ? r.cash : 0, lines: [r.won ? `+${r.xp} xp` : `${Math.ceil(r.secs / 60)} min in A&E. ${w.them.name} score a point.`], pic: <Avatar seed={t.id} look={t.look} /> }); })}>Attack</button>}</div>
            </div>); })}</div>
        </Panel>
        <div className="stack">
          <Panel title="Top fighters" flush>
            {d.board.length === 0 ? <Empty title="No hits yet" /> : <div className="list">{d.board.map((b, i) => (
              <div key={b.id} className="li" style={b.ours ? undefined : { opacity: .75 }}><span className={`stepdot ${b.ours ? "done" : ""}`}>{i + 1}</span>
                <div><div className="t"><Name p={b} tag={false} /></div><div className="s">{b.ours ? w.us.tag : w.them.tag}, {b.hits} hit{b.hits === 1 ? "" : "s"}</div></div><div className="act"><b>{num(Math.round(b.pts * 10) / 10)}</b></div></div>))}</div>}
          </Panel>
          <Panel title="Latest" flush>
            {d.feed.length === 0 ? <Empty title="Quiet, for now" /> : <div className="list">{d.feed.map((f, i) => (
              <div key={i} className="li"><Ic.Swords style={{ width: 16, color: f.ours ? "var(--seaglass)" : "var(--brick)" }} />
                <div className="s" style={{ color: "var(--fog)" }}>{f.pts > 1 ? `${f.who} put ${f.target} in A&E${f.cash ? ` and took ${money(f.cash)}` : ""}.` : `${f.who} fought off ${f.target}.`} <b>+{f.pts}</b></div><div className="act tiny">{ago(f.at)}</div></div>))}</div>}
          </Panel>
          {d.role === "leader" && (surrender ? <div className="panel"><div className="body stack-sm"><b>Surrender to {w.them.name}?</b><p className="small muted">The war ends now and they win. They take 20% of your vault and 50 of your crew's respect.</p>
              <div className="row"><button className="btn danger" disabled={busy} onClick={() => run("war_surrender", {}, () => { load(); toast("You surrendered."); })}>Surrender</button><button className="btn ghost" onClick={() => setSurrender(false)}>Keep fighting</button></div></div></div>
            : <button className="btn ghost" onClick={() => setSurrender(true)}>Surrender</button>)}
        </div>
      </div>
    </div>
  );
}
