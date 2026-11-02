import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Avatar, Empty, Seg, Name } from "../ui/ui.jsx";
import { FeedbackInbox } from "./feedback.jsx";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { IT } from "../game/catalog.js";
import * as Ic from "../ui/icons.js";

const cents = (o = {}) => Object.entries(o).map(([cur, c]) => (c / 100).toLocaleString("en-NZ", { style: "currency", currency: cur.toUpperCase() })).join(", ") || "$0.00";

export function Admin() {
  const { me } = useGame();
  const [tab, setTab] = useState("overview");
  if (!me.is_admin) return <Empty title="Admins only." />;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Admin</h1><p>Everything you do here is recorded in the admin log.</p></div>
        <Seg label="Admin" value={tab} onChange={setTab} options={[["overview", "Overview"], ["players", "Players"], ["reports", "Reports"], ["feedback", "Feedback"]]} /></div>
      {tab === "overview" ? <Overview /> : tab === "players" ? <PlayerTools /> : tab === "feedback" ? <FeedbackInbox /> : <Reports />}
    </div>
  );
}

function Overview() {
  const [d, setD] = useState(null);
  useEffect(() => { call("admin_overview").then(setD).catch(() => {}); }, []);
  if (!d) return <Empty title="Loading…" />;
  return (<>
    <div className="stats">
      <div className="stat"><div className="k">Players</div><div className="v">{num(d.players)}</div></div>
      <div className="stat"><div className="k">Online now</div><div className="v">{num(d.online)}</div></div>
      <div className="stat"><div className="k">Played today</div><div className="v">{num(d.today)}</div></div>
      <div className="stat"><div className="k">New today</div><div className="v">{num(d.new_today)}</div></div>
      <div className="stat"><div className="k">Revenue, 30 days</div><div className="v">{cents(d.revenue_30d)}</div></div>
      <div className="stat"><div className="k">Revenue, all time</div><div className="v">{cents(d.revenue)}</div></div>
      <div className="stat"><div className="k">Tokens in circulation</div><div className="v">{num(d.tokens_out)}</div></div>
      <div className="stat"><div className="k">Open reports</div><div className={`v ${d.reports ? "bad" : ""}`}>{num(d.reports)}</div></div>
      <div className="stat"><div className="k">Cash in the game</div><div className="v">{money(d.cash_out)}</div></div>
      <div className="stat"><div className="k">Items sold out</div><div className="v">{num(d.sold_out)}</div></div>
    </div>
    <div className="cols">
      <Panel title="Recent purchases" flush>
        {d.recent_purchases.length === 0 ? <Empty title="No purchases yet" /> : <div className="tablewrap"><table className="table"><tbody>
          {d.recent_purchases.map((p, i) => <tr key={i}><td>{p.name || "Deleted player"}</td><td>{num(p.tokens)} tokens</td><td className="num">{cents({ [p.currency]: p.amount_cents })}</td><td className="num tiny">{ago(p.at)}</td></tr>)}
        </tbody></table></div>}
      </Panel>
      <Panel title="Admin log" flush>
        {d.log.length === 0 ? <Empty title="Nothing yet" /> : <div className="list">{d.log.map((l, i) => (
          <div key={i} className="li"><Ic.ShieldCheck style={{ width: 16, color: "var(--mist)" }} /><div><div className="t small">{l.admin}: {l.action} {l.target ? `on ${l.target}` : ""}</div>{l.detail && <div className="s">{l.detail}</div>}</div><div className="act tiny">{ago(l.at)}</div></div>))}</div>}
      </Panel>
    </div>
  </>);
}

function PlayerTools() {
  const { run, busy, toast } = useGame();
  const [q, setQ] = useState(""); const [rows, setRows] = useState(null); const [open, setOpen] = useState(null);
  const load = () => call("admin_find", { p_q: q }).then(setRows).catch(e => toast(e.message, "bad"));
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);
  return (<>
    <input className="input" style={{ maxWidth: 320 }} placeholder="Search by name or id" value={q} onChange={e => setQ(e.target.value)} aria-label="Search players" />
    <Panel flush>
      {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="Nobody found" /> :
      <div className="list">{rows.map(p => (<React.Fragment key={p.id}>
        <button className="li click" onClick={() => setOpen(open === p.id ? null : p.id)}>
          <Avatar seed={p.id} look={p.look} />
          <div><div className="t"><Name p={p} /> {p.is_admin && <span className="pill warn">Admin</span>} {p.banned_until && new Date(p.banned_until) > Date.now() && <span className="pill bad">Banned</span>} {p.muted_until && new Date(p.muted_until) > Date.now() && <span className="pill">Muted</span>}</div>
            <div className="s">{p.email}, level {p.level}. {money(p.cash)} cash, {money(p.bank)} banked, {num(p.tokens)} tokens. Spent {cents({ nzd: p.spent_cents })}. Seen {ago(p.last_seen)}.</div></div>
          <div className="act"><Ic.ChevronRight style={{ width: 18, color: "var(--mist)" }} /></div>
        </button>
        {open === p.id && <Actions p={p} busy={busy} act={(action, amount = 0, item = null, reason = "") => run("admin_act", { p_target: p.id, p_action: action, p_amount: amount, p_item: item, p_reason: reason }, () => { load(); toast("Done.", "good"); })} />}
      </React.Fragment>))}</div>}
    </Panel>
  </>);
}

function Actions({ p, busy, act }) {
  const [hours, setHours] = useState(24); const [reason, setReason] = useState(""); const [amt, setAmt] = useState(""); const [item, setItem] = useState("");
  const banned = p.banned_until && new Date(p.banned_until) > Date.now(), muted = p.muted_until && new Date(p.muted_until) > Date.now();
  return (
    <div className="stockdetail">
      <div className="cols" style={{ gap: 14 }}>
        <div className="stack-sm">
          <b className="small">Moderation</b>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <label className="field">Hours (0 = forever)<input className="input" type="number" min={0} value={hours} onChange={e => setHours(+e.target.value)} style={{ maxWidth: 110 }} /></label>
            <label className="field grow">Reason (the player sees this)<input className="input" value={reason} onChange={e => setReason(e.target.value)} /></label>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {banned ? <button className="btn ghost sm" disabled={busy} onClick={() => act("unban")}>Lift ban</button> : <button className="btn danger sm" disabled={busy} onClick={() => act("ban", hours, null, reason)}><Ic.Ban />Ban</button>}
            {muted ? <button className="btn ghost sm" disabled={busy} onClick={() => act("unmute")}>Unmute</button> : <button className="btn ghost sm" disabled={busy} onClick={() => act("mute", Math.max(1, hours), null, reason)}><Ic.VolumeX />Mute</button>}
            <button className="btn ghost sm" disabled={busy} onClick={() => act("release")}>Free from cells or A&amp;E</button>
            <button className="btn ghost sm" onClick={() => go("player/" + p.id)}>Profile</button>
          </div>
          {p.ban_reason && <p className="tiny">Ban reason: {p.ban_reason}</p>}
        </div>
        <div className="stack-sm">
          <b className="small">Adjust (use minus numbers to take away)</b>
          <input className="input" type="number" placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)} aria-label="Amount" />
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn ghost sm" disabled={busy || !+amt} onClick={() => act("cash", +amt, null, reason)}>Cash</button>
            <button className="btn ghost sm" disabled={busy || !+amt} onClick={() => act("tokens", +amt, null, reason)}>Tokens</button>
          </div>
          <div className="row"><input className="input" placeholder="Item id, e.g. smallbox" value={item} onChange={e => setItem(e.target.value.trim())} list="itemids" aria-label="Item" />
            <datalist id="itemids">{Object.values(IT).slice(0, 1001).map(i => <option key={i.id} value={i.id}>{i.n}</option>)}</datalist></div>
          <div className="row"><button className="btn ghost sm" disabled={busy || !IT[item]} onClick={() => act("give", Math.max(1, +amt || 1), item, reason)}>Give item</button>
            <button className="btn ghost sm" disabled={busy || !IT[item]} onClick={() => act("take", Math.max(1, Math.abs(+amt) || 1), item, reason)}>Take item</button></div>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const { run, busy } = useGame();
  const [rows, setRows] = useState(null);
  const load = () => call("admin_reports").then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  return (
    <Panel flush title="Open reports">
      {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="No open reports">All quiet.</Empty> :
      <div className="list">{rows.map(r => (
        <div key={r.id} className="li"><Ic.Flag style={{ width: 18, color: "var(--brick)" }} />
          <div><div className="t">{r.reporter} reported {r.target_name || "a player"}</div>
            <div className="s">{r.body ? `“${r.body}”` : "No message attached."}{r.reason ? ` Reason: ${r.reason}.` : ""} {ago(r.at)}.</div></div>
          <div className="act">
            {r.message_exists && <button className="btn danger sm" disabled={busy} onClick={() => run("admin_resolve", { p_report: r.id, p_delete_message: true }, load)}>Delete message</button>}
            <button className="btn ghost sm" disabled={busy} onClick={() => run("admin_resolve", { p_report: r.id, p_delete_message: false }, load)}>Dismiss</button>
            {r.target && <button className="btn ghost sm" onClick={() => go("player/" + r.target)}>Profile</button>}
          </div>
        </div>))}</div>}
    </Panel>
  );
}
