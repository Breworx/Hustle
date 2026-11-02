import React, { useEffect, useState } from "react";
import { useGame } from "../state.jsx";
import { Avatar } from "./ui.jsx";
import { go, useRoute } from "../lib/nav.js";
import * as Ic from "./icons.js";

// ---------------- Tap-to-explain ----------------
export const METER_HELP = {
  stamina: ["Stamina", "Your energy. Jobs, the gym and fights all use it. It refills a little every few minutes, faster in a better home. A drink or a coffee tops it up."],
  grit: ["Grit", "Your nerve. Riskier jobs need more of it. It comes back slowly on its own, and a lager gives you a little Dutch courage."],
  mood: ["Mood", "How you're feeling. A good mood makes every set at the gym count for more. Food, drink and a nicer home all lift it."],
  health: ["Health", "How much of a beating you can take. Lose a fight and you end up in A&E until you're patched up. It refills over time, or use a first-aid kit."],
  heat: ["Heat", "How much attention you're getting from the police. Crime raises it, and high heat means more jobs end with you in the cells. It cools down over time. A burner phone cools it fast."],
};
export const PAGE_HELP = {
  street: ["The Street", "Your home page: what's going on in Greyhaven, your daily goals and streak, and your first steps if you're new."],
  missions: ["Missions", "Short story chains with a goal at each step. Finish a chain for a big reward."],
  jobs: ["Jobs", "The main way to make money and experience. Each job costs grit, has odds of success, and can turn up items. Fail and you might land in the cells."],
  fights: ["Fights", "Fight locals for their cash and loot, or attack other players turn by turn with whatever you're carrying from the armoury."],
  armoury: ["Armoury", "Buy weapons, armour, throwables and ammo, and choose what you carry into a fight. Strength decides how much weight you can carry."],
  gym: ["Gym", "Spend stamina to train strength, defence, speed and dexterity. Better stats win fights. A good mood makes each set count for more."],
  home: ["Home", "Where you live, from a doorway to a penthouse on the Moon. Each home raises your mood and stamina limits and brings its own perks."],
  property: ["Property", "Buy places and rent them out at whatever rent you like, or rent somewhere better to live from another player."],
  garage: ["Garage", "Your ride. It makes taxis cheaper and quicker, and on long trips it's one of the ways to travel, with its own speed and boot space."],
  career: ["Career", "A legit job with a shift every day. Rise through the ranks for a better wage and a perk."],
  companies: ["Companies", "Start a business, hire other players, pay wages, and grow it to ten stars. Or sell it."],
  medals: ["Medals", "Earned automatically as your numbers grow. Wear any medal you hold as your title."],
  collection: ["Collection", "Every item you've ever found, ticked off. Some exist only once in the whole game."],
  stash: ["Stash", "Everything you own. Tap an item to use it, equip it, sell it on the market, or pawn it."],
  market: ["Market", "Players buying and selling to each other. Every town has its own market, and you can only buy where you are."],
  exchange: ["Exchange", "Shares in companies whose prices follow real ones every trading day. Hold enough of some and you get a perk."],
  store: ["Corner store", "The basics at fixed prices: first-aid kits, drinks, food and a lottery ticket."],
  bank: ["Bank", "Money in the bank can't be taken off you in a mugging, and it earns a little interest."],
  tokens: ["Tokens", "The premium currency. Spend it on refills and Regular status, or sell it to other players for cash."],
  crews: ["Crews", "Gangs of up to 25 players with a shared chat, a vault and a reputation. Crews take turf and go to war."],
  crew: ["Crew", "Your crew's members, vault, turf and wars."],
  war: ["War room", "Crew wars: 48 hours of hitting the other crew anywhere in the city. Winners take a cut of the losers' vault."],
  messages: ["Messages", "Private messages with other players."],
  chat: ["Chat", "The whole city's chat, and your crew's private room."],
  players: ["Players", "Everyone in Greyhaven: who's here, who's online, and your contacts."],
  ranks: ["Rankings", "The leaderboards for players and crews."],
  map: ["Map and turf", "Greyhaven's six districts. Take a taxi between them, and see which crew runs each one."],
  travel: ["Travel", "Leave Greyhaven for towns in your own country or anywhere in the world. Every town sells its own goods, and how you travel decides the time, the cost and how much you can carry back. You can't do anything else while you're on the road."],
  event: ["Events", "Limited-time events with their own items and prizes."],
  cells: ["The Cells", "Who's locked up. Spring other players out for experience, if you've got the grit."],
  ae: ["A&E", "Who's in hospital, and for how long."],
  news: ["News", "Your notifications: sales, attacks, messages and everything else that happened to you."],
  account: ["Account", "Your country, your look, light or dark mode, and the tutorial."],
  admin: ["Admin", "Tools for running the game."],
  fight: ["Fight", "A fight against another player. Each turn, pick a weapon, throw something or run. They answer straight after."],
  player: ["Profile", "Another player's profile. Attack, message or add them to your contacts from here."],
  company: ["Company", "A company's staff, wages, money and stars."],
};
// Opens a short explanation in the game's own pop-up card.
export function useExplain() {
  const { showSheet } = useGame();
  return ([title, text], icon) => showSheet({ verdict: "What's this?", title, story: text, pic: <span className="thumb modeic">{icon || <Ic.Info />}</span> });
}
// The ? button in the top bar: explains the page you're on.
export function PageHelp() {
  const route = useRoute(); const base = route.split("?")[0].split("/")[0] || "street";
  const explain = useExplain();
  const h = PAGE_HELP[base];
  if (!h) return null;
  return <button className="iconbtn" onClick={() => explain(h, <Ic.CircleHelp />)} aria-label={`What's the ${h[0]} page?`}><Ic.CircleHelp /></button>;
}

// ---------------- The tutorial ----------------
// Sal, a fixer on the Waterfront, walks new players through their first hour.
// "do" steps wait until you've done the thing (tracked by the server's first-steps guide); "look" steps just need Next.
const SAL = { skin: 3, hat: 2, shirt: 4, bg: 5, grin: true, chain: true };
export const TOUR = [
  { k: "hello", page: "street", look: true, t: "Welcome to Greyhaven", d: "Name's Sal. I keep an eye on the Waterfront, and you look like you've just stepped off the ferry with nothing but the clothes you're in. Stick with me for ten minutes and you'll be making money by tonight." },
  { k: "meters", page: "street", look: true, sel: ".topbar .meters", t: "Your gauges", d: "Up top: stamina, grit, mood, health and heat. Everything you do uses some of them, and they all refill on their own. Tap any one of them and I'll tell you what it's for." },
  { k: "job", page: "jobs", sel: "[data-tour=job]", t: "Your first job", d: "Jobs are how you eat. Start small: rummaging through bins costs almost nothing and always turns up something. Hit Do it." },
  { k: "home", page: "home", sel: "[data-tour=home]", t: "Get off the street", d: "Sleeping in a doorway makes everything slower. A tent under the motorway costs less than a night out. Move in." },
  { k: "train", page: "gym", sel: "[data-tour=train]", t: "Get stronger", d: "The gym turns stamina into stats, and stats win fights. Do a set or two." },
  { k: "use", page: "stash", sel: "[data-tour=use-btn], [data-tour=use]", t: "Your stash", d: "Everything you own lives here. I slipped you a lager and a pie. Open the lager and use it: a good mood makes the gym count for more." },
  { k: "fight_win", page: "fights", sel: "[data-tour=fight]", t: "Stand your ground", d: "Every street has its trouble. Pick someone your size, check the odds, and win a fight. Lose, and you'll spend a few minutes in A&E. Nobody's perfect." },
  { k: "market", page: "market", look: true, sel: ".page .pagehead", t: "The market", d: "Everything here is another player selling. Prices go up and down with whatever people ask, and every town has its own market. Buy low, sell high." },
  { k: "trip", page: "travel", look: true, sel: ".mappanel", t: "Beyond Greyhaven", d: "This is where the real money is. Every town sells things you can't get here. Bring them home, or sell them where they're worth more. Mind customs." },
  { k: "crews", page: "crews", look: true, sel: ".page .pagehead", t: "Find your people", d: "Nobody runs this city alone. A crew shares a chat, a vault and a reputation, and crews fight over turf. Join one when you're ready." },
  { k: "done", page: "street", look: true, sel: ".page", t: "You'll do", d: "That's the tour. Collect your first-steps rewards on the Street, then go make a name for yourself. You can bring me back from your Account page any time. If anything's unclear, tap the ? up top." },
];
const KEY = "hustle-tour";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null") || { i: 0, off: false }; } catch (e) { return { i: 0, off: false }; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
export function restartTour() { save({ i: 0, off: false }); window.dispatchEvent(new Event("hustle-tour")); }

export function Tutorial() {
  const { me } = useGame();
  const route = useRoute(); const base = route.split("?")[0].split("/")[0] || "street";
  const [s, setS] = useState(load); const [min, setMin] = useState(false);
  useEffect(() => { const f = () => setS(load()); window.addEventListener("hustle-tour", f); return () => window.removeEventListener("hustle-tour", f); }, []);
  const set = n => { save(n); setS(n); };
  const done = me.guide?.done || {};
  // Skip past anything you've already done.
  let i = s.i; while (i < TOUR.length && !TOUR[i].look && done[TOUR[i].k]) i++;
  const step = TOUR[i];
  useEffect(() => { if (i !== s.i) set({ ...s, i }); }, [i]);
  // Glow on the thing to tap.
  useEffect(() => {
    if (!step || s.off || min || step.page !== base || !step.sel) return;
    let el = null;
    const find = () => { const n = document.querySelector(step.sel); if (n !== el) { el?.classList.remove("tour-glow"); el = n; if (el) { el.classList.add("tour-glow"); el.scrollIntoView?.({ block: "center", behavior: "smooth" }); } } };
    find(); const t = setInterval(find, 600);
    return () => { clearInterval(t); el?.classList.remove("tour-glow"); };
  }, [step?.k, base, s.off, min]);
  if (s.off || !step) return null;
  const here = step.page === base;
  if (min) return <button className="tour-pill" onClick={() => setMin(false)}><Avatar seed="sal" look={SAL} />Sal: {step.t}</button>;
  return (
    <aside className="tour" role="dialog" aria-label="Tutorial">
      <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
        <Avatar seed="sal" look={SAL} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 6 }}><span className="tiny">Sal · {i + 1} of {TOUR.length}</span>
            <button className="iconbtn sm" onClick={() => setMin(true)} aria-label="Hide for now"><Ic.Minus /></button></div>
          <b>{step.t}</b>
          <p className="story" style={{ margin: "4px 0 0", padding: 0 }}>{step.d}</p>
        </div>
      </div>
      <div className="xpbar" style={{ margin: "10px 0" }}><i style={{ width: ((i) / (TOUR.length - 1)) * 100 + "%" }} /></div>
      <div className="row" style={{ gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button className="btn ghost sm" onClick={() => set({ ...s, off: true })}>Skip the tour</button>
        {!here ? <button className="btn sm" onClick={() => go(step.page)}>Take me there</button>
          : step.look ? <button className="btn sm" onClick={() => set({ ...s, i: i + 1, off: i + 1 >= TOUR.length })}>{i + 1 >= TOUR.length ? "Thanks, Sal" : "Next"}</button>
          : <span className="tiny" style={{ alignSelf: "center" }}>Do it, and I'll take it from there.</span>}
      </div>
    </aside>
  );
}
