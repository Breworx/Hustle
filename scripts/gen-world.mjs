// Builds the world travel data from Natural Earth (public domain, naturalearthdata.com).
// Usage: node scripts/gen-world.mjs <folder with ne_10m_populated_places_simple.geojson, ne_50m_admin_0_countries.geojson, ne_110m_admin_0_countries.geojson>
// Writes src/game/world-data.js (countries and towns) and public/world/*.json (map outlines).
// You only need to run this again to change which towns are picked or how maps are drawn.
import fs from "node:fs";
import { CITIES as NZ_CITIES } from "../src/game/travel.js";
const dir = process.argv[2];
const read = f => JSON.parse(fs.readFileSync(dir + "/" + f, "utf8"));
const places = read("ne_10m_populated_places_simple.geojson").features.map(f => f.properties);
const countries50 = read("ne_50m_admin_0_countries.geojson").features;
const countries110 = read("ne_110m_admin_0_countries.geojson").features;
const OUT = new URL("../public/world/", import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

const ZONE = { "Northern America": "nam", "Central America": "lat", "South America": "lat", "Caribbean": "lat", "Western Europe": "weu", "Northern Europe": "neu",
  "Southern Europe": "seu", "Eastern Europe": "eeu", "Northern Africa": "mena", "Western Asia": "mena", "Eastern Africa": "ssa", "Middle Africa": "ssa", "Southern Africa": "ssa",
  "Western Africa": "ssa", "Southern Asia": "sas", "Eastern Asia": "eas", "South-Eastern Asia": "sea", "Central Asia": "cas", "Australia and New Zealand": "oce",
  "Melanesia": "oce", "Micronesia": "oce", "Polynesia": "oce", "Seven seas (open ocean)": "oce" };
const SKIP = new Set(["Somaliland", "N. Cyprus", "Siachen Glacier", "Indian Ocean Ter.", "Ashmore and Cartier Is.", "Antarctica", "Fr. S. Antarctic Lands", "Heard I. and McDonald Is.", "Br. Indian Ocean Ter.", "S. Geo. and the Is."]);
const R = 6371, rad = x => x * Math.PI / 180;
const km = (a, b) => 2 * R * Math.asin(Math.sqrt(Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14);
const polys = g => g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
function inRing(pt, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j];
  if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
// Which landmass (polygon) of a country a point is on: the one it's inside, or the nearest.
function partOf(ps, lat, lon) {
  for (let i = 0; i < ps.length; i++) if (inRing([lon, lat], ps[i][0])) return i;
  let best = 0, bd = 1e9; ps.forEach((p, i) => p[0].forEach(([x, y]) => { const d = (x - lon) ** 2 + (y - lat) ** 2; if (d < bd) { bd = d; best = i; } })); return best;
}
function simplify(pts, tol) { // Douglas-Peucker
  if (pts.length < 4) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [x1, y1] = pts[a], [x2, y2] = pts[b]; const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) { const t = Math.max(0, Math.min(1, ((pts[i][0] - x1) * dx + (pts[i][1] - y1) * dy) / L)); const d = (pts[i][0] - x1 - t * dx) ** 2 + (pts[i][1] - y1 - t * dy) ** 2; if (d > md) { md = d; mi = i; } }
    if (md > tol * tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]);
}

const iso2 = p => (p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2);
const out = { countries: [], cities: [] };
const used = new Set();
for (const f of countries50) {
  const P = f.properties; const iso = iso2(P); if (!iso || iso === "-99" || SKIP.has(P.NAME) || used.has(iso)) continue;
  let ps = polys(f.geometry); if (!ps.length) continue;
  // Countries that straddle the 180° line are drawn with their western bits moved east.
  const lons = ps.flatMap(p => p[0].map(c => c[0])); const shift = Math.max(...lons) > 170 && Math.min(...lons) < -170 && P.ADM0_A3 !== "USA" ? 1 : 0;
  const S = lon => shift && lon < 0 ? lon + 360 : lon;
  let towns;
  if (iso === "NZ") towns = NZ_CITIES.filter(c => c.id !== "home").map(c => ({ id: c.id, n: c.n, lat: c.lat, lon: c.lon, pop: 0, cap: c.id === "wlg", air: c.air, rail: c.rail, part: partOf(ps, c.lat, c.lon), lvl: c.lvl }));
  else {
    const mine = places.filter(p => p.adm0_a3 === P.ADM0_A3 || p.adm0_a3 === P.ISO_A3 || (p.iso_a2 === iso && p.sov0name === P.SOVEREIGNT)).sort((a, b) => (b.adm0cap - a.adm0cap) || (b.pop_max - a.pop_max));
    if (!mine.length) continue;
    const big = mine.filter(p => p.pop_max >= 100000).length;
    const want = big >= 25 ? 12 : big >= 10 ? 10 : big >= 4 ? 8 : Math.max(1, Math.min(mine.length, 5));
    const minGap = big >= 10 ? 60 : 25;
    towns = [];
    for (const p of [mine[0], ...mine.slice(1).sort((a, b) => b.pop_max - a.pop_max)]) {
      if (towns.length >= want) break;
      if (towns.some(t => km([t.lat, t.lon], [p.latitude, p.longitude]) < minGap)) continue;
      let id = iso.toLowerCase() + "_" + slug(p.nameascii || p.name); while (towns.some(t => t.id === id)) id += "2";
      towns.push({ id, n: p.name.replace(/\s+/g, " "), lat: +p.latitude.toFixed(3), lon: +p.longitude.toFixed(3), pop: p.pop_max, cap: !!p.adm0cap, air: !!p.adm0cap || p.pop_max >= 150000, rail: false, part: partOf(ps, p.latitude, p.longitude) });
    }
    const railTowns = towns.filter(t => t.pop >= 400000);
    if (railTowns.length >= 2) railTowns.forEach(t => t.rail = true);
    if (!towns.some(t => t.air)) towns[0].air = true;
    // Levels: the capital and biggest towns open first, the rest as you level up.
    const order = [...towns].sort((a, b) => (b.cap - a.cap) || (b.pop - a.pop));
    order.forEach((t, i) => t.lvl = Math.min(25, 1 + i * 2));
  }
  // Where Greyhaven sits in this country: on land, near the capital but clear of the other towns.
  const cap = towns.find(t => t.cap) || towns[0];
  let home = null;
  if (iso === "NZ") { const h = NZ_CITIES.find(c => c.id === "home"); home = [h.lat, h.lon, partOf(ps, h.lat, h.lon)]; }
  else for (const d of [60, 90, 130, 40, 180, 25, 12]) { for (let a = 0; a < 360 && !home; a += 30) {
      const lat = cap.lat + d / 111 * Math.cos(rad(a)), lon = cap.lon + d / (111 * Math.cos(rad(cap.lat))) * Math.sin(rad(a));
      if (ps.some(p => inRing([lon, lat], p[0])) && towns.every(t => km([t.lat, t.lon], [lat, lon]) > Math.min(d * 0.6, 35))) home = [+lat.toFixed(3), +lon.toFixed(3), partOf(ps, lat, lon)]; }
    if (home) break; }
  if (!home) home = [+(cap.lat + 0.05).toFixed(3), +(cap.lon + 0.05).toFixed(3), cap.part];
  const hub = (towns.find(t => t.cap && t.air) || towns.find(t => t.air) || towns[0]).id;
  used.add(iso);
  out.countries.push([iso, P.NAME_EN === "United States of America" ? "United States" : (P.NAME_EN || P.NAME), ZONE[P.SUBREGION] || "oce", home[0], home[1], home[2], hub]);
  for (const t of towns) out.cities.push([t.id, t.n, iso, t.lat, t.lon, t.lvl, (t.cap ? 1 : 0) | (t.air ? 2 : 0) | (t.rail ? 4 : 0), t.part]);

  // The map: keep landmasses with a town or Greyhaven on them, or big ones; simplify; project to fit 320 wide.
  const hasTown = new Set([...towns.map(t => t.part), home[2]]);
  const maxA = Math.max(...ps.map(p => ringArea(p[0])));
  let keep = ps.map((p, i) => ({ p: p[0], i })).filter(({ p, i }) => hasTown.has(i) || ringArea(p) >= maxA * (P.ADM0_A3 === "USA" ? 0.3 : 0.02));
  const all = keep.flatMap(k => k.p).concat(towns.map(t => [t.lon, t.lat]), [[home[1], home[0]]]);
  let x0 = Math.min(...all.map(c => S(c[0]))), x1 = Math.max(...all.map(c => S(c[0]))), y0 = Math.min(...all.map(c => c[1])), y1 = Math.max(...all.map(c => c[1]));
  const padX = Math.max(0.15, (x1 - x0) * 0.04), padY = Math.max(0.15, (y1 - y0) * 0.04); x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  const kx = Math.cos(rad((y0 + y1) / 2)); const W = 320, k = W / Math.max(1e-6, (x1 - x0) * kx); let H = (y1 - y0) * k;
  let kk = k; if (H > 440) { kk = k * 440 / H; H = 440; }
  const Wd = (x1 - x0) * kx * kk;
  const tol = Math.max(x1 - x0, y1 - y0) / 500;
  const paths = keep.map(({ p }) => { const s = simplify(p, tol); if (s.length < 4) return null;
    return "M" + s.map(([lon, lat]) => `${((S(lon) - x0) * kx * kk).toFixed(1)} ${((y1 - lat) * kk).toFixed(1)}`).join("L") + "Z"; }).filter(Boolean);
  fs.writeFileSync(new URL(iso + ".json", OUT), JSON.stringify({ w: +Wd.toFixed(1), h: +H.toFixed(1), x0: +x0.toFixed(4), y1: +y1.toFixed(4), kx: +kx.toFixed(5), k: +kk.toFixed(4), shift, d: paths.join("") }));
}
// The world map for flying abroad: 720 × 360, plain longitude/latitude.
const wd = countries110.flatMap(f => polys(f.geometry).map(p => { const s = simplify(p[0], 0.6); return s.length < 4 ? "" :
  "M" + s.map(([lon, lat]) => `${((lon + 180) * 2).toFixed(0)} ${((90 - lat) * 2).toFixed(0)}`).join("L") + "Z"; })).join("");
fs.writeFileSync(new URL("world.json", OUT), JSON.stringify({ w: 720, h: 360, d: wd }));
out.countries.sort((a, b) => a[1].localeCompare(b[1]));
fs.writeFileSync(new URL("../src/game/world-data.js", import.meta.url),
  "// Generated by scripts/gen-world.mjs from Natural Earth (public domain). Don't edit by hand.\n" +
  "// COUNTRIES: [iso, name, zone, greyhaven lat, greyhaven lon, greyhaven landmass, hub town]\n" +
  "// TOWNS: [id, name, iso, lat, lon, level, flags (1 capital, 2 airport, 4 railway), landmass]\n" +
  "export const COUNTRIES = " + JSON.stringify(out.countries) + ";\nexport const TOWNS = " + JSON.stringify(out.cities) + ";\n");
console.log("countries", out.countries.length, "towns", out.cities.length);
