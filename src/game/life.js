// Careers, vehicles and medals. Edit here, then `npm run gen-sql` and paste supabase/02_content.sql into Supabase again.
// Perk keys are shared with homes (see homes.js), plus:
//   jail (shorter stays in the cells), travel_time (shorter taxi rides).

// ---------- Careers: a legitimate day job. Clock in once a day for a wage; enough shifts and the right level get you promoted.
// Each career has one perk that grows with your rank (rank 10 gets the full amount).
export const CAREER_STEPS = [ // shifts needed and level needed for each rank
  [0, 1], [3, 2], [7, 4], [12, 6], [18, 8], [25, 11], [33, 14], [42, 18], [52, 22], [64, 26]];
export const CAREERS = [
  { id: "kitchen", n: "Hospitality", perk: "regen", max: 0.12, wage: 60, blurb: "Long shifts, free meals, and you hear everything that's said across the bar.",
    ranks: ["Dishwasher", "Kitchen hand", "Barista", "Line cook", "Bartender", "Sous chef", "Head chef", "Restaurant manager", "Restaurateur", "Celebrity chef"] },
  { id: "security", n: "Security", perk: "mug", max: 0.3, wage: 70, blurb: "You learn where the cameras point, and how to stand so nobody tries anything.",
    ranks: ["Night watch", "Door staff", "Bouncer", "Mobile patrol", "Close protection", "Team leader", "Security manager", "Head of security", "Security consultant", "Private army"] },
  { id: "docks", n: "The Docks", perk: "gym", max: 0.15, wage: 75, blurb: "Heavy lifting builds heavy shoulders. And containers sometimes fall open.",
    ranks: ["Labourer", "Lasher", "Forklift driver", "Stevedore", "Straddle driver", "Crane operator", "Foreman", "Yard manager", "Port captain", "Harbourmaster"] },
  { id: "medicine", n: "Medicine", perk: "hosp", max: 0.35, wage: 80, blurb: "Patch up the city by day. Know exactly how to patch yourself up by night.",
    ranks: ["Hospital orderly", "Healthcare assistant", "Paramedic", "Nurse", "Charge nurse", "Junior doctor", "Registrar", "Consultant", "Head of A&E", "Chief of surgery"] },
  { id: "law", n: "Law", perk: "jail", max: 0.35, wage: 85, blurb: "Learn the rules so well you know exactly how long to bend them.",
    ranks: ["Legal clerk", "Paralegal", "Law student", "Junior lawyer", "Defence lawyer", "Senior associate", "Partner", "Senior partner", "Queen's Counsel", "Judge"] },
  { id: "finance", n: "Finance", perk: "job", max: 6, wage: 90, blurb: "Spreadsheets, suits and a very good sense of who has money and where they keep it.",
    ranks: ["Bank teller", "Loan officer", "Analyst", "Trader", "Senior trader", "Fund manager", "Investment banker", "Partner", "Managing director", "Hedge fund boss"] },
];
// Daily wage for a rank in a career: the base doubles roughly every two ranks.
export const careerWage = (c, rank) => Math.round(c.wage * Math.pow(1.45, rank - 1) / 10) * 10;

// ---------- Vehicles: a second ladder. Faster, cheaper travel and better getaways.
export const VEHICLES = [
  { id: "foot", n: "On foot", price: 0, lvl: 1, blurb: "Your own two feet and a bus pass that expired in March.", perks: {} },
  { id: "bike", n: "A stolen bike", price: 150, lvl: 1, blurb: "Someone's going to miss this. Not your problem.", perks: { travel_time: 0.05 } },
  { id: "scooter", n: "An e-scooter", price: 900, lvl: 2, blurb: "Silent, quick, and abandoned on every corner. This one's charged.", perks: { travel_time: 0.1 } },
  { id: "moped", n: "A 50cc moped", price: 3500, lvl: 3, blurb: "It sounds like a hairdryer and goes about as fast. Still beats walking.", perks: { travel_time: 0.15, travel_disc: 0.1 } },
  { id: "hatch", n: "A 1998 hatchback", price: 9000, lvl: 4, blurb: "Rust, a tape deck and a boot big enough for most of a shop's stock.", perks: { travel_time: 0.2, travel_disc: 0.25, job: 1 } },
  { id: "ute", n: "A farm ute", price: 22000, lvl: 5, blurb: "Dog box on the back, mud on everything, and nobody looks twice at it.", perks: { travel_time: 0.25, travel_disc: 0.3, job: 1, heat: 0.03 } },
  { id: "roadbike", n: "A road motorbike", price: 55000, lvl: 7, blurb: "Through the traffic and gone before the sirens get started.", perks: { travel_time: 0.35, travel_disc: 0.35, job: 2, heat: 0.05 } },
  { id: "muscle", n: "A muscle car", price: 120000, lvl: 9, blurb: "Big engine, bigger noise. It makes an exit an event.", perks: { travel_time: 0.4, travel_disc: 0.4, job: 3, heat: 0.05 } },
  { id: "suv", n: "A blacked-out SUV", price: 300000, lvl: 11, blurb: "Tinted windows, run-flat tyres and room for a whole crew.", perks: { travel_time: 0.45, travel_disc: 0.5, job: 3, mug: 0.1, heat: 0.1 } },
  { id: "sports", n: "An Italian sports car", price: 750000, lvl: 13, blurb: "Red, low and loud. Every getaway driver's dream.", perks: { travel_time: 0.5, travel_disc: 0.6, job: 4, heat: 0.1 } },
  { id: "limo", n: "An armoured limousine", price: 1800000, lvl: 15, blurb: "Bulletproof glass, a driver called Bruce and a minibar.", perks: { travel_time: 0.5, travel_disc: 0.7, job: 4, mug: 0.2, hosp: 0.05, heat: 0.1 } },
  { id: "hyper", n: "A hypercar", price: 4500000, lvl: 18, blurb: "Zero to a hundred before the alarm finishes its first beep.", perks: { travel_time: 0.6, travel_disc: 0.8, job: 5, heat: 0.15 } },
  { id: "heli", n: "A helicopter", price: 12000000, lvl: 21, blurb: "Traffic is other people's problem now.", perks: { travel_time: 0.7, travel_free: true, job: 6, heat: 0.2 } },
  { id: "seaplane", n: "A seaplane", price: 30000000, lvl: 24, blurb: "Lands on the harbour, takes off from anywhere, and the coastguard can't keep up.", perks: { travel_time: 0.75, travel_free: true, job: 6, heat: 0.25, mug: 0.2 } },
  { id: "jet", n: "A private jet", price: 75000000, lvl: 28, blurb: "Wheels up whenever you say. Customs is a formality.", perks: { travel_time: 0.8, travel_free: true, job: 7, heat: 0.3, mug: 0.25 } },
  { id: "sub", n: "A private submarine", price: 160000000, lvl: 33, blurb: "Nobody follows you underwater. Nobody even knows you've left.", perks: { travel_time: 0.85, travel_free: true, job: 8, heat: 0.4, mug: 0.3 } },
];

// ---------- Medals: earned automatically as your numbers grow. Any medal you hold can be worn as your title.
// Each entry: the stat it watches, the thresholds, and a name for each threshold.
export const MEDAL_SETS = [
  { stat: "level", what: n => `Reach level ${n}`, at: [2, 5, 10, 15, 20, 25, 30, 35, 40],
    names: ["Off the street", "Known face", "Somebody", "Made", "Big shot", "Heavyweight", "Legend", "Myth", "The Last Word"] },
  { stat: "jobs", what: n => `Do ${n.toLocaleString("en-NZ")} job${n > 1 ? "s" : ""}`, at: [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    names: ["First timer", "Petty thief", "Regular", "Hustler", "Grafter", "Professional", "Career criminal", "Old hand", "Mastermind", "Untouchable"] },
  { stat: "wins", what: n => `Win ${n.toLocaleString("en-NZ")} fight${n > 1 ? "s" : ""}`, at: [1, 10, 25, 50, 100, 250, 500, 1000],
    names: ["Lucky punch", "Scrapper", "Brawler", "Bruiser", "Street fighter", "Enforcer", "Champion", "Undisputed"] },
  { stat: "busts", what: n => `Spring ${n} ${n > 1 ? "people" : "person"} from the cells`, at: [1, 5, 25, 50, 100, 250, 500],
    names: ["Good mate", "Locksmith", "Escape artist", "Jailbreaker", "Houdini", "The Key", "Patron saint of the cells"] },
  { stat: "collection", what: n => `Own ${n.toLocaleString("en-NZ")} different items`, at: [10, 25, 50, 100, 200, 300, 400, 500, 750, 1000],
    names: ["Magpie", "Hoarder", "Collector", "Curator", "Archivist", "Connoisseur", "Museum piece", "Treasure keeper", "Grand collector", "Owns one of everything"] },
  { stat: "legendary", what: n => `Own ${n} legendary item${n > 1 ? "s" : ""}`, at: [1, 3, 5, 10], names: ["Touched gold", "Golden hands", "Midas", "Living legend"] },
  { stat: "oneofone", what: () => "Own an item that only has one copy", at: [1], names: ["One of One"] },
  { stat: "home", what: n => `Live in home ${n} on the ladder`, at: [3, 6, 10, 14, 18, 22, 26, 28, 30, 31],
    names: ["Roof over my head", "Wheels for walls", "Four walls", "Homeowner", "Harbour views", "Penthouse life", "Lord of the manor", "Skyline royalty", "Bridge troll", "Moonwalker"] },
  { stat: "vehicle", what: n => `Own vehicle ${n} in the garage`, at: [2, 5, 8, 11, 13, 16], names: ["Two wheels", "Four wheels", "Muscle", "Getaway driver", "Airborne", "Silent running"] },
  { stat: "networth", what: n => `Be worth ${n >= 1e9 ? "$" + n / 1e9 + " billion" : n >= 1e6 ? "$" + n / 1e6 + " million" : "$" + n.toLocaleString("en-NZ")}`, at: [10000, 100000, 1e6, 1e7, 1e8, 1e9],
    names: ["Pocket money", "Comfortable", "Millionaire", "Multi-millionaire", "Tycoon", "Billionaire"] },
  { stat: "streak", what: n => `Keep a ${n}-day daily streak`, at: [3, 7, 14, 30, 60, 100, 365], names: ["Habit", "Weekly regular", "Fortnighter", "Monthly", "Committed", "Centurion", "Every single day"] },
  { stat: "sales", what: n => `Sell ${n} time${n > 1 ? "s" : ""} on the market`, at: [1, 10, 50, 100, 500], names: ["Open for business", "Trader", "Merchant", "Market stall king", "Tycoon of the stalls"] },
  { stat: "blocks", what: n => `Hold a full block of ${n} compan${n > 1 ? "ies'" : "y's"} shares`, at: [1, 3, 6, 10, 18], names: ["Shareholder", "Investor", "Portfolio", "Board member", "Owns the exchange"] },
  { stat: "thief", what: n => `Thieving skill level ${n}`, at: [10, 25, 50], names: ["Light fingers", "Ghost hands", "Grand master thief"] },
  { stat: "fight", what: n => `Fighting skill level ${n}`, at: [10, 25, 50], names: ["Quick hands", "Iron fists", "Grand master fighter"] },
  { stat: "fit", what: n => `Fitness skill level ${n}`, at: [10, 25, 50], names: ["Gym rat", "Machine", "Peak human"] },
  { stat: "trade", what: n => `Trading skill level ${n}`, at: [10, 25, 50], names: ["Haggler", "Dealmaker", "Wolf of Backstreet"] },
  { stat: "missions", what: n => `Finish ${n} story mission${n > 1 ? "s" : ""}`, at: [1, 10, 20, 30, 40], names: ["Errand runner", "Fixer", "Problem solver", "The one they call", "Every story told"] },
  { stat: "career", what: n => `Reach rank ${n} in a career`, at: [3, 6, 10], names: ["Steady job", "Climbing the ladder", "Top of the profession"] },
  { stat: "turf", what: n => `Be in a crew that holds ${n} district${n > 1 ? "s" : ""}`, at: [1, 3, 6], names: ["On our turf", "Running the city", "Whole city's ours"] },
  { stat: "days", what: n => `Play for ${n} days`, at: [7, 30, 90, 180, 365], names: ["New in town", "Local", "Fixture", "Old timer", "Part of the furniture"] },
  { stat: "founder", what: () => "Be one of the first 100 players", at: [1], names: ["Founder"] },
  { stat: "events", what: n => `Earn ${n.toLocaleString("en-NZ")} points in seasonal events`, at: [100, 1000, 5000], names: ["Party goer", "Festival regular", "Life of every party"] },
  { stat: "company", what: n => `Own a ${n}-star company`, at: [1, 5, 10], names: ["Entrepreneur", "Business owner", "Captain of industry"] },
  { stat: "company_sold", what: n => `Sell ${n} compan${n > 1 ? "ies" : "y"}`, at: [1, 5], names: ["Cashed out", "Serial entrepreneur"] },
  { stat: "warhits", what: n => `Land ${n} hits in crew wars`, at: [10, 100, 500], names: ["Frontline", "Shock trooper", "One-person army"] },
  { stat: "warwins", what: n => `Be on the winning side of ${n} crew war${n > 1 ? "s" : ""}`, at: [1, 5, 20, 50], names: ["Blooded", "War veteran", "Warlord", "Conqueror"] },
  { stat: "power", what: n => `Reach ${n.toLocaleString("en-NZ")} fight power`, at: [100, 500, 1000, 5000, 10000, 50000], names: ["Toughened", "Hard case", "Wall", "Tank", "Titan", "Force of nature"] },
];
export const MEDALS = MEDAL_SETS.flatMap(s => s.at.map((n, i) => ({ id: `${s.stat}_${n}`, stat: s.stat, at: n, name: s.names[i], what: s.what(n), tier: i + 1, tiers: s.at.length })));
