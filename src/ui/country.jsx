import React from "react";
import { COUNTRIES } from "../game/world-data.js";

export const flag = iso => iso && iso.length === 2 ? String.fromCodePoint(...[...iso.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : "";
export const countryName = iso => (COUNTRIES.find(c => c[0] === iso) || [])[1] || iso;
// A best guess from the browser's language setting (en-NZ → NZ), so most people don't have to scroll.
export function guessCountry() {
  try {
    const langs = navigator.languages || [navigator.language];
    for (const l of langs) { const m = /-([A-Z]{2})$/i.exec(l || ""); if (m && COUNTRIES.some(c => c[0] === m[1].toUpperCase())) return m[1].toUpperCase(); }
  } catch (e) {}
  return "NZ";
}
export function CountrySelect({ value, onChange, id }) {
  return (
    <select id={id} className="input" value={value} onChange={e => onChange(e.target.value)}>
      {COUNTRIES.map(c => <option key={c[0]} value={c[0]}>{flag(c[0])} {c[1]}</option>)}
    </select>
  );
}
