import React, { useMemo } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, Odds } from "../ui/ui.jsx";
import { skyline, DISTRICT_ART } from "../game/art.js";
import { DISTRICTS, CRIMES } from "../game/content.js";
import { rankOf } from "../game/catalog.js";
import { money, short, num } from "../lib/format.js";
import { go, DISTRICT_NAMES } from "../lib/nav.js";
import { jobChance } from "./work.jsx";
import * as Ic from "../ui/icons.js";
import { Goals } from "./goals.jsx";

const SCENES = {
  water: ["Rain on the ferry terminal roof. A food cart hisses. Somebody's wallet is sticking out of a back pocket.",
          "The last ferry has gone. The pier lights hum, and the tourists who missed it look lost and well-funded.",
          "A busker plays to nobody under the wharf lamps. Across the road, the dairy owner watches the door."],
  old:   ["Brick lanes, wet cobbles and pawn shop signs that never switch off. Everyone here owes someone.",
          "A call centre on the third floor is still lit. Down below, a man in a good coat is counting cash in a doorway.",
          "The pubs empty out at once. For a minute the lane is all elbows, and then it's quiet again."],
  docks: ["Fog over the container stacks. A crane swings in the dark, and the casino on the pier glows like a fish tank.",
          "Forklift beepers, a ship's horn, and the click of someone trying a padlock that isn't theirs.",
          "Shift change at the gate. For ten minutes, nobody is watching the yard."],
  heights: ["Forty floors up, a party you weren't invited to. Down here, a doorman pretends not to see you.",
            "Private lifts, tinted windows and a valet who parks cars worth more than a house.",
            "The towers are lit all night. Somebody up there is always awake, and always rich."]
};

export const SKILLS = [
  ["thief", "Thieving", "Better odds on jobs", Ic.Footprints],
  ["fight", "Fighting", "More power in every fight", Ic.Crosshair],
  ["fit", "Fitness", "Bigger gains at the gym", Ic.Dumbbell],
  ["trade", "Trading", "Cheaper store, lower exchange fees", Ic.Coins]
];
export const skillProgress = xp => { const l = Math.min(50, Math.floor(Math.sqrt((xp || 0) / 25)) + 1); if (l >= 50) return [50, 1]; const a = (l - 1) ** 2 * 25, b = l ** 2 * 25; return [l, ((xp || 0) - a) / (b - a)]; };

export function Street() {
  const { me, holdings, state } = useGame();
  const d = DISTRICTS.find(x => x.id === me.district) || DISTRICTS[0];
  const scene = useMemo(() => { const s = SCENES[d.id]; return s[Math.floor(Math.random() * s.length)]; }, [d.id]);
  const jobs = CRIMES.filter(c => (c.d === d.id || c.d === "any") && c.lvl <= me.level).slice(-3).reverse();
  const xpPct = Math.min(100, (Number(me.xp) / Math.max(1, me.need_xp)) * 100);
  return (
    <div className="page">
      <section className="hero">
        <Svg svg={skyline(DISTRICT_ART[d.id])} />
        {d.weather === "rain" && <div className="rain" />}
        <div className="veil" />
        <div className="in">
          <span className="pill" style={{ alignSelf: "flex-start", background: "#ffffff1f", color: "#fff" }}><Ic.MapPin />{DISTRICT_NAMES[d.id]}</span>
          <h1>{greeting()}, {me.name}.</h1>
          <p className="scene">{scene}</p>
          {state.tower?.length > 0 && <p className="small" style={{ color: "#f2c14e", fontWeight: 600 }}>Lit up on Backstreet Tower tonight: {state.tower.join(" and ")}</p>}
          <div className="row" style={{ flexWrap: "wrap", marginTop: 6 }}>
            <button className="btn" onClick={() => go("jobs")}><Ic.Briefcase />Find a job</button>
            <button className="btn ghost" onClick={() => go("fights")}><Ic.Swords />Pick a fight</button>
            <button className="btn ghost" onClick={() => go("map")}><Ic.Car />Get a taxi</button>
          </div>
        </div>
      </section>

      <Goals />

      <div className="stats">
        <div className="stat"><div className="k">Level {me.level}, {rankOf(me.level)}</div><div className="v">{num(Math.floor(me.xp))} <span className="muted small">/ {num(me.need_xp)} xp</span></div><div className="xpbar"><i style={{ width: xpPct + "%" }} /></div></div>
        <div className="stat"><div className="k">Net worth</div><div className="v">{short(me.networth)}</div></div>
        <div className="stat"><div className="k">In the bank</div><div className="v">{money(me.bank)}</div></div>
        <div className="stat"><div className="k">Fight power</div><div className="v">{num(me.power)}</div></div>
        <div className="stat"><div className="k">Record</div><div className="v">{me.wins}<span className="muted small"> won</span> {me.losses}<span className="muted small"> lost</span></div></div>
      </div>

      <div className="cols-2">
        <Panel title={`Work in ${DISTRICT_NAMES[d.id]}`} note="Your best jobs here right now" flush action={<button className="btn ghost sm" onClick={() => go("jobs")}>All jobs</button>}>
          <div className="list">
            {jobs.map(j => { const p = jobChance(j, me, holdings); return (
              <button key={j.id} className="li click" onClick={() => go("jobs")}>
                <Ic.Briefcase style={{ width: 20, color: "var(--mist)" }} />
                <div><div className="t">{j.n}</div><div className="s">{money(j.min)} to {money(j.max)}, {j.nv} grit</div><Odds p={p} /></div>
                <span className="pill">{Math.round(p)}%</span>
              </button>); })}
          </div>
        </Panel>
        <Panel title="Skills" note="They level up as you use them">
          <div className="stack-sm">
            {SKILLS.map(([k, label, note, Icon]) => { const [l, f] = skillProgress(me.skills?.[k]); return (
              <div key={k} className="row" title={note}>
                <Icon style={{ width: 18, color: "var(--sodium)", flex: "none" }} />
                <div className="grow"><div className="row" style={{ justifyContent: "space-between" }}><b className="small">{label}</b><span className="tiny">Level {l}</span></div>
                  <div className="xpbar" style={{ marginTop: 4 }}><i style={{ width: f * 100 + "%" }} /></div></div>
              </div>); })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function greeting() { const h = new Date().getHours(); return h < 5 ? "Still up" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening"; }
