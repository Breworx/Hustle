import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, ItemThumb, Empty, Countdown, Svg, NAME_COLORS } from "../ui/ui.jsx";
import { skyline, DISTRICT_ART } from "../game/art.js";
import { DISTRICTS } from "../game/content.js";
import { call, supabase } from "../lib/supabase.js";
import { num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import * as Ic from "../ui/icons.js";

const price = (cents, cur) => (cents / 100).toLocaleString("en-NZ", { style: "currency", currency: cur.toUpperCase() });
const ICONS = { stamina: Ic.Dumbbell, grit: Ic.Flame, heat: Ic.Shield, regular: Ic.Star, stall: Ic.Store };

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
  const [newName, setNewName] = useState("");
  const menu = id => info.menu.find(o => o.id === id);
  const spend = (o, arg = null) => run("token_spend", { p_what: o.id, p_arg: arg }, () => { load(); refresh();
    toast({ regular: "You're a Regular. Enjoy the faster regen.", stall: "Your stall just got bigger.", colour: "New colour, same you.", backdrop: "Backdrop set. Go and admire it.", rename: `You're ${arg} now.` }[o.id] || `${o.name} done.`, "good"); if (o.id === "rename") setNewName(""); });
  const usedToday = id => { const t = info?.refill_at?.[id]; return t && Date.now() - new Date(t) < 86400000 ? new Date(new Date(t).getTime() + 86400000).toISOString() : null; };
  const regular = info?.regular_until && new Date(info.regular_until) > Date.now();

  return (
    <div className="page">
      <div className="pagehead"><div><h1>Tokens</h1><p>Tokens buy boosts and style. You can buy them here, or buy and sell them with other players on the market for game cash, so you never have to spend real money to get them.</p></div>
        <div className="row"><ItemThumb id="token" /><div><div className="tiny">You have</div><b style={{ fontSize: 22 }}>{num(have)} tokens</b></div></div></div>

      <Panel title="Boosts" flush>
        {!info ? <Empty title="Loading…" /> : <div className="list">{info.menu.filter(o => o.group === "boost").map(o => { const Icon = ICONS[o.id] || Ic.Sparkles; const until = ["stamina", "grit", "heat"].includes(o.id) && usedToday(o.id); return (
          <div key={o.id} className="li">
            <span className="thumb"><Icon /></span>
            <div><div className="t">{o.name}</div><div className="s">{o.desc}{o.id === "regular" && regular ? ` You're a Regular until ${new Date(info.regular_until).toLocaleDateString("en-NZ", { day: "numeric", month: "long" })}.` : ""}{o.id === "stall" && info.stall_until && new Date(info.stall_until) > Date.now() ? ` Active until ${new Date(info.stall_until).toLocaleDateString("en-NZ", { day: "numeric", month: "long" })}.` : ""}</div></div>
            <div className="act">{until ? <span className="tiny">Ready again in <Countdown until={until} onDone={load} /></span> :
              <button className="btn sm" disabled={busy || have < o.cost} onClick={() => spend(o)}>{o.cost} tokens</button>}</div>
          </div>); })}</div>}
      </Panel>

      {info && <Panel title="Style" note="Cosmetics are yours to keep. They never change the odds of anything.">
        <div className="stylegrid">
          <div className="stack-sm"><b>Name colour</b><span className="tiny">Your name in colour in chat, rankings and on your profile. 60 tokens.</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>{Object.entries(NAME_COLORS).map(([k, l]) => (
              <button key={k} className={`chip nc-${k}`} aria-pressed={info.name_color === k} disabled={busy || info.name_color === k || have < 60} onClick={() => spend(menu("colour"), k)}>{me.name}<span className="sr">, {l}</span></button>))}</div></div>
          <div className="stack-sm"><b>Profile backdrop</b><span className="tiny">A skyline across the top of your profile. 40 tokens.</span>
            <div className="backdrops">{DISTRICTS.map(d => (
              <button key={d.id} className="bd" aria-pressed={info.backdrop === d.id} disabled={busy || info.backdrop === d.id || have < 40} onClick={() => spend(menu("backdrop"), d.id)} aria-label={d.n}>
                <Svg className="bdart" svg={skyline(DISTRICT_ART[d.id])} /><span className="bdl">{d.n}</span></button>))}</div></div>
          <div className="stack-sm"><b>Change your name</b><span className="tiny">100 tokens. The Bugle will let everyone know.</span>
            <div className="row"><input className="input" maxLength={20} value={newName} onChange={e => setNewName(e.target.value)} placeholder="New street name" aria-label="New name" />
              <button className="btn" disabled={busy || newName.trim().length < 3 || have < 100} onClick={() => spend(menu("rename"), newName.trim())}>Rename</button></div></div>
        </div>
      </Panel>}

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
