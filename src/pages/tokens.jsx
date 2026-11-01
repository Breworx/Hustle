import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, ItemThumb, Empty, Countdown } from "../ui/ui.jsx";
import { call, supabase } from "../lib/supabase.js";
import { num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

const price = (cents, cur) => (cents / 100).toLocaleString("en-NZ", { style: "currency", currency: cur.toUpperCase() });
const ICONS = { stamina: Ic.Dumbbell, grit: Ic.Flame, heat: Ic.Shield, regular: Ic.Sparkles };

export function Tokens() {
  const { me, inv, run, busy, toast, refresh } = useGame();
  const [info, setInfo] = useState(null); const [paying, setPaying] = useState(null);
  const have = inv.token || 0;
  const load = () => call("token_info").then(setInfo).catch(e => toast(e.message, "bad"));
  useEffect(() => {
    load();
    // Back from Stripe. The tokens arrive when Stripe confirms the payment, usually within seconds.
    if (location.hash.includes("paid=")) {
      toast("Payment received. Your tokens will land in your stash in a moment.", "good");
      history.replaceState(null, "", "#/tokens");
      const t = [3000, 8000, 15000].map(ms => setTimeout(() => { refresh(); load(); }, ms));
      return () => t.forEach(clearTimeout);
    }
  }, []);

  async function buy(pack) {
    setPaying(pack.id);
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: { pack: pack.id } });
    if (error || !data?.url) { setPaying(null); return toast(data?.error || "Payments aren't switched on yet.", "bad"); }
    location.href = data.url;
  }
  const usedToday = id => { const t = info?.refill_at?.[id]; return t && Date.now() - new Date(t) < 86400000 ? new Date(new Date(t).getTime() + 86400000).toISOString() : null; };
  const regular = info?.regular_until && new Date(info.regular_until) > Date.now();

  return (
    <div className="page">
      <div className="pagehead"><div><h1>Tokens</h1><p>Tokens buy refills and Regular status. You can buy them here, or buy and sell them with other players on the market for game cash, so you never have to spend real money to get them.</p></div>
        <div className="row"><ItemThumb id="token" /><div><div className="tiny">You have</div><b style={{ fontSize: 22 }}>{num(have)} tokens</b></div></div></div>

      <Panel title="Spend tokens" flush>
        {!info ? <Empty title="Loading…" /> : <div className="list">{info.menu.map(o => { const Icon = ICONS[o.id] || Ic.Sparkles; const until = o.id !== "regular" && usedToday(o.id); return (
          <div key={o.id} className="li">
            <span className="thumb"><Icon /></span>
            <div><div className="t">{o.name}</div><div className="s">{o.desc}{o.id === "regular" && regular ? ` You're a Regular until ${new Date(info.regular_until).toLocaleDateString("en-NZ", { day: "numeric", month: "long" })}.` : ""}</div></div>
            <div className="act">{until ? <span className="tiny">Ready again in <Countdown until={until} onDone={load} /></span> :
              <button className="btn sm" disabled={busy || have < o.cost} onClick={() => run("token_spend", { p_what: o.id }, () => { load(); toast(o.id === "regular" ? "You're a Regular. Enjoy the faster regen." : `${o.name} done.`, "good"); })}>{o.cost} tokens</button>}</div>
          </div>); })}</div>}
      </Panel>

      <Panel title="Buy tokens" note="Paid securely through Stripe. We never see your card details.">
        {!info ? null : <div className="gym">{info.packs.map(k => (
          <div key={k.id} className="panel gcard" style={{ boxShadow: "none" }}>
            <div className="top"><Ic.Coins /><b>{k.name}</b></div>
            <div className="v">{num(k.tokens)} <span className="muted small">tokens</span></div>
            <button className="btn" disabled={!!paying} onClick={() => buy(k)}>{paying === k.id ? "Opening checkout…" : `Buy for ${price(k.price_cents, k.currency)}`}</button>
          </div>))}</div>}
        <p className="tiny" style={{ marginTop: 12 }}>Tokens are part of the game, have no cash value and can't be swapped back for real money. See the <a href="#/legal">terms and refund policy</a>.</p>
      </Panel>

      <div className="cols">
        <Panel title="Trade tokens with players">
          <p className="muted small">Tokens sit in your stash like any other item. List them on the market to sell for game cash, or buy them from other players.</p>
          <div className="row" style={{ marginTop: 10 }}><button className="btn ghost" onClick={() => go("market/token")}><Ic.Store />Tokens on the market</button></div>
        </Panel>
        {info?.bought?.length > 0 && <Panel title="Your purchases" flush>
          <div className="list">{info.bought.map((b, i) => (
            <div key={i} className="li"><Ic.Coins style={{ width: 18, color: "var(--sodium)" }} /><div><div className="t">{num(b.tokens)} tokens</div><div className="s">{price(b.amount_cents, b.currency)}</div></div><div className="act tiny">{ago(b.at)}</div></div>))}</div>
        </Panel>}
      </div>
    </div>
  );
}
