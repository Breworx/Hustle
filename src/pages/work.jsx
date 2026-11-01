import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, Odds, ItemThumb, Avatar, Empty, Seg } from "../ui/ui.jsx";
import { iconSvg, npcFaceSvg } from "../game/art.js";
import { CRIMES, FOES } from "../game/content.js";
import { STOCKS } from "../game/stocks.js";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go, DISTRICT_NAMES } from "../lib/nav.js";
import { jobStory, npcFightStory, pvpStory } from "../game/stories.js";
import * as Ic from "../ui/icons.js";
import { useStartFight } from "./armoury.jsx";

const PERK = Object.fromEntries(STOCKS.map(s => [s.t, s.shares]));
const hasBlock = (holdings, t) => (holdings[t]?.shares || 0) >= (PERK[t] || 1e12);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

// Same formula the server uses, so the odds you see are the odds you get.
export function jobChance(j, me, holdings) {
  const thief = me.skill_levels?.thief || 1;
  return Math.max(5, Math.min(96, j.base + Math.sqrt(me.crime_xp) * 2.2 + (me.luck > 0 ? 10 : 0) + Math.min(25, (thief - 1) * 0.5) + (hasBlock(holdings, "GRCH") ? 3 : 0) - me.heat * 0.25));
}
const fightChance = (a, b, cap = 0.97) => Math.round(Math.max(1 - cap, Math.min(cap, 1 / (1 + Math.exp(-8 * (a / (a + b) - 0.5))))) * 100);

const VERDICT = { win: ["Clean getaway", "good"], fail: ["It went sideways", "warn"], jail: ["Nicked", "bad"], hosp: ["Hurt", "bad"] };

export function Jobs() {
  const { me, holdings, run, showSheet, busy } = useGame();
  const here = CRIMES.filter(c => c.d === "any" || c.d === me.district);
  const elsewhere = CRIMES.filter(c => c.d !== "any" && c.d !== me.district);
  const free = me.status === "ok";
  function doJob(j) {
    run("do_job", { p_job: j.id }, r => {
      const [verdict, tone] = VERDICT[r.outcome];
      showSheet({ verdict, tone, title: j.n, story: jobStory(j.id, r), cash: r.cash, items: [r.item, r.item2].filter(Boolean),
        lines: [r.xp ? `+${r.xp} xp` : null, r.outcome === "jail" ? `${Math.ceil(r.secs / 60)} min in the cells` : null, r.outcome === "hosp" ? `${Math.ceil(r.secs / 60)} min in A&E` : null].filter(Boolean),
        pic: <Svg className="thumb" svg={iconSvg(j.ic)} />, again: r.outcome === "win" || r.outcome === "fail" ? () => doJob(j) : null });
    });
  }
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Jobs</h1><p>Every job costs grit, which comes back with time. Success builds your thieving skill and raises your heat. The more heat, the worse your odds and the longer you'll sit in the cells.</p></div>
        <div className="row"><span className="pill"><Ic.Flame />{Math.floor(me.grit)} / {me.max_grit} grit</span>{me.heat >= 40 && <span className="pill bad">Heat {Math.floor(me.heat)}</span>}</div></div>
      <Panel title={`In ${DISTRICT_NAMES[me.district]}`} flush>
        <div className="list">
          {here.map(j => { const p = jobChance(j, me, holdings); const locked = me.level < j.lvl; return (
            <div key={j.id} className={`li ${locked ? "locked" : ""}`}>
              <Svg className="thumb" svg={iconSvg(j.ic)} />
              <div><div className="t">{j.n}</div><div className="s">{money(j.min)} to {money(j.max)}, {j.nv} grit, {j.xp} xp</div>{!locked && <Odds p={p} />}</div>
              <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {j.lvl}</span> : <>
                <span className="tiny">{Math.round(p)}% odds</span>
                <button className="btn sm" disabled={busy || !free || me.grit < j.nv} onClick={() => doJob(j)}>Do it</button></>}</div>
            </div>); })}
        </div>
      </Panel>
      {elsewhere.length > 0 && <Panel title="Elsewhere in the city" note="Take a taxi to work these" flush>
        <div className="list">{elsewhere.map(j => (
          <div key={j.id} className="li locked"><Svg className="thumb" svg={iconSvg(j.ic)} />
            <div><div className="t">{j.n}</div><div className="s">{DISTRICT_NAMES[j.d]}, level {j.lvl}, {money(j.min)} to {money(j.max)}</div></div>
            <div className="act"><button className="btn ghost sm" onClick={() => go("map")}>Map</button></div></div>))}</div>
      </Panel>}
    </div>
  );
}

const STATS = [["str", "Strength", "Hit harder", Ic.Dumbbell], ["def", "Defence", "Take hits better", Ic.Shield], ["spd", "Speed", "Strike first", Ic.Footprints], ["dex", "Dexterity", "Land more blows", Ic.Crosshair]];

export function Gym() {
  const { me, run, busy, toast, inv } = useGame();
  const [sets, setSets] = useState(1);
  const max = Math.floor(me.stamina / 5);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Gym</h1><p>Each set costs 5 stamina. A good mood means bigger gains, and every set wears it down a little. Your four stats add up to your fight power.</p></div>
        <div className="row"><span className="pill">Mood {Math.floor(me.mood)}</span><span className="pill">{max} sets left</span></div></div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Seg label="Sets per go" value={sets} onChange={setSets} options={[[1, "1 set"], [5, "5 sets"], [10, "10 sets"], [999, "All in"]]} />
        {inv.drink > 0 && <button className="btn ghost sm" disabled={busy} onClick={() => run("use_item", { p_item: "drink" }, () => toast("+25 stamina.", "good"))}>Drink an energy drink ({inv.drink})</button>}
        {inv.lager > 0 && <button className="btn ghost sm" disabled={busy} onClick={() => run("use_item", { p_item: "lager" }, () => toast("+60 mood.", "good"))}>Have a lager ({inv.lager})</button>}
      </div>
      <div className="gym">
        {STATS.map(([k, label, note, Icon]) => (
          <div key={k} className="panel gcard">
            <div className="top"><Icon /><div><b>{label}</b><div className="tiny">{note}</div></div></div>
            <div className="v">{num(Math.floor(me[k]))}</div>
            <button className="btn" disabled={busy || max < 1 || me.status !== "ok"} onClick={() => run("train", { p_stat: k, p_sets: sets }, r => toast(`${label} +${r.gain} over ${r.sets} set${r.sets > 1 ? "s" : ""}.`, "good"))}>Train {label.toLowerCase()}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Fights() {
  const { me, run, showSheet, busy } = useGame();
  const [tab, setTab] = useState("city");
  const foes = FOES.filter(f => f.d === me.district);
  const can = me.status === "ok" && me.stamina >= 25 && me.health >= me.max_health * 0.3;
  function fight(f) {
    run("fight_npc", { p_foe: slug(f.n) }, r => showSheet({ verdict: r.won ? "You won" : "You lost", tone: r.won ? "good" : "bad", title: f.n,
      story: npcFightStory(f.n, r), cash: r.won ? r.cash : 0, items: [r.item, r.item2].filter(Boolean),
      lines: [r.won ? `+${r.xp} xp` : `Lost ${money(r.lost)}`, !r.won ? `${Math.ceil(r.secs / 60)} min in A&E` : null].filter(Boolean),
      pic: <Svg className="av" svg={npcFaceSvg(f)} /> }));
  }
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Fights</h1><p>A fight costs 25 stamina. Win and you take their cash. Lose and you're in A&amp;E. Your power is {num(me.power)}. Fights with other players go turn by turn, with whatever you're carrying from the <button className="linkish" onClick={() => go("armoury")}>armoury</button>.</p></div>
        <Seg label="Opponents" value={tab} onChange={setTab} options={[["city", "Locals"], ["players", "Players here"]]} /></div>
      {!can && me.status === "ok" && <p className="tiny">{me.stamina < 25 ? "You need 25 stamina to start a fight." : "You're too beaten up. Heal first."}</p>}
      {tab === "city" ? (
        <Panel title={`Trouble in ${DISTRICT_NAMES[me.district]}`} flush>
          <div className="list">{foes.map(f => { const p = fightChance(me.power, f.p); const locked = me.level < f.lvl; return (
            <div key={f.n} className={`li ${locked ? "locked" : ""}`}>
              <Svg className="av" svg={npcFaceSvg(f)} />
              <div><div className="t">{f.n}</div><div className="s">Power {num(f.p)}, carries {money(f.cash[0])} to {money(f.cash[1])}</div>{!locked && <Odds p={p} />}</div>
              <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {f.lvl}</span> : <><span className="tiny">{p}% odds</span><button className="btn sm danger" disabled={busy || !can} onClick={() => fight(f)}>Fight</button></>}</div>
            </div>); })}</div>
        </Panel>
      ) : <PlayersHere can={can} />}
    </div>
  );
}

const HINT = { "much weaker": "good", weaker: "good", even: "warn", stronger: "bad", "much stronger": "bad" };

function PlayersHere({ can }) {
  const { me, busy } = useGame(); const startFight = useStartFight();
  const [list, setList] = useState(null);
  const load = () => call("list_players", { p_scope: "here" }).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, [me.district]);
  if (!list) return <Panel><Empty title="Looking around…" /></Panel>;
  return (
    <Panel title="Players on your street" note={me.level < 3 ? "You can attack other players from level 3" : "New players are protected for their first day"} flush>
      {list.length === 0 ? <Empty title="Nobody else is about">Check back later, or try another district.</Empty> :
      <div className="list">{list.map(t => (
        <div key={t.id} className="li">
          <button className="iconbtn" style={{ border: 0, width: 44, height: 44, padding: 0, background: "none" }} onClick={() => go("player/" + t.id)} aria-label={`View ${t.name}`}><Avatar seed={t.id} look={t.look} /></button>
          <div><button className="t" style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 650 }} onClick={() => go("player/" + t.id)}>{t.name}</button>
            <div className="s">Level {t.level}, {t.wins} wins, looks <span className={HINT[t.power_hint]}>{t.power_hint}</span></div></div>
          <div className="act">{t.protected ? <span className="pill">New in town</span> : <button className="btn sm danger" disabled={busy || !can || me.level < 3} onClick={() => startFight(t.id)}>Attack</button>}</div>
        </div>))}</div>}
    </Panel>
  );
}
