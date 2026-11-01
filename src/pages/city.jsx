import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, Avatar, Empty, Seg, Countdown } from "../ui/ui.jsx";
import { skyline, DISTRICT_ART } from "../game/art.js";
import { DISTRICTS } from "../game/content.js";
import { rankOf } from "../game/catalog.js";
import { STOCKS } from "../game/stocks.js";
import { call, supabase } from "../lib/supabase.js";
import { money, short, ago, num } from "../lib/format.js";
import { go, DISTRICT_NAMES } from "../lib/nav.js";
import { bustStory, pvpStory } from "../game/stories.js";
import * as Ic from "../ui/icons.js";

const STATUS = { ok: ["Out and about", "good"], jail: ["In the cells", "warn"], hosp: ["In A&E", "bad"], travel: ["In a taxi", ""] };
const hasBlock = (holdings, t) => (holdings[t]?.shares || 0) >= (STOCKS.find(s => s.t === t)?.shares || 1e12);
const nameBtn = { background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 650, color: "inherit", textAlign: "left" };

// ---------------- Map ----------------
export function CityMap() {
  const { me, holdings, run, busy, toast } = useGame();
  const free = hasBlock(holdings, "VOLT"), fast = hasBlock(holdings, "TRHD");
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Map</h1><p>Each district has its own jobs, its own trouble and better loot the further you go. A taxi takes {fast ? "20 seconds" : "a minute"}, and the ride cools your heat a little.</p></div></div>
      <div className="cols">
        {DISTRICTS.map(d => { const here = me.district === d.id; const locked = me.level < d.lvl; return (
          <div key={d.id} className="panel">
            <div className="mini-sky" style={{ height: 130, borderRadius: "10px 10px 0 0" }}><Svg svg={skyline(DISTRICT_ART[d.id])} /></div>
            <div className="body stack-sm">
              <div className="row" style={{ justifyContent: "space-between" }}><h2>{d.n}</h2>{here ? <span className="pill good"><Ic.MapPin />You're here</span> : locked ? <span className="pill"><Ic.Lock />Level {d.lvl}</span> : null}</div>
              <p className="muted small">{d.blurb}</p>
              {!here && <button className="btn" disabled={busy || locked || me.status !== "ok"} onClick={() => run("travel", { p_district: d.id }, r => toast(`Taxi booked to ${d.n}. ${r.fare ? money(r.fare) + " fare." : "Free ride."}`, "good"))}>
                <Ic.Car />Take a taxi{free ? " (free)" : `, ${money(d.fare)}`}</button>}
            </div>
          </div>); })}
      </div>
    </div>
  );
}

// ---------------- Players ----------------
export function Players() {
  const [scope, setScope] = useState("online"); const [q, setQ] = useState(""); const [rows, setRows] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => call("list_players", { p_scope: q ? "search" : scope, p_q: q || null }).then(setRows).catch(() => setRows([])), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [scope, q]);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Players</h1><p>Everyone else in the city. Tap a name to see their record.</p></div>
        <div className="row" style={{ flexWrap: "wrap" }}><Seg label="Show" value={q ? "" : scope} onChange={v => { setQ(""); setScope(v); }} options={[["online", "Online now"], ["here", "On my street"]]} />
          <input className="input" style={{ maxWidth: 220 }} placeholder="Find by name" value={q} onChange={e => setQ(e.target.value)} aria-label="Find a player by name" /></div></div>
      <Panel flush>
        {!rows ? <Empty title="Looking…" /> : rows.length === 0 ? <Empty title="Nobody found">{q ? "Check the spelling." : "Quiet night. Try again soon."}</Empty> :
        <div className="list">{rows.map(p => (
          <button key={p.id} className="li click" onClick={() => go("player/" + p.id)}>
            <Avatar seed={p.id} />
            <div><div className="t">{p.name}</div><div className="s">Level {p.level}, {rankOf(p.level).toLowerCase()} in {DISTRICT_NAMES[p.district]}{p.founder ? `, founder #${p.founder}` : ""}</div></div>
            <div className="act"><span className={`pill ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}</span></div>
          </button>))}</div>}
      </Panel>
    </div>
  );
}

export function Profile({ arg }) {
  const { me, run, busy, showSheet } = useGame();
  const [p, setP] = useState(null); const [err, setErr] = useState("");
  const load = () => call("get_profile", { p_id: arg }).then(setP).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [arg]);
  if (err) return <Empty title={err} />;
  if (!p) return <Empty title="Loading…" />;
  const canHit = !p.is_me && p.status === "ok" && !p.protected && p.district === me.district && me.level >= 3 && me.status === "ok";
  const why = p.is_me ? null : p.protected ? `${p.name} is new to the city and protected for now.` : p.status !== "ok" ? `${p.name} isn't around right now.` : p.district !== me.district ? `${p.name} is in ${DISTRICT_NAMES[p.district]}.` : me.level < 3 ? "You can attack other players from level 3." : null;
  return (
    <div className="page">
      <div className="panel"><div className="body row" style={{ gap: 18, flexWrap: "wrap" }}>
        <Avatar seed={p.id} lg />
        <div className="grow"><h1>{p.name}</h1><p className="muted">Level {p.level}, {rankOf(p.level).toLowerCase()}. On the street since {new Date(p.created_at).toLocaleDateString("en-NZ", { month: "long", year: "numeric" })}.</p>
          <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}><span className={`pill ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}{p.until && p.status !== "ok" ? <>&nbsp;for <Countdown until={p.until} onDone={load} /></> : null}</span>{p.founder && <span className="pill scarce"><Ic.Sparkles />Founder #{p.founder}</span>}{p.regular && <span className="pill good">Regular</span>}<span className="pill"><Ic.MapPin />{DISTRICT_NAMES[p.district]}</span><span className="pill">Last seen {ago(p.last_seen)}</span></div>
          {(p.jail_reason || p.hosp_reason) && <p className="tiny" style={{ marginTop: 6 }}>{p.jail_reason || p.hosp_reason}</p>}</div>
        {!p.is_me && <div className="stack-sm" style={{ alignItems: "flex-end" }}>
          <button className="btn danger" disabled={busy || !canHit} onClick={() => run("attack", { p_target: p.id }, r => { load(); showSheet({ verdict: r.won ? "You won" : "You lost", tone: r.won ? "good" : "bad", title: `You attacked ${r.name}`, story: pvpStory(r), cash: r.won ? r.cash : 0, lines: [r.won ? `+${r.xp} xp` : `${Math.ceil(r.secs / 60)} min in A&E`], pic: <Avatar seed={p.id} /> }); })}><Ic.Swords />Attack</button>
          {why && <span className="tiny" style={{ maxWidth: 240, textAlign: "right" }}>{why}</span>}</div>}
      </div></div>
      <div className="stats">
        <div className="stat"><div className="k">Fights won</div><div className="v">{num(p.wins)}</div></div>
        <div className="stat"><div className="k">Fights lost</div><div className="v">{num(p.losses)}</div></div>
        <div className="stat"><div className="k">Jobs pulled</div><div className="v">{num(p.jobs_done)}</div></div>
        <div className="stat"><div className="k">People sprung</div><div className="v">{num(p.busts)}</div></div>
      </div>
      <Panel title="Recent fights" flush>
        {p.recent.length === 0 ? <Empty title="No fights yet" /> :
        <div className="list">{p.recent.map((a, i) => (
          <div key={i} className="li"><Ic.Swords style={{ width: 18, color: "var(--mist)" }} />
            <div><div className="t">{a.attacker || "Someone"} attacked {a.defender || "someone"}</div><div className="s">{a.won ? `${a.attacker} won${a.cash ? ` and took ${money(a.cash)}` : ""}` : `${a.defender} fought them off`}</div></div>
            <div className="act tiny">{ago(a.at)}</div></div>))}</div>}
      </Panel>
    </div>
  );
}

// ---------------- The Cells and A&E ----------------
export function Cells() {
  const { me, run, busy, showSheet } = useGame();
  const [rows, setRows] = useState(null);
  const load = () => call("jail_list").then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);
  const chance = t => Math.round(Math.max(8, Math.min(92, 72 + Math.sqrt(me.crime_xp) * 2 - t.level * 3.5 - me.heat * 0.2)));
  return (
    <div className="page">
      <div className="pagehead"><div><h1>The Cells</h1><p>Who's locked up right now. Springing someone costs 5 grit and earns you their thanks. Get caught and you'll be in the next cell.</p></div></div>
      <Panel flush>
        {!rows ? <Empty title="Checking the cells…" /> : rows.length === 0 ? <Empty title="The cells are empty">Everyone's behaving, for once.</Empty> :
        <div className="list">{rows.map(t => (
          <div key={t.id} className="li">
            <Avatar seed={t.id} />
            <div><button className="t" style={nameBtn} onClick={() => go("player/" + t.id)}>{t.name}</button><div className="s">Level {t.level}. {t.reason}. Out in <Countdown until={t.until} onDone={load} />.</div></div>
            <div className="act">{t.id === me.id ? <span className="pill warn">That's you</span> : <><span className="tiny">{chance(t)}% odds</span>
              <button className="btn sm" disabled={busy || me.status !== "ok" || me.grit < 5} onClick={() => run("bust", { p_target: t.id }, r => { load(); showSheet({ verdict: r.ok ? "Sprung" : r.jailed ? "Caught" : "No luck", tone: r.ok ? "good" : "bad", title: `Springing ${r.name}`, story: bustStory(r), lines: r.jailed ? [`${Math.ceil(r.secs / 60)} min in the cells`] : [], pic: <Avatar seed={t.id} /> }); })}>Spring them</button></>}</div>
          </div>))}</div>}
      </Panel>
    </div>
  );
}

export function AandE() {
  const { me } = useGame();
  const [rows, setRows] = useState(null);
  const load = () => call("hosp_list").then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>A&amp;E</h1><p>Who's being patched up, and who put them there.</p></div></div>
      <Panel flush>
        {!rows ? <Empty title="Checking the ward…" /> : rows.length === 0 ? <Empty title="Every bed is empty">A quiet night at the hospital.</Empty> :
        <div className="list">{rows.map(t => (
          <div key={t.id} className="li">
            <Avatar seed={t.id} />
            <div><button className="t" style={nameBtn} onClick={() => go("player/" + t.id)}>{t.name}</button><div className="s">Level {t.level}. {t.reason}.</div></div>
            <div className="act">{t.id === me.id && <span className="pill bad">That's you</span>}<span className="tiny">Out in <Countdown until={t.until} onDone={load} /></span></div>
          </div>))}</div>}
      </Panel>
    </div>
  );
}

// ---------------- Chat ----------------
export function Chat() {
  const { me, toast } = useGame();
  const [msgs, setMsgs] = useState(null); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
  const log = useRef(null); const stick = useRef(true);
  const load = () => call("chat_recent", { p_limit: 80 }).then(setMsgs).catch(() => setMsgs(m => m || []));
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    const ch = supabase.channel?.("chat").on("postgres_changes", { event: "INSERT", schema: "game", table: "messages" }, p => {
      setMsgs(m => (m || []).some(x => x.id === p.new.id) ? m : [...(m || []), p.new].slice(-120));
    }).subscribe();
    return () => { clearInterval(t); ch && supabase.removeChannel(ch); };
  }, []);
  useEffect(() => { const el = log.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);
  async function send(e) {
    e.preventDefault(); if (!body.trim()) return; setSending(true);
    try { await call("chat_send", { p_body: body }); setBody(""); stick.current = true; load(); } catch (x) { toast(x.message, "bad"); } finally { setSending(false); }
  }
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Chat</h1><p>One room for the whole city. Be a menace in the game, not in here.</p></div></div>
      <div className="panel">
        <div className="chatlog" ref={log} onScroll={e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }} aria-live="polite">
          {!msgs ? <Empty title="Tuning in…" /> : msgs.length === 0 ? <Empty title="Nobody's said anything yet">Say hello.</Empty> :
            msgs.map(m => (
              <div key={m.id} className={`msg ${m.player_id ? "" : "sys"}`}>
                <Avatar seed={m.player_id || m.name} />
                <div><button style={nameBtn} onClick={() => m.player_id && go("player/" + m.player_id)}><b>{m.name}</b></button><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" })}</time>
                  <p>{m.body}</p></div>
              </div>))}
        </div>
        <form className="chatform" onSubmit={send}>
          <input className="input" maxLength={280} value={body} onChange={e => setBody(e.target.value)} placeholder={`Say something, ${me.name}`} aria-label="Message" />
          <button className="btn" disabled={sending || !body.trim()}><Ic.Send />Send</button>
        </form>
      </div>
    </div>
  );
}

// ---------------- Rankings ----------------
export function Rankings() {
  const { me } = useGame();
  const [by, setBy] = useState("level"); const [rows, setRows] = useState(null);
  useEffect(() => { setRows(null); call("leaderboard", { p_by: by }).then(setRows).catch(() => setRows([])); }, [by]);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Rankings</h1><p>The top fifty in the city.</p></div>
        <Seg label="Rank by" value={by} onChange={setBy} options={[["level", "Level"], ["wealth", "Net worth"], ["fights", "Fights won"]]} /></div>
      <Panel flush>
        {!rows ? <Empty title="Counting…" /> :
        <div className="tablewrap"><table className="table">
          <thead><tr><th style={{ width: 48 }}>#</th><th>Player</th><th className="num">{by === "wealth" ? "Net worth" : by === "fights" ? "Wins" : "Level"}</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id} style={r.id === me.id ? { background: "var(--sodium-soft)" } : undefined}>
              <td className="muted">{i + 1}</td>
              <td><button style={{ ...nameBtn, display: "flex", alignItems: "center", gap: 10 }} onClick={() => go("player/" + r.id)}><Avatar seed={r.id} className="sm" />{r.name}</button></td>
              <td className="num"><b>{by === "wealth" ? short(r.networth) : by === "fights" ? num(r.wins) : r.level}</b></td>
            </tr>))}</tbody>
        </table></div>}
      </Panel>
    </div>
  );
}

// ---------------- Notifications ----------------
const KIND_ICON = { attacked: Ic.Swords, defended: Ic.Shield, sale: Ic.Coins, level: Ic.Sparkles, skill: Ic.Sparkles, bust: Ic.Lock };
export function News() {
  const { refresh } = useGame();
  const [rows, setRows] = useState(null);
  useEffect(() => { call("get_events", { p_limit: 60 }).then(r => { setRows(r); refresh(); }).catch(() => setRows([])); }, []);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Notifications</h1><p>What happened while you were busy.</p></div></div>
      <Panel flush>
        {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="Nothing yet">Fights, sales and level-ups will show up here.</Empty> :
        <div className="list">{rows.map(e => { const Icon = KIND_ICON[e.kind] || Ic.Bell; return (
          <div key={e.id} className="li" style={!e.seen ? { background: "var(--sodium-soft)" } : undefined}>
            <Icon style={{ width: 18, color: e.kind === "attacked" ? "var(--brick)" : "var(--sodium)" }} />
            <div className="t" style={{ fontWeight: e.seen ? 500 : 650 }}>{e.body}</div>
            <div className="act tiny">{ago(e.created_at)}</div>
          </div>); })}</div>}
      </Panel>
    </div>
  );
}

// ---------------- Account ----------------
export function Account() {
  const { me, session } = useGame();
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("bs-theme") || "auto"; } catch (e) { return "auto"; } });
  function pickTheme(t) {
    setTheme(t);
    if (t === "auto") { delete document.documentElement.dataset.theme; try { localStorage.removeItem("bs-theme"); } catch (e) {} }
    else { document.documentElement.dataset.theme = t; try { localStorage.setItem("bs-theme", t); } catch (e) {} }
  }
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Account</h1><p>Signed in as {session.user.email}.</p></div></div>
      <Panel title="Appearance">
        <Seg label="Theme" value={theme} onChange={pickTheme} options={[["auto", "Match my device"], ["dark", "Dark"], ["light", "Light"]]} />
      </Panel>
      <Panel title="Your character">
        <div className="row"><Avatar seed={me.id} lg /><div><h2>{me.name}</h2><p className="muted">Level {me.level}. Your face is drawn from your account, so it stays the same everywhere.</p></div></div>
      </Panel>
      <div className="row"><button className="btn ghost" onClick={() => supabase.auth.signOut()}><Ic.LogOut />Sign out</button><a className="btn ghost" href="#/legal">Terms and privacy</a></div>
    </div>
  );
}
