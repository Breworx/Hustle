import React, { useEffect, useState } from "react";
import { IT, RAR, CATN } from "../game/catalog.js";
import { itemSvg, portraitSvg, lookSvg } from "../game/art.js";
import { clock, oddsColor } from "../lib/format.js";
import { scarceLabel } from "../lib/supply.js";

export const Svg = ({ svg, className, style }) => <span className={className} style={style} dangerouslySetInnerHTML={{ __html: svg }} />;

export function ItemThumb({ id, lg }) {
  const it = IT[id];
  return <Svg className={`thumb ${lg ? "lg" : ""} r${it ? it.r : 0}`} svg={itemSvg(id)} />;
}
export const Rarity = ({ id }) => { const it = IT[id]; return it ? <span className="rar" style={{ color: RAR[it.r][1] }}>{RAR[it.r][0]}</span> : null; };
export const Scarce = ({ s }) => { const l = scarceLabel(s); return l ? <span className="pill scarce">{l}</span> : null; };
export const itemName = id => (IT[id] ? IT[id].n : id);
export const itemCat = id => (IT[id] ? CATN[IT[id].cat] : "");

export const Avatar = ({ seed, look, lg, xl, className = "" }) => <Svg className={`av ${lg ? "lg" : ""} ${xl ? "xl" : ""} ${className}`} svg={look ? lookSvg(look) : portraitSvg(seed)} />;

// A player's name, in their chosen colour, with their crew tag.
export const NAME_COLORS = { gold: "Gold", ember: "Ember", seaglass: "Seaglass", sky: "Sky", violet: "Violet", rose: "Rose" };
export const Name = ({ p, tag = true }) => (
  <span className="pname">{tag && (p.crew?.tag || p.crew_tag) ? <span className="ctag">{p.crew?.tag || p.crew_tag}</span> : null}<span className={p.name_color ? "nc-" + p.name_color : ""}>{p.name}</span></span>
);

export function Meter({ label, value, max, color, note }) {
  const w = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="meter" title={note || `${label}: ${Math.floor(value)} of ${max}`}>
      <div className="mh"><span>{label}</span><b>{Math.floor(value)}<span className="muted">/{max}</span></b></div>
      <div className="track"><div className="fill" style={{ width: w + "%", background: color }} /></div>
    </div>
  );
}

export function Countdown({ until, onDone }) {
  const [, tick] = useState(0);
  const left = new Date(until).getTime() - Date.now();
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => { tick(x => x + 1); if (new Date(until).getTime() <= Date.now()) { clearInterval(t); onDone && onDone(); } }, 1000);
    return () => clearInterval(t);
  }, [until]);
  return <span className="num">{clock(left)}</span>;
}

export function Panel({ title, note, action, flush, children, className = "" }) {
  return (
    <section className={`panel ${flush ? "flush" : ""} ${className}`}>
      {(title || note || action) && <header><div className="grow"><h2>{title}</h2>{note && <div className="tiny">{note}</div>}</div>{action}</header>}
      <div className="body">{children}</div>
    </section>
  );
}

export const Empty = ({ title, children }) => <div className="empty"><b>{title}</b>{children}</div>;

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

export const Odds = ({ p }) => <div className="odds"><i style={{ width: Math.max(2, Math.min(100, p)) + "%", background: oddsColor(p) }} /></div>;

export function Spark({ values, w = 100, h = 30, color, area = true, className = "spark" }) {
  const v = values && values.length > 1 ? values : [values?.[0] || 0, values?.[0] || 0];
  const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1;
  const pts = v.map((x, i) => [(i / (v.length - 1)) * (w - 4) + 2, h - 3 - ((x - lo) / sp) * (h - 6)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  const last = pts[pts.length - 1];
  const col = color || (v[v.length - 1] >= v[0] ? "var(--seaglass)" : "var(--brick)");
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width={className === "spark" ? w : undefined} height={className === "spark" ? h : undefined} aria-hidden="true">
      {area && <path d={`${d}L${last[0].toFixed(1)} ${h}L2 ${h}Z`} fill={col} fillOpacity=".12" />}
      <path d={d} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={col} />
    </svg>
  );
}

export function Qty({ value, onChange, min = 1, max = 999999, id }) {
  return <input id={id} className="input" type="number" inputMode="numeric" min={min} max={max} value={value}
    onChange={e => onChange(e.target.value === "" ? "" : Math.max(min, Math.min(max, Math.floor(+e.target.value || 0))))} style={{ maxWidth: 120 }} />;
}
