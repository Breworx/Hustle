// Turns server results into the short stories players read.
import { STORY, BUSTSTORY, BOXSTORY } from "./content.js";
import { NAMES, IT } from "./catalog.js";
import { money } from "../lib/format.js";

const pick = a => a[Math.floor(Math.random() * a.length)];
const fill = (s, ctx) => s.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? "");

export function jobStory(jobId, res) {
  const st = STORY[jobId] || STORY.bins;
  const key = { win: "s", fail: "f", jail: "j", hosp: "h" }[res.outcome];
  return fill(pick(st[key] || st.f), { cash: money(res.cash), npc: pick(NAMES), npc2: pick(NAMES) });
}

export function npcFightStory(foe, res) {
  const fn = `the ${foe.toLowerCase()}`;
  const open = [`You square up to ${fn}`, `You duck the first punch from ${fn} and come up swinging`, `You throw a chilly bin lid like a frisbee at ${fn}`, `You fake left, go right and catch ${fn} off guard`];
  return res.won
    ? `${pick(open)}. ${pick([`They fold like a deck chair. You help yourself to ${money(res.cash)}.`, `They sit down on the kerb to think about their choices. You take ${money(res.cash)} for your trouble.`, `A crowd outside the chippy cheers as ${money(res.cash)} changes hands.`])}`
    : `${pick(open)}. ${pick(["They catch your fist mid-swing and laugh.", "They've clearly done this before. A lot.", "You land one good hit. They land five."])} ${pick([`You wake up in an ambulance, ${money(res.lost)} lighter.`, `Someone goes through your pockets while you're seeing stars. ${money(res.lost)} gone.`])}`;
}

export function pvpStory(res) {
  const n = res.name;
  return res.won
    ? pick([`You catch ${n} outside the TAB and it's over before they get their hands up. You lift ${money(res.cash)} from their jacket.`,
            `${n} sees you coming and runs, but not fast enough. You leave them in a doorway and walk off with ${money(res.cash)}.`,
            `Three quick hits and ${n} is on the wet pavement. Their wallet has ${money(res.cash)} in it. Had.`])
    : pick([`${n} was ready for you. You come round in an ambulance with the siren going.`,
            `You swing first. ${n} swings last. Someone calls an ambulance.`,
            `${n} has clearly been training. You find that out the hard way.`]);
}

export function bustStory(res) {
  const ctx = { npc: res.name, cash: "" };
  if (res.ok) return fill(pick(["You phone in a noise complaint two streets away. While the duty sergeant is on the call, you walk {npc} out the back door.", "A borrowed key, a squeaky gate and a very quiet corridor. {npc} is free."]), ctx);
  return fill(pick(res.jailed ? BUSTSTORY.j : BUSTSTORY.f), ctx);
}

export const boxIntro = () => pick(BOXSTORY);
export const itemList = ids => ids.map(id => (IT[id] ? IT[id].n : id)).join(", ");
