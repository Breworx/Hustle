// The armoury: weapons, armour, ammo and throwables you can buy, plus fight stats for every weapon and armour item.
// Slots you can fill (one item each): melee, sidearm, long (a long gun), head, body, hands, legs, feet,
// plus up to three throwables. Everything has a weight, and your strength sets how much you can carry.
// Edit, then `npm run gen-sql`.

// Weapon fields: dmg (damage per hit), acc (base hit chance %), shots (hits tried per turn), ammo (item used per shot),
// weight (kg), lvl, price. Armour: def (% of damage stopped where it covers), weight, lvl, price.
export const SHOP_ARMS = [
  // ---- Melee
  { id: "arm_knife", n: "Kitchen knife", slot: "melee", dmg: 14, acc: 85, weight: 0.3, lvl: 1, price: 150, sh: "knife", c: "#c9d3d6", d: "Borrowed from the drawer and never returned." },
  { id: "arm_crowbar", n: "Crowbar", slot: "melee", dmg: 18, acc: 76, weight: 2.5, lvl: 1, price: 350, sh: "tyreiron", c: "#c2412b", d: "Opens doors, crates and arguments." },
  { id: "arm_machete", n: "Machete", slot: "melee", dmg: 24, acc: 78, weight: 0.9, lvl: 3, price: 900, sh: "knife", c: "#9aa4ad", d: "Sold for clearing gorse. Rarely used for clearing gorse." },
  { id: "arm_katana", n: "Replica katana", slot: "melee", dmg: 32, acc: 80, weight: 1.2, lvl: 10, price: 18000, sh: "knife", c: "#e8e2ff", d: "The shop said it was decorative. The shop was wrong." },
  // ---- Sidearms
  { id: "arm_pocket", n: "Pocket pistol", slot: "sidearm", dmg: 28, acc: 70, ammo: "ammo_9", weight: 0.5, lvl: 4, price: 2500, sh: "pistol", c: "#8f96a6", d: "Small enough to forget it's there. Loud enough that nobody else will." },
  { id: "arm_service", n: "Service pistol", slot: "sidearm", dmg: 34, acc: 76, ammo: "ammo_9", weight: 0.9, lvl: 6, price: 6000, sh: "pistol", c: "#273042", d: "Reliable, accurate and dull. The way you want it." },
  { id: "arm_revolver", n: ".357 revolver", slot: "sidearm", dmg: 46, acc: 68, ammo: "ammo_357", weight: 1.2, lvl: 8, price: 12000, sh: "revolver", c: "#c9d3d6", d: "Six shots and a lot of noise." },
  { id: "arm_goldpistol", n: "Gold-plated pistol", slot: "sidearm", dmg: 52, acc: 86, ammo: "ammo_9", weight: 1.0, lvl: 25, price: 2000000, sh: "pistol", c: "#f2c14e", d: "Completely unnecessary. Completely accurate." },
  // ---- Long guns
  { id: "arm_sawnoff", n: "Sawn-off shotgun", slot: "long", dmg: 60, acc: 58, ammo: "ammo_shell", weight: 2.4, lvl: 9, price: 15000, sh: "shotgun", c: "#6b4128", d: "Short range, short temper." },
  { id: "arm_smg", n: "Compact SMG", slot: "long", dmg: 22, acc: 66, shots: 3, ammo: "ammo_9", weight: 2.8, lvl: 12, price: 40000, sh: "smg", c: "#273042", d: "Three rounds a pull. Some of them might land." },
  { id: "arm_pump", n: "Pump shotgun", slot: "long", dmg: 70, acc: 64, ammo: "ammo_shell", weight: 3.4, lvl: 14, price: 55000, sh: "shotgun", c: "#3a2014", d: "The sound of it being racked ends most arguments." },
  { id: "arm_hunting", n: "Hunting rifle", slot: "long", dmg: 76, acc: 80, ammo: "ammo_rifle", weight: 4.0, lvl: 16, price: 80000, sh: "rifle", c: "#6b4128", d: "Meant for deer in the Ureweras. Works on other things too." },
  { id: "arm_assault", n: "Assault rifle", slot: "long", dmg: 32, acc: 72, shots: 3, ammo: "ammo_rifle", weight: 3.6, lvl: 20, price: 200000, sh: "smg", c: "#2f3a2a", d: "Military surplus that should never have been surplus." },
  { id: "arm_lmg", n: "Light machine gun", slot: "long", dmg: 30, acc: 62, shots: 5, ammo: "ammo_rifle", weight: 8.0, lvl: 30, price: 1500000, sh: "rifle", c: "#111", d: "Heavy, hungry for ammo, and impossible to argue with." },
  // ---- Throwables (used up when thrown)
  { id: "arm_pepper", n: "Pepper spray", slot: "throw", effect: "blind", dmg: 4, acc: 90, weight: 0.1, lvl: 1, price: 120, sh: "can", c: "#e8664f", d: "Their aim is terrible for the next two turns." },
  { id: "arm_flash", n: "Flashbang", slot: "throw", effect: "stun", dmg: 6, acc: 85, weight: 0.4, lvl: 7, price: 1500, sh: "grenade", c: "#c9d3d6", d: "A bang and a flash. They lose their next turn." },
  { id: "arm_smoke", n: "Smoke grenade", slot: "throw", effect: "smoke", dmg: 0, acc: 100, weight: 0.4, lvl: 5, price: 900, sh: "grenade", c: "#748a88", d: "They can't see you. Their next two attacks will probably miss." },
  { id: "arm_molotov", n: "Molotov cocktail", slot: "throw", effect: "burn", dmg: 18, acc: 75, weight: 0.8, lvl: 11, price: 2500, sh: "bottle", c: "#ff7a3d", d: "Burns for two more turns after it lands." },
  // ---- Armour
  { id: "arm_cap", n: "Baseball cap", slot: "head", def: 4, weight: 0.1, lvl: 1, price: 40, sh: "cap", c: "#e2574c", d: "Stops the sun. Not much else." },
  { id: "arm_riothelm", n: "Riot helmet", slot: "head", def: 30, weight: 1.6, lvl: 8, price: 7000, sh: "helmet", c: "#111", d: "Visor down, chin strap tight." },
  { id: "arm_ballhelm", n: "Ballistic helmet", slot: "head", def: 50, weight: 1.4, lvl: 16, price: 60000, sh: "helmet", c: "#2f3a2a", d: "Rated to stop a pistol round. Don't test it." },
  { id: "arm_leather", n: "Leather jacket", slot: "body", def: 12, weight: 2.0, lvl: 1, price: 600, sh: "jacket", c: "#3a2014", d: "Looks good, turns a knife if you're lucky." },
  { id: "arm_stab", n: "Stab vest", slot: "body", def: 28, weight: 2.8, lvl: 5, price: 4500, sh: "stabvest", c: "#273042", d: "What the bouncers wear under their shirts." },
  { id: "arm_kevlar", n: "Kevlar vest", slot: "body", def: 42, weight: 3.5, lvl: 10, price: 25000, sh: "stabvest", c: "#2f3a2a", d: "Soft armour that stops most handgun rounds." },
  { id: "arm_plate", n: "Plate carrier", slot: "body", def: 60, weight: 9.0, lvl: 18, price: 150000, sh: "riot", c: "#1d2a1a", d: "Ceramic plates front and back. Heavy, and worth every gram." },
  { id: "arm_workgloves", n: "Work gloves", slot: "hands", def: 8, weight: 0.3, lvl: 1, price: 50, sh: "gloves", c: "#a06a33", d: "Rigger gloves from the hardware store." },
  { id: "arm_kevgloves", n: "Kevlar gloves", slot: "hands", def: 25, weight: 0.4, lvl: 9, price: 5000, sh: "gloves", c: "#111", d: "Cut-proof, and they grip a handle in the rain." },
  { id: "arm_jeans", n: "Work jeans", slot: "legs", def: 6, weight: 0.8, lvl: 1, price: 80, sh: "trousers", c: "#2a4a7a", d: "Double-stitched and nearly indestructible. Nearly." },
  { id: "arm_kneepads", n: "Riot leg guards", slot: "legs", def: 28, weight: 2.2, lvl: 8, price: 8000, sh: "trousers", c: "#111", d: "Shin and thigh plates that strap over your trousers." },
  { id: "arm_kevlegs", n: "Kevlar trousers", slot: "legs", def: 42, weight: 2.0, lvl: 15, price: 45000, sh: "trousers", c: "#2f3a2a", d: "Look like cargo pants. Aren't." },
  { id: "arm_steelcaps", n: "Steel-cap boots", slot: "feet", def: 12, weight: 1.8, lvl: 1, price: 180, sh: "boots", c: "#3a2014", d: "Required on every building site, and every good fight." },
  { id: "arm_tacboots", n: "Tactical boots", slot: "feet", def: 30, weight: 1.4, lvl: 12, price: 12000, sh: "boots", c: "#111", d: "Light, quiet and armoured at the toe and ankle." },
];
// Ammo, sold in boxes. One round per shot.
export const AMMO = [
  { id: "ammo_9", n: "9mm rounds", box: 50, price: 250, lvl: 4, sh: "ammo", c: "#d9a62a", d: "For pistols and SMGs." },
  { id: "ammo_357", n: ".357 rounds", box: 30, price: 400, lvl: 8, sh: "ammo", c: "#c9d3d6", d: "For the revolver." },
  { id: "ammo_shell", n: "Shotgun shells", box: 25, price: 400, lvl: 9, sh: "ammo", c: "#c2412b", d: "For shotguns." },
  { id: "ammo_rifle", n: "Rifle rounds", box: 40, price: 900, lvl: 16, sh: "ammo", c: "#2f3a2a", d: "For rifles and machine guns." },
];

// Fight stats for weapons and armour that only drop as loot (from their power bonus and shape).
const LOOT_WEIGHT = { newspaper: 0.2, bikechain: 1.2, cricketbat: 1.2, tyreiron: 2.2, knuckles: 0.3, nunchucks: 0.8, taser: 0.4, bbat: 1.0, pan: 1.8, wrench: 1.5, golf: 0.4,
  hivis: 0.3, hoodie: 0.6, jacket: 2.0, helmet: 1.4, stabvest: 2.8, riot: 6.0, trench: 2.5, gloves: 0.3, boots: 1.6 };
const LOOT_SLOT = { helmet: "head", gloves: "hands", boots: "feet" };
export function lootArms(it) {
  if (it.cat === "weapon") return { slot: "melee", dmg: Math.round(8 + (it.fx || 0) * 0.8), acc: it.sh === "taser" ? 82 : 76, weight: LOOT_WEIGHT[it.sh] || 1, lvl: 1,
    effect: it.sh === "taser" ? "stun" : null };
  return { slot: LOOT_SLOT[it.sh] || "body", def: Math.min(60, Math.round((it.fx || 0) * 1.2)), weight: LOOT_WEIGHT[it.sh] || 1.5, lvl: 1 };
}

// Extra item pictures used by the armoury.
export const ARMS_SHAPES = {
  knife: c => `<path d="M8 32L32 12l6 2-2 6-24 18z" fill="${c}"/><path d="M8 32l-2 6 6-2" stroke="${c}"/><path d="M12 30l6 6" stroke="#10141c" stroke-width="3"/>`,
  pistol: c => `<path d="M8 14h32v8H22l-2 4h-4l-2 12H8l2-14H8z" fill="${c}"/><circle cx="18" cy="24" r="2" fill="#10141c"/>`,
  revolver: c => `<path d="M6 16h30v5H22v3l-2 2h-4l-2 12H8l2-14H6z" fill="${c}"/><rect x="20" y="20" width="8" height="7" rx="3" fill="${c}"/><path d="M36 17h6" stroke="${c}" stroke-width="3"/>`,
  shotgun: c => `<path d="M4 18h38v5H20l-4 3H6l-2 10H2l2-14z" fill="${c}"/><path d="M18 26h10v3H18z" fill="${c}"/>`,
  smg: c => `<path d="M6 16h34v7H26v10h-5V23h-4l-2 12H9l2-12H6z" fill="${c}"/><path d="M40 18h4" stroke="${c}" stroke-width="3"/>`,
  rifle: c => `<path d="M2 20h42v4H22l-6 4H6l-4 6H0l2-10z" fill="${c}"/><rect x="18" y="14" width="12" height="4" rx="2" fill="${c}"/>`,
  grenade: c => `<circle cx="24" cy="28" r="12" fill="${c}"/><rect x="20" y="10" width="8" height="6" fill="${c}"/><path d="M28 12q8-2 8 6" stroke="${c}"/>`,
  ammo: c => `<rect x="8" y="16" width="8" height="22" rx="2" fill="${c}"/><rect x="20" y="16" width="8" height="22" rx="2" fill="${c}"/><rect x="32" y="16" width="8" height="22" rx="2" fill="${c}"/><path d="M8 18q4-8 8 0M20 18q4-8 8 0M32 18q4-8 8 0" fill="${c}"/>`,
  trousers: c => `<path d="M14 6h20l2 36h-8l-4-24-4 24h-8z" fill="${c}"/><path d="M14 10h20" stroke="#10141c" stroke-width="2"/>`,
};
export const SLOT_NAMES = { melee: "Melee", sidearm: "Sidearm", long: "Long gun", throw: "Throwables", head: "Head", body: "Body", hands: "Hands", legs: "Legs", feet: "Feet" };
export const carryLimit = str => Math.round((12 + Math.sqrt(Math.max(0, str))) * 10) / 10; // kg
