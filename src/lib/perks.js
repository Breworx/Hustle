// Plain-language descriptions of perks, shared by homes, vehicles and careers.
import { IT } from "../game/catalog.js";
import { money, num } from "./format.js";
const pc = x => Math.round(x * 100) + "%";
export const dailyText = d => [d.item ? `${d.qty > 1 ? d.qty + " × " : ""}${IT[d.item]?.n || d.item}` : null, d.cash ? money(d.cash) : null].filter(Boolean).join(" and ");
export const PERK_TEXT = {
  regen: v => v < 0 ? `Stamina and health ${pc(-v)} slower` : `Stamina and health ${pc(v)} faster`,
  mug: v => `Muggers take ${pc(v)} less`,
  hosp: v => `${pc(v)} shorter A&E stays`,
  jail: v => `${pc(v)} shorter stays in the cells`,
  heat: v => `Heat cools ${pc(v)} faster`,
  listings: v => `+${v} market listings`,
  gym: v => `${pc(v)} bigger gym gains`,
  job: v => `+${Math.round(v * 10) / 10}% job odds`,
  travel_disc: v => v >= 1 ? "Free taxis" : `Taxis ${pc(v)} off`,
  travel_time: v => `Taxi rides ${pc(v)} quicker`,
};
// [text, tone] pairs for a perk object (plus mood and stamina limits for homes).
export function perkList(h) {
  const k = h.perks || {}, out = [];
  if (h.mood) out.push([`+${num(h.mood)} mood limit`, "good"]);
  if (h.stamina) out.push([`+${h.stamina} stamina limit`, "good"]);
  for (const key of ["regen", "mug", "hosp", "jail", "heat", "gym", "job", "listings", "travel_disc", "travel_time"])
    if (k[key]) out.push([PERK_TEXT[key](k[key]), k[key] < 0 ? "bad" : "good"]);
  if (k.travel_free) out.push([k.travel_fast ? "Free travel in 5 seconds" : "Free travel", "good"]);
  if (k.daily) out.push([`Every day: ${dailyText(k.daily)}`, "warn"]);
  if (k.skyline) out.push(["Your name on the skyline", "warn"]);
  return out;
}
