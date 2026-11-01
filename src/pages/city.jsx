import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, Avatar, Empty, Seg, Countdown, Name } from "../ui/ui.jsx";
import { skyline, DISTRICT_ART, WARDROBE } from "../game/art.js";
import { DISTRICTS } from "../game/content.js";
import { rankOf } from "../game/catalog.js";
import { STOCKS } from "../game/stocks.js";
import { call, supabase } from "../lib/supabase.js";
import { money, short, ago, num } from "../lib/format.js";
import { go, DISTRICT_NAMES } from "../lib/nav.js";
import { bustStory, pvpStory } from "../game/stories.js";
import * as Ic from "../ui/icons.js";
import { useStartFight } from "./armoury.jsx";
import { CountrySelect, flag, countryName } from "../ui/country.jsx";

const STATUS = { ok: ["Out and about", "good"], jail: ["In the cells", "warn"], hosp: ["In A&E", "bad"], travel: ["In a taxi", ""], road: ["On the road", ""], away: ["Out of town", ""] };
const hasBlock = (holdings, t) => (holdings[t]?.shares || 0) >= (STOCKS.find(s => s.t === t)?.shares || 1e12);
const nameBtn = { background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 650, color: "inherit", textAlign: "left" };

// ---------------- Map ----------------
export function CityMap() {
  const { me, state, holdings, run, busy, toast } = useGame();
  const [turf, setTurf] = useState(null);
  useEffect(() => { call("turf_state").then(setTurf).catch(() => setTurf({ districts: [] })); }, []);
  const T = Object.fromEntries((turf?.districts || []).map(t => [t.id, t]));
  const free = hasBlock(holdings, "VOLT");
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Map and turf</h1><p>Each district has its own jobs, trouble and better loot the further out you go. Crews fight for control: every job and fight a member wins earns their crew influence there. The crew with the most influence over the last seven days runs the district. Its members get +3% job odds there, and its vault takes a 3% cut of every job done there by anyone.</p></div></div>
      <div className="cols">
        {DISTRICTS.map(d => { const here = me.district === d.id; const locked = me.level < d.lvl; const t = T[d.id]; const ours = t?.owner && t.owner.id === state.crew?.id; const top = t?.standings?.[0]?.pts || 0; return (
          <div key={d.id} className={`panel ${ours ? "ourturf" : ""}`}>
            <div className="mini-sky" style={{ height: 130, borderRadius: "10px 10px 0 0" }}><Svg svg={skyline(DISTRICT_ART[d.id])} />
              {t?.owner && <span className="turfflag"><span className="crewmark sm">{t.owner.tag}</span>{ours ? "Your crew's turf" : `Run by ${t.owner.name}`}</span>}</div>
            <div className="body stack-sm">
              <div className="row" style={{ justifyContent: "space-between" }}><h2>{d.n}</h2>{here ? <span className="pill good"><Ic.MapPin />You're here</span> : locked ? <span className="pill"><Ic.Lock />Level {d.lvl}</span> : null}</div>
              <p className="muted small">{d.blurb}</p>
              {t && <div className="stack-sm">{t.standings.length === 0 ? <span className="tiny">No crew has a hold here yet. 50 influence takes it.</span> :
                t.standings.slice(0, 3).map(c => <div key={c.id} className="turfrow"><span className="small"><b>{c.tag}</b> {c.name}</span><div className="xpbar"><i style={{ width: (c.pts / Math.max(50, top)) * 100 + "%", background: c.id === state.crew?.id ? "var(--seaglass)" : undefined }} /></div><span className="tiny">{num(c.pts)}</span></div>)}</div>}
              {!here && <button className="btn" disabled={busy || locked || me.status !== "ok"} onClick={() => run("travel", { p_district: d.id }, r => toast(`On your way to ${d.n}. ${r.fare ? money(r.fare) + " fare" : "Free ride"}, ${r.secs} seconds.`, "good"))}>
                <Ic.Car />Travel{free ? " (free)" : ""}</button>}
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
      <div className="pagehead"><div><h1>Players</h1><p>Everyone else in the city. Tap a name to see their record, add them to your contacts or send a message.</p></div>
        <div className="row" style={{ flexWrap: "wrap" }}><Seg label="Show" value={q ? "" : scope} onChange={v => { setQ(""); setScope(v); }} options={[["online", "Online now"], ["here", "On my street"], ["contacts", "Contacts"]]} />
          <input className="input" style={{ maxWidth: 220 }} placeholder="Find by name" value={q} onChange={e => setQ(e.target.value)} aria-label="Find a player by name" /></div></div>
      <Panel flush>
        {!rows ? <Empty title="Looking…" /> : rows.length === 0 ? <Empty title={scope === "contacts" && !q ? "No contacts yet" : "Nobody found"}>{q ? "Check the spelling." : scope === "contacts" ? "Open someone's profile and choose Add to contacts." : "Quiet night. Try again soon."}</Empty> :
        <div className="list">{rows.map(p => (
          <button key={p.id} className="li click" onClick={() => go("player/" + p.id)}>
            <Avatar seed={p.id} look={p.look} />
            <div><div className="t"><Name p={p} /></div><div className="s">Level {p.level}, {rankOf(p.level).toLowerCase()} in {DISTRICT_NAMES[p.district]}{p.founder ? `, founder #${p.founder}` : ""}</div></div>
            <div className="act"><span className={`pill ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}</span></div>
          </button>))}</div>}
      </Panel>
    </div>
  );
}

export function Profile({ arg }) {
  const { me, run, busy, showSheet, toast } = useGame(); const startFight = useStartFight();
  const [p, setP] = useState(null); const [err, setErr] = useState("");
  const load = () => call("get_profile", { p_id: arg }).then(setP).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [arg]);
  if (err) return <Empty title={err} />;
  if (!p) return <Empty title="Loading…" />;
  const sameCrew = p.crew && me.crew_id === p.crew.id;
  const canHit = !p.is_me && !sameCrew && p.status === "ok" && !p.protected && p.district === me.district && me.level >= 3 && me.status === "ok";
  const why = p.is_me ? null : sameCrew ? `${p.name} is in your crew.` : p.protected ? `${p.name} is new to the city and protected for now.` : p.status !== "ok" ? `${p.name} isn't around right now.` : p.district !== me.district ? `${p.name} is in ${DISTRICT_NAMES[p.district]}.` : me.level < 3 ? "You can attack other players from level 3." : null;
  return (
    <div className="page">
      <div className={`panel profile ${p.backdrop ? "has-backdrop" : ""}`}>
        {p.backdrop && <div className="backdrop"><Svg svg={skyline(DISTRICT_ART[p.backdrop])} /><div className="fade" /></div>}
        <div className="body row" style={{ gap: 18, flexWrap: "wrap", position: "relative" }}>
          <Avatar seed={p.id} look={p.look} xl className={p.regular ? "ring" : ""} />
          <div className="grow">{p.title && <div className="ptitle">{p.title}</div>}<h1><Name p={p} tag={false} /></h1>
            {p.tagline && <p className="tagline">“{p.tagline}”</p>}
            <p className="muted">Level {p.level}, {rankOf(p.level).toLowerCase()}{p.crew ? <> in <button style={{ ...nameBtn, color: "var(--signal)" }} onClick={() => go("crew/" + p.crew.id)}>{p.crew.name}</button>{p.crew_role === "leader" ? ", which they lead" : ""}</> : ""}. On the street since {new Date(p.created_at).toLocaleDateString("en-NZ", { month: "long", year: "numeric" })}.</p>
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}><span className={`pill ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}{p.until && p.status !== "ok" ? <>&nbsp;for <Countdown until={p.until} onDone={load} /></> : null}</span>{p.founder && <span className="pill scarce"><Ic.Sparkles />Founder #{p.founder}</span>}{p.regular && <span className="pill good"><Ic.Star />Regular</span>}<span className="pill"><Ic.MapPin />{DISTRICT_NAMES[p.district]}</span><span className="pill">Last seen {ago(p.last_seen)}</span></div>
            {(p.jail_reason || p.hosp_reason) && <p className="tiny" style={{ marginTop: 6 }}>{p.jail_reason || p.hosp_reason}</p>}</div>
          {!p.is_me ? <div className="stack-sm" style={{ alignItems: "flex-end" }}>
            <button className="btn danger" disabled={busy || !canHit} onClick={() => startFight(p.id)}><Ic.Swords />Attack</button>
            <div className="row"><button className="btn ghost sm" onClick={() => go("messages/" + p.id)}><Ic.Mail />Message</button>
              <button className="btn ghost sm" disabled={busy} onClick={() => run("contact_toggle", { p_id: p.id }, r => { load(); toast(r.contact ? `${p.name} added to your contacts.` : `${p.name} removed from your contacts.`); })}>{p.is_contact ? <><Ic.UserCheck />In contacts</> : <><Ic.UserPlus />Add to contacts</>}</button></div>
            {why && <span className="tiny" style={{ maxWidth: 260, textAlign: "right" }}>{why}</span>}</div>
          : <button className="btn ghost" onClick={() => go("account")}><Ic.Pencil />Edit profile</button>}
        </div>
      </div>
      <div className="stats">
        <div className="stat"><div className="k">Fights won</div><div className="v">{num(p.wins)}</div></div>
        <div className="stat"><div className="k">Fights lost</div><div className="v">{num(p.losses)}</div></div>
        <div className="stat"><div className="k">Jobs pulled</div><div className="v">{num(p.jobs_done)}</div></div>
        <div className="stat"><div className="k">People sprung</div><div className="v">{num(p.busts)}</div></div>
        <div className="stat"><div className="k">Collection</div><div className="v">{num(p.collection)} <span className="muted small">items</span></div></div>
        <div className="stat"><div className="k">Lives in</div><div className="v" style={{ fontSize: 16 }}>{p.property}</div></div>
        <div className="stat"><div className="k">Gets around by</div><div className="v" style={{ fontSize: 16 }}>{p.vehicle_name}</div></div>
        <div className="stat"><div className="k">Day job</div><div className="v" style={{ fontSize: 16 }}>{p.career_title || "None"}</div></div>
        <button className="stat" style={{ textAlign: "left", border: 0, font: "inherit", color: "inherit", cursor: "pointer" }} onClick={() => go("medals/" + p.id)}><div className="k">Medals</div><div className="v">{num(p.medals)} <span className="muted small">see all</span></div></button>
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
            <Avatar seed={t.id} look={t.look} />
            <div><button className="t" style={nameBtn} onClick={() => go("player/" + t.id)}><Name p={t} /></button><div className="s">Level {t.level}. {t.reason}. Out in <Countdown until={t.until} onDone={load} />.</div></div>
            <div className="act">{t.id === me.id ? <span className="pill warn">That's you</span> : <><span className="tiny">{chance(t)}% odds</span>
              <button className="btn sm" disabled={busy || me.status !== "ok" || me.grit < 5} onClick={() => run("bust", { p_target: t.id }, r => { load(); showSheet({ verdict: r.ok ? "Sprung" : r.jailed ? "Caught" : "No luck", tone: r.ok ? "good" : "bad", title: `Springing ${r.name}`, story: bustStory(r), lines: r.jailed ? [`${Math.ceil(r.secs / 60)} min in the cells`] : [], pic: <Avatar seed={t.id} look={t.look} /> }); })}>Spring them</button></>}</div>
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
            <Avatar seed={t.id} look={t.look} />
            <div><button className="t" style={nameBtn} onClick={() => go("player/" + t.id)}><Name p={t} /></button><div className="s">Level {t.level}. {t.reason}.</div></div>
            <div className="act">{t.id === me.id && <span className="pill bad">That's you</span>}<span className="tiny">Out in <Countdown until={t.until} onDone={load} /></span></div>
          </div>))}</div>}
      </Panel>
    </div>
  );
}

// ---------------- Chat ----------------
export function Chat() {
  const { me, state, toast, run } = useGame();
  const [room, setRoom] = useState(location.hash.includes("?crew") && state.crew ? "crew" : "city");
  const [msgs, setMsgs] = useState(null); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
  const log = useRef(null); const stick = useRef(true);
  const load = () => call("chat_recent", { p_limit: 80, p_channel: room }).then(setMsgs).catch(() => setMsgs(m => m || []));
  useEffect(() => {
    setMsgs(null); load();
    const t = setInterval(load, 10000);
    const want = room === "crew" ? "crew:" + state.crew?.id : "city";
    const ch = supabase.channel?.("chat-" + want).on("postgres_changes", { event: "INSERT", schema: "game", table: "messages" }, p => {
      if (p.new.channel !== want) return;
      if (p.new.player_id) load();  // fetch so the sender's look and colour come with it
      else setMsgs(m => (m || []).some(x => x.id === p.new.id) ? m : [...(m || []), p.new].slice(-120));
    }).subscribe();
    return () => { clearInterval(t); ch && supabase.removeChannel(ch); };
  }, [room]);
  useEffect(() => { const el = log.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);
  async function send(e) {
    e.preventDefault(); if (!body.trim()) return; setSending(true);
    try { await call("chat_send", { p_body: body, p_channel: room }); setBody(""); stick.current = true; load(); } catch (x) { toast(x.message, "bad"); } finally { setSending(false); }
  }
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Chat</h1><p>{room === "crew" ? `Only members of ${state.crew.name} can read this.` : "One room for the whole city. Be a menace in the game, not in here."}</p></div>
        {state.crew && <Seg label="Room" value={room} onChange={setRoom} options={[["city", "City"], ["crew", state.crew.name]]} />}</div>
      <div className="panel">
        <div className="chatlog" ref={log} onScroll={e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }} aria-live="polite">
          {!msgs ? <Empty title="Tuning in…" /> : msgs.length === 0 ? <Empty title="Nobody's said anything yet">Say hello.</Empty> :
            msgs.map(m => (
              <div key={m.id} className={`msg ${m.player_id ? "" : "sys"}`}>
                <Avatar seed={m.player_id || m.name} look={m.look} />
                <div><button style={nameBtn} onClick={() => m.player_id && go("player/" + m.player_id)}><b><Name p={m} tag={room === "city"} /></b></button><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" })}</time>
                  {m.player_id && m.player_id !== me.id && <span className="msgtools">
                    <button aria-label="Report this message" title="Report" onClick={() => run("report", { p_target: m.player_id, p_message: m.id, p_reason: "" }, () => toast("Thanks. An admin will take a look."))}><Ic.Flag /></button>
                    {me.is_admin && <button aria-label="Delete this message" title="Delete" onClick={() => run("admin_delete_message", { p_id: m.id }, load)}><Ic.Trash2 /></button>}</span>}
                  <p>{m.body}</p></div>
              </div>))}
        </div>
        <form className="chatform" onSubmit={send}>
          <input className="input" maxLength={280} value={body} onChange={e => setBody(e.target.value)} placeholder={room === "crew" ? "Say something to your crew" : `Say something, ${me.name}`} aria-label="Message" />
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
        <Seg label="Rank by" value={by} onChange={setBy} options={[["level", "Level"], ["wealth", "Net worth"], ["fights", "Fights won"], ["crews", "Crews"]]} /></div>
      <Panel flush>
        {!rows ? <Empty title="Counting…" /> : rows.length === 0 ? <Empty title="Nobody here yet" /> :
        <div className="tablewrap"><table className="table">
          <thead><tr><th style={{ width: 48 }}>#</th><th>{by === "crews" ? "Crew" : "Player"}</th><th className="num">{by === "wealth" ? "Net worth" : by === "fights" ? "Wins" : by === "crews" ? "Respect" : "Level"}</th></tr></thead>
          <tbody>{rows.map((r, i) => by === "crews" ? (
            <tr key={r.id} style={r.id === me.crew_id ? { background: "var(--sodium-soft)" } : undefined}>
              <td className={i < 3 ? "medal m" + i : "muted"}>{i + 1}</td>
              <td><button style={{ ...nameBtn, display: "flex", alignItems: "center", gap: 10 }} onClick={() => go("crew/" + r.id)}><span className="crewmark sm">{r.tag}</span>{r.name} <span className="tiny">{r.members} members</span></button></td>
              <td className="num"><b>{num(r.respect)}</b></td>
            </tr>) : (
            <tr key={r.id} style={r.id === me.id ? { background: "var(--sodium-soft)" } : undefined}>
              <td className={i < 3 ? "medal m" + i : "muted"}>{i + 1}</td>
              <td><button style={{ ...nameBtn, display: "flex", alignItems: "center", gap: 10 }} onClick={() => go("player/" + r.id)}><Avatar seed={r.id} look={r.look} className="sm" /><Name p={r} tag={false} /></button></td>
              <td className="num"><b>{by === "wealth" ? short(r.networth) : by === "fights" ? num(r.wins) : r.level}</b></td>
            </tr>))}</tbody>
        </table></div>}
      </Panel>
    </div>
  );
}

// ---------------- Notifications ----------------
const KIND_ICON = { attacked: Ic.Swords, defended: Ic.Shield, sale: Ic.Coins, level: Ic.Sparkles, skill: Ic.Sparkles, bust: Ic.Lock, crew: Ic.Flag, dm: Ic.Mail, tokens: Ic.Coins, founder: Ic.Crown, mod: Ic.ShieldCheck, report: Ic.Flag };
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
const FLAGS = [["shades", "Shades"], ["glasses", "Glasses"], ["beard", "Beard"], ["scar", "Scar"], ["grin", "Grin"], ["chain", "Chain"], ["lips", "Lipstick"]];
const HAT_NAMES = { cap: "Cap", slick: "Slicked back", bald: "Bald", bandana: "Bandana", beanie: "Beanie", fedora: "Fedora", mohawk: "Mohawk", long: "Long hair", headset: "Headset" };

export function Account() {
  const { me, session, run, busy, toast } = useGame();
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("bs-theme") || "auto"; } catch (e) { return "auto"; } });
  const [look, setLook] = useState(() => me.look || { skin: 0, hat: 0, shirt: 0, bg: 0, grin: true });
  const [tagline, setTagline] = useState(me.tagline || "");
  const [country, setCountry] = useState(me.country || "NZ");
  function pickTheme(t) {
    setTheme(t);
    if (t === "auto") { delete document.documentElement.dataset.theme; try { localStorage.removeItem("bs-theme"); } catch (e) {} }
    else { document.documentElement.dataset.theme = t; try { localStorage.setItem("bs-theme", t); } catch (e) {} }
  }
  const set = (k, v) => setLook({ ...look, [k]: v });
  const Swatches = ({ k, list, label }) => (
    <div className="stack-sm"><span className="tiny">{label}</span><div className="swatches" role="group" aria-label={label}>
      {list.map((c, i) => <button key={i} type="button" className="swatch" aria-pressed={look[k] === i} aria-label={`${label} ${i + 1}`} style={{ background: c }} onClick={() => set(k, i)} />)}</div></div>
  );
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Account</h1><p>Signed in as {session.user.email}.</p></div>
        <button className="btn ghost" onClick={() => go("player/" + me.id)}>View my profile</button></div>
      <Panel title="Your country" note="Your travel map starts here, with Greyhaven placed inside it. You can change it when you're home.">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><CountrySelect id="acct-country" value={country} onChange={setCountry} />
          <button className="btn" disabled={busy || country === me.country} onClick={() => run("country_set", { p_country: country }, r => toast(`Your country is now ${r.name}.`, "good"))}>Save</button></div>
      </Panel>
      <Panel title="Your look" note="Change it whenever you like. It's free.">
        <div className="wardrobe">
          <div className="stack-sm" style={{ alignItems: "center" }}><Avatar seed={me.id} look={look} xl /><span className="tiny">Preview</span></div>
          <div className="stack">
            <Swatches k="skin" list={WARDROBE.SKIN} label="Skin" />
            <Swatches k="shirt" list={WARDROBE.SHIRTS} label="Shirt" />
            <Swatches k="bg" list={WARDROBE.BGS} label="Background" />
            <div className="stack-sm"><span className="tiny">Hair and hats</span><div className="chips">{WARDROBE.HATS.map((h, i) => <button key={h} type="button" className="chip" aria-pressed={look.hat === i} onClick={() => set("hat", i)}>{HAT_NAMES[h] || h}</button>)}</div></div>
            <div className="stack-sm"><span className="tiny">Extras</span><div className="chips">{FLAGS.map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={!!look[k]} onClick={() => set(k, !look[k])}>{l}</button>)}</div></div>
            <label className="field">Profile tagline<input className="input" maxLength={80} value={tagline} onChange={e => setTagline(e.target.value)} placeholder="A line about you, shown on your profile" /></label>
            <div className="row" style={{ flexWrap: "wrap" }}><button className="btn" disabled={busy} onClick={() => run("profile_set", { p_look: look, p_tagline: tagline }, () => toast("Looking good.", "good"))}>Save my look</button>
              <button className="btn ghost" onClick={() => go("tokens")}><Ic.Palette />Name colours and backdrops</button></div>
          </div>
        </div>
      </Panel>
      <Panel title="Appearance">
        <Seg label="Theme" value={theme} onChange={pickTheme} options={[["auto", "Match my device"], ["dark", "Dark"], ["light", "Light"]]} />
      </Panel>
      <div className="row"><button className="btn ghost" onClick={() => supabase.auth.signOut()}><Ic.LogOut />Sign out</button><a className="btn ghost" href="#/legal">Terms and privacy</a></div>
    </div>
  );
}
