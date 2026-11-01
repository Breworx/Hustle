// Travelling the country: cities, how you get there, travel gear, and what each city sells.
// Your home city is the harbour city the game is set in. Every other city has its own shop of local goods,
// some only found there. Buy cheap, carry it home, sell it on the market or keep it.
// Edit, then `npm run gen-sql`.

// Real minutes per hour of travel in the game world. A 640 km bus ride (9 hours) takes about 46 minutes.
export const MINUTES_PER_HOUR = 5;
// The city everyone plays in. On your travel map it sits inside your own country.
export const HOME_NAME = "Greyhaven";
// Chance customs find contraband when you cross a border, by how you travel.
export const CUSTOMS = { intl: 25, cargo: 20, charter: 10, jet: 5, seaplane: 8, sub: 2 };
export const FERRY = { hours: 3.5, foot: 75, vehicle: 250 }; // crossing Cook Strait by road

// lat/lon place each city on the map and set the distances. Road trips are 1.3× the straight line.
export const CITIES = [
  { id: "home", n: HOME_NAME, island: "N", lat: -39.93, lon: 175.05, air: true, rail: true, lvl: 1, blurb: "Home. Rain, ferries, and everyone you owe money to." },
  { id: "akl", n: "Auckland", island: "N", lat: -36.85, lon: 174.76, air: true, rail: true, lvl: 5, blurb: "Volcanoes, motorways and harbour views you can't afford." },
  { id: "ham", n: "Hamilton", island: "N", lat: -37.79, lon: 175.28, air: true, rail: true, lvl: 3, blurb: "Farm money, student flats and a river that goes all the way through." },
  { id: "tga", n: "Tauranga", island: "N", lat: -37.69, lon: 176.17, air: true, rail: false, lvl: 4, blurb: "Surf, kiwifruit and the biggest port in the country." },
  { id: "rot", n: "Rotorua", island: "N", lat: -38.14, lon: 176.25, air: true, rail: false, lvl: 6, blurb: "Steaming ground, hot pools and the smell of eggs everywhere." },
  { id: "tpo", n: "Taupō", island: "N", lat: -38.69, lon: 176.07, air: true, rail: false, lvl: 7, blurb: "A lake the size of a small country, sitting on top of a supervolcano." },
  { id: "npl", n: "New Plymouth", island: "N", lat: -39.06, lon: 174.08, air: true, rail: false, lvl: 6, blurb: "A perfect cone of a mountain, oil rigs offshore, surf on every beach." },
  { id: "npr", n: "Napier", island: "N", lat: -39.49, lon: 176.91, air: true, rail: false, lvl: 8, blurb: "Rebuilt in art deco after the 1931 quake, and still dressing for it." },
  { id: "boi", n: "Bay of Islands", island: "N", lat: -35.28, lon: 174.09, air: true, rail: false, lvl: 9, blurb: "Big-game fishing, dolphins and old shipwrecks in clear water." },
  { id: "wlg", n: "Wellington", island: "N", lat: -41.29, lon: 174.78, air: true, rail: true, lvl: 10, blurb: "The capital. Wind, coffee, politicians and secrets." },
  { id: "nsn", n: "Nelson", island: "S", lat: -41.27, lon: 173.28, air: true, rail: false, lvl: 12, blurb: "Sunshine, potters, hop gardens and the start of every tramp." },
  { id: "kai", n: "Kaikōura", island: "S", lat: -42.40, lon: 173.68, air: false, rail: true, lvl: 14, blurb: "Snowy mountains dropping straight into a sea full of whales and crayfish." },
  { id: "chc", n: "Christchurch", island: "S", lat: -43.53, lon: 172.64, air: true, rail: true, lvl: 15, blurb: "Rebuilt from the rubble, and the gateway to Antarctica." },
  { id: "hok", n: "Hokitika", island: "S", lat: -42.72, lon: 170.97, air: true, rail: false, lvl: 16, blurb: "Gold-rush town on the wild West Coast, and the home of pounamu." },
  { id: "dud", n: "Dunedin", island: "S", lat: -45.87, lon: 170.50, air: true, rail: false, lvl: 18, blurb: "Students, bagpipes, steep streets and a castle on the hill." },
  { id: "zqn", n: "Queenstown", island: "S", lat: -45.03, lon: 168.66, air: true, rail: false, lvl: 20, blurb: "Ski fields, bungy jumps and holiday homes worth more than whole towns." },
  { id: "ivc", n: "Invercargill", island: "S", lat: -46.41, lon: 168.35, air: true, rail: false, lvl: 22, blurb: "The bottom of the country. Oysters, deer stalkers and old motorbikes." },
];

// How you can get there. kph is average speed including stops; wait is fixed hours (check-in, waiting at the roadside).
// fare: base + per km. cap: how many items you can carry back. needs: rail (both ends), air (both ends) or nothing.
export const MODES = [
  { id: "walk", n: "Walk", kph: 5, wait: 0, base: 0, km: 0, cap: 4, lvl: 1, ferry: "foot", blurb: "Free, slow and good for the soul. Bring snacks." },
  { id: "bikehire", n: "Hire a bike", kph: 16, wait: 0.25, base: 15, km: 0.02, cap: 6, lvl: 1, ferry: "foot", blurb: "A rental bike with a basket. About 16 km an hour on the flat, less on the hills." },
  { id: "hitch", n: "Hitchhike", kph: 55, wait: 1, base: 0, km: 0, cap: 6, lvl: 1, ferry: "foot", blurb: "Thumb out on the state highway. Could be quick, could take all day." },
  { id: "stow", n: "Stow away on a truck", kph: 70, wait: 0.5, base: 0, km: 0, cap: 15, lvl: 3, ferry: "free", blurb: "Hide in the back of a freight truck. Free, roomy, and one in five drivers checks the load." },
  { id: "bus", n: "Coach", kph: 70, wait: 0.5, base: 10, km: 0.12, cap: 10, lvl: 1, ferry: "foot", blurb: "Long-distance coach. Cheap, reliable and smells faintly of chips." },
  { id: "train", n: "Scenic train", kph: 60, wait: 0.5, base: 25, km: 0.2, cap: 12, lvl: 2, needs: "rail", ferry: "foot", blurb: "Big windows, a café car and the best views in the country. Only runs on a few lines." },
  { id: "rental", n: "Rental car", kph: 90, wait: 0.25, base: 90, km: 0.25, cap: 20, lvl: 4, ferry: "vehicle", road: true, blurb: "A white hatchback with a stranger's sunglasses in the glovebox." },
  { id: "campervan", n: "Campervan hire", kph: 75, wait: 0.25, base: 250, km: 0.35, cap: 40, lvl: 8, ferry: "vehicle", road: true, blurb: "Slow on the hills, but there's room for a lot of shopping." },
  { id: "flight", n: "Domestic flight", kph: 550, wait: 1, base: 80, km: 0.35, cap: 8, lvl: 3, needs: "air", air: true, blurb: "Turboprop or jet, with one checked bag. Only between cities with airports." },
  { id: "charter", n: "Charter plane", kph: 350, wait: 0.25, base: 1500, km: 6, cap: 20, lvl: 15, air: true, scope: "both", range: 4000, blurb: "Your own small plane and a pilot who lands anywhere with a flat paddock." },
  // Abroad: only these cross a border.
  { id: "intl", n: "International flight", kph: 800, wait: 2.5, base: 250, km: 0.09, cap: 12, lvl: 8, needs: "air", air: true, scope: "intl", blurb: "Economy, a middle seat and a meal you won't remember. Customs search one bag in four." },
  { id: "cargo", n: "Stow away on a cargo ship", kph: 30, wait: 3, base: 0, km: 0, cap: 40, lvl: 10, sea: true, scope: "intl", blurb: "Free, slow and smelly, with room for a lot. One in five gets found by the crew." },
  { id: "own", n: "Your own ride", own: true, blurb: "Whatever's in your garage." },
];

// Each vehicle in the garage, on a long trip: speed, how much it carries, fuel per km, and how it travels.
export const VEHICLE_TRAVEL = {
  bike: { kph: 18, cap: 6, fuel: 0 }, scooter: { kph: 22, cap: 4, fuel: 0.02 }, moped: { kph: 45, cap: 8, fuel: 0.04 },
  hatch: { kph: 85, cap: 25, fuel: 0.12 }, ute: { kph: 85, cap: 40, fuel: 0.15 }, roadbike: { kph: 105, cap: 8, fuel: 0.1 },
  muscle: { kph: 100, cap: 20, fuel: 0.25 }, suv: { kph: 95, cap: 35, fuel: 0.22 }, sports: { kph: 115, cap: 10, fuel: 0.3 },
  limo: { kph: 90, cap: 25, fuel: 0.35 }, hyper: { kph: 125, cap: 6, fuel: 0.5 },
  heli: { kph: 220, cap: 12, fuel: 3, air: true }, seaplane: { kph: 300, cap: 20, fuel: 4, air: true, scope: "both", range: 2500 },
  jet: { kph: 750, cap: 50, fuel: 8, air: true, scope: "both" }, sub: { kph: 40, cap: 120, fuel: 2, sea: true, scope: "both" },
};

// Travel gear: bought once, kept for good.
export const GEAR = [
  { id: "sign", n: "Cardboard sign", price: 5, lvl: 1, sh: "postcard", c: "#c9a46a", blurb: "Hitchhiking is 25% quicker. Drivers like to know where you're going." },
  { id: "boots", n: "Tramping boots", price: 250, lvl: 1, sh: "boots", c: "#6b4128", blurb: "Walking is 40% quicker." },
  { id: "pack", n: "Tramping pack", price: 400, lvl: 1, sh: "board", c: "#e2574c", blurb: "Carry 6 more items when you walk, hitchhike or take the coach." },
  { id: "roofbox", n: "Roof box", price: 1500, lvl: 4, sh: "box", c: "#273042", blurb: "Carry 10 more items in your own car, a rental or a campervan." },
  { id: "manifest", n: "Dodgy freight manifest", price: 2000, lvl: 3, sh: "newspaper", c: "#e8e2d0", blurb: "Stowing away on trucks only gets you caught one time in twenty." },
  { id: "buspass", n: "Coach pass", price: 3000, lvl: 2, sh: "ticket", c: "#5cc8a0", blurb: "Coach trips are free. You still pay for the ferry." },
  { id: "railpass", n: "Scenic rail pass", price: 8000, lvl: 4, sh: "ticket", c: "#6db7e8", blurb: "Train trips are free, and the café car gives you a free pie." },
  { id: "airpoints", n: "Frequent flyer gold card", price: 25000, lvl: 10, sh: "card", c: "#f2c14e", blurb: "Flights 30% off, check-in halved and 6 more items in your bags." },
];

// What each city sells. price is the local shop price; v is what it's worth back home.
// Stock is shared by every player and comes back slowly: rarer things come back much slower.
const S = (city, id, n, cat, r, v, price, sh, c, d, extra = {}) => ({ id: `c_${city}_${id}`, city, n, cat, r, v, price, sh, c, c2: "", d, ...extra });
const food = (u) => ({ u });
const melee = (dmg, acc, weight, lvl) => ({ arms: { slot: "melee", dmg, acc, weight, lvl } });
const armour = (slot, def, weight, lvl = 1) => ({ arms: { slot, def, weight, lvl } });
export const CITY_ITEMS = [
  // Auckland
  S("akl", "pie", "Mince and cheese pie", "food", 0, 18, 6, "pie", "#d9a62a", "From a 24-hour bakery on K Road. Better at 3am.", food({ energy: 8, life: 5 })),
  S("akl", "globe", "Harbour bridge snow globe", "collect", 1, 400, 160, "globe", "#6db7e8", "It has never snowed on the harbour bridge. The globe doesn't care."),
  S("akl", "phone", "Grey-import phone", "elec", 1, 1200, 480, "tablet", "#273042", "The menus are in Japanese. It works fine once you guess the buttons."),
  S("akl", "sunnies", "Designer sunnies (probably real)", "jewel", 1, 900, 350, "sunnies", "#111", "Bought from a man on Queen Street who said they were real twice."),
  S("akl", "vinyl", "Ponsonby record-shop find", "record", 2, 2500, 1000, "vinyl", "#c2412b", "A first pressing someone's nan gave away. The owner doesn't know what he's got."),
  S("akl", "bat", "Carbon cricket bat", "weapon", 1, 2000, 900, "cricketbat", "#2a2f3a", "Light, stiff and very expensive. Hits like a truck.", melee(20, 80, 1.1, 5)),
  S("akl", "watch", "Yacht-club watch", "jewel", 3, 40000, 17000, "gwatch", "#c9d3d6", "Engraved for a regatta win. The winner sold it to pay for the yacht."),
  // Hamilton
  S("ham", "milk", "Farm-fresh milk", "food", 0, 8, 3, "bottle", "#f4f1ea", "Straight from the shed this morning. Full cream, obviously.", food({ energy: 6, life: 4 })),
  S("ham", "eel", "Smoked eel", "food", 0, 30, 12, "fish", "#6b4128", "Caught in the Waikato and smoked over mānuka.", food({ energy: 10, life: 6 })),
  S("ham", "tractor", "Die-cast tractor", "figure", 1, 300, 120, "figure", "#2f8a3a", "Every farm kid had one. Every farm kid lost it in the paddock."),
  S("ham", "ball", "Signed rugby ball", "collect", 2, 3000, 1200, "rugby", "#c9a46a", "Signed by a whole Super Rugby squad. Half the signatures are the physio."),
  S("ham", "pliers", "Fencing pliers", "weapon", 0, 150, 60, "wrench", "#c2412b", "Cuts wire, pulls staples, and makes a point.", melee(12, 82, 0.6, 1)),
  S("ham", "gumboots", "Gumboots", "armour", 0, 120, 45, "boots", "#2f6a3a", "The national footwear. Wear them to a wedding.", armour("feet", 10, 1.2)),
  S("ham", "bushshirt", "Wool bush shirt", "armour", 0, 400, 160, "jacket", "#8a2a1c", "Red and black check, thick enough to stop a gorse bush.", armour("body", 10, 1.0)),
  // Tauranga
  S("tga", "kiwifruit", "Tray of kiwifruit", "food", 0, 20, 8, "apple", "#7aa83a", "Gold ones, from a packhouse on the way into town.", food({ energy: 12, life: 6 })),
  S("tga", "honey", "Jar of mānuka honey", "food", 1, 220, 80, "jar", "#e8a62a", "High grade, and priced like it. Cures everything, according to the label.", food({ life: 15, happy: 10 })),
  S("tga", "paua", "Pāua shell", "collect", 1, 250, 90, "shell", "#4fb0a0", "Blue, green and purple, depending on how you hold it."),
  S("tga", "board", "Second-hand surfboard", "collect", 1, 800, 300, "board", "#f0f0e8", "A few dings, a lot of wax and one very good summer."),
  S("tga", "crane", "Container crane model", "figure", 2, 2600, 1000, "figure", "#e8b21f", "A desk model from the port's head office. Somebody wanted it gone."),
  S("tga", "wetsuit", "Thick wetsuit", "armour", 0, 300, 110, "jacket", "#111", "Five millimetres of neoprene. Good against cold water and knives.", armour("body", 8, 1.5)),
  S("tga", "pearl", "Black pearl", "jewel", 3, 30000, 13000, "egg", "#2a2a3a", "Flown in from the Pacific Islands and sold out of a shop with no sign."),
  // Rotorua
  S("rot", "hangi", "Hāngī meal pack", "food", 0, 35, 14, "fishchips", "#a06a33", "Cooked in the ground for hours. Pork, chicken, kūmara and stuffing.", food({ energy: 15, life: 10, happy: 15 })),
  S("rot", "mud", "Geothermal mud mask", "use", 0, 60, 25, "jar", "#748a88", "Smells terrible. Works wonders.", food({ happy: 40 })),
  S("rot", "pools", "Hot pools pass", "use", 1, 300, 120, "ticket", "#4fb0a0", "A soak in a private pool. You come out a new person.", food({ happy: 120, life: 20 })),
  S("rot", "sulphur", "Sulphur crystal", "fossil", 1, 500, 200, "amber", "#e8d82a", "Grown on the edge of a steaming vent. Don't lick it."),
  S("rot", "bowl", "Redwood burl bowl", "collect", 2, 3500, 1400, "cup", "#8a3a1c", "Turned from a fallen redwood in the forest. The grain looks like flames."),
  S("rot", "luge", "Luge helmet", "armour", 0, 600, 240, "helmet", "#e2574c", "Borrowed from the luge track. Permanently.", armour("head", 14, 0.8, 4)),
  S("rot", "opal", "Fire opal", "jewel", 3, 45000, 19000, "bigdiamond", "#ff7a3d", "Sold by a man in a hot pool who said he found it there. He didn't."),
  // Taupō
  S("tpo", "trout", "Smoked trout", "food", 0, 28, 11, "fish", "#c9a46a", "You can't buy trout in this country. You can, apparently, buy this.", food({ energy: 14, life: 8 })),
  S("tpo", "pumice", "Lake pumice", "junk", 0, 20, 6, "ball", "#d6d0c4", "It floats. That's it. That's the whole thing."),
  S("tpo", "fly", "Hand-tied trout fly", "collect", 1, 350, 130, "feather", "#e8664f", "Tied by a retired surgeon who has never caught a fish on one."),
  S("tpo", "skydive", "Skydive certificate", "collect", 1, 700, 280, "postcard", "#6db7e8", "Proof you jumped out of a plane over the lake. The photo is mostly your face."),
  S("tpo", "gaff", "Fishing gaff", "weapon", 0, 1400, 560, "tyreiron", "#9aa4ad", "A steel hook on a pole. Meant for fish.", melee(19, 78, 0.9, 6)),
  S("tpo", "waders", "Fishing waders", "armour", 0, 500, 190, "trousers", "#3a4a2a", "Chest-high rubber. Keeps the river out, and a few other things.", armour("legs", 10, 1.4)),
  S("tpo", "obsidian", "Obsidian blade", "weapon", 2, 6000, 2500, "knife", "#1a1a22", "Volcanic glass, knapped to an edge sharper than steel.", melee(26, 80, 0.4, 7)),
  // New Plymouth
  S("npl", "cheese", "Taranaki cheddar", "food", 0, 15, 6, "bar", "#e8c45a", "Aged a year in a cave somewhere near the mountain.", food({ energy: 8, happy: 10 })),
  S("npl", "wax", "Surf wax", "junk", 0, 10, 4, "bar", "#f0e8d0", "Coconut scented. Smells like summer in a car park."),
  S("npl", "photo", "Summit photo", "collect", 1, 300, 120, "postcard", "#bfe3ff", "The mountain, from the top. Taken on a clear day, which is rare."),
  S("npl", "wand", "Wind sculpture miniature", "collect", 2, 2800, 1100, "cone", "#e8e2ff", "A tiny copy of the giant red pole on the foreshore that bends in the wind."),
  S("npl", "spanner", "Rig spanner", "weapon", 0, 500, 200, "wrench", "#c2412b", "Forty centimetres of chrome vanadium.", melee(17, 78, 1.6, 3)),
  S("npl", "hardhat", "Oil-rig hard hat", "armour", 1, 900, 360, "helmet", "#f2c14e", "Rated for things falling from a great height.", armour("head", 18, 0.5, 5)),
  S("npl", "coveralls", "Rig coveralls", "armour", 0, 700, 280, "hivis", "#e8664f", "Fire-resistant and orange. Nobody will lose you in a crowd.", armour("body", 12, 1.2, 4)),
  // Napier
  S("npr", "apples", "Box of apples", "food", 0, 15, 6, "apple", "#c2412b", "Crisp, red and picked this week in the orchards out the back of town.", food({ energy: 10, life: 5 })),
  S("npr", "syrah", "Hawke's Bay syrah", "food", 0, 70, 28, "bottle", "#5a1c3a", "Peppery, dark and much better than the price.", food({ happy: 50 })),
  S("npr", "feather", "Gannet feather", "collect", 0, 40, 15, "feather", "#f4f1ea", "From the colony at Cape Kidnappers. Picked up, not plucked."),
  S("npr", "cane", "Art deco walking cane", "weapon", 1, 1600, 650, "golf", "#2a2a3a", "Silver-topped and heavy. Very 1931.", melee(16, 84, 0.7, 6)),
  S("npr", "fedora", "1930s fedora", "armour", 1, 900, 350, "cap", "#5a4a3a", "Felt, a silk band and a brim you can hide behind.", armour("head", 3, 0.2)),
  S("npr", "poster", "Art deco travel poster", "collect", 2, 4000, 1600, "postcard", "#f0b84a", "An original from the rebuild, with sunbursts and a very confident font."),
  S("npr", "brooch", "Deco brooch", "jewel", 3, 35000, 15000, "jbrooch", "#c9d3d6", "Platinum and onyx, from an estate sale on Marine Parade."),
  // Bay of Islands
  S("boi", "kina", "Fresh kina", "food", 0, 30, 12, "shell", "#6a2a6a", "Sea urchin, cracked open on the wharf. An acquired taste.", food({ energy: 10, life: 10 })),
  S("boi", "rum", "Bottle of rum", "food", 0, 40, 16, "bottle", "#8a4a1c", "From a distillery with a pirate on the label.", food({ happy: 40, nerve: 1 })),
  S("boi", "dolphins", "Dolphin-watch ticket", "use", 0, 150, 60, "ticket", "#6db7e8", "Out among the islands. They always turn up.", food({ happy: 80 })),
  S("boi", "reel", "Big-game fishing reel", "collect", 1, 1200, 480, "wheel", "#c9d3d6", "Gold anodised and built to fight a marlin for six hours."),
  S("boi", "bill", "Marlin bill", "collect", 2, 5000, 2000, "tooth", "#3a4a5a", "A trophy from a record catch. The record was set in 1987."),
  S("boi", "gum", "Ancient kauri gum", "fossil", 2, 6000, 2400, "amber", "#e8a62a", "Thousands of years old, dug from a swamp up north. Some have insects inside."),
  S("boi", "coin", "Shipwreck coin", "coin", 3, 50000, 21000, "coin", "#f2c14e", "Silver, crusted with coral, and nobody's saying which wreck."),
  // Wellington
  S("wlg", "flatwhite", "Flat white to go", "food", 0, 8, 4, "cup", "#c9a46a", "The best coffee in the country, and the barista will tell you so.", food({ energy: 12 })),
  S("wlg", "ipa", "Hazy IPA four-pack", "food", 0, 25, 10, "can", "#e8c45a", "From a brewery in a shipping container in Te Aro.", food({ happy: 45, nerve: 1 })),
  S("wlg", "token", "Cable car token", "coin", 1, 400, 160, "coin", "#c2412b", "From before they went electronic. Collectors want them."),
  S("wlg", "brolly", "Wind-proof umbrella", "weapon", 0, 200, 80, "umbrella", "#111", "Rated for 100 km/h gusts. Sturdy enough to fence with.", melee(10, 88, 0.5, 1)),
  S("wlg", "oilskin", "Oilskin coat", "armour", 1, 1500, 600, "trench", "#3a2014", "Waxed cotton down to your knees. Wind, rain and blades all struggle.", armour("body", 18, 2.2, 6)),
  S("wlg", "draft", "Leaked draft bill", "collect", 2, 6000, 2400, "newspaper", "#e8e2d0", "Marked 'not for circulation'. Several journalists would like a look."),
  S("wlg", "pass", "Ministerial security pass", "collect", 3, 60000, 26000, "card", "#2a75b3", "It opens doors in the Beehive. It's been reported lost."),
  // Nelson
  S("nsn", "cherries", "Punnet of cherries", "food", 0, 14, 6, "apple", "#6a1424", "Sold from a stall on the side of the road, honesty box and all.", food({ happy: 20, energy: 6 })),
  S("nsn", "scallops", "Bag of scallops", "food", 0, 40, 16, "shell", "#f0d8b0", "Dredged from the bay this morning.", food({ energy: 14, life: 10 })),
  S("nsn", "hops", "Sack of fresh hops", "junk", 0, 40, 15, "apple", "#7aa83a", "Smells like a brewery. Brewers back home will pay for these."),
  S("nsn", "mug", "Hand-thrown mug", "collect", 1, 350, 140, "cup", "#4a6a8a", "From a potter who has been making the same mug since 1974."),
  S("nsn", "paddle", "Kayak paddle", "weapon", 0, 600, 240, "golf", "#e8664f", "Carbon shaft and two hard blades.", melee(15, 80, 1.0, 4)),
  S("nsn", "jacket", "Tramping jacket", "armour", 1, 900, 360, "jacket", "#c2412b", "Gore-lined, hooded and made for three days in the bush.", armour("body", 14, 0.7, 6)),
  S("nsn", "ring", "Hand-forged gold ring", "jewel", 3, 70000, 30000, "ring", "#f2c14e", "From a jeweller in a little shop on the main street. Plain, heavy and very precious."),
  // Kaikōura
  S("kai", "cray", "Whole crayfish", "food", 1, 180, 70, "fish", "#c2412b", "From the caravan on the coast road. The best meal in the country.", food({ energy: 20, life: 20, happy: 30 })),
  S("kai", "whales", "Whale-watch ticket", "use", 1, 400, 160, "ticket", "#2a4a6a", "Out past the shelf where the sperm whales feed.", food({ happy: 150 })),
  S("kai", "postcard", "Seal-colony postcard", "collect", 0, 60, 24, "postcard", "#9aa4ad", "A seal asleep on a rock. Every postcard here is a seal asleep on a rock."),
  S("kai", "pendant", "Polished pāua pendant", "jewel", 1, 900, 350, "jpend", "#4fb0a0", "Set in silver by a local jeweller."),
  S("kai", "knife", "Dive knife", "weapon", 1, 1800, 700, "knife", "#c9d3d6", "Titanium, with a serrated back. Strapped to your calf.", melee(20, 84, 0.4, 8)),
  S("kai", "drysuit", "Drysuit leggings", "armour", 1, 1600, 620, "trousers", "#111", "Thick, tough and cut for cold water.", armour("legs", 16, 1.6, 8)),
  S("kai", "fossil", "Limestone fossil", "fossil", 2, 7000, 2800, "shell", "#c9c4b0", "An ancient sea creature in a slab of the cliffs."),
  // Christchurch
  S("chc", "scone", "Cheese scone", "food", 0, 6, 3, "pie", "#e8c45a", "From a tearoom that survived both quakes and won't let you forget it.", food({ energy: 10 })),
  S("chc", "brick", "Heritage brick", "junk", 0, 25, 10, "bar", "#a8442a", "From a building that came down in 2011. Stamped with the maker's name."),
  S("chc", "hivis", "Rebuild hi-vis vest", "armour", 0, 300, 120, "hivis", "#e8ff3a", "Ten years of rebuilding and these are everywhere.", armour("body", 8, 0.3)),
  S("chc", "scrum", "Scrum cap", "armour", 0, 500, 200, "cap", "#c2412b", "Padded, and good for ears.", armour("head", 12, 0.3, 3)),
  S("chc", "hardhat", "Rebuild hard hat", "armour", 1, 1200, 480, "helmet", "#f4f1ea", "White, scuffed, and signed by a whole site crew.", armour("head", 20, 0.5, 8)),
  S("chc", "pole", "Punting pole", "weapon", 1, 2500, 1000, "bbat", "#a06a33", "Four metres of wood from the boats on the Avon. Long reach.", melee(22, 74, 2.5, 10)),
  S("chc", "meteorite", "Antarctic meteorite", "fossil", 3, 90000, 38000, "meteor", "#4a4a5a", "Brought back on an ice flight. The paperwork says 'rock'."),
  // Hokitika
  S("hok", "fritter", "Whitebait fritter", "food", 0, 30, 12, "pie", "#f0e0b0", "Egg, whitebait and nothing else. Anything else is a crime.", food({ energy: 15, happy: 25 })),
  S("hok", "repellent", "Sandfly repellent", "use", 0, 12, 5, "can", "#7aa83a", "Smells awful. Doesn't work. Buy two.", food({ happy: 10 })),
  S("hok", "driftwood", "Driftwood sculpture", "collect", 1, 600, 240, "bone", "#c9b89a", "Washed down the rivers and carved on the beach."),
  S("hok", "pounamu", "Pounamu pendant", "jewel", 2, 9000, 3600, "jpend", "#2f8a5a", "Carved by a local carver. Tradition says pounamu should be given, not bought for yourself."),
  S("hok", "nugget", "Gold nugget", "jewel", 2, 8000, 3300, "ball", "#f2c14e", "Panned from a creek by a man who has done nothing else since 1979."),
  S("hok", "pick", "Gold-miner's pick", "weapon", 1, 3000, 1200, "axe", "#9aa4ad", "Heavy, old and still sharp.", melee(27, 72, 2.8, 10)),
  S("hok", "quartz", "Gold-bearing quartz", "fossil", 4, 400000, 170000, "egg", "#f4f1ea", "A fist of white quartz shot through with gold. Found once in a generation."),
  // Dunedin
  S("dud", "chocolate", "Chocolate factory seconds", "food", 0, 15, 6, "bar", "#5a3a1c", "Broken bars from the old factory. Tastes the same.", food({ happy: 35, energy: 8 })),
  S("dud", "cushion", "Burnt couch cushion", "junk", 0, 5, 2, "bar", "#5a4a3a", "From a student flat on Castle Street. A souvenir of a big night."),
  S("dud", "castle", "Castle tour ticket", "use", 0, 150, 60, "ticket", "#6a4a8a", "The only castle in the country, and a ghost in the ballroom.", food({ happy: 60 })),
  S("dud", "penguin", "Penguin plushie", "plush", 1, 300, 120, "plush", "#e8c45a", "The yellow-eyed kind. The real ones are rarer than this."),
  S("dud", "pipes", "Bagpipes", "collect", 2, 6000, 2400, "speaker", "#3a5a3a", "Tartan bag, blackwood drones. Your neighbours will move."),
  S("dud", "claymore", "Replica claymore", "weapon", 2, 15000, 6000, "knife", "#c9d3d6", "A two-handed Scottish broadsword, sold as decor.", melee(34, 74, 2.2, 14)),
  S("dud", "stub", "Steam train ticket stub", "stamp", 3, 40000, 17000, "ticket", "#a06a33", "From the first train to reach the city in 1878."),
  // Queenstown
  S("zqn", "burger", "Giant burger", "food", 0, 20, 8, "pie", "#a06a33", "Bigger than your head. There's a queue round the block at midnight.", food({ energy: 25, happy: 30 })),
  S("zqn", "pinot", "Central Otago pinot noir", "food", 1, 300, 120, "bottle", "#6a1424", "From vineyards in the gorge. The best in the world, they'll tell you.", food({ happy: 70 })),
  S("zqn", "bungy", "Bungy jump certificate", "collect", 1, 800, 300, "postcard", "#e8664f", "43 metres off a bridge, head first."),
  S("zqn", "beanie", "Merino beanie", "armour", 0, 400, 160, "beanie", "#6a4a8a", "Warm, soft and better than nothing.", armour("head", 5, 0.1)),
  S("zqn", "goggles", "Ski goggles", "armour", 1, 800, 300, "sunnies", "#e8a62a", "Mirrored lenses. Protect the eyes, at least.", armour("head", 8, 0.3)),
  S("zqn", "skijacket", "Ski jacket", "armour", 1, 4000, 1600, "jacket", "#2a75b3", "Insulated, padded and armoured at the spine.", armour("body", 20, 1.4, 12)),
  S("zqn", "iceaxe", "Ice axe", "weapon", 2, 12000, 4800, "axe", "#2a75b3", "Steel head, carbon shaft. For climbing glaciers, or whatever.", melee(30, 80, 0.7, 16)),
  S("zqn", "chalet", "Ski chalet key", "collect", 3, 120000, 52000, "key", "#c9a46a", "To a chalet nobody uses in summer. The owner's in London."),
  // Invercargill
  S("ivc", "oysters", "A dozen Bluff oysters", "food", 1, 250, 100, "shell", "#c9c4b0", "From the bottom of the world. People fly in for these.", food({ energy: 20, life: 15, happy: 40 })),
  S("ivc", "sausage", "Venison sausage roll", "food", 0, 12, 5, "pie", "#8a4a1c", "From the bakery at the deer farm.", food({ energy: 18 })),
  S("ivc", "gloves", "Possum-merino gloves", "armour", 0, 600, 240, "gloves", "#6b4128", "The warmest gloves you'll ever own.", armour("hands", 12, 0.1)),
  S("ivc", "bushcoat", "Heavy wool bush coat", "armour", 2, 6000, 2400, "jacket", "#3a4a2a", "Thick felted wool. Shrugs off rain, thorns and the odd blade.", armour("body", 24, 2.4, 14)),
  S("ivc", "part", "Vintage motorbike part", "collect", 2, 8000, 3200, "wheel", "#9aa4ad", "From a hardware shop with a famous speed-record bike in the window."),
  S("ivc", "rifle", "Deer stalker's rifle", "weapon", 2, 40000, 16000, "rifle", "#6b4128", "Bolt-action, scoped and very accurate. Uses rifle rounds.", { arms: { slot: "long", dmg: 70, acc: 82, ammo: "ammo_rifle", weight: 3.5, lvl: 16 } }),
  S("ivc", "kiwi", "Stewart Island kiwi tour", "use", 2, 1500, 600, "ticket", "#6b4128", "A night walk on the beach where kiwi feed in the wild.", food({ happy: 200 })),
  S("ivc", "anchor", "Old whaling anchor", "collect", 3, 75000, 32000, "anchor", "#3a3a3a", "From a station on the coast. It took four men to lift it into the truck."),
];
// Stock and how fast it comes back, by rarity.
export const RESTOCK = [{ max: 50, mins: 2 }, { max: 20, mins: 8 }, { max: 4, mins: 60 }, { max: 1, mins: 300 }, { max: 1, mins: 720 }];

// Extra item pictures for the local goods.
export const TRAVEL_SHAPES = {
  globe: c => `<circle cx="24" cy="21" r="14" fill="${c}" opacity=".85"/><path d="M14 21q10-8 20 0" stroke="#fff" fill="none"/><rect x="14" y="34" width="20" height="8" rx="2" fill="#6b4128"/>`,
  apple: c => `<circle cx="18" cy="28" r="10" fill="${c}"/><circle cx="30" cy="28" r="10" fill="${c}"/><path d="M24 18q2-8 8-10" stroke="#3a2014" stroke-width="2" fill="none"/>`,
  jar: c => `<rect x="12" y="14" width="24" height="28" rx="5" fill="${c}"/><rect x="14" y="8" width="20" height="7" rx="2" fill="#3a2014"/><rect x="16" y="22" width="16" height="10" rx="1" fill="#f4f1ea" opacity=".85"/>`,
  fish: c => `<path d="M6 24q14-14 30 0q-16 14-30 0z" fill="${c}"/><path d="M36 24l8-8v16z" fill="${c}"/><circle cx="14" cy="22" r="2" fill="#10141c"/>`,
  board: c => `<path d="M24 4q10 10 8 30q-2 10-8 10q-6 0-8-10q-2-20 8-30z" fill="${c}"/><path d="M24 8v34" stroke="#e2574c" stroke-width="2"/>`,
  postcard: c => `<rect x="5" y="11" width="38" height="26" rx="2" fill="${c}"/><rect x="31" y="15" width="8" height="9" fill="#e2574c"/><path d="M9 28h16M9 32h12" stroke="#10141c"/>`,
  beanie: c => `<path d="M8 34q0-24 16-24t16 24z" fill="${c}"/><rect x="7" y="32" width="34" height="7" rx="2" fill="${c}" stroke="#10141c" stroke-opacity=".4"/><circle cx="24" cy="9" r="4" fill="${c}"/>`,
  axe: c => `<path d="M24 6v38" stroke="#6b4128" stroke-width="4"/><path d="M24 8q14 0 16 10H24z" fill="${c}"/><path d="M24 10q-10 2-14 6l14 2z" fill="${c}"/>`,
  anchor: c => `<circle cx="24" cy="9" r="4" fill="none" stroke="${c}" stroke-width="3"/><path d="M24 13v30M16 20h16M8 30q2 12 16 13q14-1 16-13" stroke="${c}" stroke-width="4" fill="none"/>`,
};
