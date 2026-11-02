import React, { useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Svg, Panel, ItemThumb, Rarity, itemName, itemCat, Empty, Seg, Spark, Qty, Scarce } from "../ui/ui.jsx";
import { useSupply } from "../lib/supply.js";
import { IT, RAR, FILT, SHOPIDS, CATN } from "../game/catalog.js";
import { call } from "../lib/supabase.js";
import { money, num, ago } from "../lib/format.js";
import { go } from "../lib/nav.js";
import { boxIntro, itemList } from "../game/stories.js";
import { BOTTLESTORY, MAPSTORY } from "../game/content.js";
import * as Ic from "../ui/icons.js";
import { TOWNS } from "../game/world-data.js";
import { HOME_NAME } from "../game/travel.js";
import { flag } from "../ui/country.jsx";

const TOWN = Object.fromEntries(TOWNS.map(t => [t[0], t]));
export const cityName = id => id === "home" || !id ? HOME_NAME : TOWN[id]?.[1] || id;
const cityFlag = id => id && id !== "home" && TOWN[id] ? flag(TOWN[id][2]) + " " : "";
// Which town's market you're looking at. Remembered while you move between the market and an item.
let browsing = null;

const USABLE = new Set(["use", "food", "box", "contraband"]);
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
  const sup = useSupply((state.inventory || []).map(x => x.item_id));
  const total = (state.inventory || []).reduce((s, x) => s + (IT[x.item_id]?.v || 0) * x.qty, 0);
  const kinds = (state.inventory || []).length;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Stash</h1><p>{kinds} items in your stash, worth about {money(total)} at book value.</p></div></div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="chips">{FILT.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
        <input className="input" style={{ maxWidth: 240, marginLeft: "auto" }} placeholder="Search your stash" value={q} onChange={e => setQ(e.target.value)} aria-label="Search your stash" />
      </div>
      <Panel flush>
        {items.length === 0 ? <Empty title={kinds ? "Nothing matches" : "Your stash is empty"}>{kinds ? "Try another filter." : "Jobs, fights and mystery boxes all turn up things worth keeping."}</Empty> :
        <div className="list">{items.map(x => { const it = IT[x.item_id]; const eq = me.weapon === it.id || me.armour === it.id; return (
          <button key={it.id} className="li click" data-tour={["lager", "pie", "med"].includes(it.id) ? "use" : undefined} onClick={() => setOpen(it.id)}>
            <ItemThumb id={it.id} />
            <div><div className="t">{it.n} {x.qty > 1 && <span className="muted">×{x.qty}</span>}</div><div className="s"><Rarity id={it.id} /> {CATN[it.cat]}{it.fx ? `, +${it.fx}% power` : ""}</div></div>
            <div className="act"><Scarce s={sup[it.id]} />{eq && <span className="pill good"><Ic.Check />Equipped</span>}<span className="tiny">{money(it.v)}</span></div>
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
        {mkt?.supply && <SupplyNote m={mkt} />}
        <div className="stack" style={{ padding: "8px 20px 20px" }}>
          {id === "token" && <button className="btn" onClick={() => { onClose(); go("tokens"); }}>Spend tokens</button>}
          {id !== "token" && (canUse(id) || canEquip(id)) && <button className="btn" data-tour="use-btn" disabled={busy} onClick={use}>{canEquip(id) ? (eq ? "Unequip" : "Equip") : it.cat === "box" ? "Open it" : id === "oldmap" ? "Go digging" : id === "msgbottle" ? "Open the bottle" : "Use it"}</button>}
          <div className="panel" style={{ boxShadow: "none" }}><div className="body stack-sm">
            <b>Sell on the market in {cityName(me.city)}</b>
            <div className="tiny">{mkt ? (low ? `Cheapest listing here now: ${money(low)}.` : "Nobody's selling one here right now. Name your price.") : "Checking the market…"} Buyers pay a 3% fee on top.{me.city !== "home" ? " Your listing stays in this town, and buyers have to be here too." : ""}</div>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <label className="field">Quantity<Qty value={qty} onChange={setQty} max={have} /></label>
              <label className="field grow">Price each<input className="input" type="number" inputMode="numeric" min={1} value={price} onChange={e => setPrice(e.target.value === "" ? "" : Math.max(1, Math.floor(+e.target.value || 0)))} /></label>
            </div>
            <button className="btn good" disabled={busy || !qty || !price} onClick={() => run("market_list", { p_item: id, p_qty: +qty, p_price: +price }, () => { toast(`Listed ${qty} × ${it.n} at ${money(price)}.`, "good"); onClose(); })}>List for {money((+qty || 0) * (+price || 0))}</button>
          </div></div>
          {me.city && me.city !== "home" ? <button className="btn ghost" disabled={busy || !mkt} onClick={() => run("city_sell", { p_item: id, p_qty: +qty || 1 }, r => toast(`The trader in ${r.city} paid ${money(r.paid)}.`, "good"))}>Sell {qty > 1 ? qty : "it"} to the trader here for about {money((mkt?.trader_here || 0) * (+qty || 1))}</button>
            : <button className="btn ghost" disabled={busy} onClick={() => run("pawn", { p_item: id, p_qty: +qty || 1 }, r => toast(`The pawn shop paid ${money(r.paid)}.`, "good"))}>Pawn {qty > 1 ? qty : "it"} for about {money(Math.floor(it.v * (+qty || 1) * 0.5))}</button>}
          {mkt?.traders?.length > 0 && <p className="tiny">Traders who pay most for this: {mkt.traders.slice(0, 3).map(t => `${cityFlag(t.city)}${t.name} (${money(t.price)})`).join(", ")}.</p>}
        </div>
      </div>
    </div>
  );
}

// How many exist, how many have been found and how many are still around (the rest were pawned or used).
function SupplyNote({ m }) {
  const left = m.supply - m.found;
  return (
    <div style={{ padding: "0 20px" }}><div className="perkbox" style={{ borderStyle: "solid" }}>
      <b>{m.supply === 1 ? "There is only one of these." : `Only ${num(m.supply)} will ever exist.`}</b>
      <div className="small muted">{left > 0 ? `${num(m.found)} found so far, ${num(left)} still out there to find.` : "Every one has been found. The only way to get one now is from another player."} {num(m.around)} in players' hands.</div>
      <div className="xpbar"><i style={{ width: Math.min(100, (m.found / m.supply) * 100) + "%" }} /></div>
    </div></div>
  );
}

// ---------------- Market ----------------
export function Market({ arg }) {
  const [tab, setTab] = useState(arg === "mine" ? "mine" : "browse");
  if (arg && arg !== "mine") return <MarketItem id={arg} />;
  return (
    <div className="page">
      <div className="pagehead"><div><h1>Market</h1><p>Every town has its own market, and every listing is another player. Prices move with whatever people ask, so the same thing can be cheap in one town and dear in the next. You can look anywhere, but you can only buy where you are.</p></div>
        <div className="row"><Seg label="Market view" value={tab} onChange={setTab} options={[["browse", "Browse"], ["mine", "My listings"]]} />
          <button className="btn ghost" onClick={() => go("stash")}><Ic.Plus />Sell something</button></div></div>
      {tab === "browse" ? <MarketBrowse /> : <MyListings />}
    </div>
  );
}

function MarketBrowse() {
  const { me } = useGame();
  const [f, setF] = useState("all"); const [q, setQ] = useState(""); const [rows, setRows] = useState(null);
  const [city, setCity] = useState(browsing || me.city || "home"); const [cities, setCities] = useState([]);
  const sup = useSupply((rows || []).map(r => r.item_id));
  useEffect(() => { call("market_cities").then(r => setCities(r.cities || [])).catch(() => {}); }, []);
  useEffect(() => {
    browsing = city;
    const cats = FILT.find(x => x[0] === f)[2];
    const t = setTimeout(() => call("market_overview", { p_cats: cats, p_q: q || null, p_city: city }).then(setRows).catch(() => setRows([])), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [f, q, city]);
  const opts = [me.city || "home", "home", ...cities.map(c => c.id)].filter((x, i, a) => a.indexOf(x) === i);
  const count = Object.fromEntries(cities.map(c => [c.id, c.listings]));
  return (<>
    <div className="panel"><div className="body row" style={{ flexWrap: "wrap", gap: 10 }}>
      <label className="field" style={{ minWidth: 240 }}>Market in
        <select className="input" value={city} onChange={e => { setRows(null); setCity(e.target.value); }}>
          {opts.map(c => <option key={c} value={c}>{cityFlag(c)}{cityName(c)}{c === me.city ? " (you're here)" : ""}{count[c] ? `, ${count[c]} listings` : ""}</option>)}
        </select></label>
      {city !== (me.city || "home") && <span className="tiny grow">You're looking from afar. To buy here, travel to {cityName(city)} first.</span>}
    </div></div>
    <div className="row" style={{ flexWrap: "wrap" }}>
      <div className="chips">{FILT.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => { setF(k); setRows(null); }}>{l}</button>)}</div>
      <input className="input" style={{ maxWidth: 260, marginLeft: "auto" }} placeholder="Search the market" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the market" />
    </div>
    <Panel flush>
      {!rows ? <Empty title="Loading listings…" /> : rows.length === 0 ? <Empty title="Nothing for sale here yet">Be the first. List something from your stash and set the price.</Empty> :
      <div className="list">{rows.map(r => { const d = Math.round((r.min_price / r.value - 1) * 100); return (
        <button key={r.item_id} className="li click" onClick={() => { browsing = city; go("market/" + r.item_id); }}>
          <ItemThumb id={r.item_id} />
          <div><div className="t">{itemName(r.item_id)}</div><div className="s"><Rarity id={r.item_id} /> <Scarce s={sup[r.item_id]} /> {itemCat(r.item_id)}, {num(r.qty)} for sale from {r.listings} seller{r.listings > 1 ? "s" : ""}</div></div>
          <div className="act" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}><b>{money(r.min_price)}</b><span className={`tiny ${d <= -10 ? "good" : d >= 25 ? "bad" : ""}`}>{d === 0 ? "at book value" : `${Math.abs(d)}% ${d < 0 ? "under" : "over"} book`}</span></div>
        </button>); })}</div>}
    </Panel>
  </>);
}

function MarketItem({ id }) {
  const { me, run, busy, toast } = useGame();
  const it = IT[id];
  const [data, setData] = useState(null); const [qty, setQty] = useState({});
  const [city, setCity] = useState(browsing || me.city || "home"); const there = city === (me.city || "home");
  const load = () => call("market_item", { p_item: id, p_city: city }).then(setData).catch(() => setData({ listings: [], sales: [], elsewhere: [], traders: [] }));
  useEffect(() => { browsing = city; load(); }, [id, city]);
  if (!it) return <Empty title="That item doesn't exist." />;
  const sales = data?.sales || [];
  const avg = sales.length ? Math.round(sales.reduce((s, x) => s + Number(x.price), 0) / sales.length) : null;
  return (
    <div className="page">
      <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("market")}>Back to the market</button>
      <div className="row" style={{ gap: 16 }}>
        <ItemThumb id={id} lg />
        <div className="grow"><div className="verdict small" style={{ color: RAR[it.r][1], fontWeight: 700 }}>{RAR[it.r][0]} {CATN[it.cat].toLowerCase()}</div><h1>{it.n}</h1><p className="muted">{it.d}</p>
          <p className="tiny">{cityFlag(city)}Market in {cityName(city)}{there ? ", where you are." : `. You're in ${cityName(me.city)}, so you can look but not buy.`}</p></div>
      </div>
      <div className="stats">
        <div className="stat"><div className="k">Cheapest now</div><div className="v">{data?.listings?.[0] ? money(data.listings[0].price) : "None listed"}</div></div>
        <div className="stat"><div className="k">Average sale</div><div className="v">{avg ? money(avg) : "No sales yet"}</div></div>
        <div className="stat"><div className="k">Book value</div><div className="v">{money(it.v)}</div></div>
        <div className="stat"><div className="k">{city === "home" ? "Pawn shop pays" : "Trader here pays"}</div><div className="v">{data ? money(data.trader_here) : "…"}</div></div>
        {data?.supply && <div className="stat"><div className="k">Found so far</div><div className="v">{num(data.found)} <span className="muted small">of {num(data.supply)}</span></div></div>}
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
                <button className="btn sm" disabled={busy || me.cash < cost || !there} title={there ? "" : `Travel to ${cityName(city)} to buy`} onClick={() => run("market_buy", { p_id: l.id, p_qty: +q || 1 }, r => { load(); toast(`Bought ${r.qty} × ${it.n} for ${money(r.cost)}.`, "good"); })}>Buy for {money(cost)}</button></>}</div>
            </div>); })}</div>}
        </Panel>
        <Panel title="Other towns" note="Cheapest listing in each town that has one, and the traders who pay most.">
          {!data ? <Empty title="Loading…" /> : <div className="stack-sm">
            {data.elsewhere.length === 0 ? <p className="tiny">Nobody's selling one anywhere else.</p> :
              <div className="list">{data.elsewhere.map(e => <button key={e.city} className="li click" onClick={() => { setData(null); setCity(e.city); }}>
                <Ic.Store style={{ width: 18, color: "var(--mist)" }} /><div><div className="t">{cityFlag(e.city)}{e.name}</div><div className="s">{num(e.qty)} listed</div></div><div className="act"><b>{money(e.price)}</b></div></button>)}</div>}
            {data.traders?.length > 0 && <><b className="small">Best traders</b>
            <div className="list">{data.traders.map(t => <div key={t.city} className="li"><Ic.HandCoins style={{ width: 18, color: "var(--mist)" }} /><div><div className="t">{cityFlag(t.city)}{t.name}</div><div className="s">Pays a fixed price, any day</div></div><div className="act"><b>{money(t.price)}</b></div></div>)}</div></>}
          </div>}
        </Panel>
        <Panel title="Recent sales" note={sales.length ? `Last ${sales.length} sales in ${cityName(city)}` : "What it actually sold for"}>
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
          <div><button className="t" style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 650 }} onClick={() => go("market/" + l.item_id)}>{itemName(l.item_id)}</button><div className="s">{l.qty} at {money(l.price)} each in {cityFlag(l.city)}{l.city_name || cityName(l.city)}, listed {ago(l.created_at)}</div></div>
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
