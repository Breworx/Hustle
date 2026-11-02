import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Empty, Avatar, ItemThumb } from "../ui/ui.jsx";
import { call } from "../lib/supabase.js";
import { ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

// Invite links look like https://yourgame/?ref=AB12CD. The code is kept until the new player picks a name.
export function captureRef() {
  try {
    const m = /[?&]ref=([A-Za-z0-9]{4,12})/.exec(location.search + "&" + location.hash);
    if (m) localStorage.setItem("hustle-ref", m[1].toUpperCase());
  } catch (e) {}
}
export const pendingRef = () => { try { return localStorage.getItem("hustle-ref"); } catch (e) { return null; } };
export const clearRef = () => { try { localStorage.removeItem("hustle-ref"); } catch (e) {} };

export function Invite() {
  const { toast } = useGame();
  const [d, setD] = useState(null);
  useEffect(() => { call("invite_state").then(setD).catch(() => setD({ code: null, recruits: [] })); }, []);
  if (!d) return <Empty title="Loading…" />;
  const link = `${location.origin}/?ref=${d.code}`;
  const text = "I'm playing Hustle, a crime and trading game set in Greyhaven. Join with my link and you start with extra cash and a mystery box:";
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast("Link copied.", "good"); } catch (e) { toast("Couldn't copy. Press and hold the link to copy it instead.", "bad"); } };
  const share = async () => { try { await navigator.share({ title: "Hustle", text, url: link }); } catch (e) {} };
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Invite friends</h1><p>Send your link to friends. They start with extra cash and a mystery box, and when they reach level 5 you both get a reward.</p></div></div>
      <Panel title="Your invite link">
        <div className="stack">
          <div className="invitelink" onClick={e => { const r = document.createRange(); r.selectNodeContents(e.currentTarget); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }}>{link}</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={copy}><Ic.Send />Copy link</button>
            {navigator.share && <button className="btn ghost" onClick={share}><Ic.ArrowUpRight />Share</button>}
          </div>
        </div>
      </Panel>
      <div className="cols-2">
        <Panel title="What everyone gets">
          <div className="list">
            <div className="li"><ItemThumb id="smallbox" /><div><div className="t">Your friend, straight away</div><div className="s">$2,000 and a mystery box when they join with your link.</div></div></div>
            <div className="li"><ItemThumb id="crate" /><div><div className="t">You, when they reach level 5</div><div className="s">$25,000, a crate and 5 tokens. They get another $10,000.</div></div></div>
            <div className="li"><ItemThumb id="recruit_pin" /><div><div className="t">Every fifth friend</div><div className="s">A Recruiter's pin, a rare collectible you can only get this way.</div></div></div>
          </div>
          <p className="tiny" style={{ marginTop: 10 }}>Rewards count for your first 50 friends. Level 5 has to be reached for real, so fake accounts don't pay.</p>
        </Panel>
        <Panel title={`Your recruits${d.joined ? ` (${d.joined})` : ""}`} note={d.joined ? `${d.rewarded} of ${d.joined} have reached level 5.` : null} flush>
          {d.recruits.length === 0 ? <Empty title="Nobody yet">Send your link to a friend or two.</Empty> :
          <div className="list">{d.recruits.map(r => (
            <button key={r.id} className="li click" onClick={() => go("player/" + r.id)}>
              <Avatar seed={r.id} look={r.look} />
              <div><div className="t">{r.name}</div><div className="s">Level {r.level}, joined {ago(r.joined)}</div></div>
              <div className="act">{r.paid ? <span className="pill good"><Ic.Check />Rewarded</span> : <span className="pill">{Math.max(0, 5 - r.level)} levels to go</span>}</div>
            </button>))}</div>}
        </Panel>
      </div>
    </div>
  );
}
