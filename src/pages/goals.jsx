import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, ItemThumb, Countdown } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { IT } from "../game/catalog.js";
import * as Ic from "../ui/icons.js";

const rewardText = r => r.cash ? money(r.cash) : `${r.qty > 1 ? r.qty + " × " : ""}${IT[r.item]?.n || r.item}`;

// Daily streak, today's three goals and (for new players) the first-steps guide.
export function Goals() {
  const { run, busy, toast, showSheet, state } = useGame();
  const [g, setG] = useState(null);
  const load = () => call("goals_state").then(setG).catch(() => {});
  useEffect(() => { load(); }, [state.goals_ready]);
  if (!g) return null;
  const steps = g.steps, done = g.guide.done || {}, claimed = g.guide.claimed || {};
  const guideLeft = steps.filter(s => !claimed[s.k]);
  const goals = g.daily.goals || [];
  const after = () => load();

  return (
    <>
      {guideLeft.length > 0 && (
        <Panel title="First steps" note={`${steps.length - guideLeft.length} of ${steps.length} done. Finish them all for two mystery boxes.`} flush>
          <div className="list">{steps.map((s, i) => { const isDone = !!done[s.k], isClaimed = !!claimed[s.k]; return (
            <div key={s.k} className={`li ${isClaimed ? "locked" : ""}`}>
              <span className={`stepdot ${isDone ? "done" : ""}`}>{isDone ? <Ic.Check /> : i + 1}</span>
              <div><div className="t">{s.t}</div><div className="s">{s.d}</div></div>
              <div className="act">{isClaimed ? <span className="tiny">Collected</span> : isDone
                ? <button className="btn sm good" disabled={busy} onClick={() => run("guide_claim", { p_step: s.k }, r => { after(); toast(`+${money(r.cash)}${r.finished ? " and two mystery boxes. You know your way around now." : ""}`, "good"); })}>Collect {money(s.cash)}</button>
                : <button className="btn ghost sm" onClick={() => go(s.go)}>Go</button>}</div>
            </div>); })}</div>
        </Panel>
      )}
      <div className="cols-2">
        <Panel title="Today's goals" note={<>New goals in <Countdown until={g.reset_at} onDone={load} />. Finish all three for a mystery box and a token.</>} flush>
          <div className="list">{goals.map((x, i) => { const full = x.have >= x.n; return (
            <div key={x.k} className={`li ${x.claimed ? "locked" : ""}`}>
              <Ic.Target style={{ width: 20, color: full ? "var(--seaglass)" : "var(--mist)" }} />
              <div><div className="t">{x.t}</div><div className="xpbar" style={{ maxWidth: 240 }}><i style={{ width: Math.min(100, (x.have / x.n) * 100) + "%", background: full ? "var(--seaglass)" : undefined }} /></div>
                <div className="s">{x.k === "jobcash" ? `${money(x.have)} of ${money(x.n)}` : `${num(x.have)} of ${num(x.n)}`}</div></div>
              <div className="act">{x.claimed ? <span className="tiny">Collected</span> : <button className="btn sm good" disabled={busy || !full} onClick={() => run("goal_claim", { p_index: i }, r => {
                after();
                if (r.bonus) showSheet({ verdict: "All three done", title: "A good day's work", story: "Every goal ticked off. Somebody left a box on your doorstep, and a token on top of it.", cash: r.cash, items: ["smallbox", "token"], pic: <ItemThumb id="smallbox" /> });
                else toast(`+${money(r.cash)}`, "good");
              })}>Collect</button>}</div>
            </div>); })}</div>
        </Panel>
        <Panel title="Daily reward" note={g.streak > 0 ? `${g.streak} day streak. Miss a day and it starts again.` : "Come back every day to build a streak."}>
          <div className="streak">{g.week.map(d => { const got = d.day < g.next_day || (g.checked_in && d.day === g.next_day); const today = d.day === g.next_day; return (
            <div key={d.day} className={`sday ${got ? "got" : ""} ${today ? "today" : ""}`}>
              <span className="tiny">Day {d.day}</span>
              {d.item ? <ItemThumb id={d.item} /> : <span className="thumb"><Ic.Coins /></span>}
              <span className="small">{rewardText(d)}</span>
            </div>); })}</div>
          <button className="btn block" style={{ marginTop: 12 }} disabled={busy || g.checked_in} onClick={() => run("checkin", {}, r => { after(); toast(`Day ${r.streak}: ${rewardText(r)}.`, "good"); })}>
            {g.checked_in ? "Collected. Back tomorrow." : <><Ic.Gift />Collect day {g.next_day}</>}</button>
        </Panel>
      </div>
    </>
  );
}
