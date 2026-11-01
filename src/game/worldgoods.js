// Local goods for every town in the world (New Zealand has its own hand-made set in travel.js).
// Each town sells three things: something to eat or drink, a souvenir with its name on it, and a local craft.
// Each country also has one rare find and one piece of gear that works in fights.
// Everything is generated the same way every time from the town's id, so the app and the database always agree.
import { COUNTRIES, TOWNS } from "./world-data.js";

// [name, shape, colour, value, effect]   {c} = town, {n} = country
const F = (n, sh, c, v, u) => ({ n, sh, c, v, u });
const ZONES = {
  nam: { food: [F("Maple syrup", "jar", "#a0521c", 40, { life: 8, happy: 15 }), F("Box of doughnuts", "pie", "#e8a6c4", 20, { energy: 10, happy: 15 }), F("Beef jerky", "bar", "#7a3a1c", 25, { energy: 14 }),
      F("Craft root beer", "can", "#5a2a1c", 12, { energy: 6, happy: 10 }), F("Slice of deep-dish pizza", "pie", "#e8664f", 15, { energy: 12, life: 4 }), F("Smoked brisket", "bar", "#5a2a14", 35, { energy: 16, life: 8 })],
    craft: [F("Vintage baseball card", "card", "#2a4a8a", 600), F("Record from a {c} dig", "vinyl", "#111", 900), F("Hand-tooled leather belt", "bar", "#6b4128", 500), F("Thrift-store denim jacket", "jacket", "#3a5a8a", 450)],
    rare: [F("Gold rush nugget", "ball", "#f2c14e", 45000), F("Signed championship ball", "ball", "#c9a46a", 38000), F("Original film prop", "statue", "#9aa4ad", 60000)] },
  lat: { food: [F("Empanadas", "pie", "#d9a62a", 15, { energy: 12, life: 4 }), F("Bag of coffee beans", "jar", "#5a3a1c", 40, { energy: 14 }), F("Dulce de leche", "jar", "#c98a3a", 25, { happy: 20 }),
      F("Fresh mangoes", "apple", "#f0a43a", 12, { energy: 8, life: 6 }), F("Bottle of rum", "bottle", "#8a4a1c", 40, { happy: 40, nerve: 1 }), F("Plantain chips", "chips", "#e8c45a", 8, { energy: 6 })],
    craft: [F("Hand-woven hammock", "board", "#e2574c", 700), F("Hand-painted ceramic bowl", "cup", "#2a75b3", 500), F("Silver filigree earrings", "earrings", "#c9d3d6", 900), F("Alpaca-wool blanket", "box", "#c9a46a", 800)],
    rare: [F("Uncut emerald", "bigdiamond", "#2f8a5a", 55000), F("Signed football shirt", "jacket", "#2a75b3", 35000), F("Silver colonial coin", "coin", "#c9d3d6", 42000)] },
  weu: { food: [F("Wheel of cheese", "ball", "#e8c45a", 45, { energy: 12, happy: 15 }), F("Bottle of red wine", "bottle", "#5a1c3a", 40, { happy: 45 }), F("Box of chocolates", "bar", "#5a3a1c", 25, { happy: 30 }),
      F("Bag of pastries", "pie", "#d9a62a", 15, { energy: 12 }), F("Waffles", "bar", "#d9a62a", 10, { energy: 10, happy: 10 }), F("Sausages from the market", "bar", "#a0521c", 18, { energy: 14 })],
    craft: [F("Vintage travel poster of {c}", "postcard", "#f0b84a", 800), F("Porcelain figurine", "figure", "#e8e2ff", 900), F("Antique mantel clock", "gwatch", "#c9a46a", 1500), F("Second-hand designer scarf", "sock", "#c2412b", 700)],
    rare: [F("Old master sketch", "postcard", "#c9a46a", 80000), F("Cut diamond", "bigdiamond", "#e8f4ff", 70000), F("Vintage luxury watch", "gwatch", "#c9d3d6", 55000)] },
  neu: { food: [F("Smoked salmon", "fish", "#e8664f", 35, { energy: 12, life: 8 }), F("Cinnamon buns", "pie", "#c98a3a", 12, { energy: 10, happy: 12 }), F("Pickled herring", "fish", "#9aa4ad", 15, { energy: 10 }),
      F("Rye bread", "bar", "#6b4128", 8, { energy: 10 }), F("Bottle of whisky", "bottle", "#c98a3a", 60, { happy: 50, nerve: 1 }), F("Fish and chips", "fishchips", "#e8c45a", 14, { energy: 14, life: 4 })],
    craft: [F("Hand-knitted wool jumper", "jacket", "#c9c4b0", 600), F("Woollen tartan scarf", "sock", "#2a4a3a", 400), F("Carved wooden spoon", "spoon", "#c98a3a", 250), F("Vintage football programme", "comic", "#c2412b", 350)],
    rare: [F("Viking-age silver coin", "coin", "#c9d3d6", 50000), F("Baltic amber with an insect", "amber", "#e8a62a", 45000), F("Rare single malt", "bottle", "#c98a3a", 30000)] },
  seu: { food: [F("Extra virgin olive oil", "bottle", "#7a8a2a", 30, { life: 10 }), F("Jar of olives", "jar", "#4a5a2a", 12, { energy: 6 }), F("Custard tarts", "pie", "#e8c45a", 10, { energy: 8, happy: 12 }),
      F("Cured ham", "bar", "#a0423a", 45, { energy: 14 }), F("Bottle of limoncello", "bottle", "#e8d82a", 30, { happy: 40 }), F("Espresso beans", "jar", "#3a2014", 25, { energy: 14 })],
    craft: [F("Hand-painted tile from {c}", "postcard", "#2a75b3", 400), F("Blown-glass ornament", "egg", "#4fb0a0", 700), F("Leather wallet", "bar", "#6b4128", 500), F("Lace tablecloth", "box", "#f4f1ea", 600)],
    rare: [F("Ancient Roman coin", "coin", "#c9a46a", 60000), F("Marble statuette", "statue", "#f4f1ea", 70000), F("Renaissance sketch", "postcard", "#c9a46a", 80000)] },
  eeu: { food: [F("Dumplings", "pie", "#f0e0b0", 10, { energy: 12, life: 4 }), F("Jar of pickles", "jar", "#4a6a2a", 8, { energy: 6 }), F("Bottle of vodka", "bottle", "#e8f4ff", 25, { happy: 40, nerve: 1 }),
      F("Honey cake", "pie", "#d9a62a", 12, { happy: 20 }), F("Poppy-seed roll", "bar", "#3a3a3a", 8, { energy: 8 }), F("Smoked sausage", "bar", "#8a2a1c", 15, { energy: 14 })],
    craft: [F("Nesting dolls", "figure", "#e2574c", 400), F("Hand-painted egg", "egg", "#e8c45a", 500), F("Amber bracelet", "jbrace", "#e8a62a", 800), F("Embroidered shirt", "jacket", "#f4f1ea", 600)],
    rare: [F("Imperial-era gold coin", "coin", "#f2c14e", 55000), F("Jewelled egg (very good replica)", "egg", "#c2412b", 65000), F("Space-race medal", "coin", "#c9d3d6", 40000)] },
  mena: { food: [F("Box of dates", "bar", "#7a3a1c", 25, { energy: 14 }), F("Baklava", "pie", "#d9a62a", 20, { happy: 25 }), F("Saffron threads", "jar", "#c2412b", 80, { happy: 15, life: 6 }),
      F("Glass of mint tea", "cup", "#4a8a3a", 6, { energy: 8 }), F("Bag of pistachios", "bar", "#7aa83a", 25, { energy: 10 }), F("Halva", "bar", "#c9b89a", 12, { happy: 15 })],
    craft: [F("Brass lantern", "cone", "#c9a46a", 700), F("Hand-woven rug", "board", "#8a2a1c", 1500), F("Painted spice box", "box", "#2a75b3", 400), F("Hammered copper tray", "coin", "#c97a3a", 600)],
    rare: [F("Antique brass astrolabe", "compass", "#c9a46a", 70000), F("Natural Gulf pearl", "egg", "#f4f1ea", 55000), F("Silk carpet", "board", "#8a1c3a", 80000)] },
  ssa: { food: [F("Bag of coffee beans", "jar", "#5a3a1c", 35, { energy: 14 }), F("Bush tea", "cup", "#a0521c", 10, { life: 8 }), F("Spiced peanuts", "bar", "#c98a3a", 8, { energy: 8 }),
      F("Fresh mangoes", "apple", "#f0a43a", 10, { energy: 8, life: 6 }), F("Dried meat", "bar", "#5a2a14", 20, { energy: 16 }), F("Jollof rice", "pie", "#e2574c", 12, { energy: 14, life: 4 })],
    craft: [F("Beaded bracelet", "jbrace", "#e2574c", 300), F("Woven basket", "cup", "#c9a46a", 400), F("Carved soapstone figure", "figure", "#9aa4ad", 600), F("Printed wax-cloth fabric", "sock", "#f0a43a", 350)],
    rare: [F("Rough diamond", "bigdiamond", "#e8f4ff", 75000), F("Tanzanite", "bigdiamond", "#4a3aa8", 60000), F("Gold coin", "coin", "#f2c14e", 45000)] },
  sas: { food: [F("Bag of loose-leaf tea", "jar", "#4a6a2a", 30, { energy: 10, life: 6 }), F("Mango pickle", "jar", "#e8a62a", 10, { energy: 6 }), F("Samosas", "pie", "#d9a62a", 6, { energy: 12 }),
      F("Box of sweets", "box", "#e8664f", 15, { happy: 25 }), F("Masala chai", "cup", "#a0521c", 4, { energy: 10 }), F("Spice mix", "jar", "#c2412b", 15, { happy: 10 })],
    craft: [F("Silk scarf", "sock", "#c2412b", 600), F("Brass elephant", "figure", "#c9a46a", 500), F("Block-printed cushion cover", "box", "#2a75b3", 300), F("Signed cricket bat", "cricketbat", "#c9a46a", 1500)],
    rare: [F("Star sapphire", "bigdiamond", "#2a4ab3", 70000), F("Heavy gold bangle", "jbrace", "#f2c14e", 50000), F("Antique miniature painting", "postcard", "#c2412b", 45000)] },
  eas: { food: [F("Green tea", "jar", "#4a8a3a", 25, { energy: 10, life: 6 }), F("Instant noodles", "can", "#e2574c", 4, { energy: 10 }), F("Dumplings", "pie", "#f0e0b0", 8, { energy: 12 }),
      F("Rice crackers", "bar", "#c9a46a", 6, { energy: 6 }), F("Jar of kimchi", "jar", "#c2412b", 10, { energy: 8, life: 4 }), F("Bubble tea", "cup", "#c98a3a", 6, { happy: 20 })],
    craft: [F("Paper lantern", "cone", "#e2574c", 300), F("Porcelain teacup", "cup", "#e8f4ff", 600), F("Lucky cat figurine", "figure", "#f4f1ea", 400), F("Second-hand game console", "console", "#9aa4ad", 1200)],
    rare: [F("Jade bangle", "jbrace", "#2f8a5a", 60000), F("Vintage film camera", "camera", "#2a2a3a", 35000), F("Antique porcelain vase", "cup", "#2a4ab3", 80000)] },
  sea: { food: [F("Satay skewers", "bar", "#a0521c", 6, { energy: 12 }), F("Fresh coconut", "ball", "#7a5a3a", 5, { energy: 6, life: 6 }), F("Bag of coffee beans", "jar", "#5a3a1c", 30, { energy: 14 }),
      F("Chilli sauce", "bottle", "#c2412b", 6, { happy: 8 }), F("Mango sticky rice", "pie", "#e8c45a", 6, { energy: 10, happy: 10 }), F("Durian", "apple", "#a8a82a", 20, { energy: 10 })],
    craft: [F("Batik sarong", "sock", "#2a4a8a", 400), F("Carved teak elephant", "figure", "#8a5a2a", 600), F("Pearl earrings", "earrings", "#f4f1ea", 900), F("Silk tie from {c}", "sock", "#8a1c3a", 300)],
    rare: [F("South Sea pearl", "egg", "#e8e2c8", 55000), F("Ruby", "bigdiamond", "#c2142a", 70000), F("Agarwood chips", "amber", "#5a3a1c", 40000)] },
  cas: { food: [F("Dried apricots", "apple", "#f0a43a", 12, { energy: 10 }), F("Round flatbread", "pie", "#d9a62a", 4, { energy: 10 }), F("Sweet melon", "ball", "#c9d83a", 8, { energy: 6, life: 6 }),
      F("Mountain honey", "jar", "#e8a62a", 25, { life: 12, happy: 10 }), F("Spice mix", "jar", "#c2412b", 10, { happy: 10 }), F("Fermented mare's milk", "bottle", "#f4f1ea", 10, { life: 8 })],
    craft: [F("Felt hat", "cap", "#f4f1ea", 400), F("Embroidered cushion", "box", "#c2412b", 500), F("Painted ceramic dish", "cup", "#2a75b3", 450), F("Silver ring", "ring", "#c9d3d6", 700)],
    rare: [F("Lapis lazuli", "bigdiamond", "#1f3ab3", 50000), F("Turquoise", "bigdiamond", "#3ab3a8", 40000), F("Antique silk carpet", "board", "#8a1c3a", 75000)] },
  oce: { food: [F("Meat pie", "pie", "#a0521c", 8, { energy: 12, life: 4 }), F("Lamingtons", "bar", "#7a3a1c", 8, { happy: 15 }), F("Fresh coconut", "ball", "#7a5a3a", 5, { energy: 6, life: 6 }),
      F("Tropical fruit", "apple", "#f0a43a", 8, { energy: 8, life: 6 }), F("Fresh-caught fish", "fish", "#4a8ab3", 20, { energy: 14, life: 8 }), F("Bottle of local beer", "bottle", "#c98a3a", 8, { happy: 20 })],
    craft: [F("Shell necklace", "necklace", "#f4f1ea", 300), F("Woven fan", "feather", "#c9a46a", 250), F("Second-hand surfboard", "board", "#f4f1ea", 800), F("Bush hat", "cap", "#7a5a3a", 400)],
    rare: [F("Black pearl", "egg", "#2a2a3a", 50000), F("Opal", "bigdiamond", "#8ad8e8", 60000), F("Gold nugget", "ball", "#f2c14e", 45000)] },
};
// Souvenirs: every town has one.
const SOUVENIR = [F("{c} snow globe", "globe", "#6db7e8", 60), F("{c} postcard", "postcard", "#f0b84a", 20), F("{c} fridge magnet", "cap", "#e2574c", 25), F("{c} keyring", "key", "#c9d3d6", 30),
  F("{c} shot glass", "cup", "#c9d3d6", 35), F("{c} tea towel", "sock", "#2a75b3", 30), F("{c} tram ticket", "ticket", "#c2412b", 40), F("{c} commemorative coin", "coin", "#c9a46a", 80)];
// Gear: one per country, works in the armoury.
const GEAR = [
  { n: "Motorcycle helmet from {n}", sh: "helmet", c: "#111", v: 1800, arms: { slot: "head", def: 22, weight: 1.4, lvl: 6 } },
  { n: "Leather biker jacket", sh: "jacket", c: "#2a1a14", v: 2200, arms: { slot: "body", def: 16, weight: 2.2, lvl: 5 } },
  { n: "Steel-toe work boots", sh: "boots", c: "#6b4128", v: 900, arms: { slot: "feet", def: 14, weight: 1.8, lvl: 3 } },
  { n: "Trekking pole", sh: "golf", c: "#9aa4ad", v: 700, arms: { slot: "melee", dmg: 13, acc: 84, weight: 0.4, lvl: 2 } },
  { n: "Baseball bat", sh: "bbat", c: "#c98a3a", v: 900, arms: { slot: "melee", dmg: 18, acc: 80, weight: 1.0, lvl: 3 } },
  { n: "Fishing knife", sh: "knife", c: "#c9d3d6", v: 800, arms: { slot: "melee", dmg: 16, acc: 86, weight: 0.3, lvl: 3 } },
  { n: "Cut-resistant gloves", sh: "gloves", c: "#111", v: 1400, arms: { slot: "hands", def: 18, weight: 0.3, lvl: 5 } },
  { n: "Padded motocross trousers", sh: "trousers", c: "#c2412b", v: 1600, arms: { slot: "legs", def: 16, weight: 1.4, lvl: 6 } },
];
// "the United Kingdom", "the Philippines", but just "France".
export const theName = n => /^(United|Netherlands|Philippines|Bahamas|Maldives|Democratic|Republic of|Central African|Dominican|Czech|Solomon|Marshall|Cayman|Falkland|Faroe|Comoros|Seychelles|Vatican|British|Turks|Cook|Northern Mariana|Pitcairn|Federated|French Southern|Gambia|Ivory)/.test(n) ? "the " + n : n;
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const fill = (s, c, n) => s.replace("{c}", c).replace("{n}", n);
const vary = (v, h) => Math.max(1, Math.round(v * (0.85 + (h % 31) / 100)));
const rarityOf = v => v >= 20000 ? 3 : v >= 1000 ? 2 : v >= 200 ? 1 : 0;
const C = Object.fromEntries(COUNTRIES.map(c => [c[0], c]));
export const WORLD_ITEMS = [];
for (const [id, name, iso] of TOWNS) {
  if (iso === "NZ") continue;
  const z = ZONES[C[iso][2]] || ZONES.oce, h = hash(id), cn = C[iso][1];
  const food = z.food[h % z.food.length], craft = z.craft[(h >>> 5) % z.craft.length], souv = SOUVENIR[(h >>> 9) % SOUVENIR.length];
  for (const [k, t, cat, d] of [["f", food, "food", `A local favourite in ${name}.`], ["s", souv, "collect", `Every tourist in ${name} goes home with one.`], ["c", craft, "collect", `Made in ${name}, ${cn}.`]]) {
    const v = vary(t.v, h >>> (k === "f" ? 1 : k === "s" ? 2 : 3));
    WORLD_ITEMS.push({ id: `w_${id}_${k}`, city: id, n: fill(t.n, name, cn), cat: k === "f" && !t.u ? "use" : cat, r: rarityOf(v), v, price: Math.max(1, Math.round(v * 0.3)), sh: t.sh, c: t.c, c2: "", d, u: t.u });
  }
}
const firstTown = Object.fromEntries([...TOWNS].reverse().map(t => [t[2], t]));
for (const [iso, name, zone, , , , hub] of COUNTRIES) {
  if (iso === "NZ") continue;
  const z = ZONES[zone] || ZONES.oce, h = hash(iso), hubTown = TOWNS.find(t => t[0] === hub) || firstTown[iso];
  if (!hubTown) continue;
  const rare = z.rare[h % z.rare.length], gear = GEAR[(h >>> 4) % GEAR.length];
  WORLD_ITEMS.push({ id: `w_${iso.toLowerCase()}_r`, city: hubTown[0], n: fill(rare.n, hubTown[1], name), cat: "collect", r: 3, v: vary(rare.v, h), price: Math.round(vary(rare.v, h) * 0.3), sh: rare.sh, c: rare.c, c2: "",
    d: `Found in ${theName(name)}. There's only ever one in the shop, and it takes a long time to come back.` });
  const gid = `w_${iso.toLowerCase()}_g`, gtown = TOWNS.filter(t => t[2] === iso)[(h >>> 8) % TOWNS.filter(t => t[2] === iso).length] || hubTown;
  WORLD_ITEMS.push({ id: gid, city: gtown[0], n: fill(gear.n, gtown[1], name), cat: gear.arms.def != null ? "armour" : "weapon", r: 2, v: vary(gear.v, h), price: Math.round(vary(gear.v, h) * 0.3), sh: gear.sh, c: gear.c, c2: "",
    d: `Picked up in ${gtown[1]}. Works in a fight.`, arms: gear.arms });
}

// Contraband: every country has two things sold out of a back alley in its main town. Made-up names, real risks:
// they're worth far more back home, but customs search your bags when you cross a border.
const CONTRA = [
  { n: "Night Bloom", sh: "feather", c: "#7a3ab3", v: 900, u: { happy: 150, heat: 6 } },
  { n: "Static", sh: "egg", c: "#6db7e8", v: 1400, u: { energy: 30, heat: 8 } },
  { n: "Hush", sh: "egg", c: "#e8e2ff", v: 1100, u: { happy: 100, life: 10, heat: 6 } },
  { n: "Glimmer", sh: "amber", c: "#f2c14e", v: 2200, u: { happy: 220, heat: 10 } },
  { n: "Driftleaf", sh: "feather", c: "#4a8a3a", v: 600, u: { happy: 90, energy: -5, heat: 4 } },
  { n: "Velvet", sh: "jar", c: "#8a1c3a", v: 1800, u: { happy: 180, nerve: 2, heat: 8 } },
  { n: "Lucky Dust", sh: "jar", c: "#e8d82a", v: 2600, u: { energy: 40, happy: 60, heat: 12 } },
  { n: "Echo", sh: "egg", c: "#3ab3a8", v: 1600, u: { happy: 140, heat: 7 } },
  { n: "Red Mist", sh: "bottle", c: "#c2142a", v: 1300, u: { energy: 25, nerve: 3, heat: 9 } },
  { n: "Slow Honey", sh: "jar", c: "#c98a3a", v: 1000, u: { life: 25, happy: 80, heat: 5 } },
  { n: "Spark", sh: "egg", c: "#ff7a3d", v: 2000, u: { energy: 35, heat: 10 } },
  { n: "Halo", sh: "egg", c: "#f4f1ea", v: 3000, u: { happy: 260, energy: 10, heat: 14 } },
];
for (const [iso, name, , , , , hub] of COUNTRIES) {
  const h = hash("x" + iso), hubTown = TOWNS.find(t => t[0] === hub); if (!hubTown) continue;
  for (const [k, t] of [["x", CONTRA[h % CONTRA.length]], ["y", CONTRA[(h >>> 7) % CONTRA.length === h % CONTRA.length ? ((h >>> 7) + 1) % CONTRA.length : (h >>> 7) % CONTRA.length]]]) {
    const v = vary(t.v, h >>> (k === "x" ? 3 : 11));
    WORLD_ITEMS.push({ id: `w_${iso.toLowerCase()}_${k}`, city: hubTown[0], n: `${t.n} (${name})`, cat: "contraband", r: 2, v, price: Math.max(1, Math.round(v * 0.2)), sh: t.sh, c: t.c, c2: "",
      d: `Sold quietly in a back alley in ${hubTown[1]}. Worth a lot more at home, if customs don't find it.`, u: t.u, contraband: true });
  }
}
