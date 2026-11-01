import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, ItemThumb, Avatar, Name, Countdown, Seg, Scarce } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { perkList, PERK_TEXT } from "../lib/perks.js";
import { IT, RAR } from "../game/catalog.js";
import { FOES, CRIMES } from "../game/content.js";
import { DISTRICT_NAMES } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

const pc = x => Math.round(x * 100) + "%";

// ---------------- Garage ----------------
const CAR_ICON = { foot: Ic.Footprints, bike: Ic.Bike, scooter: Ic.Bike, moped: Ic.Bike, hatch: Ic.Car, ute: Ic.Truck, roadbike: Ic.Bike, muscle: Ic.CarFront,
  suv: Ic.Truck, sports: Ic.CarFront, limo: Ic.Car, hyper: Ic.CarFront, heli: Ic.Plane, seaplane: Ic.Sailboat, jet: Ic.Plane, sub: Ic.Anchor };
export function Garage() {
  const { me, run, busy, toast, showSheet } = useGame();
  const [d, setD] = useState(null);
  const load = () => call("vehicle_list").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const cur = d.vehicles.find(v => v.id === d.current), idx = d.vehicles.indexOf(cur);
  const net = v => v.price - Math.floor(cur.price * 0.7);
  const Icon = CAR_ICON[cur.id] || Ic.Car;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Garage</h1><p>Your ride decides how fast you get around the city, how much the taxi costs, and how clean your getaways are. Trading up sells your current one for 70% of what it cost.</p></div></div>
      <div className={`panel homehero tier-${Math.min(12, idx + 1)}`}><div className="body">
        <span className="bigicon"><Icon /></span>
        <div className="stack-sm grow"><span className="tiny">You get around by</span><h2>{cur.name}</h2><p className="muted small">{cur.blurb}</p>
          <div className="chips">{perkList(cur).map(([t, tone]) => <span key={t} className={`pill ${tone}`}>{t}</span>)}{perkList(cur).length === 0 && <span className="pill">No perks yet</span>}</div></div>
      </div></div>
      <Panel title="Every ride in the city" note={`${d.vehicles.length} of them, from your own two feet to a private submarine.`} flush>
        <ol className="ladder">{d.vehicles.map((v, i) => { const here = v.id === cur.id, past = i < idx, locked = me.level < v.lvl, n = net(v); const VI = CAR_ICON[v.id] || Ic.Car; return (
          <li key={v.id} className={`rung ${here ? "here" : ""} ${past ? "past" : ""} ${locked ? "locked" : ""}`}>
            <span className="step">{i + 1}</span><span className="thumb homepic"><VI /></span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{v.name}</b><span className="tiny">{v.price ? money(v.price) : "Free"}{v.lvl > 1 ? `, level ${v.lvl}` : ""}</span></div>
              <p className="tiny" style={{ marginTop: 2 }}>{v.blurb}</p>
              <div className="chips" style={{ marginTop: 6 }}>{perkList(v).map(([t, tone]) => <span key={t} className={`pill ${tone}`}>{t}</span>)}</div>
            </div>
            <div className="act">{here ? <span className="pill good"><Ic.Check />Yours</span> : locked ? <span className="pill"><Ic.Lock />Level {v.lvl}</span> :
              <button className={`btn sm ${n < 0 ? "ghost" : ""}`} disabled={busy || n > me.cash} onClick={() => run("vehicle_buy", { p_id: v.id }, r => { load();
                if (v.price > cur.price) showSheet({ verdict: "New ride", title: v.name, story: v.blurb, lines: perkList(v).map(x => x[0]), pic: <span className="thumb homepic"><VI /></span> });
                else toast(`Traded down. You pocketed ${money(-r.paid)}.`, "good"); })}>{n >= 0 ? `Buy for ${money(n)}` : `Trade down, get ${money(-n)}`}</button>}</div>
          </li>); })}</ol>
      </Panel>
    </div>
  );
}

// ---------------- Career ----------------
const CAREER_ICON = { kitchen: Ic.ChefHat, security: Ic.Shield, docks: Ic.HardHat, medicine: Ic.Stethoscope, law: Ic.Scale, finance: Ic.Banknote };
export function Career() {
  const { me, run, busy, toast, showSheet } = useGame();
  const [d, setD] = useState(null); const [confirm, setConfirm] = useState(null);
  const load = () => call("career_state").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const c = d.careers.find(x => x.id === d.career);
  const nxt = c && d.steps[d.rank];
  const perkNow = c ? PERK_TEXT[c.perk](c.max * d.rank / 10) : null;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Career</h1><p>A legitimate day job. Clock in once a day for a wage, and enough shifts at a high enough level get you promoted. Every rank makes your career's perk stronger.</p></div></div>
      {c ? (
        <div className="panel homehero tier-6"><div className="body">
          <span className="bigicon">{React.createElement(CAREER_ICON[c.id] || Ic.Briefcase)}</span>
          <div className="stack-sm grow">
            <span className="tiny">{c.name}, rank {d.rank} of 10</span><h2>{c.ranks[d.rank - 1]}</h2>
            <div className="chips"><span className="pill good">{money(c.wages[d.rank - 1])} a shift</span><span className="pill good">{perkNow}</span></div>
            {nxt ? <div style={{ maxWidth: 420 }}><div className="xpbar"><i style={{ width: Math.min(100, (d.shifts / nxt.shifts) * 100) + "%" }} /></div>
              <div className="tiny" style={{ marginTop: 4 }}>Next: {c.ranks[d.rank]} after {nxt.shifts} shifts{me.level < nxt.lvl ? ` and level ${nxt.lvl}` : ""}. You've worked {d.shifts}.</div></div>
              : <div className="tiny">Top of the profession.</div>}
            <div className="row" style={{ marginTop: 4 }}><button className="btn good" disabled={busy || !d.can_shift || me.status !== "ok"} onClick={() => run("career_shift", {}, r => { load();
              if (r.promoted) showSheet({ verdict: "Promoted", title: r.title, story: `Your boss shakes your hand and hands you a new badge. The pay's better and so is the perk.`, cash: r.wage, pic: <span className="thumb homepic">{React.createElement(CAREER_ICON[c.id])}</span> });
              else toast(`Shift done. +${money(r.wage)}.`, "good"); })}>
              {d.can_shift ? <><Ic.Clock />Clock in for {money(c.wages[d.rank - 1])}</> : <>Next shift in <Countdown until={d.next_shift} onDone={load} /></>}</button></div>
          </div>
        </div></div>
      ) : <Panel><Empty title="You don't have a job yet">Pick a career below. You can change later, but you start again at the bottom.</Empty></Panel>}
      <div className="homes">{d.careers.map(x => { const mine = x.id === d.career; const CI = CAREER_ICON[x.id] || Ic.Briefcase; return (
        <div key={x.id} className={`panel home ${mine ? "here" : ""}`}><div className="body stack-sm">
          <div className="row"><span className="thumb homepic"><CI /></span><div className="grow"><h2>{x.name}</h2><div className="tiny">{x.ranks[0]} to {x.ranks[9]}</div></div></div>
          <p className="muted small">{x.blurb}</p>
          <div className="chips"><span className="pill">{money(x.wages[0])} to {money(x.wages[9])} a shift</span><span className="pill good">Up to: {PERK_TEXT[x.perk](x.max)}</span></div>
          {mine ? <span className="pill good" style={{ alignSelf: "flex-start" }}><Ic.Check />Your career</span> : confirm === x.id
            ? <div className="row"><button className="btn sm" disabled={busy} onClick={() => run("career_join", { p_id: x.id }, r => { setConfirm(null); load(); toast(`You start as a ${r.title.toLowerCase()} on Monday. Actually, today.`, "good"); })}>Yes, start over</button><button className="btn ghost sm" onClick={() => setConfirm(null)}>Keep my job</button></div>
            : <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => d.career ? setConfirm(x.id) : run("career_join", { p_id: x.id }, r => { load(); toast(`You start as a ${r.title.toLowerCase()}.`, "good"); })}>{d.career ? "Switch to this" : "Start here"}</button>}
          {confirm === x.id && <p className="tiny">Switching starts you at rank 1 again.</p>}
        </div></div>); })}</div>
    </div>
  );
}

// ---------------- Medals ----------------
const STAT_LABEL = { level: "Level", jobs: "Jobs", wins: "Fights", busts: "The Cells", collection: "Collection", legendary: "Legendary finds", oneofone: "One of one",
  home: "Home", vehicle: "Garage", networth: "Wealth", streak: "Daily streak", sales: "Market", blocks: "Exchange", thief: "Thieving", fight: "Fighting",
  fit: "Fitness", trade: "Trading", missions: "Stories", career: "Career", turf: "Turf", days: "Time served", founder: "Founder", events: "Events", power: "Power" };
export function Medals({ arg }) {
  const { me, run, busy, toast } = useGame();
  const [d, setD] = useState(null); const [f, setF] = useState("all");
  const load = () => call("medals_state", { p_player: arg || null }).then(setD).catch(() => {});
  useEffect(() => { load(); }, [arg]);
  if (!d) return <Empty title="Loading…" />;
  const mine = !arg || arg === me.id;
  const earned = Object.keys(d.earned).length;
  const groups = [...new Set(d.medals.map(m => m.stat))];
  const shown = d.medals.filter(m => f === "all" || (f === "got" ? d.earned[m.id] : !d.earned[m.id]));
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Medals</h1><p>{mine ? `You've earned ${earned} of ${d.medals.length}. They come automatically as your numbers grow. Wear any one you've earned as your title.` : `${earned} of ${d.medals.length} earned.`}</p></div>
        <div className="collect-ring" style={{ "--p": (earned / d.medals.length) * 100 }}><b>{earned}</b></div></div>
      {mine && <div className="row" style={{ flexWrap: "wrap" }}><span className="small">Your title: <b>{d.title || "none"}</b></span>{d.title && <button className="btn ghost sm" disabled={busy} onClick={() => run("title_set", { p_medal: null }, () => { load(); toast("Title removed."); })}>Remove</button>}</div>}
      <Seg label="Show" value={f} onChange={setF} options={[["all", "All"], ["got", "Earned"], ["todo", "Still to get"]]} />
      {groups.map(g => { const ms = shown.filter(m => m.stat === g); if (!ms.length) return null; const val = d.stats[g] || 0; return (
        <Panel key={g} title={STAT_LABEL[g] || g} note={g === "networth" ? `You: ${money(val)}` : `You: ${num(val)}`}>
          <div className="medals">{ms.map(m => { const got = d.earned[m.id]; const rare = m.holders / Math.max(1, d.players); return (
            <div key={m.id} className={`medal ${got ? "got" : ""} t${Math.min(5, Math.ceil(m.tier / m.tiers * 5))}`}>
              <span className="disc">{got ? <Ic.Award /> : <Ic.Lock />}</span>
              <div className="grow" style={{ minWidth: 0 }}><b>{m.name}</b><div className="tiny">{m.what}</div>
                <div className="tiny">{got ? `Earned ${ago(d.earned[m.id])}` : `${num(Math.min(val, m.at))} of ${num(m.at)}`}{m.holders ? `, held by ${rare < 0.01 ? "under 1%" : pc(rare)} of players` : ", nobody has this yet"}</div></div>
              {mine && got && <button className="btn ghost sm" disabled={busy || d.title === m.name} onClick={() => run("title_set", { p_medal: m.id }, () => { load(); toast(`You're now known as ${m.name}.`, "good"); })}>{d.title === m.name ? "Wearing" : "Wear"}</button>}
            </div>); })}</div>
        </Panel>); })}
    </div>
  );
}

// ---------------- Story missions ----------------
const FOE_NAME = Object.fromEntries(FOES.map(f => [f.n.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), f.n]));
const JOB_NAME = Object.fromEntries(CRIMES.map(c => [c.id, c.n]));
export function objText(k, n) {
  const [a, b] = k.split(":");
  const t = { job: `Do ${n} job${n > 1 ? "s" : ""}`, jobcash: `Make ${money(n)} from jobs`, train: `Train ${n} sets at the gym`, fight_win: `Win ${n} fight${n > 1 ? "s" : ""}`,
    bust: `Spring ${n} ${n > 1 ? "people" : "person"} from the cells`, travel: `Take ${n} taxi${n > 1 ? "s" : ""}`, market: `Buy or sell on the market ${n > 1 ? n + " times" : ""}`.trim(),
    stock: `Buy shares ${n > 1 ? n + " times" : ""}`.trim(), use: `Use ${n} item${n > 1 ? "s" : ""}`, home: `Move up the home ladder${n > 1 ? " " + n + " times" : ""}`,
    vehicle: "Buy a better ride", shift: `Work ${n} shift${n > 1 ? "s" : ""}`, crew: "Join or start a crew" }[a];
  if (b && a === "job") return `${JOB_NAME[b] || b}${n > 1 ? `, ${n} times` : ""}`;
  if (b && a === "fight") return `Beat the ${(FOE_NAME[b] || b).replace(/^The /, "").toLowerCase()}${n > 1 ? ` ${n} times` : ""}`;
  if (b && a === "travel") return `Go to ${DISTRICT_NAMES[b] || b}`;
  return t || k;
}
const rewardText = r => [r.cash ? money(r.cash) : null, r.item ? `${r.qty > 1 ? r.qty + " × " : ""}${IT[r.item]?.n}` : null, r.xp ? `${r.xp} xp` : null].filter(Boolean).join(", ");

export function Missions() {
  const { me, run, busy, toast, showSheet } = useGame();
  const [d, setD] = useState(null); const [open, setOpen] = useState(null);
  const load = () => call("missions_state").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const act = d.active?.chain ? d.chains.find(c => c.id === d.active.chain) : null;
  const step = act && act.steps[d.active.step - 1];
  const doneCount = d.done.length;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Missions</h1><p>Stories told by people around the city. Take one at a time, finish each step's goal, and come back here to see what happens next. {doneCount} of {d.chains.length} stories finished.</p></div></div>
      {act && step ? (
        <div className="panel story-card"><div className="body stack">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><span className="tiny">{act.name}, part {step.step} of {act.steps.length}</span>
            <button className="btn ghost sm" disabled={busy} onClick={() => run("mission_drop", {}, () => { load(); toast("Story dropped. You can start it again later."); })}>Drop this story</button></div>
          <h2>{step.title}</h2>
          <p className="storytext">{step.story}</p>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Ic.Target style={{ width: 20, color: "var(--sodium)" }} />
            <div className="grow" style={{ minWidth: 200 }}><b>{objText(step.k, step.n)}</b>
              <div className="xpbar" style={{ maxWidth: 320 }}><i style={{ width: Math.min(100, (d.active.have / step.n) * 100) + "%" }} /></div>
              <div className="tiny">{step.k === "jobcash" ? `${money(d.active.have)} of ${money(step.n)}` : `${num(d.active.have)} of ${num(step.n)}`}. Reward: {rewardText(step.reward)}.</div></div>
            <button className="btn good" disabled={busy || d.active.have < step.n} onClick={() => run("mission_claim", {}, r => { load();
              showSheet({ verdict: r.finished ? "Story finished" : "Done", title: r.title, story: r.done_text, cash: r.reward.cash, items: r.reward.item ? Array(r.reward.qty || 1).fill(r.reward.item) : [], lines: r.reward.xp ? [`+${r.reward.xp} xp`] : [], pic: <span className="thumb homepic"><Ic.ScrollText /></span> }); })}>
              {d.active.have >= step.n ? "See what happens" : "Not done yet"}</button>
          </div>
        </div></div>
      ) : <Panel><Empty title="You're not on a story">Pick one below. New stories open as you level up.</Empty></Panel>}
      <Panel title="Stories" flush>
        <div className="list">{d.chains.map(c => { const done = d.done.includes(c.id), active = act?.id === c.id, locked = me.level < c.lvl; return (<React.Fragment key={c.id}>
          <button className={`li click ${locked ? "locked" : ""}`} onClick={() => setOpen(open === c.id ? null : c.id)}>
            <span className="thumb homepic">{done ? <Ic.Check /> : locked ? <Ic.Lock /> : <Ic.ScrollText />}</span>
            <div><div className="t">{c.name}</div><div className="s">{c.who}. {c.steps.length} parts. {locked ? `Opens at level ${c.lvl}.` : done ? "Finished." : active ? "In progress." : "Ready to start."}</div></div>
            <div className="act"><Ic.ChevronRight style={{ width: 18, color: "var(--mist)", transform: open === c.id ? "rotate(90deg)" : "none" }} /></div>
          </button>
          {open === c.id && <div className="stockdetail"><p className="small">{c.blurb}</p>
            <ol className="steplist">{c.steps.map(s => <li key={s.step}><b>{s.title}</b> <span className="tiny">{objText(s.k, s.n)}. {rewardText(s.reward)}.</span></li>)}</ol>
            {!done && !active && !locked && <div><button className="btn" disabled={busy || !!act} onClick={() => run("mission_start", { p_chain: c.id }, () => { load(); window.scrollTo(0, 0); })}>{act ? "Finish your current story first" : "Start this story"}</button></div>}
          </div>}</React.Fragment>); })}</div>
      </Panel>
    </div>
  );
}

// ---------------- Seasonal events ----------------
export function Event() {
  const { me, run, busy, toast } = useGame();
  const [d, setD] = useState(null);
  const load = () => call("season_state").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const a = d.active;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>{a ? a.name : "Events"}</h1><p>{a ? a.blurb : "Events run on the same dates every year: Summer Heatwave in January, Winter Storms in June, Halloween Night, Fireworks Week in November and The Christmas Heist in December."}</p></div>
        {a && <span className="pill warn">Ends in <Countdown until={a.ends_at} onDone={load} /></span>}</div>
      {a && <>
        <div className="stats">
          <div className="stat"><div className="k">Your points</div><div className="v">{num(a.mine)}</div></div>
          <div className="stat"><div className="k">Your place</div><div className="v">{a.mine ? `#${a.rank}` : "Not yet"}</div></div>
          <div className="stat"><div className="k">How to score</div><div className="v small" style={{ fontSize: 14, fontWeight: 600 }}>{Object.entries(a.points).map(([k, v]) => `${objText(k, 1).replace(/^(Do|Win|Spring|Use|Train) 1 /, "$1 a ").replace("sets", "set")}: ${v} pt${v === 1 ? "" : "s"}`).join(". ")}</div></div>
        </div>
        <div className="cols-2">
          <Panel title="Limited event items" note="They drop from about 1 in 8 jobs and fights won while the event is on. Once they're gone, they're gone." flush>
            <div className="list">{a.items.map(x => { const it = IT[x.id]; return (
              <div key={x.id} className="li"><ItemThumb id={x.id} />
                <div><div className="t">{it?.n}</div><div className="s"><span className="rar" style={{ color: RAR[it?.r || 0][1] }}>{RAR[it?.r || 0][0]}</span> {it?.d}</div>
                  <div className="xpbar" style={{ maxWidth: 240 }}><i style={{ width: Math.min(100, x.found / x.supply * 100) + "%" }} /></div><div className="tiny">{num(x.found)} of {num(x.supply)} found</div></div>
              </div>); })}</div>
          </Panel>
          <Panel title="Leaderboard" note="The top ten each win this year's trophy." flush>
            {a.top.length === 0 ? <Empty title="Nobody has scored yet">Do a job to get on the board.</Empty> :
            <div className="list">{a.top.map((p, i) => (
              <button key={p.id} className="li click" onClick={() => go("player/" + p.id)} style={p.id === me.id ? { background: "var(--sodium-soft)" } : undefined}>
                <span className={`stepdot ${i < 10 ? "done" : ""}`}>{i + 1}</span><div className="t"><Name p={p} tag={false} /></div><div className="act"><b>{num(p.points)}</b></div>
              </button>))}</div>}
          </Panel>
        </div>
      </>}
      {d.last && <Panel title={`${d.last.name} ${d.last.year}: final results`}>
        {d.last.top.length === 0 ? <p className="tiny">Nobody took part.</p> : <ol className="steplist">{d.last.top.map(p => <li key={p.id}>{p.name} <span className="tiny">{num(p.points)} points</span></li>)}</ol>}
        {d.last.can_claim && <button className="btn good" style={{ marginTop: 10 }} disabled={busy} onClick={() => run("season_claim", { p_season: d.last.id, p_year: d.last.year }, () => { load(); toast("Trophy collected. It's in your stash.", "good"); })}><Ic.Trophy />Claim your trophy</button>}
      </Panel>}
    </div>
  );
}
