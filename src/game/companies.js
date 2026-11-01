// Legitimate companies players can start, staff and grow.
// Each employee (the owner included) works one shift a day. A shift earns the company money and pays the worker
// the wage the owner set, from the company's funds. Shifts build reputation, which earns stars (1 to 10).
// More stars mean more revenue per shift, more staff and a stronger staff perk.
// Edit, then `npm run gen-sql`.
export const COMPANY_STARS = [0, 15, 40, 80, 140, 220, 330, 470, 650, 900]; // reputation needed for each star
export const companyStaff = stars => 3 + stars * 2;                            // staff limit, not counting the owner
export const COMPANIES = [
  // ---- Small, cheap and quick to get going
  { id: "foodtruck", n: "Food truck", cost: 30000, lvl: 3, base: 220, perk: "regen", max: 0.08, blurb: "Fish and chips out the hatch at the beach carpark. Staff eat for free and it shows." },
  { id: "laundromat", n: "Laundromat", cost: 40000, lvl: 4, base: 260, perk: "heat", max: 0.2, blurb: "Coin machines that take anything. Some things come out cleaner than they went in." },
  { id: "coffee", n: "Coffee cart", cost: 50000, lvl: 5, base: 300, perk: "regen", max: 0.1, blurb: "Flat whites at the ferry terminal. Staff get free coffee, which turns out to matter." },
  { id: "dairy", n: "Corner dairy", cost: 60000, lvl: 5, base: 330, perk: "job", max: 2, blurb: "Bread, milk, Lotto and every bit of gossip on the street. Staff always know what's going on." },
  { id: "barber", n: "Barber shop", cost: 80000, lvl: 5, base: 380, perk: "mug", max: 0.15, blurb: "A cut, a shave and a quiet word. Nobody mugs a regular at Tony's." },
  { id: "couriers", n: "Bike couriers", cost: 90000, lvl: 6, base: 420, perk: "travel_time", max: 0.2, blurb: "Lycra, attitude and a map of every alley in the city in their heads." },
  { id: "pawnshop", n: "Pawn shop", cost: 100000, lvl: 6, base: 450, perk: "listings", max: 3, blurb: "Buy low, sell high, ask nothing. Staff get extra space on the market." },
  { id: "carwash", n: "Hand car wash", cost: 120000, lvl: 6, base: 500, perk: "travel_time", max: 0.3, blurb: "Ten dollars a wash and no questions about what's in the boot. Staff learn every shortcut in town." },
  { id: "locksmith", n: "Locksmith", cost: 150000, lvl: 7, base: 560, perk: "jail", max: 0.15, blurb: "Locks, keys and safes. Staff have a habit of not staying locked up for long." },
  { id: "pizzeria", n: "Pizza joint", cost: 180000, lvl: 7, base: 620, perk: "regen", max: 0.12, blurb: "Wood-fired, open till three, and the delivery drivers know everyone." },
  { id: "sportsgoods", n: "Sporting goods store", cost: 200000, lvl: 8, base: 680, perk: "arms", max: 0.2, blurb: "Cricket bats, hunting knives and a locked cabinet out back. Staff buy from the armoury at a discount." },
  { id: "removals", n: "Removals company", cost: 220000, lvl: 8, base: 700, perk: "carry", max: 4, blurb: "Two blokes and a truck. Staff lift for a living, so they carry more into a fight." },
  { id: "tattoo", n: "Tattoo parlour", cost: 250000, lvl: 8, base: 800, perk: "mug", max: 0.25, blurb: "The ink says you're not to be messed with. Muggers read it and keep walking." },
  { id: "mechanic", n: "Mechanic's workshop", cost: 300000, lvl: 9, base: 850, perk: "travel_disc", max: 0.3, blurb: "Oil on the floor, the radio on and a car on every hoist. Staff get rides at mates' rates." },
  { id: "pub", n: "Pub", cost: 350000, lvl: 9, base: 950, perk: "heat", max: 0.25, blurb: "Pool table, pokies and a landlord who never saw anything. Staff lie low here." },
  // ---- Proper businesses
  { id: "boxing", n: "Boxing gym", cost: 500000, lvl: 10, base: 1200, perk: "gym", max: 0.15, blurb: "Ropes, sweat and a coach who used to fight for money. Staff train for free." },
  { id: "security", n: "Security firm", cost: 600000, lvl: 11, base: 1400, perk: "mug", max: 0.35, blurb: "Bouncers, guards and a fleet of white utes. Nobody tries it on with your staff." },
  { id: "range", n: "Shooting range", cost: 800000, lvl: 12, base: 1650, perk: "arms", max: 0.3, blurb: "Lanes, targets and a licensed dealer behind the counter. Staff get trade prices at the armoury." },
  { id: "seafood", n: "Seafood restaurant", cost: 900000, lvl: 12, base: 1750, perk: "regen", max: 0.15, blurb: "Crayfish, paua and a view of the harbour. Staff eat like kings after close." },
  { id: "scrapyard", n: "Scrapyard", cost: 1000000, lvl: 13, base: 1900, perk: "listings", max: 6, blurb: "Mountains of metal and a crusher that's very good at keeping secrets." },
  { id: "taxi", n: "Taxi company", cost: 1200000, lvl: 13, base: 2000, perk: "travel_disc", max: 0.5, blurb: "Forty cabs and a dispatcher who knows where everyone is. Staff ride half price." },
  { id: "dojo", n: "Martial arts dojo", cost: 1300000, lvl: 14, base: 2100, perk: "gym", max: 0.2, blurb: "Bare feet, bowed heads and a sensei who once broke a car door with his hand." },
  { id: "clinic", n: "Private clinic", cost: 1500000, lvl: 14, base: 2200, perk: "hosp", max: 0.3, blurb: "Discreet medicine, cash only. Staff get patched up first and fastest." },
  { id: "gallery", n: "Art gallery", cost: 1800000, lvl: 15, base: 2500, perk: "heat", max: 0.35, blurb: "Paintings that sell for a fortune to buyers nobody has ever met." },
  { id: "bailbonds", n: "Bail bonds office", cost: 2000000, lvl: 15, base: 2700, perk: "jail", max: 0.4, blurb: "Open all night across from the courthouse. Staff are out before the paperwork's dry." },
  { id: "lawfirm", n: "Law firm", cost: 2500000, lvl: 16, base: 3500, perk: "jail", max: 0.3, blurb: "Three partners, one very expensive receptionist. Staff never spend long in the cells." },
  { id: "brewery", n: "Craft brewery", cost: 3000000, lvl: 16, base: 3800, perk: "regen", max: 0.18, blurb: "Hazy IPAs with silly names and a tasting room full of beards." },
  { id: "hotel", n: "Boutique hotel", cost: 4000000, lvl: 17, base: 4600, perk: "hosp", max: 0.4, blurb: "Forty rooms, a rooftop bar and a doctor on call who doesn't keep records." },
  { id: "jeweller", n: "Jeweller", cost: 4500000, lvl: 18, base: 5200, perk: "listings", max: 10, blurb: "Diamonds in the window, a vault downstairs, and a very good eye for what things are worth." },
  { id: "nightclub", n: "Nightclub", cost: 5000000, lvl: 18, base: 6000, perk: "job", max: 5, blurb: "Velvet rope, loud bass, and a back office where the real business gets done." },
  { id: "haulage", n: "Freight haulage", cost: 6500000, lvl: 19, base: 7000, perk: "carry", max: 8, blurb: "Road trains up and down the island. Staff haul heavy gear without breaking a sweat." },
  // ---- Empires
  { id: "logistics", n: "Logistics company", cost: 10000000, lvl: 21, base: 10000, perk: "travel_disc", max: 0.6, blurb: "Trucks, vans and a warehouse at the Docks. Staff ride anywhere on the company account." },
  { id: "military", n: "Private military contractor", cost: 15000000, lvl: 23, base: 13000, perk: "arms", max: 0.5, blurb: "Contracts overseas and a warehouse of surplus kit at home. Staff buy from the armoury at half price." },
  { id: "casino", n: "Casino", cost: 20000000, lvl: 24, base: 16000, perk: "job", max: 8, blurb: "The house always wins, and the house is you. Staff get very lucky." },
  { id: "tech", n: "Tech startup", cost: 25000000, lvl: 25, base: 20000, perk: "listings", max: 15, blurb: "An app, a pitch deck and a lot of investors' money. Staff get a slick storefront on the market." },
  { id: "marina", n: "Marina", cost: 30000000, lvl: 26, base: 22000, perk: "travel_time", max: 0.5, blurb: "Two hundred berths and the fastest boats in the harbour. Staff get everywhere quicker." },
  { id: "airline", n: "Charter airline", cost: 45000000, lvl: 28, base: 30000, perk: "travel_disc", max: 1, blurb: "Three jets and a helicopter. At ten stars, staff never pay for a ride again." },
  { id: "media", n: "Media empire", cost: 60000000, lvl: 30, base: 40000, perk: "heat", max: 0.5, blurb: "Newspapers, radio and a TV channel. Staff are never in the news for the wrong reasons." },
  { id: "developer", n: "Property developer", cost: 80000000, lvl: 32, base: 50000, perk: "regen", max: 0.25, blurb: "Cranes on every skyline in the city. Staff live in the show homes." },
  { id: "hospital", n: "Private hospital", cost: 100000000, lvl: 34, base: 60000, perk: "hosp", max: 0.6, blurb: "Surgeons on call and a wing nobody else can get into. Staff are up and about in no time." },
  { id: "bank", n: "Private bank", cost: 150000000, lvl: 37, base: 80000, perk: "listings", max: 25, blurb: "Numbered accounts, marble floors and no questions. Staff trade on a whole other level." },
  { id: "shipping", n: "Shipping line", cost: 250000000, lvl: 40, base: 120000, perk: "carry", max: 12, blurb: "Container ships in every port in the Pacific. Staff carry whatever they like." },
];
