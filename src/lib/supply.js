// How many of each limited item can ever exist, fetched once per item and cached for the session.
import { useEffect, useState } from "react";
import { call } from "./supabase.js";
const cache = {};
export async function getSupply(ids) {
  const need = [...new Set(ids)].filter(id => id && !(id in cache));
  if (need.length) { try { const r = await call("item_supply", { p_ids: need }); need.forEach(id => { cache[id] = r[id] || null; }); } catch (e) {} }
  return Object.fromEntries(ids.map(id => [id, cache[id] || null]));
}
export function useSupply(ids) {
  const key = ids.join(",");
  const [map, setMap] = useState(() => Object.fromEntries(ids.filter(id => id in cache).map(id => [id, cache[id]])));
  useEffect(() => { let live = true; getSupply(ids).then(m => live && setMap(m)); return () => { live = false; }; }, [key]);
  return map;
}
// Label for scarce items only. Anything with more than 100 copies isn't worth shouting about.
export const scarceLabel = s => !s ? null : s[0] === 1 ? "One of one" : s[0] <= 100 ? `Only ${s[0].toLocaleString("en-NZ")} exist` : null;
