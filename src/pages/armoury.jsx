import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, Avatar, ItemThumb, Seg, Name, itemName } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { SLOT_NAMES, SHOP_ARMS } from "../game/arms.js";
import * as Ic from "../ui/icons.js";

const WEAPON_SLOTS = ["melee", "sidearm", "long"];
const ARMOUR_SLOTS = ["head", "body", "hands", "legs", "feet"];
const EFFECT = { blind: "Blinds for 2 turns", stun: "Stuns: they lose a turn", smoke: "Smoke: their next 2 attacks mostly miss", burn: "Burns for 2 more turns" };
const AMMO_NAME = { ammo_9: "9mm", ammo_357: ".357", ammo_shell: "shells", ammo_rifle: "rifle rounds" };
const kg = w => `${Number(w).toFixed(w < 1 ? 1 : w % 1 ? 1 : 0)} kg`;

function statLine(a) {
  if (a.slot === "ammo") return `Box of ${a.box}`;
  if (a.def != null) return `Stops ${a.def}% of damage to the ${a.slot === "body" ? "body" : a.slot}, ${kg(a.weight)}`;
  const shots = a.shots > 1 ? ` x${a.shots}` : "";
  return `${a.dmg} damage${shots}, ${a.acc}% accuracy, ${kg(a.weight)}${a.ammo ? `, uses ${AMMO_NAME[a.ammo] || itemName(a.ammo)}` : ""}`;
}

// ---------------- Armoury: what you carry, and the shop ----------------
export function Armoury() {
  const { me, run, busy, toast } = useGame();
  const [d, setD] = useState(null); const [tab, setTab] = useState("loadout"); const [shop, setShop] = useState("weapons"); const [pick, setPick] = useState(null);
  const load = () => call("armoury").then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!d) return <Empty title="Loading…" />;
  const A = Object.fromEntries((d.arms || []).map(a => [a.item_id, a]));
  const lo = d.loadout || {}; const th = lo.throw || [];
  const pct = Math.min(100, (d.weight / d.limit) * 100);
  const owned = s => (d.arms || []).filter(a => a.owned > 0 && a.slot === s);
  const put = (id, remove) => run("loadout_set", { p_item: id, p_remove: !!remove }, r => { setD(x => ({ ...x, loadout: r.loadout, weight: r.weight })); setPick(null); });

  const Slot = ({ s, id, i }) => { const a = id && A[id]; return (
    <button className={`slot ${a ? "full" : ""} ${pick === s ? "open" : ""}`} onClick={() => setPick(pick === s ? null : s)} aria-expanded={pick === s}>
      {a ? <ItemThumb id={id} /> : <span className="thumb empty"><Ic.Plus /></span>}
      <span className="sl">{s === "throw" ? `Throwable ${i + 1}` : SLOT_NAMES[s]}</span>
      <b>{a ? itemName(id) : "Empty"}</b>
      {a && <span className="tiny">{a.def != null ? `${a.def}% protection` : a.slot === "throw" ? EFFECT[a.effect] : `${a.dmg}${a.shots > 1 ? ` x${a.shots}` : ""} dmg, ${a.acc}%`}</span>}
      {a && a.ammo && <span className={`tiny ${(d.arms.find(x => x.item_id === a.ammo)?.owned || 0) ? "" : "bad"}`}>{num(d.arms.find(x => x.item_id === a.ammo)?.owned || 0)} {AMMO_NAME[a.ammo]} left</span>}
    </button>); };

  const Picker = ({ s }) => { const list = owned(s); const cur = s === "throw" ? null : lo[s]; return (
    <div className="picker">
      {list.length === 0 ? <p className="tiny">You don't own anything for this slot. <button className="linkish" onClick={() => { setTab("shop"); setShop(s === "throw" ? "throw" : ARMOUR_SLOTS.includes(s) ? "armour" : "weapons"); }}>Visit the shop</button></p> :
      <div className="list">{list.map(a => { const on = cur === a.item_id; const inBag = th.filter(x => x === a.item_id).length; const over = !on && d.weight - (cur ? A[cur].weight : 0) + a.weight > d.limit; return (
        <div key={a.item_id} className="li">
          <ItemThumb id={a.item_id} />
          <div><div className="t">{itemName(a.item_id)}{s === "throw" ? ` (${a.owned} owned, ${inBag} packed)` : a.owned > 1 ? ` x${a.owned}` : ""}</div><div className="s">{statLine(a)}</div></div>
          <div className="act">{s === "throw" ? <><button className="btn sm ghost" disabled={busy || !inBag} onClick={() => put(a.item_id, true)}>Unpack</button><button className="btn sm" disabled={busy || th.length >= 3 || inBag >= a.owned || over} onClick={() => put(a.item_id)}>Pack</button></>
            : on ? <button className="btn sm ghost" disabled={busy} onClick={() => put(a.item_id, true)}>Take off</button>
            : <button className="btn sm" disabled={busy || over} title={over ? "Too heavy" : ""} onClick={() => put(a.item_id)}>{over ? "Too heavy" : WEAPON_SLOTS.includes(s) ? "Carry" : "Wear"}</button>}</div>
        </div>); })}</div>}
    </div>); };

  const shopList = (d.arms || []).filter(a => a.price != null && (shop === "weapons" ? WEAPON_SLOTS.includes(a.slot) : shop === "armour" ? ARMOUR_SLOTS.includes(a.slot) : a.slot === shop))
    .sort((x, y) => x.lvl - y.lvl || x.price - y.price);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Armoury</h1><p>What you carry into a fight is what you fight with. One weapon in each hand slot, armour on each part of you, and up to three things to throw. Everything weighs something, and strength decides how much you can carry.</p></div>
        <Seg label="Armoury" value={tab} onChange={setTab} options={[["loadout", "Your loadout"], ["shop", "Shop"]]} /></div>
      {tab === "loadout" ? <>
        <div className="panel"><div className="body stack-sm">
          <div className="row" style={{ justifyContent: "space-between" }}><span className="row" style={{ gap: 6 }}><Ic.Backpack style={{ width: 18 }} /><b>Carrying {kg(d.weight)}</b></span><span className="tiny">You can carry {kg(d.limit)}. Train strength for more.</span></div>
          <div className="track carry"><div className="fill" style={{ width: pct + "%", background: pct > 90 ? "var(--brick)" : pct > 70 ? "var(--sodium)" : "var(--seaglass)" }} /></div>
        </div></div>
        <Panel title="Weapons" note="Pick one of these each turn, or use your fists.">
          <div className="slots">{WEAPON_SLOTS.map(s => <Slot key={s} s={s} id={lo[s]} />)}</div>
          {WEAPON_SLOTS.includes(pick) && <Picker s={pick} />}
        </Panel>
        <Panel title="Armour" note="A hit lands somewhere: head, body, hands, legs or feet. Armour there takes its share of the damage. Head shots hurt most.">
          <div className="slots">{ARMOUR_SLOTS.map(s => <Slot key={s} s={s} id={lo[s]} />)}</div>
          {ARMOUR_SLOTS.includes(pick) && <Picker s={pick} />}
        </Panel>
        <Panel title="Throwables" note="Used up when thrown.">
          <div className="slots">{[0, 1, 2].map(i => <Slot key={i} s="throw" i={i} id={th[i]} />)}</div>
          {pick === "throw" && <Picker s="throw" />}
        </Panel>
      </> : <>
        <Seg label="Shop section" value={shop} onChange={setShop} options={[["weapons", "Weapons"], ["armour", "Armour"], ["throw", "Throwables"], ["ammo", "Ammo"]]} />
        <Panel flush>
          <div className="list">{shopList.map(a => { const locked = me.level < a.lvl; return (
            <div key={a.item_id} className={`li ${locked ? "locked" : ""}`}>
              <ItemThumb id={a.item_id} />
              <div><div className="t">{itemName(a.item_id)}{a.owned ? <span className="pill" style={{ marginLeft: 8 }}>{num(a.owned)} owned</span> : null}</div>
                <div className="s">{a.slot !== "ammo" && a.slot !== "throw" ? `${SLOT_NAMES[a.slot]}. ` : ""}{statLine(a)}{a.effect ? `. ${EFFECT[a.effect]}` : ""}</div></div>
              <div className="act">{locked ? <span className="pill"><Ic.Lock />Level {a.lvl}</span> :
                <button className="btn sm" disabled={busy || me.cash < a.price} onClick={() => run("arms_buy", { p_item: a.item_id, p_qty: 1 }, r => { load(); toast(`Bought ${r.qty > 1 ? `${r.qty} ` : ""}${itemName(r.item)} for ${money(r.cost)}.`, "good"); })}>{money(a.price)}</button>}</div>
            </div>); })}</div>
        </Panel>
      </>}
    </div>
  );
}

// ---------------- One fight, turn by turn ----------------
const FX_PILL = { blind: ["Can't see", Ic.EyeOff], stun: ["Stunned", Ic.Zap], smoke: ["In smoke", Ic.Cloud], burn: ["Burning", Ic.Flame] };
const THROWN = new Set(SHOP_ARMS.filter(a => a.slot === "throw").map(a => a.id)); const GUNS = new Set(SHOP_ARMS.filter(a => a.ammo).map(a => a.id));
const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
const LOC = { head: "the head", body: "the body", hands: "the hand", legs: "the leg", feet: "the foot" };

export function logText(l, me, them) {
  const who = l.side === "a" ? "You" : them; const whom = l.side === "a" ? them : "you";
  const out = [];
  if (l.burn) out.push(`${who === "You" ? "You burn" : `${who} burns`} for ${l.burn}.`);
  if (l.stunned) { out.push(`${who === "You" ? "You're" : `${who} is`} still reeling and can't act.`); return out.join(" "); }
  if (l.flee) { out.push(l.escaped ? `${who === "You" ? "You" : who} got away.` : `${who === "You" ? "You" : who} tried to run and got cut off.`); return out.join(" "); }
  const w = l.weapon === "fists" ? (who === "You" ? "your fists" : "their fists") : "the " + lower(itemName(l.weapon));
  const es = who === "You" ? "" : "es";
  if (l.effect === "smoke") { out.push(`${who} pull${who === "You" ? "" : "s"} the pin on a smoke grenade. Smoke fills the street.`); return out.join(" "); }
  const v = who === "You" ? "" : "s";
  const verb = THROWN.has(l.weapon) ? "throw" + v : GUNS.has(l.weapon) ? "fire" + v : "swing" + v + " with";
  if (!l.hits) out.push(l.shots > 1 ? `${who} fire${v} ${w} ${l.shots} times and miss${es} with every one.` : `${who} ${verb} ${w} and miss${es}.`);
  else {
    const where = [...new Set(l.locs)].map(x => LOC[x]).join(" and ");
    out.push(l.shots > 1 ? `${l.hits} of ${l.shots} from ${w} hit ${whom} in ${where}: ${num(l.dmg)} damage.` : `${who} hit${v} ${whom} in ${where} with ${w}: ${num(l.dmg)} damage.`);
    if (THROWN.has(l.weapon) && l.effect) out.push({ blind: "Eyes streaming.", stun: "Stunned.", burn: "Flames catch." }[l.effect]);
  }
  return out.join(" ");
}

function Fighter({ p, fx, you }) {
  const pct = Math.max(0, Math.min(100, (p.hp / p.max) * 100));
  return (
    <div className={`fighter ${you ? "you" : ""}`}>
      <Avatar seed={p.id} look={p.look} lg />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}><b className="ell">{you ? "You" : <Name p={p} />}</b><span className="tiny">{num(Math.ceil(p.hp))} / {num(p.max)}</span></div>
        <div className="track hp"><div className="fill" style={{ width: pct + "%", background: pct < 25 ? "var(--brick)" : pct < 55 ? "var(--sodium)" : "var(--seaglass)" }} /></div>
        <div className="chips" style={{ marginTop: 6, minHeight: 24 }}>{Object.entries(fx || {}).filter(([, n]) => n > 0).map(([k]) => { const [t, I] = FX_PILL[k] || [k, Ic.Info]; return <span key={k} className={`pill ${k === "smoke" ? "good" : "bad"}`}><I />{t}</span>; })}
          {!you && p.power_hint && <span className="pill">Looks {p.power_hint}</span>}</div>
      </div>
    </div>
  );
}

export function Fight({ arg }) {
  const { run, busy, refresh } = useGame();
  const [f, setF] = useState(null); const [err, setErr] = useState(""); const logRef = useRef(null);
  useEffect(() => { call("fight_get", { p_fight: +arg }).then(setF).catch(e => setErr(e.message)); }, [arg]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [f?.log?.length]);
  if (err) return <Empty title="Fight not found">{err}</Empty>;
  if (!f) return <Empty title="Squaring up…" />;
  const act = a => run("fight_turn", { p_fight: f.id, p_action: a }, setF);
  const on = f.status === "on"; const res = f.result || {};
  const turns = []; f.log.forEach((l, i) => { if (l.side === "a" || i === 0) turns.push([l]); else turns[turns.length - 1].push(l); });
  const verdict = { win: "You won", loss: "You lost", fled: res.fled !== false ? "You got away" : "Fight over", draw: "A standstill" }[f.status];
  return (
    <div className="page fightpage">
      <div className="pagehead"><div><h1>{on ? `Fighting ${f.them.name}` : verdict}</h1><p>{on ? `Turn ${f.turn + 1} of ${f.max_turns}. Pick your move. They answer straight after.${f.war ? " This is a war fight: a win scores points for your crew." : ""}` :
        f.status === "win" ? `You put ${f.them.name} in A&E and took ${money(res.cash)}. +${res.xp} xp${res.war_pts ? `, +${res.war_pts} war points` : ""}.`
        : f.status === "loss" ? `${f.them.name} put you down. ${Math.ceil((res.secs || 0) / 60)} minutes in A&E.`
        : f.status === "draw" ? `Twenty-five turns and nobody dropped. You both walk away hurting.` : `You walked away with the damage you took.`}</p></div></div>
      <div className="panel"><div className="body fighters">
        <Fighter p={f.me} fx={f.fx?.a} you />
        <span className="vs">vs</span>
        <Fighter p={f.them} fx={f.fx?.d} />
      </div></div>
      {on && <Panel title="Your move">
        <div className="moves">
          {f.actions.map(a => { const dry = a.ammo === 0; return (
            <button key={a.act} className="move" disabled={busy || dry} onClick={() => act(a.act)}>
              <ItemThumb id={a.item} />
              <span className="grow"><b>{itemName(a.item)}</b><span className="tiny">{a.effect && a.act.startsWith("throw") ? EFFECT[a.effect] : `${a.dmg}${a.shots > 1 ? ` x${a.shots}` : ""} dmg, ${a.acc}%`}{a.ammo != null ? `, ${dry ? "no ammo" : `${num(a.ammo)} rounds`}` : ""}{a.count > 1 ? `, ${a.count} left` : ""}</span></span>
            </button>); })}
          <button className="move" disabled={busy} onClick={() => act("fists")}><span className="thumb empty"><Ic.Swords /></span><span className="grow"><b>Fists</b><span className="tiny">6 dmg, 85%</span></span></button>
          <button className="move flee" disabled={busy} onClick={() => act("flee")}><span className="thumb empty"><Ic.Footprints /></span><span className="grow"><b>Run for it</b><span className="tiny">Works half the time. Always in smoke.</span></span></button>
        </div>
        {f.actions.length === 0 && <p className="tiny" style={{ marginTop: 10 }}>You came with nothing but your fists. Kit yourself out at the <button className="linkish" onClick={() => go("armoury")}>armoury</button> before the next one.</p>}
      </Panel>}
      <Panel title="What happened" flush>
        {f.log.length === 0 ? <Empty title="Nobody's moved yet">Your move.</Empty> :
        <ol className="fightlog" ref={logRef}>{turns.map((t, i) => <li key={i}><span className="step">{i + 1}</span><div>{t.map((l, j) => <p key={j} className={l.side === "a" ? "mine" : "theirs"}>{logText(l, f.me.name, f.them.name)}</p>)}</div></li>)}</ol>}
      </Panel>
      {!on && <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={() => { refresh(); go("fights"); }}>Back to fights</button><button className="btn ghost" onClick={() => go("armoury")}>Armoury</button><button className="btn ghost" onClick={() => go("player/" + f.them.id)}>{f.them.name}'s profile</button></div>}
    </div>
  );
}

// Start a fight and open it. Used by every Attack button.
export function useStartFight() {
  const { run } = useGame();
  return id => run("fight_start", { p_target: id }, r => go("fight/" + r.id));
}
