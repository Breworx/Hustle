import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Avatar, Empty, Seg, Name } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

const ROLE = { leader: "Leader", officer: "Officer", member: "Member" };
const linkBtn = { background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", textAlign: "left", fontWeight: 650 };

// ---------------- Crews ----------------
export function Crews() {
  const { state } = useGame();
  const [tab, setTab] = useState(state.crew ? "mine" : "browse");
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Crews</h1><p>A crew shares a private chat, a vault and a reputation. Every fight a member wins against an outsider earns the crew respect, and the crews with the most respect top the rankings.</p></div>
        {state.crew && <Seg label="Crews" value={tab} onChange={setTab} options={[["mine", state.crew.name], ["browse", "All crews"]]} />}</div>
      {tab === "mine" && state.crew ? <CrewView id={state.crew.id} /> : <CrewBrowse />}
    </div>
  );
}

export function CrewPage({ arg }) {
  return <div className="page"><button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("crews")}>All crews</button><CrewView id={+arg} /></div>;
}

function CrewBrowse() {
  const { me, state, run, busy, toast } = useGame();
  const [rows, setRows] = useState(null); const [name, setName] = useState(""); const [tag, setTag] = useState("");
  const load = () => call("crew_list").then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="cols-2">
      <Panel title="Crews in the city" flush>
        {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="No crews yet">Start the first one and the city will know your name.</Empty> :
        <div className="list">{rows.map(c => (
          <div key={c.id} className="li">
            <span className="crewmark">{c.tag}</span>
            <div><button style={linkBtn} onClick={() => go("crew/" + c.id)}>{c.name}</button><div className="s">{num(c.members)} member{c.members === 1 ? "" : "s"}, led by {c.leader}. {num(c.respect)} respect.{c.motto ? ` “${c.motto}”` : ""}</div></div>
            <div className="act">{state.crew ? null : c.applied ? <button className="btn ghost sm" disabled={busy} onClick={() => run("crew_withdraw", { p_id: c.id }, load)}>Withdraw</button>
              : <button className="btn sm" disabled={busy} onClick={() => run("crew_apply", { p_id: c.id, p_note: "" }, () => { load(); toast(`Application sent to ${c.name}.`, "good"); })}>Apply</button>}</div>
          </div>))}</div>}
      </Panel>
      {!state.crew && <Panel title="Start a crew" note="Costs $25,000. You need level 5.">
        <form className="stack-sm" onSubmit={e => { e.preventDefault(); run("crew_create", { p_name: name, p_tag: tag }, () => toast(`${name} is open for business.`, "good")); }}>
          <label className="field">Crew name<input className="input" maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Harbour Rats" /></label>
          <label className="field">Tag, 2 to 4 letters<input className="input" maxLength={4} value={tag} onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="HR" style={{ maxWidth: 120 }} /></label>
          <button className="btn" disabled={busy || me.level < 5 || me.cash < 25000 || name.trim().length < 3 || tag.length < 2}>Start the crew for {money(25000)}</button>
          {(me.level < 5 || me.cash < 25000) && <p className="tiny">{me.level < 5 ? "You need level 5." : `You have ${money(me.cash)} on you.`}</p>}
        </form>
      </Panel>}
    </div>
  );
}

function CrewView({ id }) {
  const { me, run, busy, toast, refresh } = useGame();
  const [c, setC] = useState(null); const [err, setErr] = useState(""); const [amt, setAmt] = useState(""); const [motto, setMotto] = useState(null);
  const load = () => call("crew_get", { p_id: id }).then(setC).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  if (err) return <Empty title={err} />;
  if (!c) return <Empty title="Loading…" />;
  const lead = c.my_role === "leader", boss = lead || c.my_role === "officer";
  const act = (fn, args, msg) => run(fn, args, () => { load(); if (msg) toast(msg, "good"); });
  return (<>
    <div className="panel crewhead"><div className="body row" style={{ gap: 16, flexWrap: "wrap" }}>
      <span className="crewmark lg">{c.tag}</span>
      <div className="grow"><h1>{c.name}</h1>
        <p className="muted">{c.motto ? `“${c.motto}”` : "No motto yet."} Ranked #{c.rank} with {num(c.respect)} respect. Founded {new Date(c.created_at).toLocaleDateString("en-NZ", { month: "long", year: "numeric" })}.</p></div>
      {c.war && <button className="btn danger" onClick={() => go("war")}><Ic.Swords />At war with {c.war.vs}</button>}
      {!c.mine && c.can_declare && !c.war && <button className="btn danger" onClick={() => go("war")}><Ic.Swords />Declare war</button>}
      {c.mine ? <button className="btn ghost" disabled={busy} onClick={() => run("crew_leave", {}, r => { refresh(); toast(r.disbanded ? "You were the last one. The crew is no more." : "You've left the crew."); go("crews"); })}><Ic.LogOut />Leave crew</button>
        : !me.crew_id && (c.applied ? <span className="pill">Application sent</span> : <button className="btn" disabled={busy} onClick={() => act("crew_apply", { p_id: c.id, p_note: "" }, "Application sent.")}>Apply to join</button>)}
    </div></div>

    {c.mine && <div className="stats">
      <div className="stat"><div className="k">Crew vault</div><div className="v">{money(c.vault)}</div></div>
      <div className="stat"><div className="k">Members</div><div className="v">{c.members.length} <span className="muted small">of 25</span></div></div>
      <div className="stat"><div className="k">Your role</div><div className="v">{ROLE[c.my_role]}</div></div>
    </div>}

    {boss && c.apps?.length > 0 && <Panel title="Applications" flush>
      <div className="list">{c.apps.map(a => (
        <div key={a.id} className="li"><Avatar seed={a.id} look={a.look} />
          <div><button style={linkBtn} onClick={() => go("player/" + a.id)}><Name p={a} /></button><div className="s">Level {a.level}, {a.wins} wins. Applied {ago(a.at)}.{a.note ? ` “${a.note}”` : ""}</div></div>
          <div className="act"><button className="btn sm good" disabled={busy} onClick={() => act("crew_decide", { p_player: a.id, p_accept: true }, `${a.name} is in.`)}>Let them in</button>
            <button className="btn ghost sm" disabled={busy} onClick={() => act("crew_decide", { p_player: a.id, p_accept: false })}>Turn down</button></div>
        </div>))}</div>
    </Panel>}

    <div className="cols-2">
      <Panel title="Members" flush>
        <div className="list">{c.members.map(m => (
          <div key={m.id} className="li"><Avatar seed={m.id} look={m.look} />
            <div><button style={linkBtn} onClick={() => go("player/" + m.id)}><Name p={m} tag={false} /></button>
              <div className="s">{ROLE[m.role]}, level {m.level}. {m.status === "ok" ? `Last seen ${ago(m.last_seen)}` : m.status === "jail" ? "In the cells" : m.status === "hosp" ? "In A&E" : "In a taxi"}.</div></div>
            <div className="act">{m.id !== me.id && lead && <>
                {m.role === "member" && <button className="btn ghost sm" disabled={busy} onClick={() => act("crew_member", { p_player: m.id, p_action: "officer" })}>Make officer</button>}
                {m.role === "officer" && <button className="btn ghost sm" disabled={busy} onClick={() => act("crew_member", { p_player: m.id, p_action: "member" })}>Demote</button>}
                <button className="btn ghost sm" disabled={busy} onClick={() => act("crew_member", { p_player: m.id, p_action: "leader" }, `${m.name} leads the crew now.`)}>Hand over</button></>}
              {m.id !== me.id && (lead || (c.my_role === "officer" && m.role === "member")) && <button className="btn ghost sm" disabled={busy} onClick={() => act("crew_member", { p_player: m.id, p_action: "kick" })}>Remove</button>}</div>
          </div>))}</div>
      </Panel>
      {c.mine && <div className="stack">
        <Panel title="Vault" note={lead ? "Anyone can pay in. You can pay members out." : "Anyone can pay in. The leader pays out."}>
          <div className="stack-sm">
            <input className="input" type="number" inputMode="numeric" min={1} value={amt} onChange={e => setAmt(e.target.value)} placeholder="Amount" aria-label="Amount" />
            <button className="btn" disabled={busy || !(+amt > 0)} onClick={() => run("crew_vault", { p_amount: +amt }, () => { load(); setAmt(""); toast("Paid into the vault.", "good"); })}>Pay in</button>
            {lead && <select className="input" defaultValue="" onChange={e => { const to = e.target.value; e.target.value = ""; if (to && +amt > 0) run("crew_vault", { p_amount: +amt, p_to: to }, () => { load(); setAmt(""); toast("Paid out.", "good"); }); }} aria-label="Pay a member">
              <option value="">Pay the amount to…</option>{c.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
          </div>
        </Panel>
        {lead && <Panel title="Motto">
          <div className="row"><input className="input" maxLength={140} value={motto ?? c.motto} onChange={e => setMotto(e.target.value)} aria-label="Crew motto" />
            <button className="btn ghost" disabled={busy || motto === null} onClick={() => run("crew_motto", { p_motto: motto }, () => { setMotto(null); load(); })}>Save</button></div>
        </Panel>}
        {c.wars?.length > 0 && <Panel title="Wars" flush><div className="list">{c.wars.map(w => (
          <div key={w.id} className="li"><Ic.Swords style={{ width: 16, color: w.result === "won" ? "var(--seaglass)" : w.result === "lost" ? "var(--brick)" : "var(--mist)" }} />
            <div><div className="t small">{w.result === "active" ? `At war with ${w.vs}` : w.result === "won" ? `Beat ${w.vs}` : w.result === "lost" ? `Lost to ${w.vs}` : `Drew with ${w.vs}`}</div>
              <div className="s">{Math.round(w.ours)} to {Math.round(w.theirs)}{w.surrendered ? ", by surrender" : ""}{w.loot && w.result !== "draw" ? `, ${money(w.loot)} ${w.result === "won" ? "taken" : "lost"}` : ""}</div></div><div className="act tiny">{ago(w.at)}</div></div>))}</div></Panel>}
        <Panel title="What's been happening" flush>
          <div className="list">{c.log.map((l, i) => <div key={i} className="li"><Ic.Flag style={{ width: 16, color: "var(--mist)" }} /><div className="s" style={{ color: "var(--fog)" }}>{l.body}</div><div className="act tiny">{ago(l.at)}</div></div>)}</div>
        </Panel>
        <button className="btn ghost" onClick={() => go("chat?crew")}><Ic.MessageSquare />Crew chat</button>
      </div>}
    </div>
  </>);
}

// ---------------- Messages ----------------
export function Messages({ arg }) {
  return arg ? <Thread id={arg} /> : <Inbox />;
}

function Inbox() {
  const [rows, setRows] = useState(null);
  useEffect(() => { call("dm_threads").then(setRows).catch(() => setRows([])); }, []);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Messages</h1><p>Private conversations. To start one, open someone's profile and choose Message.</p></div>
        <button className="btn ghost" onClick={() => go("players")}><Ic.Users />Find someone</button></div>
      <Panel flush>
        {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="No messages yet">Message a crewmate, a rival or the player who just outbid you.</Empty> :
        <div className="list">{rows.map(t => (
          <button key={t.id} className="li click" onClick={() => go("messages/" + t.id)} style={t.unread ? { background: "var(--sodium-soft)" } : undefined}>
            <Avatar seed={t.id} look={t.look} />
            <div><div className="t"><Name p={t} tag={false} /></div><div className="s" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.mine ? "You: " : ""}{t.body}</div></div>
            <div className="act">{t.unread > 0 && <span className="count">{t.unread}</span>}<span className="tiny">{ago(t.at)}</span></div>
          </button>))}</div>}
      </Panel>
    </div>
  );
}

function Thread({ id }) {
  const { toast, refresh } = useGame();
  const [t, setT] = useState(null); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
  const log = useRef(null);
  const load = () => call("dm_thread", { p_with: id }).then(r => { setT(r); refresh(); }).catch(e => toast(e.message, "bad"));
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [id]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [t?.messages?.length]);
  async function send(e) {
    e.preventDefault(); if (!body.trim()) return; setSending(true);
    try { await call("dm_send", { p_to: id, p_body: body }); setBody(""); load(); } catch (x) { toast(x.message, "bad"); } finally { setSending(false); }
  }
  if (!t) return <Empty title="Loading…" />;
  const w = t.with;
  return (
    <div className="page">
      <div className="row"><button className="btn ghost sm" onClick={() => go("messages")}>All messages</button></div>
      <div className="panel">
        <header className="row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--rope)" }}>
          <Avatar seed={w.id} look={w.look} /><div className="grow"><button style={linkBtn} onClick={() => go("player/" + w.id)}><Name p={w} /></button><div className="tiny">Level {w.level}, last seen {ago(w.last_seen)}</div></div>
        </header>
        <div className="dmlog" ref={log}>
          {t.messages.length === 0 ? <Empty title={`Say something to ${w.name}`} /> : t.messages.map(m => (
            <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}><p>{m.body}</p><time>{ago(m.at)}</time></div>))}
        </div>
        <form className="chatform" onSubmit={send}>
          <input className="input" maxLength={1000} value={body} onChange={e => setBody(e.target.value)} placeholder={`Message ${w.name}`} aria-label="Message" />
          <button className="btn" disabled={sending || !body.trim()}><Ic.Send />Send</button>
        </form>
      </div>
    </div>
  );
}
