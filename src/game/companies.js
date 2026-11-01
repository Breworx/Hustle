// Legitimate companies players can start, staff and grow.
// Each employee (the owner included) works one shift a day. A shift earns the company money and pays the worker
// the wage the owner set, from the company's funds. Shifts build reputation, which earns stars (1 to 10).
// More stars mean more revenue per shift, more staff and a stronger staff perk.
// Edit, then `npm run gen-sql`.
export const COMPANY_STARS = [0, 15, 40, 80, 140, 220, 330, 470, 650, 900]; // reputation needed for each star
export const companyStaff = stars => 3 + stars * 2;                            // staff limit, not counting the owner
export const COMPANIES = [
  { id: "coffee", n: "Coffee cart", cost: 50000, lvl: 5, base: 300, perk: "regen", max: 0.1, blurb: "Flat whites at the ferry terminal. Staff get free coffee, which turns out to matter." },
  { id: "carwash", n: "Hand car wash", cost: 120000, lvl: 6, base: 500, perk: "travel_time", max: 0.3, blurb: "Ten dollars a wash and no questions about what's in the boot. Staff learn every shortcut in town." },
  { id: "tattoo", n: "Tattoo parlour", cost: 250000, lvl: 8, base: 800, perk: "mug", max: 0.25, blurb: "The ink says you're not to be messed with. Muggers read it and keep walking." },
  { id: "boxing", n: "Boxing gym", cost: 500000, lvl: 10, base: 1200, perk: "gym", max: 0.15, blurb: "Ropes, sweat and a coach who used to fight for money. Staff train for free." },
  { id: "clinic", n: "Private clinic", cost: 1500000, lvl: 14, base: 2200, perk: "hosp", max: 0.3, blurb: "Discreet medicine, cash only. Staff get patched up first and fastest." },
  { id: "lawfirm", n: "Law firm", cost: 2500000, lvl: 16, base: 3500, perk: "jail", max: 0.3, blurb: "Three partners, one very expensive receptionist. Staff never spend long in the cells." },
  { id: "nightclub", n: "Nightclub", cost: 5000000, lvl: 18, base: 6000, perk: "job", max: 5, blurb: "Velvet rope, loud bass, and a back office where the real business gets done." },
  { id: "logistics", n: "Logistics company", cost: 10000000, lvl: 21, base: 10000, perk: "travel_disc", max: 0.6, blurb: "Trucks, vans and a warehouse at the Docks. Staff ride anywhere on the company account." },
  { id: "tech", n: "Tech startup", cost: 25000000, lvl: 25, base: 20000, perk: "listings", max: 15, blurb: "An app, a pitch deck and a lot of investors' money. Staff get a slick storefront on the market." },
  { id: "media", n: "Media empire", cost: 60000000, lvl: 30, base: 40000, perk: "heat", max: 0.5, blurb: "Newspapers, radio and a TV channel. Staff are never in the news for the wrong reasons." },
];
