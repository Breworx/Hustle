import React, { useEffect, useState } from "react";
import { supabase, configured, call } from "./lib/supabase.js";
import { GameProvider, useGame } from "./state.jsx";
import { Avatar, Countdown, Meter, Svg, ItemThumb, Name } from "./ui/ui.jsx";
import { skyline, DISTRICT_ART } from "./game/art.js";
import { rankOf } from "./game/catalog.js";
import { money } from "./lib/format.js";
import { go, useRoute, DISTRICT_NAMES } from "./lib/nav.js";
import * as Ic from "./ui/icons.js";
import { Street } from "./pages/street.jsx";
import { Jobs, Gym, Fights } from "./pages/work.jsx";
import { Stash, Market, Store, Bank } from "./pages/money.jsx";
import { Exchange } from "./pages/exchange.jsx";
import { Tokens } from "./pages/tokens.jsx";
import { Legal } from "./pages/legal.jsx";
import { CityMap, Players, Profile, Cells, AandE, Chat, Rankings, News, Account } from "./pages/city.jsx";
import { Crews, CrewPage, Messages } from "./pages/social.jsx";
import { Home, Collection } from "./pages/home.jsx";
import { Admin } from "./pages/admin.jsx";
import { Garage, Career, Medals, Missions, Event } from "./pages/life.jsx";

export const NAV = [
  { group: "On the street", items: [["street", "The Street", Ic.House], ["missions", "Missions", Ic.ScrollText], ["jobs", "Jobs", Ic.Briefcase], ["fights", "Fights", Ic.Swords], ["gym", "Gym", Ic.Dumbbell]] },
  { group: "Your life", items: [["home", "Home", Ic.Building], ["garage", "Garage", Ic.Car], ["career", "Career", Ic.Briefcase], ["medals", "Medals", Ic.Award], ["collection", "Collection", Ic.Gem]] },
  { group: "Money", items: [["stash", "Stash", Ic.Package], ["market", "Market", Ic.Store], ["exchange", "Exchange", Ic.ChartLine], ["store", "Corner store", Ic.ShoppingBag], ["bank", "Bank", Ic.Landmark], ["tokens", "Tokens", Ic.Coins]] },
  { group: "People", items: [["crews", "Crews", Ic.Flag], ["messages", "Messages", Ic.Mail], ["chat", "Chat", Ic.MessageSquare], ["players", "Players", Ic.Users], ["ranks", "Rankings", Ic.Trophy]] },
  { group: "The city", items: [["map", "Map and turf", Ic.Map], ["event", "Events", Ic.PartyPopper], ["cells", "The Cells", Ic.Lock], ["ae", "A&E", Ic.HeartPulse]] }
];
const TABS = [["street", "Street", Ic.House], ["jobs", "Jobs", Ic.Briefcase], ["fights", "Fights", Ic.Swords], ["market", "Market", Ic.Store]];

export default function App() {
  const [session, setSession] = useState(undefined);
  const route = useRoute();
  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => data.subscription.unsubscribe();
  }, []);
  // The terms page is public, so Stripe and new players can read it without signing in.
  if (route.startsWith("legal")) return <Legal />;
  if (!configured) return <SetupNeeded />;
  if (session === undefined) return <Loading />;
  if (!session) return <Auth />;
  return <GameProvider session={session} key={session.user.id}><Gate /></GameProvider>;
}

function Loading() { return <div className="empty" style={{ paddingTop: "30vh" }}><b>Loading the city…</b></div>; }

function SetupNeeded() {
  return (
    <div className="content" style={{ margin: "10vh auto", maxWidth: 640 }}>
      <div className="panel"><div className="body stack">
        <h1>Almost there</h1>
        <p className="muted">This copy of Backstreet isn't connected to a database yet. In Vercel, open the project's Settings, then Environment Variables, and add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> from your Supabase project's API settings. Then redeploy.</p>
      </div></div>
    </div>
  );
}

// Optional bot check on sign-up and sign-in (Cloudflare Turnstile), switched on by VITE_TURNSTILE_SITE_KEY.
// Pair it with Supabase: Authentication, Bot and Abuse Protection, Enable CAPTCHA protection.
function useCaptcha() {
  const site = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const ref = React.useRef(null); const wid = React.useRef(null);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (!site) return;
    const draw = () => { if (ref.current && window.turnstile && wid.current == null)
      wid.current = window.turnstile.render(ref.current, { sitekey: site, theme: "auto", callback: setToken, "expired-callback": () => setToken(""), "error-callback": () => setToken("") }); };
    if (window.turnstile) draw();
    else if (!document.getElementById("ts-script")) {
      const sc = document.createElement("script"); sc.id = "ts-script"; sc.async = true;
      sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; sc.onload = draw; document.head.appendChild(sc);
    } else document.getElementById("ts-script").addEventListener("load", draw);
    return () => { if (wid.current != null && window.turnstile) { window.turnstile.remove(wid.current); wid.current = null; } };
  }, [site]);
  return { on: !!site, token, ref, reset: () => { setToken(""); if (wid.current != null && window.turnstile) window.turnstile.reset(wid.current); } };
}

function Auth() {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const captcha = useCaptcha();
  async function submit(e) {
    e.preventDefault(); setErr(""); setNote("");
    if (captcha.on && !captcha.token) return setErr("Tick the box to show you're a person.");
    setBusy(true);
    const options = captcha.on ? { captchaToken: captcha.token } : undefined;
    const f = mode === "in" ? supabase.auth.signInWithPassword({ email, password: pw, options }) : supabase.auth.signUp({ email, password: pw, options });
    const { data, error } = await f; setBusy(false); captcha.reset();
    if (error) return setErr(error.message);
    if (mode === "up" && !data.session) setNote("Check your email to confirm your account, then sign in.");
  }
  return (
    <div className="auth">
      <div className="art">
        <Svg svg={skyline(DISTRICT_ART.water)} /><div className="rain" /><div className="veil" />
        <div className="in"><h1>Backstreet</h1><p>A harbour city that never sleeps. Pull jobs, build a crew of rivals and friends, trade on the market, and see who's still standing by morning.</p></div>
      </div>
      <form className="form" onSubmit={submit}>
        <h2>{mode === "in" ? "Sign in" : "Create your account"}</h2>
        <label className="field">Email<input className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="field">Password<input className="input" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={6} required value={pw} onChange={e => setPw(e.target.value)} /></label>
        {captcha.on && <div ref={captcha.ref} className="captcha" />}
        {err && <p className="err">{err}</p>}
        {note && <p className="good">{note}</p>}
        <p className="tiny">By playing you agree to the <a href="#/legal">terms and privacy policy</a>.</p>
        <button className="btn lg block" disabled={busy}>{busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}</button>
        <p className="muted small">{mode === "in" ? "New to the city? " : "Already have an account? "}
          <button type="button" className="btn ghost sm" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>{mode === "in" ? "Create an account" : "Sign in instead"}</button></p>
      </form>
    </div>
  );
}

function CreateCharacter() {
  const { refresh, showSheet } = useGame();
  const [name, setName] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const r = await call("create_player", { p_name: name }); await refresh();
      if (r.founder) showSheet({ verdict: `Founder #${r.founder}`, title: "You got here early", story: "You’re one of the first hundred people in Backstreet. There’s a Founder’s key in your stash with your number on it, and a badge on your profile that nobody who comes later can ever get.", items: ["founder"], pic: <ItemThumb id="founder" /> }); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <div className="content" style={{ margin: "8vh auto", maxWidth: 520 }}>
      <form className="panel" onSubmit={submit}><div className="body stack">
        <div className="row"><Avatar seed={name || "new"} lg /><div><h1>Who are you?</h1><p className="muted">Pick the name people on the street will know you by. You can't change it later. The first hundred characters each get a numbered Founder's key.</p></div></div>
        <label className="field">Street name<input className="input" autoFocus maxLength={20} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ghost" /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn lg" disabled={busy || name.trim().length < 3}>Hit the street</button>
        <button type="button" className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div></form>
    </div>
  );
}

function Gate() {
  const { state, needsChar, banned } = useGame();
  if (banned) return <Banned b={banned} />;
  if (needsChar) return <CreateCharacter />;
  if (!state) return <Loading />;
  return <Shell />;
}

function Banned({ b }) {
  const forever = !b.until || b.until.startsWith("infinity");
  return (
    <div className="content" style={{ margin: "12vh auto", maxWidth: 560 }}>
      <div className="panel"><div className="body stack">
        <h1>Your account is suspended</h1>
        <p className="muted">{forever ? "This suspension is permanent." : `It lifts on ${new Date(b.until).toLocaleString("en-NZ", { dateStyle: "medium", timeStyle: "short" })}.`}{b.reason ? ` Reason: ${b.reason}.` : ""}</p>
        <p className="muted small">If you think this is a mistake, contact us using the details on the <a href="#/legal">terms page</a>.</p>
        <div><button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      </div></div>
    </div>
  );
}

const PAGES = { garage: Garage, career: Career, medals: Medals, missions: Missions, event: Event, home: Home, collection: Collection, crews: Crews, crew: CrewPage, messages: Messages, admin: Admin, tokens: Tokens, street: Street, jobs: Jobs, gym: Gym, fights: Fights, stash: Stash, market: Market, store: Store, bank: Bank, exchange: Exchange,
  map: CityMap, players: Players, player: Profile, cells: Cells, ae: AandE, chat: Chat, ranks: Rankings, news: News, account: Account };

function Shell() {
  const { me, state, inv } = useGame();
  const route = useRoute();
  const [base, ...rest] = route.split("?")[0].split("/");
  const Page = PAGES[base] || Street;
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  return (
    <div className="shell">
      {open && <div className="railscrim" onClick={() => setOpen(false)} />}
      <nav className={`rail ${open ? "open" : ""}`} aria-label="Places">
        <button className="brand" onClick={() => go("street")}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 42V14q0-6 8-6h8" stroke="var(--mist-2)" strokeWidth="3.5" fill="none" strokeLinecap="round" /><ellipse cx="33" cy="9" rx="5.5" ry="2.8" fill="var(--sodium)" /><path d="M28.5 11L19 42h24z" fill="var(--sodium)" opacity=".25" /></svg>
          <span><b>Backstreet</b><span>{state.online} on the street now</span></span>
        </button>
        {NAV.map(g => (
          <div className="navgroup" key={g.group}>
            <h4>{g.group}</h4>
            {g.items.map(([k, label, Icon]) => (
              <button key={k} className="navlink" aria-current={base === k ? "page" : undefined} onClick={() => go(k)}>
                <Icon />{label}{badge(k, me, inv, state)}
              </button>
            ))}
          </div>
        ))}
        <div className="railfoot">
          {me.is_admin && <button className="navlink" aria-current={base === "admin" ? "page" : undefined} onClick={() => go("admin")}><Ic.ShieldCheck />Admin</button>}
          <button className="navlink" aria-current={base === "account" ? "page" : undefined} onClick={() => go("account")}><Ic.User />Account</button>
        </div>
      </nav>
      <div className="main">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="content">
          <StatusBanner />
          <Page arg={rest.join("/")} key={route} />
        </main>
      </div>
      <nav className="tabbar" aria-label="Main">
        {TABS.map(([k, l, Icon]) => <button key={k} aria-current={base === k ? "page" : undefined} onClick={() => go(k)}><Icon />{l}</button>)}
        <button onClick={() => setOpen(true)} aria-label="All places"><Ic.Menu />More{(state.unseen + state.unread_dms + state.goals_ready + (state.home_ready ? 1 : 0)) > 0 && <span className="count">{state.unseen + state.unread_dms + state.goals_ready + (state.home_ready ? 1 : 0)}</span>}</button>
      </nav>
    </div>
  );
}

function badge(k, me, inv, state) {
  if (k === "street" && state.goals_ready) return <span className="count">{state.goals_ready}</span>;
  if (k === "home" && state.home_ready) return <span className="count">1</span>;
  if (k === "missions" && state.mission_ready) return <span className="count">1</span>;
  if (k === "career" && state.shift_ready) return <span className="count">1</span>;
  if (k === "event" && state.season) return <span className="count quiet">On</span>;
  if (k === "messages" && state.unread_dms) return <span className="count">{state.unread_dms}</span>;
  if (k === "crews" && state.crew?.apps) return <span className="count">{state.crew.apps}</span>;
  if (k === "tokens" && inv.token) return <span className="count quiet">{inv.token}</span>;
  if (k === "cells" && me.status === "jail") return <span className="count">You</span>;
  if (k === "ae" && me.status === "hosp") return <span className="count">You</span>;
  return null;
}

function Topbar({ onMenu }) {
  const { me, state } = useGame();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "");
  const flip = () => {
    const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const t = dark ? "light" : "dark"; setTheme(t); document.documentElement.dataset.theme = t;
    try { localStorage.setItem("bs-theme", t); } catch (e) {}
  };
  return (
    <header className="topbar">
      <div className="topbar-in">
        <button className="who" onClick={() => go("player/" + me.id)}>
          <Avatar seed={me.id} look={me.look} />
          <span><b><Name p={{ ...me, crew_tag: state.crew?.tag }} /></b><span className="sub">{rankOf(me.level)}, level {me.level}</span></span>
        </button>
        <div className="purse"><b>{money(me.cash)}</b><span>{DISTRICT_NAMES[me.district]}</span></div>
        <div className="meters">
          <Meter label="Stamina" value={me.stamina} max={me.max_stamina} color="var(--stamina)" />
          <Meter label="Grit" value={me.grit} max={me.max_grit} color="var(--grit)" />
          <Meter label="Mood" value={me.mood} max={me.max_mood} color="var(--mood)" />
          <Meter label="Health" value={me.health} max={me.max_health} color="var(--health)" />
          <Meter label={me.heat >= 75 ? "Wanted" : "Heat"} value={me.heat} max={100} color="var(--heat)" />
        </div>
        <button className="iconbtn" onClick={() => go("news")} aria-label={`Notifications${state.unseen ? `, ${state.unseen} new` : ""}`}><Ic.Bell />{state.unseen > 0 && <span className="count">{state.unseen}</span>}</button>
        <button className="iconbtn" onClick={flip} aria-label="Switch light or dark">{(theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches) ? <Ic.Sun /> : <Ic.Moon />}</button>
      </div>
    </header>
  );
}

function StatusBanner() {
  const { me, run, inv, refresh, showSheet } = useGame();
  if (me.status === "jail") {
    const left = Math.max(0, (new Date(me.jail_until) - Date.now()) / 1000);
    return <div className="banner jail"><Ic.Lock /><span className="grow"><b>In the cells</b> for <Countdown until={me.jail_until} onDone={refresh} />. {me.jail_reason}</span>
      <button className="btn sm" onClick={() => run("bail", {}, r => showSheet({ verdict: "Free to go", title: "Bail paid", story: `The desk sergeant counts ${money(r.paid)} twice and buzzes you out into the rain.`, pic: <span className="thumb"><Ic.Lock /></span> }))}>Pay bail ({money(Math.ceil(left) * me.level * 2)})</button></div>;
  }
  if (me.status === "hosp") return <div className="banner hosp"><Ic.HeartPulse /><span className="grow"><b>In A&amp;E</b> for <Countdown until={me.hosp_until} onDone={refresh} />. {me.hosp_reason}</span>
    {inv.med > 0 && <button className="btn sm" onClick={() => run("use_item", { p_item: "med" })}>Use a first-aid kit ({inv.med})</button>}</div>;
  if (me.status === "travel") return <div className="banner travel"><Ic.Car /><span className="grow"><b>In a taxi</b> to {DISTRICT_NAMES[me.travel_to]}, arriving in <Countdown until={me.travel_until} onDone={refresh} />.</span></div>;
  return null;
}
