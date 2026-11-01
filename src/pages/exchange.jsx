import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useGame } from "../state.jsx";
import { Panel, Spark, Empty, Seg, Qty, Svg, ItemThumb } from "../ui/ui.jsx";
import { stockNow } from "../game/stocks.js";
import { call } from "../lib/supabase.js";
import { money, money2, num } from "../lib/format.js";
import * as Ic from "../ui/icons.js";

// Prices drift through the day by a formula the server shares, and jump each evening by the real company's daily move.
const intraday = (s, now) => Array.from({ length: 48 }, (_, i) => stockNow(s.ticker, Number(s.close), Number(s.vol), now - (47 - i) * 150000));
const pctTxt = p => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";

export function Exchange() {
  const { run, busy, toast, showSheet, refresh } = useGame();
  const [board, setBoard] = useState(null); const [open, setOpen] = useState(null); const [now, setNow] = useState(Date.now());
  const [view, setView] = useState("all");
  const load = () => call("stock_board").then(setBoard).catch(e => { toast(e.message, "bad"); setBoard([]); });
  useEffect(() => { load(); const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);
  const rows = useMemo(() => (board || []).map(s => {
    const px = stockNow(s.ticker, Number(s.close), Number(s.vol), now);
    return { ...s, px, chg: (px / Number(s.prev) - 1) * 100, spark: intraday(s, now) };
  }), [board, now]);
  const mine = rows.filter(s => s.shares > 0);
  const value = mine.reduce((a, s) => a + s.shares * s.px, 0), cost = mine.reduce((a, s) => a + Number(s.cost), 0);
  const shown = view === "mine" ? mine : rows;
  const lastReal = rows.map(s => s.real_date).filter(Boolean).sort().pop();

  async function trade(s, n) {
    const r = await run("stock_trade", { p_ticker: s.ticker, p_shares: n });
    if (!r) return; load();
    toast(r.bought ? `Bought ${num(r.bought)} ${s.ticker} at ${money2(r.price)}. Total ${money(r.total)}.` : `Sold ${num(r.sold)} ${s.ticker} for ${money(r.total)}, ${r.gain >= 0 ? "a profit of " + money(r.gain) : "a loss of " + money(-r.gain)}.`, "good");
  }
  async function perk(s) {
    const r = await run("stock_perk", { p_ticker: s.ticker }); if (!r) return; load();
    showSheet({ verdict: "Dividend collected", title: s.name, story: `Your ${s.ticker} shares paid out today.`, cash: r.cash, items: r.items || [], pic: <span className="thumb"><Ic.Coins /></span> });
  }

  return (
    <div className="page">
      <div className="pagehead"><div><h1>Exchange</h1><p>Eighteen city companies, each shadowing a real one. Every trading day, a company moves by the same percentage as its real twin did at the close. In between, prices drift with the mood of the street. Holding a full block of shares unlocks a perk.</p></div>
        <Seg label="Show" value={view} onChange={setView} options={[["all", "All companies"], ["mine", `My shares (${mine.length})`]]} /></div>
      <div className="stats">
        <div className="stat"><div className="k">Portfolio value</div><div className="v">{money(value)}</div></div>
        <div className="stat"><div className="k">Profit and loss</div><div className={`v ${value - cost >= 0 ? "good" : "bad"}`}>{value - cost >= 0 ? "+" : "−"}{money(Math.abs(value - cost))}</div></div>
        <div className="stat"><div className="k">Last real close</div><div className="v">{lastReal ? new Date(lastReal + "T12:00").toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" }) : "Waiting"}</div></div>
      </div>
      <Panel flush>
        {!board ? <Empty title="Opening the board…" /> : shown.length === 0 ? <Empty title="You don't own any shares">Pick a company from the full board and buy in.</Empty> :
        <div role="list">{shown.map(s => (
          <Fragment key={s.ticker}>
            <button className="stockrow" aria-expanded={open === s.ticker} onClick={() => setOpen(open === s.ticker ? null : s.ticker)}>
              <span className="ticker">{s.ticker}</span>
              <span style={{ minWidth: 0 }}><b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</b><span className="tiny">{s.sector}{s.shares > 0 ? `, you own ${num(s.shares)}` : ""}</span></span>
              <span className="spk"><Spark values={s.spark} w={110} h={30} color={s.chg >= 0 ? "var(--seaglass)" : "var(--brick)"} /></span>
              <span className="p">{money2(s.px)}</span>
              <span className={`c ${s.chg >= 0 ? "good" : "bad"}`}>{pctTxt(s.chg)}</span>
            </button>
            {open === s.ticker && <StockDetail s={s} busy={busy} onTrade={trade} onPerk={perk} />}
          </Fragment>))}</div>}
      </Panel>
    </div>
  );
}

function StockDetail({ s, busy, onTrade, onPerk }) {
  const { me } = useGame();
  const [n, setN] = useState(10);
  const daily = (s.history || []).map(h => Number(h[1]));
  const days = (s.history || []).slice(-6).reverse();
  const block = s.shares >= s.perk_shares;
  const daily_ = s.perk.startsWith("daily:");
  const ready = block && daily_ && (!s.perk_at || Date.now() - new Date(s.perk_at) > 86400000);
  const maxBuy = Math.floor(me.cash / s.px);
  return (
    <div className="stockdetail">
      <div className="cols" style={{ gap: 14 }}>
        <div className="stack-sm">
          <div className="tiny">Today, live</div>
          <Spark values={s.spark} w={320} h={90} className="chart" color={s.chg >= 0 ? "var(--seaglass)" : "var(--brick)"} />
          {daily.length > 1 && <><div className="tiny">Daily closes</div><Spark values={daily} w={320} h={60} className="chart" color="var(--signal)" /></>}
        </div>
        <div className="stack-sm">
          <table className="table"><tbody>
            <tr><td>Yesterday's close</td><td className="num">{money2(s.prev)}</td></tr>
            {days.filter(d => d[2] != null).slice(0, 4).map(d => <tr key={d[0]}><td>{new Date(d[0] + "T12:00").toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" })}</td><td className={`num ${d[2] >= 0 ? "good" : "bad"}`}>{pctTxt(Number(d[2]))}</td></tr>)}
            {s.shares > 0 && <tr><td>Your average cost</td><td className="num">{money2(s.cost / s.shares)}</td></tr>}
          </tbody></table>
          <div className={`perkbox ${block ? "on" : ""}`}>
            <b>{block ? "Perk unlocked" : `Own ${num(s.perk_shares)} shares to unlock`}</b>
            <div className="small">{s.perk_desc}</div>
            {!block && <div className="tiny">You have {num(s.shares)}. That's {money(Math.max(0, s.perk_shares - s.shares) * s.px)} more.</div>}
            {block && daily_ && <button className="btn sm good" style={{ marginTop: 8 }} disabled={busy || !ready} onClick={() => onPerk(s)}>{ready ? "Collect today's dividend" : "Collected today"}</button>}
          </div>
          <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
            <label className="field">Shares<Qty value={n} onChange={setN} max={10000000} /></label>
            <button className="btn" disabled={busy || !n || n > maxBuy} onClick={() => onTrade(s, +n)}>Buy for {money(Math.ceil(n * s.px))}</button>
            <button className="btn ghost" disabled={busy || !n || n > s.shares} onClick={() => onTrade(s, -n)}>Sell</button>
          </div>
          <div className="tiny">You can afford {num(maxBuy)}. Selling costs a small fee that shrinks as your trading skill grows.</div>
        </div>
      </div>
    </div>
  );
}
