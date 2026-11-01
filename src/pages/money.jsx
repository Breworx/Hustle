import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, ItemThumb, Rarity, itemName, itemCat, Empty, Seg, Spark, Qty } from "../ui/ui.jsx";
import { IT, RAR, FILT, SHOPIDS, CATN } from "../game/catalog.js";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { boxIntro, itemList } from "../game/stories.js";
import { BOTTLESTORY, MAPSTORY } from "../game/content.js";
import * as Ic from "../ui/icons.js";

const USABLE = new Set(["use", "food", "box"]);
const canUse = id => IT[id] && (USABLE.has(IT[id].cat) || id === "msgbottle" || id === "oldmap");
const canEquip = id => IT[id] && (IT[id].cat === "weapon" || IT[id].cat === "armour");
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------------- Stash ----------------
export function Stash() {
  const { me, state } = useGame();
  const [f, setF] = useState("all"); const [q, setQ] = useState(""); const [open, setOpen] = useState(null);
  const cats = FILT.find(x => x[0] === f)[2];
  const items = (state.inventory || []).filter(x => IT[x.item_id] && (!cats || cats.includes(IT[x.item_id].cat)) && (!q || IT[x.item_id].n.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => IT[b.item_id].r - IT[a.item_id].r || IT[b.item_id].v - IT[a.item_id].v);
  const total = (state.inventory || []).reduce((s, x) => s + (IT[x.item_id]?.v || 0) * x.qty, 0);
  const kinds = (state.inventory || []).length;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Stash</h1><p>{kinds} of {Object.keys(IT).length} items collected, worth about {money(total)} at book value.</p></div></div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="chips">{FILT.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
        <input className="input" style={{ maxWidth: 240, marginLeft: "auto" }} placeholder="Search your stash" value={q} onChange={e => setQ(e.target.value)} aria-label="Search your stash" />
      </div>
      <Panel flush>
        {items.length === 0 ? <Empty title={kinds ? "Nothing matches" : "Your stash is empty"}>{kinds ? "Try another filter." : "Jobs, fights and mystery boxes all turn up things worth keeping."}</Empty> :
        <div className="list">{items.map(x => { const it = IT[x.item_id]; const eq = me.weapon === it.id || me.armour === it.id; return (
          <button key={it.id} className="li click" onClick={() => setOpen(it.id)}>
            <ItemThumb id={it.id} />
            <div><div className="t">{it.n} {x.qty > 1 && <span className="muted">×{x.qty}</span>}</div><div className="s"><Rarity id={it.id} /> {CATN[it.cat]}{it.fx ? `, +${it.fx}% power` : ""}</div></div>
            <div className="act">{eq && <span className="pill good"><Ic.Check />Equipped</span>}<span className="tiny">{money(it.v)}</span></div>
          </button>); })}</div>}
      </Panel>
      {open && <ItemSheet id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ItemSheet({ id, onClose }) {
  const { me, inv, run, busy, showSheet, toast } = useGame();
  const it = IT[id]; const have = inv[id] || 0;
  const [qty, setQty] = useState(1); const [price, setPrice] = useState(Math.ceil(it.v * 1.1));
  const [mkt, setMkt] = useState(null);
  useEffect(() => { call("market_item", { p_item: id }).then(setMkt).catch(() => {}); }, [id]);
  useEffect(() => { if (!have) onClose(); }, [have]);
  const low = mkt?.listings?.[0]?.price;
  const eq = me.weapon === id || me.armour === id;
  function use() {
    run("use_item", { p_item: id }, r => {
      if (r.equipped) return toast(eq ? `Put away the ${it.n.toLowerCase()}.` : `Equipped the ${it.n.toLowerCase()}.`, "good");
      const got = r.items || [];
      if (got.length || r.cash) {
        const story = id === "msgbottle" ? pick(BOTTLESTORY) : id === "oldmap" ? pick(MAPSTORY) : boxIntro();
        onClose(); showSheet({ verdict: "Opened", title: it.n, story: typeof story === "string" ? story : story.t || "", cash: r.cash, items: got, pic: <ItemThumb id={id} /> });
      } else toast(r.msg || it.d, r.msg && r.msg.startsWith("No luck") ? "" : "good");
    });
  }
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={it.n} onClick={e => e.stopPropagation()}>
        <div className="head"><ItemThumb id={id} lg /><div className="grow"><div className="verdict" style={{ color: RAR[it.r][1] }}>{RAR[it.r][0]} {CATN[it.cat].toLowerCase()}</div><h2>{it.n}</h2><div className="tiny">You have {have}. Book value {money(it.v)}.</div></div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Ic.X /></button></div>
        <p className="story">{it.d}{it.fx ? ` Adds ${it.fx}% to your fight power when equipped.` : ""}</p>
        <div className="stack" style={{ padding: "8px 20px 20px" }}>
          {(canUse(id) || canEquip(id)) && <button className="btn" disabled={busy} onClick={use}>{canEquip(id) ? (eq ? "Unequip" : "Equip") : it.cat === "box" ? "Open it" : id === "oldmap" ? "Go digging" : id === "msgbottle" ? "Open the bottle" : "Use it"}</button>}
          <div className="panel" style={{ boxShadow: "none" }}><div className="body stack-sm">
            <b>Sell on the market</b>
            <div className="tiny">{mkt ? (low ? `Cheapest listing now: ${money(low)}.` : "Nobody's selling one right now. Name your price.") : "Checking the market…"} Buyers pay a 3% fee on top.</div>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <label className="field">Quantity<Qty value={qty} onChange={setQty} max={have} /></label>
              <label className="field grow">Price each<input className="input" type="number" inputMode="numeric" min={1} value={price} onChange={e => setPrice(e.target.value === "" ? "" : Math.max(1, Math.floor(+e.target.value || 0)))} /></label>
            </div>
            <button className="btn good" disabled={busy || !qty || !price} onClick={() => run("market_list", { p_item: id, p_qty: +qty, p_price: +price }, () => { toast(`Listed ${qty} × ${it.n} at ${money(price)}.`, "good"); onClose(); })}>List for {money((+qty || 0) * (+price || 0))}</button>
          </div></div>
          <button className="btn ghost" disabled={busy} onClick={() => run("pawn", { p_item: id, p_qty: +qty || 1 }, r => toast(`The pawn shop paid ${money(r.paid)}.`, "good"))}>Pawn {qty > 1 ? qty : "it"} for about {money(Math.floor(it.v * (+qty || 1) * 0.5))}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Market ----------------
export function Market({ arg }) {
  const [tab, setTab] = useState(arg === "mine" ? "mine" : "browse");
  if (arg && arg !== "mine") return <MarketItem id={arg} />;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Market</h1><p>Every listing is another player. Set your own price, undercut the competition, and watch what things actually sell for.</p></div>
        <div className="row"><Seg label="Market view" value={tab} onChange={setTab} options={[["browse", "Browse"], ["mine", "My listings"]]} />
          <button className="btn ghost" onClick={() => go("stash")}><Ic.Plus />Sell something</button></div></div>
      {tab === "browse" ? <MarketBrowse /> : <MyListings />}
    </div>
  );
}

function MarketBrowse() {
  const [f, setF] = useState("all"); const [q, setQ] = useState(""); const [rows, setRows] = useState(null);
  useEffect(() => {
    const cats = FILT.find(x => x[0] === f)[2];
    const t = setTimeout(() => call("market_overview", { p_cats: cats, p_q: q || null }).then(setRows).catch(() => setRows([])), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [f, q]);
  return (<>
    <div className="row" style={{ flexWrap: "wrap" }}>
      <div className="chips">{FILT.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => { setF(k); setRows(null); }}>{l}</button>)}</div>
      <input className="input" style={{ maxWidth: 260, marginLeft: "auto" }} placeholder="Search the market" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the market" />
    </div>
    <Panel flush>
      {!rows ? <Empty title="Loading listings…" /> : rows.length === 0 ? <Empty title="Nothing for sale here yet">Be the first. List something from your stash and set the price.</Empty> :
      <div className="list">{rows.map(r => { const d = Math.round((r.min_price / r.value - 1) * 100); return (
        <button key={r.item_id} className="li click" onClick={() => go("market/" + r.item_id)}>
          <ItemThumb id={r.item_id} />
          <div><div className="t">{itemName(r.item_id)}</div><div className="s"><Rarity id={r.item_id} /> {itemCat(r.item_id)}, {num(r.qty)} for sale from {r.listings} seller{r.listings > 1 ? "s" : ""}</div></div>
          <div className="act" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}><b>{money(r.min_price)}</b><span className={`tiny ${d <= -10 ? "good" : d >= 25 ? "bad" : ""}`}>{d === 0 ? "at book value" : `${Math.abs(d)}% ${d < 0 ? "under" : "over"} book`}</span></div>
        </button>); })}</div>}
    </Panel>
  </>);
}

function MarketItem({ id }) {
  const { me, run, busy, toast } = useGame();
  const it = IT[id];
  const [data, setData] = useState(null); const [qty, setQty] = useState({});
  const load = () => call("market_item", { p_item: id }).then(setData).catch(() => setData({ listings: [], sales: [] }));
  useEffect(() => { load(); }, [id]);
  if (!it) return <Empty title="That item doesn't exist." />;
  const sales = data?.sales || [];
  const avg = sales.length ? Math.round(sales.reduce((s, x) => s + Number(x.price), 0) / sales.length) : null;
  return (
    <div className="page">
      <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("market")}>Back to the market</button>
      <div className="row" style={{ gap: 16 }}>
        <ItemThumb id={id} lg />
        <div className="grow"><div className="verdict small" style={{ color: RAR[it.r][1], fontWeight: 700 }}>{RAR[it.r][0]} {CATN[it.cat].toLowerCase()}</div><h1>{it.n}</h1><p className="muted">{it.d}</p></div>
      </div>
      <div className="stats">
        <div className="stat"><div className="k">Cheapest now</div><div className="v">{data?.listings?.[0] ? money(data.listings[0].price) : "None listed"}</div></div>
        <div className="stat"><div className="k">Average sale</div><div className="v">{avg ? money(avg) : "No sales yet"}</div></div>
        <div className="stat"><div className="k">Book value</div><div className="v">{money(it.v)}</div></div>
      </div>
      <div className="cols-2">
        <Panel title="For sale" note="Cheapest first. You pay a 3% fee on top." flush>
          {!data ? <Empty title="Loading…" /> : data.listings.length === 0 ? <Empty title="Nobody's selling one">If you have one, you could name your price.</Empty> :
          <div className="list">{data.listings.map(l => { const q = qty[l.id] || 1; const cost = Math.ceil(l.price * q * 1.03); return (
            <div key={l.id} className="li">
              <Ic.Store style={{ width: 20, color: "var(--mist)" }} />
              <div><div className="t">{money(l.price)} each</div><div className="s">{l.qty} from {l.mine ? "you" : l.seller}</div></div>
              <div className="act">{l.mine ? <button className="btn ghost sm" disabled={busy} onClick={() => run("market_cancel", { p_id: l.id }, () => { load(); toast("Listing taken down. The items are back in your stash."); })}>Take down</button> : <>
                {l.qty > 1 && <Qty value={q} onChange={v => setQty({ ...qty, [l.id]: v })} max={l.qty} />}
                <button className="btn sm" disabled={busy || me.cash < cost} onClick={() => run("market_buy", { p_id: l.id, p_qty: +q || 1 }, r => { load(); toast(`Bought ${r.qty} × ${it.n} for ${money(r.cost)}.`, "good"); })}>Buy for {money(cost)}</button></>}</div>
            </div>); })}</div>}
        </Panel>
        <Panel title="Recent sales" note={sales.length ? `Last ${sales.length} sales` : "What it actually sold for"}>
          {sales.length < 2 ? <p className="tiny">{sales.length ? `One sale so far, at ${money(sales[0].price)}.` : "No sales yet."}</p> :
            <><Spark values={sales.map(s => Number(s.price))} w={320} h={110} className="chart" />
              <div className="row tiny" style={{ justifyContent: "space-between" }}><span>{ago(sales[0].at)}</span><span>{ago(sales[sales.length - 1].at)}</span></div></>}
        </Panel>
      </div>
    </div>
  );
}

function MyListings() {
  const { run, busy, toast } = useGame();
  const [rows, setRows] = useState(null);
  const load = () => call("my_listings").then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  return (
    <Panel flush title="Your listings" note="When something sells, the money lands in your pocket and you'll get a notification.">
      {!rows ? <Empty title="Loading…" /> : rows.length === 0 ? <Empty title="You're not selling anything">Open an item in your stash to list it.</Empty> :
      <div className="list">{rows.map(l => (
        <div key={l.id} className="li">
          <ItemThumb id={l.item_id} />
          <div><button className="t" style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 650 }} onClick={() => go("market/" + l.item_id)}>{itemName(l.item_id)}</button><div className="s">{l.qty} at {money(l.price)} each, listed {ago(l.created_at)}</div></div>
          <div className="act"><button className="btn ghost sm" disabled={busy} onClick={() => run("market_cancel", { p_id: l.id }, () => { load(); toast("Listing taken down."); })}>Take down</button></div>
        </div>))}</div>}
    </Panel>
  );
}

// ---------------- Corner store ----------------
export function Store() {
  const { me, run, busy, toast, inv } = useGame();
  const [qty, setQty] = useState({});
  const disc = Math.min(0.15, ((me.skill_levels?.trade || 1) - 1) * 0.005);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Corner store</h1><p>The dairy on the corner sells the basics at fixed prices.{disc > 0 ? ` Your trading skill gets you ${Math.round(disc * 1000) / 10}% off.` : ""}</p></div></div>
      <Panel flush>
        <div className="list">{SHOPIDS.map(id => { const it = IT[id]; const q = qty[id] || 1; const cost = Math.round(it.v * q * (1 - disc)); return (
          <div key={id} className="li">
            <ItemThumb id={id} />
            <div><div className="t">{it.n} {inv[id] ? <span className="muted small">(you have {inv[id]})</span> : null}</div><div className="s">{it.d}</div></div>
            <div className="act"><Qty value={q} onChange={v => setQty({ ...qty, [id]: v })} max={100} />
              <button className="btn sm" disabled={busy || me.cash < cost} onClick={() => run("shop_buy", { p_item: id, p_qty: +q || 1 }, r => toast(`Bought ${r.qty} × ${it.n} for ${money(r.cost)}.`, "good"))}>Buy for {money(cost)}</button></div>
          </div>); })}</div>
      </Panel>
    </div>
  );
}

// ---------------- Bank ----------------
export function Bank() {
  const { me, run, busy, toast } = useGame();
  const [amt, setAmt] = useState("");
  const a = Math.floor(+amt || 0);
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Bank</h1><p>Cash on you can be taken in a fight. Cash in the bank can't.</p></div></div>
      <div className="stats">
        <div className="stat"><div className="k">On you</div><div className="v good">{money(me.cash)}</div></div>
        <div className="stat"><div className="k">In the bank</div><div className="v">{money(me.bank)}</div></div>
      </div>
      <Panel title="Move money">
        <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field grow" style={{ maxWidth: 260 }}>Amount<input className="input" type="number" inputMode="numeric" min={1} value={amt} onChange={e => setAmt(e.target.value)} placeholder="0" /></label>
          <button className="btn" disabled={busy || a < 1 || a > me.cash} onClick={() => run("bank", { p_amount: a }, () => { toast(`Deposited ${money(a)}.`, "good"); setAmt(""); })}>Deposit</button>
          <button className="btn ghost" disabled={busy || a < 1 || a > me.bank} onClick={() => run("bank", { p_amount: -a }, () => { toast(`Withdrew ${money(a)}.`, "good"); setAmt(""); })}>Withdraw</button>
          <button className="btn ghost" disabled={busy || me.cash < 1} onClick={() => run("bank", { p_amount: me.cash }, () => toast("Everything's in the bank.", "good"))}>Deposit all</button>
        </div>
      </Panel>
    </div>
  );
}
