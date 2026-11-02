import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, Seg } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { PAGE_HELP } from "../ui/help.jsx";
import * as Ic from "../ui/icons.js";

export const KINDS = [["bug", "Something's broken"], ["idea", "An idea"], ["balance", "Too easy or too hard"], ["love", "Something I love"], ["other", "Something else"]];
// The page you were on before opening feedback, so you don't have to say where the problem was.
let lastPage = "street";
export const notePage = base => { if (base && base !== "feedback") lastPage = base; };

export function Feedback() {
  const { run, busy, toast } = useGame();
  const [kind, setKind] = useState("bug"); const [text, setText] = useState(""); const [anon, setAnon] = useState(true); const [page, setPage] = useState(lastPage);
  const [sent, setSent] = useState(false);
  if (sent) return (
    <div className="page"><Panel><Empty title="Thanks, that's been sent">Every message gets read. <button className="linkish" onClick={() => { setSent(false); setText(""); }}>Send another</button> or <button className="linkish" onClick={() => go(lastPage)}>go back to the game</button>.</Empty></Panel></div>
  );
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Feedback</h1><p>Tell us what's broken, what's confusing, what you'd add, or what you love. It goes straight to the people making Hustle.</p></div></div>
      <Panel>
        <div className="stack">
          <div className="stack-sm"><b>What's it about?</b>
            <div className="chips" role="group" aria-label="Kind of feedback">{KINDS.map(([k, l]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}</div></div>
          <label className="field">Which part of the game?
            <select className="input" value={page} onChange={e => setPage(e.target.value)} style={{ maxWidth: 320 }}>
              {Object.entries(PAGE_HELP).filter(([k]) => !["admin"].includes(k)).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
              <option value="general">The game in general</option>
            </select></label>
          <label className="field">Your feedback
            <textarea className="input" rows={6} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder={kind === "bug" ? "What did you do, what happened, and what did you expect?" : "Tell us everything."} /></label>
          <label className="row" style={{ gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ marginTop: 4 }} />
            <span><b>Send anonymously</b><br /><span className="tiny">{anon ? "Your name isn't saved with it at all, so nobody can tell it came from you, not even the admins." : "Your street name goes with it, so we can reply or follow up."}</span></span>
          </label>
          <div><button className="btn" disabled={busy || text.trim().length < 5} onClick={() => run("feedback_send", { p_kind: kind, p_text: text, p_page: page, p_anon: anon }, () => { setSent(true); toast("Feedback sent. Thank you.", "good"); })}><Ic.Send />Send feedback</button></div>
        </div>
      </Panel>
    </div>
  );
}

// Admin: read and sort feedback.
export function FeedbackInbox() {
  const { run, busy } = useGame();
  const [status, setStatus] = useState("new"); const [d, setD] = useState(null);
  const load = () => call("admin_feedback", { p_status: status }).then(setD).catch(() => setD({ items: [], counts: {} }));
  useEffect(() => { setD(null); load(); }, [status]);
  const c = d?.counts || {};
  const label = Object.fromEntries(KINDS);
  return (<>
    <Seg label="Feedback" value={status} onChange={setStatus} options={[["new", `New${c.new ? ` (${c.new})` : ""}`], ["read", `Read${c.read ? ` (${c.read})` : ""}`], ["done", `Done${c.done ? ` (${c.done})` : ""}`]]} />
    <Panel flush>
      {!d ? <Empty title="Loading…" /> : d.items.length === 0 ? <Empty title={status === "new" ? "No new feedback" : "Nothing here"}>{status === "new" ? "Players can send it from Feedback in the menu." : ""}</Empty> :
      <div className="list">{d.items.map(f => (
        <div key={f.id} className="li fb">
          <span className={`pill ${f.kind === "bug" ? "bad" : f.kind === "love" ? "good" : f.kind === "balance" ? "warn" : ""}`}>{label[f.kind] || f.kind}</span>
          <div style={{ minWidth: 0 }}>
            <div className="fbbody">{f.body}</div>
            <div className="s">{f.page ? `${PAGE_HELP[f.page]?.[0] || f.page}, ` : ""}{ago(f.at)}, {f.player_name ? <>from <button className="linkish" onClick={() => go("player/" + f.player_id)}>{f.player_name}</button> (level {f.level})</> : "anonymous"}</div>
          </div>
          <div className="act shopact">
            {f.status !== "read" && f.status !== "done" && <button className="btn sm ghost" disabled={busy} onClick={() => run("admin_feedback_set", { p_id: f.id, p_status: "read" }, load)}>Mark read</button>}
            {f.status !== "done" && <button className="btn sm" disabled={busy} onClick={() => run("admin_feedback_set", { p_id: f.id, p_status: "done" }, load)}>Done</button>}
            {f.status === "done" && <button className="btn sm ghost" disabled={busy} onClick={() => run("admin_feedback_set", { p_id: f.id, p_status: "new" }, load)}>Reopen</button>}
          </div>
        </div>))}</div>}
    </Panel>
  </>);
}
