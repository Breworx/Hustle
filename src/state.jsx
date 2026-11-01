import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { call, supabase } from "./lib/supabase.js";
import { Svg } from "./ui/ui.jsx";
import { itemSvg } from "./game/art.js";
import { IT, RAR } from "./game/catalog.js";
import { money } from "./lib/format.js";
import { Check, Info, TriangleAlert, X } from "./ui/icons.js";
import { useSupply, scarceLabel } from "./lib/supply.js";

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ session, children }) {
  const [state, setState] = useState(null);
  const [needsChar, setNeedsChar] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const uid = session?.user?.id;

  const toast = useCallback((msg, tone = "") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-3), { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4800);
  }, []);

  const refresh = useCallback(async () => {
    try { const s = await call("get_state"); setState(s); setNeedsChar(false); }
    catch (e) { if (String(e.message).includes("NO_PLAYER")) setNeedsChar(true); else toast(e.message, "bad"); }
  }, [toast]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [refresh]);

  // Live notifications: attacks, sales, springs and level-ups arrive the moment they happen.
  useEffect(() => {
    if (!supabase || !uid || !supabase.channel) return;
    const ch = supabase.channel("events-" + uid)
      .on("postgres_changes", { event: "INSERT", schema: "game", table: "events", filter: `player_id=eq.${uid}` }, p => {
        const k = p.new?.kind;
        toast(p.new?.body || "Something happened.", k === "attacked" ? "bad" : k === "sale" || k === "level" || k === "skill" || k === "bust" ? "good" : "");
        refresh();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, toast, refresh]);

  // Run a game action. Errors become a toast; success refreshes the player and hands back the result.
  const run = useCallback(async (fn, args, after) => {
    if (busyRef.current) return null;
    busyRef.current = true; setBusy(true);
    try { const r = await call(fn, args); await refresh(); if (after) after(r); return r; }
    catch (e) { toast(e.message, "bad"); return null; }
    finally { busyRef.current = false; setBusy(false); }
  }, [refresh, toast]);

  const inv = useMemo(() => Object.fromEntries((state?.inventory || []).map(x => [x.item_id, x.qty])), [state]);
  const holdings = useMemo(() => Object.fromEntries((state?.holdings || []).map(x => [x.ticker, x])), [state]);
  const value = { state, me: state?.me, inv, holdings, refresh, run, toast, showSheet: setSheet, busy, needsChar, session, uid };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.tone === "bad" ? <TriangleAlert color="var(--brick)" /> : t.tone === "good" ? <Check color="var(--seaglass)" /> : <Info color="var(--signal)" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      {sheet && <ResultSheet {...sheet} onClose={() => setSheet(null)} />}
    </Ctx.Provider>
  );
}

// The result of an action, told as a short story with what you gained or lost.
function ResultSheet({ pic, verdict, tone = "good", title, story, cash, items = [], lines = [], onClose, extra, again }) {
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const sup = useSupply(items.filter(Boolean));
  const col = tone === "good" ? "var(--seaglass)" : tone === "bad" ? "var(--brick)" : "var(--sodium)";
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="head">
          {pic}
          <div className="grow"><div className="verdict" style={{ color: col }}>{verdict}</div><h2>{title}</h2></div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {story && <p className="story">{story}</p>}
        {(cash > 0 || items.length > 0 || lines.length > 0) && (
          <div className="gains">
            {cash > 0 && <span className="gain money">+{money(cash)}</span>}
            {items.filter(Boolean).map((id, i) => (
              <span key={i} className="gain"><Svg svg={itemSvg(id)} />{IT[id]?.n}<span className="rar" style={{ color: RAR[IT[id]?.r || 0][1] }}>{RAR[IT[id]?.r || 0][0]}</span>{scarceLabel(sup[id]) && <span className="pill scarce">{scarceLabel(sup[id])}</span>}</span>
            ))}
            {lines.map((l, i) => <span key={"l" + i} className="gain">{l}</span>)}
          </div>
        )}
        {extra}
        <div className="foot">{again && <button className="btn ghost" onClick={() => { onClose(); again(); }}>{again.label || "Go again"}</button>}<button className="btn" onClick={onClose} autoFocus>Carry on</button></div>
      </div>
    </div>
  );
}
