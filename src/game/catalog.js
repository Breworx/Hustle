import {SEASONS,TROPHIES} from "./seasons.js";
import {SHOP_ARMS,AMMO,ARMS_SHAPES} from "./arms.js";
import {CITY_ITEMS,TRAVEL_SHAPES} from "./travel.js";
import {WORLD_ITEMS} from "./worldgoods.js";
// Shared game content: item art, the 1,000-item catalogue and portraits.
// Used by the web app for display and by scripts/gen-sql.mjs to seed the database.
const I={
bag:`<path d="M12 18h24l-2 22H14z" fill="#f2a33a"/><path d="M18 18v-4a6 6 0 0 1 12 0v4"/>`,
pack:`<path d="M13 16a11 11 0 0 1 22 0v24H13z" fill="#a06a33"/><rect x="17" y="26" width="14" height="9" rx="2" fill="#7a5a3a"/><path d="M19 10V7h10v3"/><path d="M13 22h22"/>`,
wallet:`<rect x="7" y="13" width="34" height="24" rx="3" fill="#7a5a3a"/><path d="M28 21h13v9H28a4.5 4.5 0 0 1 0-9z" fill="#f2a33a"/><circle cx="29" cy="25.5" r="1.5" fill="#10141c" stroke="none"/>`,
spray:`<rect x="15" y="17" width="14" height="25" rx="3" fill="#d97bb3"/><rect x="18" y="11" width="8" height="6" fill="#e7e2d6"/><path d="M31 10l6-3M32 14h7M31 18l6 3" stroke="#d97bb3"/>`,
sneaker:`<path d="M5 32c0-7 4-13 8-15l6 6 8-2 6 4c5 1 10 3 10 7v4H5z" fill="#e7e2d6"/><path d="M5 36h38" stroke="#f2a33a" stroke-width="4"/><path d="M17 22l3 3M21 21l2 3" stroke="#10141c"/>`,
ute:`<path d="M3 29h42v8H3z" fill="#5aa7e0"/><path d="M7 29l5-10h13v10" fill="#5aa7e0"/><path d="M13 21h10v7H10z" fill="#bfe0f5"/><circle cx="13" cy="37" r="4.5" fill="#10141c"/><circle cx="36" cy="37" r="4.5" fill="#10141c"/>`,
phone:`<rect x="14" y="5" width="20" height="38" rx="4" fill="#273042"/><rect x="17" y="10" width="14" height="24" rx="1" fill="#5fbf8a"/><path d="M20 16h8M20 20h6M20 24h8" stroke="#10141c"/><circle cx="24" cy="38.5" r="1.5" fill="#e7e2d6"/>`,
diamond:`<path d="M14 13h20l7 9-17 19L7 22z" fill="#5aa7e0"/><path d="M7 22h34M19 13l-3 9 8 19 8-19-3-9" stroke="#e7e2d6"/>`,
crate:`<rect x="7" y="11" width="34" height="30" fill="#a06a33"/><path d="M7 11l34 30M41 11L7 41M7 26h34"/>`,
boat:`<path d="M3 29h42l-6 10H9z" fill="#5aa7e0"/><rect x="12" y="19" width="10" height="10" fill="#e2574c"/><rect x="22" y="21" width="10" height="8" fill="#f2a33a"/><path d="M4 44c4-2 8 2 12 0s8 2 12 0 8 2 12 0"/>`,
vault:`<rect x="6" y="6" width="36" height="36" rx="4" fill="#273042"/><circle cx="24" cy="24" r="11" fill="#f2a33a"/><path d="M24 14v20M14 24h20M17 17l14 14M31 17L17 31" stroke="#10141c"/><circle cx="24" cy="24" r="3" fill="#10141c" stroke="none"/>`,
van:`<path d="M3 14h28v23H3z" fill="#8f96a6"/><path d="M31 20h9l5 8v9H31z" fill="#8f96a6"/><path d="M33 22h6l3 5h-9z" fill="#bfe0f5"/><rect x="7" y="19" width="18" height="8" fill="#273042"/><path d="M10 23h12" stroke="#f2a33a" stroke-width="3"/><circle cx="11" cy="38" r="4.5" fill="#10141c"/><circle cx="37" cy="38" r="4.5" fill="#10141c"/>`,
art:`<rect x="6" y="8" width="36" height="30" fill="#a06a33"/><rect x="10" y="12" width="28" height="22" fill="#5aa7e0"/><circle cx="31" cy="18" r="3.5" fill="#f5c96a" stroke="none"/><path d="M10 34l9-11 6 7 4-4 9 8z" fill="#2f6b3a"/>`,
med:`<rect x="6" y="14" width="36" height="26" rx="4" fill="#e7e2d6"/><path d="M24 20v14M17 27h14" stroke="#e2574c" stroke-width="5"/><path d="M18 14v-4h12v4"/>`,
drink:`<rect x="15" y="7" width="18" height="35" rx="4" fill="#5fbf8a"/><path d="M15 12h18" stroke="#10141c"/><path d="M26 17l-5 10h6l-4 9" stroke="#10141c" stroke-width="3"/>`,
lager:`<path d="M20 5h8v8l4 6v23H16V19l4-6z" fill="#f2a33a"/><rect x="16" y="24" width="16" height="11" fill="#e7e2d6"/><path d="M20 29h8" stroke="#10141c"/>`,
charm:`<circle cx="18" cy="18" r="7" fill="#5fbf8a"/><circle cx="30" cy="18" r="7" fill="#5fbf8a"/><circle cx="18" cy="30" r="7" fill="#5fbf8a"/><circle cx="30" cy="30" r="7" fill="#5fbf8a"/><path d="M24 24l10 18"/>`,
burner:`<rect x="15" y="13" width="18" height="29" rx="3" fill="#8f96a6"/><rect x="18" y="17" width="12" height="9" fill="#10141c"/><path d="M24 11c-4-3 2-5-1-9 5 2 6 6 3 9" fill="#ff6a3d" stroke="#ff6a3d"/>`,
str:`<rect x="3" y="15" width="8" height="18" rx="2" fill="#f2a33a"/><rect x="37" y="15" width="8" height="18" rx="2" fill="#f2a33a"/><rect x="11" y="21" width="26" height="6" fill="#e7e2d6"/>`,
def:`<path d="M24 5l16 6v11c0 10-7 17-16 21C15 39 8 32 8 22V11z" fill="#5aa7e0"/><path d="M24 12v24M16 22h16" stroke="#e7e2d6"/>`,
spd:`<path d="M27 3L10 27h12l-3 18 19-26H26z" fill="#f2a33a"/>`,
dex:`<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10" fill="#d97bb3"/><circle cx="24" cy="24" r="3.5" fill="#10141c"/><path d="M38 10L27 21"/>`,
home:`<path d="M7 24L24 9l17 15v17H7z" fill="#273042"/><rect x="20" y="28" width="8" height="13" fill="#f2a33a"/>`,
mask:`<path d="M5 19c7-5 31-5 38 0 0 11-6 15-12 15-3 0-4-3-7-3s-4 3-7 3C11 34 5 30 5 19z" fill="#e7e2d6"/><ellipse cx="16" cy="22" rx="4.5" ry="3" fill="#10141c"/><ellipse cx="32" cy="22" rx="4.5" ry="3" fill="#10141c"/>`,
fist:`<path d="M10 38L36 12" stroke-width="5" stroke="#a06a33"/><path d="M38 38L12 12" stroke-width="5" stroke="#8f96a6"/><circle cx="36" cy="12" r="4" fill="#a06a33"/><circle cx="12" cy="12" r="4" fill="#8f96a6"/>`,
bank:`<path d="M5 18L24 7l19 11z" fill="#f2a33a"/><path d="M10 21v15M18 21v15M30 21v15M38 21v15" stroke-width="3"/><path d="M5 40h38" stroke-width="3"/>`,
empire:`<rect x="6" y="18" width="14" height="24" fill="#273042"/><rect x="20" y="6" width="22" height="36" fill="#33405a"/><path d="M25 12h4M33 12h4M25 19h4M33 19h4M25 26h4M33 26h4M10 24h6M10 31h6" stroke="#f5c96a" stroke-width="3"/><path d="M28 42v-8h6v8" fill="#f2a33a"/>`,
taxi:`<path d="M3 28h42v9H3z" fill="#f5d34a"/><path d="M10 28l5-9h18l5 9" fill="#f5d34a"/><rect x="19" y="13" width="10" height="5" fill="#10141c"/><circle cx="13" cy="37" r="4.5" fill="#10141c"/><circle cx="35" cy="37" r="4.5" fill="#10141c"/>`,
cuffs:`<circle cx="15" cy="28" r="9"/><circle cx="33" cy="28" r="9"/><path d="M22 20h4" stroke-width="3"/>`,
star:`<path d="M24 5l5.6 12 13 1.5-9.7 9 2.6 13L24 34l-11.5 6.5 2.6-13-9.7-9 13-1.5z" fill="#f2a33a"/>`,
plan:`<rect x="5" y="8" width="38" height="32" rx="2" fill="#1d4a7a"/><path d="M11 16h14v10H11zM29 16h8v18h-8zM11 30h14" stroke="#cfe3ff"/><path d="M15 34l18-14" stroke="#ff6a3d" stroke-dasharray="3 2"/><circle cx="33" cy="20" r="2.5" fill="#ff6a3d" stroke="none"/>`,
dice:`<rect x="5" y="16" width="22" height="22" rx="4" fill="#e7e2d6" transform="rotate(-12 16 27)"/><rect x="21" y="9" width="22" height="22" rx="4" fill="#e2574c"/><circle cx="27" cy="15" r="2" fill="#fff" stroke="none"/><circle cx="32" cy="20" r="2" fill="#fff" stroke="none"/><circle cx="37" cy="25" r="2" fill="#fff" stroke="none"/><circle cx="12" cy="24" r="2" fill="#10141c" stroke="none"/><circle cx="19" cy="31" r="2" fill="#10141c" stroke="none"/>`,
paper:`<rect x="6" y="9" width="30" height="32" rx="2" fill="#e7e2d6"/><path d="M36 15h6v22a4 4 0 0 1-4 4H10" fill="#c9c2b0"/><rect x="10" y="14" width="22" height="6" fill="#10141c" stroke="none"/><path d="M10 25h10M10 30h10M10 35h10M24 25h8v10h-8z" stroke="#10141c"/>`,
trophy:`<path d="M15 7h18v10a9 9 0 0 1-18 0z" fill="#f5c96a"/><path d="M15 10H8c0 6 3 9 7 9M33 10h7c0 6-3 9-7 9"/><path d="M24 26v7" stroke-width="3"/><rect x="16" y="33" width="16" height="7" rx="1" fill="#a06a33"/>`,
crew:`<circle cx="17" cy="17" r="6" fill="#d97bb3"/><circle cx="32" cy="17" r="6" fill="#5aa7e0"/><path d="M6 40c0-8 5-13 11-13s11 5 11 13z" fill="#d97bb3"/><path d="M21 40c0-8 5-13 11-13s11 5 11 13z" fill="#5aa7e0"/>`,
map:`<path d="M6 12l12-4 12 4 12-4v28l-12 4-12-4-12 4z" fill="#2f6b3a"/><path d="M18 8v28M30 12v28"/><path d="M24 30s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" fill="#e2574c"/><circle cx="24" cy="18" r="2.5" fill="#10141c" stroke="none"/>`,
bin:`<rect x="10" y="14" width="28" height="28" rx="2" fill="#2f6b3a"/><rect x="8" y="9" width="32" height="6" rx="2" fill="#3c7a48"/><path d="M17 20v16M24 20v16M31 20v16" stroke="#10141c"/>`,
stall:`<path d="M6 18l4-10h28l4 10z" fill="#e2574c"/><path d="M6 18q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0" fill="#e7e2d6"/><rect x="10" y="22" width="28" height="18" fill="#273042"/><rect x="16" y="28" width="16" height="12" fill="#f5c96a"/>`,
chart:`<rect x="6" y="6" width="36" height="36" fill="#efe7d4"/><path d="M10 34l8-10 6 6 8-14 6 6" stroke="#2c7a3a" stroke-width="3" fill="none"/><path d="M10 39h28" stroke="#1b1714"/><circle cx="38" cy="22" r="2.5" fill="#c3301f" stroke="none"/>`,
book:`<rect x="10" y="6" width="28" height="36" rx="2" fill="#7a3a2a"/><path d="M14 6v36" stroke="#10141c"/><circle cx="25" cy="18" r="4" fill="#efe7d4" stroke="none"/><path d="M19 30a6 5 0 0 1 12 0z" fill="#efe7d4" stroke="none"/>`,
more:`<circle cx="12" cy="24" r="3.5" fill="#e7e2d6"/><circle cx="24" cy="24" r="3.5" fill="#e7e2d6"/><circle cx="36" cy="24" r="3.5" fill="#e7e2d6"/>`
};
const ic=(n,cls="ic")=>`<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${I[n]||""}</svg>`;
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SKIN=["#c58c5c","#8d5a3b","#e0b48c","#6b4128","#d9a27a","#a8714a"];
function face(f){
  const sk=f.skin;let s=`<svg class="face" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${f.bg}"/><circle cx="32" cy="24" r="26" fill="#ffffff" opacity=".06"/>`;
  s+=`<path d="M6 64c2-14 13-19 26-19s24 5 26 19z" fill="${f.shirt}"/><rect x="27" y="38" width="10" height="9" fill="${sk}"/>`;
  if(f.hat==="long")s+=`<path d="M17 30c-2-15 5-21 15-21s17 6 15 21l2 18H15z" fill="#3a1d12"/>`;
  s+=`<ellipse cx="32" cy="28" rx="12.5" ry="14.5" fill="${sk}"/><ellipse cx="19.5" cy="29" rx="2.5" ry="3.5" fill="${sk}"/><ellipse cx="44.5" cy="29" rx="2.5" ry="3.5" fill="${sk}"/>`;
  if(f.beard)s+=`<path d="M20 30c0 12 6 15 12 15s12-3 12-15c-3 5-7 6-12 6s-9-1-12-6z" fill="#2a1d16"/>`;
  s+={beanie:`<path d="M18 24c0-11 6-16 14-16s14 5 14 16z" fill="#e2574c"/><rect x="17" y="21" width="30" height="5" rx="2" fill="#a83a31"/>`,
   cap:`<path d="M19 22c0-9 6-13 13-13s13 4 13 13z" fill="#273042"/><path d="M30 21h22l-2 4H30z" fill="#1a2030"/>`,
   slick:`<path d="M19 26c-1-12 5-17 13-17s15 4 13 17c-2-6-6-9-13-9s-11 3-13 9z" fill="#14100d"/>`,
   bald:`<ellipse cx="27" cy="17" rx="4" ry="2" fill="#fff" opacity=".25"/>`,
   bandana:`<path d="M19 21c1-8 6-12 13-12s12 4 13 12z" fill="#5aa7e0"/><path d="M44 18l7 4-5 3z" fill="#5aa7e0"/>`,
   fedora:`<path d="M22 18c0-8 4-11 10-11s10 3 10 11z" fill="#2a2a2a"/><rect x="14" y="17" width="36" height="4" rx="2" fill="#2a2a2a"/><rect x="22" y="15" width="20" height="2.5" fill="#f2a33a"/>`,
   mohawk:`<path d="M28 3h8l1 16h-10z" fill="#4fe3ff"/>`,
   long:`<path d="M19 24c0-10 6-14 13-14s13 4 13 14c-4-5-8-7-13-7s-9 2-13 7z" fill="#3a1d12"/>`,
   headset:`<path d="M18 28c0-12 6-17 14-17s14 5 14 17" stroke="#10141c" stroke-width="3" fill="none"/><rect x="15" y="25" width="6" height="9" rx="2" fill="#5fbf8a"/><rect x="43" y="25" width="6" height="9" rx="2" fill="#5fbf8a"/>`}[f.hat]||"";
  if(f.shades)s+=`<rect x="21" y="25" width="9" height="5" rx="1.5" fill="#0b0e14"/><rect x="34" y="25" width="9" height="5" rx="1.5" fill="#0b0e14"/><path d="M30 27h4" stroke="#0b0e14" stroke-width="1.5"/>`;
  else if(f.glasses)s+=`<circle cx="26.5" cy="28" r="4" fill="#bfe0f5" fill-opacity=".25" stroke="#10141c" stroke-width="1.5"/><circle cx="37.5" cy="28" r="4" fill="#bfe0f5" fill-opacity=".25" stroke="#10141c" stroke-width="1.5"/><circle cx="26.5" cy="28" r="1.4" fill="#1a120c"/><circle cx="37.5" cy="28" r="1.4" fill="#1a120c"/>`;
  else s+=`<path d="${f.kind?"M22 24l7-1M42 24l-7-1":"M22 23l7 2M42 23l-7 2"}" stroke="#1a120c" stroke-width="2" stroke-linecap="round"/><circle cx="26.5" cy="28" r="1.7" fill="#1a120c"/><circle cx="37.5" cy="28" r="1.7" fill="#1a120c"/>`;
  s+=`<path d="M28 37q4 ${f.grin?3:-1.5} 8 0" stroke="#1a120c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  if(f.lips)s+=`<path d="M28.5 37q3.5 2.5 7 0q-3.5-1.5-7 0z" fill="#b5434f"/>`;
  if(f.scar)s+=`<path d="M38 21l3 11M37 24l4-1M38 28l4-1" stroke="#a3332b" stroke-width="1.5"/>`;
  if(f.chain)s+=`<path d="M21 50q11 9 22 0" stroke="#f2a33a" stroke-width="2.5" fill="none"/><circle cx="32" cy="55" r="2.5" fill="#f2a33a"/>`;
  return s+`</svg>`;
}
function hashS(s){let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
const LBL={energy:"stamina",nerve:"grit",happy:"mood",life:"health"};
const RAR=[["Common","#8f98a8"],["Uncommon","#3fbf7f"],["Rare","#4a9df0"],["Very rare","#a978f0"],["Legendary","#f0a83a"]];
const RW=[620,250,95,30,5];
const CATN={contraband:"Contraband",use:"Consumable",food:"Food & drink",junk:"Junk",elec:"Electronics",jewel:"Jewellery",collect:"Collectible",fossil:"Fossil & relic",weapon:"Weapon",armour:"Armour",box:"Mystery box",plush:"Plushie",figure:"Figurine",stamp:"Stamp",coin:"Old coin",card:"Trading card",record:"Vinyl",comic:"Comic"};
const SHP={
 cap:c=>`<circle cx="24" cy="24" r="14" fill="${c}"/><circle cx="24" cy="24" r="9" fill="none" stroke="#10141c" stroke-dasharray="2 2"/>`,
 ticket:c=>`<rect x="6" y="15" width="36" height="18" rx="2" fill="${c}"/><path d="M14 15v18" stroke-dasharray="2 2" stroke="#10141c"/><path d="M19 21h17M19 27h12" stroke="#10141c"/>`,
 umbrella:c=>`<path d="M6 24a18 14 0 0 1 36 0z" fill="${c}"/><path d="M24 24v14a4 4 0 0 1-8 0M24 10V7M14 18l-4 7M34 18l3 6"/>`,
 key:c=>`<circle cx="14" cy="24" r="7" fill="${c}"/><circle cx="14" cy="24" r="2.5" fill="#10141c" stroke="none"/><path d="M21 24h20M34 24v6M39 24v5" stroke-width="3" stroke="${c}"/>`,
 sock:c=>`<path d="M18 6h12v20l8 6a5 5 0 0 1-4 9l-14-6a6 6 0 0 1-2-5z" fill="${c}"/><path d="M18 11h12" stroke="#10141c"/>`,
 chips:c=>`<path d="M15 18l2-10M21 18l1-12M27 18l1-11M33 18l-1-9" stroke="#f5c96a" stroke-width="3"/><path d="M12 18h24l-3 22H15z" fill="${c}"/>`,
 feather:c=>`<path d="M36 6C20 10 12 24 12 40l4-2c2-14 10-24 20-32z" fill="${c}"/><path d="M12 40L30 14"/>`,
 hubcap:c=>`<circle cx="24" cy="24" r="16" fill="${c}"/><circle cx="24" cy="24" r="5" fill="#10141c"/><path d="M24 8v11M24 29v11M8 24h11M29 24h11"/><path d="M30 10l-4 6" stroke="#10141c"/>`,
 gum:c=>`<rect x="10" y="14" width="28" height="20" rx="4" fill="${c}"/><path d="M10 22h28" stroke="#fff"/>`,
 jandal:c=>`<ellipse cx="24" cy="24" rx="10" ry="18" fill="${c}"/><path d="M24 14l-7 10M24 14l7 10" stroke="#10141c" stroke-width="2.5"/>`,
 lotto:c=>`<rect x="8" y="10" width="32" height="28" rx="2" fill="${c}"/><circle cx="17" cy="20" r="4" fill="#f5c96a"/><circle cx="31" cy="20" r="4" fill="#f5c96a"/><circle cx="24" cy="29" r="4" fill="#c9ced6"/>`,
 pie:c=>`<path d="M8 26q16-14 32 0v8H8z" fill="${c}"/><path d="M8 26h32v8H8z" fill="#a8692a"/><path d="M14 22l3 3M22 19l3 3M30 21l3 3" stroke="#7a4a1a"/>`,
 cup:c=>`<path d="M12 16h22l-3 24H15z" fill="${c}"/><path d="M34 20h4a4 4 0 0 1 0 8h-5"/><ellipse cx="23" cy="16" rx="11" ry="3" fill="#a06a33"/><path d="M20 15q3-2 6 0" stroke="#efe7d4"/>`,
 flip:c=>`<rect x="15" y="6" width="18" height="17" rx="3" fill="${c}"/><rect x="15" y="25" width="18" height="17" rx="3" fill="${c}"/><rect x="18" y="9" width="12" height="10" fill="#9fd3ff"/><path d="M19 30h2M23 30h2M27 30h2M19 35h2M23 35h2M27 35h2"/>`,
 tablet:c=>`<rect x="8" y="8" width="32" height="32" rx="4" fill="${c}"/><rect x="12" y="12" width="24" height="22" fill="#9fd3ff"/><path d="M14 14l8 10 4-4 6 10" stroke="#10141c"/>`,
 buds:c=>`<path d="M12 14a6 6 0 0 1 8 6v14h-4V22a6 6 0 0 1-4-8z" fill="${c}"/><path d="M36 14a6 6 0 0 0-8 6v14h4V22a6 6 0 0 0 4-8z" fill="${c}"/>`,
 console:c=>`<path d="M8 20q0-6 8-6h16q8 0 8 6l2 12q1 6-5 6l-6-6H17l-6 6q-6 0-5-6z" fill="${c}"/><path d="M14 22h6M17 19v6"/><circle cx="31" cy="21" r="1.6" fill="#fff" stroke="none"/><circle cx="35" cy="24" r="1.6" fill="#fff" stroke="none"/>`,
 laptop:c=>`<rect x="10" y="10" width="28" height="20" rx="2" fill="${c}"/><rect x="13" y="13" width="22" height="14" fill="#9fd3ff"/><path d="M5 34h38l-3 4H8z" fill="${c}"/>`,
 drone:c=>`<path d="M18 22L10 16M30 22l8-6M18 26l-8 6M30 26l8 6"/><rect x="18" y="20" width="12" height="8" rx="2" fill="${c}"/><ellipse cx="10" cy="16" rx="6" ry="2" fill="${c}"/><ellipse cx="38" cy="16" rx="6" ry="2" fill="${c}"/><ellipse cx="10" cy="32" rx="6" ry="2" fill="${c}"/><ellipse cx="38" cy="32" rx="6" ry="2" fill="${c}"/>`,
 swatch:c=>`<rect x="16" y="4" width="16" height="40" rx="4" fill="#273042"/><rect x="12" y="13" width="24" height="22" rx="6" fill="${c}"/><rect x="15" y="16" width="18" height="16" rx="3" fill="#10141c"/><path d="M18 26l3-4 3 3 5-6" stroke="#7bd389"/>`,
 proto:c=>`<rect x="14" y="5" width="20" height="38" rx="5" fill="${c}"/><rect x="16" y="8" width="16" height="31" rx="3" fill="#10141c"/><circle cx="24" cy="22" r="6" fill="none" stroke="${c}"/><circle cx="24" cy="22" r="2" fill="${c}" stroke="none"/>`,
 chain:c=>`<path d="M10 10q14 34 28 0" stroke="${c}" stroke-width="5" fill="none" stroke-dasharray="5 2"/><circle cx="24" cy="33" r="6" fill="${c}"/>`,
 ring:(c,g)=>`<circle cx="24" cy="30" r="12" fill="none" stroke="${c}" stroke-width="5"/><path d="M18 14l6-8 6 8-6 6z" fill="${g}"/>`,
 earrings:c=>`<path d="M15 8v8M33 8v8"/><circle cx="15" cy="22" r="6" fill="${c}"/><circle cx="33" cy="22" r="6" fill="${c}"/><circle cx="13" cy="20" r="1.5" fill="#fff" stroke="none"/><circle cx="31" cy="20" r="1.5" fill="#fff" stroke="none"/>`,
 gwatch:c=>`<rect x="18" y="4" width="12" height="40" rx="3" fill="${c}"/><circle cx="24" cy="24" r="11" fill="${c}"/><circle cx="24" cy="24" r="8" fill="#fff"/><path d="M24 24v-5M24 24l4 2" stroke="#10141c"/>`,
 necklace:(c,g)=>`<path d="M8 8q16 28 32 0" stroke="${c}" stroke-width="2.5" fill="none"/><path d="M24 26l6 6-6 10-6-10z" fill="${g}"/>`,
 bigdiamond:c=>`<path d="M14 13h20l7 9-17 19L7 22z" fill="${c}"/><path d="M7 22h34M19 13l-3 9 8 19 8-19-3-9" stroke="#fff"/>`,
 msgbottle:c=>`<path d="M18 4h12v8l4 6v24H14V18l4-6z" fill="${c}" fill-opacity=".45"/><rect x="18" y="20" width="12" height="16" rx="1" fill="#efe7d4"/><rect x="19" y="2" width="10" height="5" fill="#a06a33"/>`,
 vinyl:c=>`<circle cx="24" cy="24" r="18" fill="#10141c"/><circle cx="24" cy="24" r="13" fill="none" stroke="#3a4250"/><circle cx="24" cy="24" r="6" fill="${c}"/><circle cx="24" cy="24" r="1.5" fill="#000"/>`,
 shipbottle:c=>`<path d="M8 20h26l6 3v4l-6 3H8a5 5 0 0 1 0-10z" fill="#bfe0f5" fill-opacity=".35"/><path d="M14 27h14l-2 3H16z" fill="${c}"/><path d="M20 27v-8l6 6z" fill="#fff"/><rect x="40" y="22" width="4" height="6" fill="#a06a33"/>`,
 comic:c=>`<rect x="10" y="6" width="28" height="36" fill="${c}"/><path d="M14 12h20v8H14z" fill="#f5c96a"/><path d="M15 36l6-8 4 4 6-8 3 12z" fill="#e2574c"/>`,
 rugby:c=>`<ellipse cx="24" cy="24" rx="18" ry="11" fill="${c}" transform="rotate(-30 24 24)"/><path d="M17 31l14-14M20 24l3 3M24 20l3 3M28 16l3 3" stroke="#fff"/>`,
 compass:c=>`<rect x="21" y="5" width="6" height="6" fill="${c}"/><circle cx="24" cy="26" r="16" fill="${c}"/><circle cx="24" cy="26" r="12" fill="#efe7d4"/><path d="M24 16l3 10h-6z" fill="#e2574c" stroke="none"/><path d="M24 36l3-10h-6z" fill="#10141c" stroke="none"/>`,
 oldmap:c=>`<path d="M6 12l12-4 12 4 12-4v28l-12 4-12-4-12 4z" fill="${c}"/><path d="M12 30q8-14 16-6t10-10" stroke="#a3332b" stroke-dasharray="3 2"/><path d="M32 12l4 4M36 12l-4 4" stroke="#a3332b"/>`,
 spyglass:(c,g)=>`<path d="M6 34l8-4 2 4-8 4z" fill="${c}"/><path d="M14 30l12-6 3 6-12 6z" fill="${g}"/><path d="M26 24l14-7 3 7-14 7z" fill="${c}"/>`,
 meteor:c=>`<path d="M12 18l10-8 14 4 6 14-8 12-16 2-8-12z" fill="${c}"/><circle cx="20" cy="22" r="3" fill="#10141c"/><circle cx="30" cy="30" r="2" fill="#10141c"/><path d="M26 16l4 4" stroke="#ffb547"/>`,
 tooth:c=>`<path d="M14 8h20l-4 14-6 20-6-20z" fill="${c}"/><path d="M18 14l4 6" stroke="#a0907a"/>`,
 egg:(c,g)=>`<ellipse cx="24" cy="26" rx="13" ry="17" fill="${c}"/><path d="M12 22h24M11 30h26" stroke="${g}" stroke-width="3"/><circle cx="24" cy="26" r="3" fill="${g}"/>`,
 statue:c=>`<rect x="13" y="38" width="22" height="6" fill="#273042"/><ellipse cx="22" cy="26" rx="10" ry="9" fill="${c}"/><circle cx="31" cy="17" r="5" fill="${c}"/><path d="M35 18l8 5" stroke="${c}" stroke-width="2.5"/><path d="M19 34v4M25 34v4" stroke="${c}" stroke-width="2.5"/>`,
 newspaper:()=>`<rect x="8" y="18" width="32" height="12" rx="6" fill="#efe7d4"/><path d="M14 18v12M20 18v12" stroke="#10141c"/>`,
 bikechain:c=>`<path d="M10 16h28a8 8 0 0 1 0 16H10a8 8 0 0 1 0-16z" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="4 2"/>`,
 cricketbat:c=>`<path d="M34 6l8 8-20 20-8-8z" fill="${c}"/><path d="M14 26l-8 8 4 4 8-8" fill="#273042"/>`,
 tyreiron:c=>`<path d="M8 40L34 14M28 8l12 12" stroke="${c}" stroke-width="5"/>`,
 knuckles:c=>`<path d="M14 26q10 14 20 0" fill="${c}"/><rect x="8" y="14" width="32" height="12" rx="6" fill="${c}"/><circle cx="14" cy="20" r="3" fill="#10141c"/><circle cx="21" cy="20" r="3" fill="#10141c"/><circle cx="28" cy="20" r="3" fill="#10141c"/><circle cx="35" cy="20" r="3" fill="#10141c"/>`,
 nunchucks:c=>`<path d="M14 22q10-16 20 0" stroke-dasharray="2 2"/><rect x="8" y="22" width="8" height="20" rx="3" fill="${c}" transform="rotate(-20 12 32)"/><rect x="32" y="22" width="8" height="20" rx="3" fill="${c}" transform="rotate(20 36 32)"/>`,
 taser:c=>`<path d="M8 18h24l6 6H8z" fill="${c}"/><path d="M12 24h8v14h-8z" fill="${c}"/><path d="M38 20l4-4M39 25l5 2M36 18l2-6" stroke="#4fe3ff"/>`,
 bbat:c=>`<path d="M38 6a5 5 0 0 1 6 6L16 36l-5-5z" fill="${c}"/><path d="M14 33l-6 6 2 2 6-6" fill="#273042"/>`,
 hivis:c=>`<path d="M16 8l8 4 8-4 4 6v28H12V14z" fill="${c}"/><path d="M12 26h24M12 32h24" stroke="#e7e2d6" stroke-width="3"/>`,
 hoodie:c=>`<path d="M16 8q8-4 16 0l8 8 4 18-6 2-2-10v16H12V26l-2 10-6-2 4-18z" fill="${c}"/><path d="M18 10q6 10 12 0" fill="#10141c"/><path d="M20 30h8"/>`,
 jacket:c=>`<path d="M16 8l8 4 8-4 8 8 4 18-6 2-2-10v16H12V26l-2 10-6-2 4-18z" fill="${c}"/><path d="M24 12v28M18 10l6 10 6-10"/>`,
 helmet:c=>`<path d="M8 30a16 16 0 0 1 32 0v6H8z" fill="${c}"/><path d="M14 26h20v6H14z" fill="#10141c"/>`,
 stabvest:c=>`<path d="M14 8h6l4 4 4-4h6v32H14z" fill="${c}"/><path d="M14 18h20M14 26h20M14 34h20" stroke="#10141c"/>`,
 riot:c=>`<rect x="10" y="4" width="28" height="40" rx="6" fill="${c}" fill-opacity=".6"/><rect x="14" y="10" width="20" height="6" fill="#10141c"/><path d="M14 22h20" stroke="#fff"/>`,
 trench:c=>`<path d="M16 6l8 6 8-6 8 10v28H8V16z" fill="${c}"/><path d="M24 12v32M18 20l6 4 6-4"/><circle cx="21" cy="28" r="1.5" fill="#f5c96a"/><circle cx="21" cy="34" r="1.5" fill="#f5c96a"/>`,
 box:c=>`<path d="M6 16l18-8 18 8v20l-18 8-18-8z" fill="${c}"/><path d="M6 16l18 8 18-8M24 24v20"/><text x="15" y="36" text-anchor="middle" font-family="Saira Extra Condensed,sans-serif" font-size="13" font-weight="800" fill="#fff" stroke="none">?</text>`,
 plush:(c,k)=>{let s="";if(k.includes("wings"))s+=`<path d="M12 30l-9-7 11 1zM36 30l9-7-11 1z" fill="${c}"/>`;if(k.includes("claws"))s+=`<circle cx="8" cy="22" r="5" fill="${c}"/><circle cx="40" cy="22" r="5" fill="${c}"/>`;if(k.includes("fin"))s+=`<path d="M24 22l8-14 2 14z" fill="${c}"/>`;
   s+=`<ellipse cx="24" cy="31" rx="14" ry="12" fill="${c}"/>`;if(k.includes("belly"))s+=`<ellipse cx="24" cy="33" rx="8" ry="8" fill="#fff" stroke="none"/>`;
   s+=`<circle cx="24" cy="17" r="9" fill="${c}"/><circle cx="21" cy="16" r="1.6" fill="#10141c" stroke="none"/><circle cx="27" cy="16" r="1.6" fill="#10141c" stroke="none"/>`;
   if(k.includes("longbeak"))s+=`<path d="M27 19l15 9" stroke="#e7d7b0" stroke-width="2.5"/>`;else if(k.includes("beak"))s+=`<path d="M22 19h8l-4 4z" fill="#f2a33a" stroke="none"/>`;
   if(k.includes("whisk"))s+=`<path d="M18 20h-6M30 20h6M18 22l-5 2M30 22l5 2"/>`;
   if(k.includes("tent"))s+=`<path d="M13 40q-2 6 2 6M19 42q0 5 3 4M29 42q0 5-3 4M35 40q2 6-2 6" stroke="${c}" stroke-width="3"/>`;
   return s+`<circle cx="18" cy="20" r="2" fill="#ff9fb0" stroke="none" opacity=".7"/><circle cx="30" cy="20" r="2" fill="#ff9fb0" stroke="none" opacity=".7"/>`},
 jring:(c,g)=>`<circle cx="24" cy="30" r="12" fill="none" stroke="${c}" stroke-width="5"/>${g?`<path d="M18 14l6-8 6 8-6 6z" fill="${g}"/>`:`<path d="M19 18h10" stroke="${c}" stroke-width="4"/>`}`,
 jchain:(c,g)=>`<path d="M10 10q14 34 28 0" stroke="${c}" stroke-width="4" fill="none" stroke-dasharray="4 2"/>${g?`<circle cx="24" cy="33" r="5.5" fill="${g}"/>`:`<rect x="20" y="29" width="8" height="8" fill="${c}"/>`}`,
 jbrace:(c,g)=>`<ellipse cx="24" cy="26" rx="17" ry="10" fill="none" stroke="${c}" stroke-width="5"/>${g?`<circle cx="24" cy="16" r="4" fill="${g}"/><circle cx="12" cy="19" r="2.5" fill="${g}"/><circle cx="36" cy="19" r="2.5" fill="${g}"/>`:""}`,
 jbrooch:(c,g)=>`<path d="M24 6l5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill="${c}"/>${g?`<circle cx="24" cy="24" r="5" fill="${g}"/>`:""}`,
 jpend:(c,g)=>`<path d="M8 8q16 24 32 0" stroke="${c}" stroke-width="2" fill="none"/><path d="M24 22l7 8-7 12-7-12z" fill="${g||c}"/>`,
 jcuff:(c,g)=>`<rect x="6" y="18" width="14" height="14" rx="3" fill="${c}"/><rect x="28" y="18" width="14" height="14" rx="3" fill="${c}"/>${g?`<circle cx="13" cy="25" r="3.5" fill="${g}"/><circle cx="35" cy="25" r="3.5" fill="${g}"/>`:""}`,
 gloves:c=>`<path d="M12 40V22l2-10h3l1 10 1-12h3l1 12 1-11h3l1 11 2-8h3l-2 16v10z" fill="${c}"/>`,
 boots:c=>`<path d="M12 8h12v20l14 4a4 4 0 0 1 4 4v6H12z" fill="${c}"/><path d="M12 36h30" stroke="#10141c" stroke-width="3"/>`,
 pan:c=>`<path d="M30 22l14-6" stroke="#5a3420" stroke-width="5"/><circle cx="18" cy="26" r="13" fill="${c}"/><circle cx="18" cy="26" r="9" fill="#10141c" opacity=".45"/>`,
 wrench:c=>`<path d="M14 36l18-18" stroke="${c}" stroke-width="6"/><path d="M30 8a8 8 0 0 0 10 10l-4-2-2-2z" fill="${c}"/><circle cx="12" cy="38" r="5" fill="${c}"/>`,
 golf:c=>`<path d="M36 4L18 38" stroke="${c}" stroke-width="3"/><path d="M14 36h12l-2 6H10z" fill="${c}"/>`,
 camera:c=>`<rect x="14" y="10" width="10" height="5" fill="${c}"/><rect x="6" y="14" width="36" height="24" rx="3" fill="${c}"/><circle cx="24" cy="26" r="8" fill="#10141c"/><circle cx="24" cy="26" r="4" fill="#5aa7e0"/>`,
 speaker:c=>`<rect x="12" y="6" width="24" height="36" rx="4" fill="${c}"/><circle cx="24" cy="28" r="8" fill="#10141c"/><circle cx="24" cy="14" r="3" fill="#10141c"/>`,
 headphones:c=>`<path d="M10 28a14 14 0 0 1 28 0" fill="none" stroke="${c}" stroke-width="4"/><rect x="6" y="26" width="9" height="14" rx="3" fill="${c}"/><rect x="33" y="26" width="9" height="14" rx="3" fill="${c}"/>`,
 card:(c,k)=>{const[foil,ini]=k.split(":");return `${foil==="f"?`<defs><linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset=".35" stop-color="#7ae0ff"/><stop offset=".7" stop-color="#b6ff9e"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs>`:""}<rect x="10" y="4" width="28" height="40" rx="3" fill="${foil==="f"?"url(#holo)":"#efe7d4"}"/><rect x="13" y="7" width="22" height="21" fill="${c}"/><circle cx="24" cy="15" r="5" fill="#e0b48c" stroke="none"/><path d="M16 28a8 7 0 0 1 16 0z" fill="#273042" stroke="none"/><text x="24" y="39.5" text-anchor="middle" font-family="Saira Extra Condensed,sans-serif" font-weight="800" font-size="10" fill="#10141c" stroke="none">${ini}</text>`},
 figure:(c,k)=>`<g transform="translate(5 -2) scale(.8)">${SHP.plush(c,k)}</g><rect x="9" y="38" width="30" height="7" rx="1" fill="#273042"/>`,
 shell:c=>`<circle cx="24" cy="24" r="16" fill="${c}"/><path d="M24 24m-3 0a3 3 0 1 1 6 0a6 6 0 1 1-12 0a9 9 0 1 1 18 0a12 12 0 1 1-24 0" fill="none" stroke="#4a3a2a"/>`,
 bone:c=>`<path d="M14 34L34 14" stroke="${c}" stroke-width="6"/><circle cx="12" cy="32" r="4" fill="${c}"/><circle cx="16" cy="36" r="4" fill="${c}"/><circle cx="32" cy="12" r="4" fill="${c}"/><circle cx="36" cy="16" r="4" fill="${c}"/>`,
 amber:c=>`<path d="M16 8h16l8 14-8 18H16L8 22z" fill="${c}" fill-opacity=".85"/><path d="M22 20l4 4M26 20l-4 4M24 18v8" stroke="#3a2010"/>`,
 bar:c=>`<path d="M8 32l6-14h20l6 14z" fill="${c}"/><path d="M14 18l2 4h16l2-4" stroke="#00000044"/>`,
 can:c=>`<rect x="15" y="8" width="18" height="32" rx="3" fill="${c}"/><path d="M15 14h18M15 34h18" stroke="#10141c"/><path d="M26 18l-4 7h5l-4 7" stroke="#fff"/>`,
 icecream:c=>`<path d="M16 24l8 20 8-20z" fill="#d9a24a"/><path d="M18 28l12 0M20 34h8" stroke="#a8692a"/><circle cx="24" cy="18" r="10" fill="${c}"/>`,
 bottle:c=>`<path d="M20 5h8v8l4 6v23H16V19l4-6z" fill="${c}"/><rect x="16" y="24" width="16" height="10" fill="#efe7d4"/>`,
 fishchips:c=>`<path d="M14 20l2-10M20 20l1-12M28 20l1-11" stroke="#f5c96a" stroke-width="3"/><ellipse cx="27" cy="17" rx="9" ry="5" fill="${c}"/><path d="M8 20h32l-4 22H12z" fill="#efe7d4"/>`,
 spoon:c=>`<ellipse cx="18" cy="16" rx="7" ry="10" fill="${c}"/><path d="M21 24l15 18" stroke="${c}" stroke-width="4"/>`,
 fork:c=>`<path d="M14 6v10q0 6 6 6M20 6v14M26 6v10q0 6-6 6M20 22l14 20" stroke="${c}" stroke-width="3" fill="none"/>`,
 cone:c=>`<path d="M18 8h12l8 30H10z" fill="${c}"/><path d="M14 22h20M12 30h24" stroke="#fff" stroke-width="3"/><rect x="6" y="38" width="36" height="5" fill="${c}"/>`,
 hanger:c=>`<path d="M24 14a4 4 0 1 1 4-4M24 14L6 34h36z" fill="none" stroke="${c}" stroke-width="3"/>`,
 ball:c=>`<circle cx="24" cy="24" r="15" fill="${c}"/><path d="M12 15q10 9 0 18M36 15q-10 9 0 18" stroke="#fff"/>`,
 charger:c=>`<rect x="14" y="8" width="20" height="18" rx="3" fill="${c}"/><path d="M19 8V3M29 8V3M24 26v8q0 8 10 8" stroke="${c}" stroke-width="3" fill="none"/>`,
 sunnies:c=>`<rect x="5" y="18" width="16" height="11" rx="4" fill="${c}"/><rect x="27" y="18" width="16" height="11" rx="4" fill="${c}"/><path d="M21 22h6M5 20L2 16M43 20l3-4"/>`,
 wheel:c=>`<circle cx="24" cy="26" r="12" fill="#10141c"/><circle cx="24" cy="26" r="5" fill="${c}"/><path d="M24 14V4h10"/>`,
 stamp:(c,g)=>{const G={lighthouse:`<path d="M21 32l1-14h4l1 14z" fill="#fff" stroke="none"/><path d="M20 18h8l-4-4z" fill="#f5c96a" stroke="none"/>`,bird:`<path d="M14 26q6-8 10-2 4-6 10 2-6-2-10 2-4-4-10-2z" fill="#fff" stroke="none"/>`,mountain:`<path d="M13 32l8-14 4 6 3-4 7 12z" fill="#fff" stroke="none"/>`,train:`<rect x="15" y="20" width="16" height="9" fill="#fff" stroke="none"/><rect x="27" y="16" width="5" height="6" fill="#fff" stroke="none"/><circle cx="19" cy="31" r="2" fill="#fff" stroke="none"/><circle cx="27" cy="31" r="2" fill="#fff" stroke="none"/>`,flower:`<path d="M24 15v6M24 27v6M15 24h6M27 24h6" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="3" fill="#f5c96a" stroke="none"/>`,fish:`<path d="M14 24q8-8 16 0-8 8-16 0zM30 24l5-4v8z" fill="#fff" stroke="none"/>`,ship:`<path d="M16 28h16l-3 4H19zM24 28V16l6 10z" fill="#fff" stroke="none"/>`,inv:`<g transform="rotate(180 24 24)"><path d="M16 28h16l-3 4H19zM24 28V16l6 10z" fill="#fff" stroke="none"/></g>`,
   star:`<path d="M24 15l2.6 5.5 6 .7-4.5 4.1 1.2 6L24 28.3l-5.3 3 1.2-6-4.5-4.1 6-.7z" fill="#fff" stroke="none"/>`,crown:`<path d="M16 30V20l4 4 4-6 4 6 4-4v10z" fill="#f5c96a" stroke="none"/>`,
   fern:`<path d="M24 32V16M24 20l-5-3M24 20l5-3M24 25l-6-3M24 25l6-3M24 30l-6-3M24 30l6-3" stroke="#fff"/>`,plane:`<path d="M14 26l20-8-6 14-4-5z" fill="#fff" stroke="none"/>`}[g];
   return `<rect x="8" y="8" width="32" height="32" fill="#efe7d4" stroke="#efe7d4" stroke-width="3" stroke-dasharray="2 2"/><rect x="12" y="12" width="24" height="24" fill="${c}"/>${G}`},
 coin:(c,m)=>`<circle cx="24" cy="24" r="17" fill="${c}"/><circle cx="24" cy="24" r="13" fill="none" stroke="#00000055" stroke-width="1.5"/><text x="24" y="29.5" text-anchor="middle" font-family="Saira Extra Condensed,sans-serif" font-weight="800" font-size="15" fill="#00000099" stroke="none">${m}</text>`
};
// [id, name, category, rarity 0-4, base value, shape, colour, colour2/kind, description, fight bonus %]
const RAW=[
 ["med","First-aid kit","use",0,250,"I:med","","","+40 health, or a minute off a stay in A&E."],
 ["drink","Energy drink","use",0,500,"I:drink","","","+25 stamina. Can take you past your maximum."],
 ["lager","Craft lager","use",0,80,"I:lager","","","+60 mood and +1 grit. A good mood makes for better training."],
 ["burner","Burner phone","use",1,900,"I:burner","","","Drops your heat by 35. Ditch it after one call."],
 ["charm","Lucky charm","use",2,3000,"I:charm","","","+10% success on your next 5 jobs."],
 ["lotto","Scratchie","use",0,50,"lotto","#e2574c","","Scratch it and see. Probably nothing. Probably."],
 ["pie","Mince and cheese pie","use",0,15,"pie","#d9a24a","","+15 mood and +5 health. Still warm, somehow."],
 ["flatwhite","Flat white","use",0,6,"cup","#efe7d4","","+10 stamina. Extra shot, no judgement."],
 ["cap","Bottle cap","junk",0,3,"cap","#c9ced6","","From a long-gone soft drink. Someone collects these."],
 ["busticket","Bus ticket","junk",0,2,"ticket","#f5d34a","","Expired in 2019. The route doesn't exist any more."],
 ["umbrella","Broken umbrella","junk",0,5,"umbrella","#5aa7e0","","It has survived its last southerly."],
 ["rustykey","Rusty key","junk",0,12,"key","#a06a33","","Opens something. Somewhere. Probably."],
 ["sock","Odd sock","junk",0,1,"sock","#d97bb3","","The other one is in a better place."],
 ["chips","Soggy chips","junk",0,3,"chips","#efe7d4","","The seagulls have been at them."],
 ["feather","Pigeon feather","junk",0,2,"feather","#8f96a6","","Iridescent, if you squint."],
 ["hubcap","Dented hubcap","junk",0,25,"hubcap","#c9ced6","","Came off a ute doing 80 on a roundabout."],
 ["gum","Pack of gum","junk",0,4,"gum","#7bd389","","Two pieces left. Spearmint."],
 ["jandal","Single jandal","junk",0,4,"jandal","#4fe3ff","","Left foot. The right one is at sea."],
 ["antiquekey","Antique key","junk",1,600,"key","#f5c96a","","Heavy brass, with an anchor on the bow."],
 ["goldcap","Golden bottle cap","junk",2,4000,"cap","#ffb547","","A 1990s promo cap. The brewery still wants it back."],
 ["flip","Old flip phone","elec",0,60,"flip","#8f96a6","","Battery lasts a week. Plays one ringtone, very loudly."],
 ["tablet","Cracked tablet","elec",1,300,"tablet","#273042","","Works fine if you don't touch the top left corner."],
 ["buds","Wireless earbuds","elec",1,450,"buds","#e7e2d6","","Both of them, which is rare."],
 ["swatch","Smartwatch","elec",1,900,"swatch","#5aa7e0","","Still counting someone else's steps."],
 ["console","Games console","elec",2,3500,"console","#33405a","","Comes with a save file 200 hours deep."],
 ["laptop","Gaming laptop","elec",2,6000,"laptop","#6a4a8a","","RGB keyboard. Sticker of a cartoon frog."],
 ["drone","Camera drone","elec",2,9000,"drone","#e7e2d6","","Great for scouting. Terrible in wind."],
 ["proto","Prototype phone","elec",3,85000,"proto","#c9ced6","","Not released yet. Someone is very upset about that."],
 ["fakechain","Fake gold chain","jewel",0,40,"chain","#d9b45a","","Turns your neck green in about an hour."],
 ["silverring","Silver ring","jewel",1,800,"ring","#c9ced6","#5aa7e0","Engraved inside: 'To D, always'."],
 ["pearls","Pearl earrings","jewel",1,1600,"earrings","#f4ead2","","Freshwater, the good kind."],
 ["goldwatch","Gold watch","jewel",2,12000,"gwatch","#f5c96a","","Swiss. Ticks like a heartbeat."],
 ["diamondring","Diamond ring","jewel",2,18000,"ring","#f5c96a","#bfe0f5","Somebody said yes to this."],
 ["ruby","Ruby necklace","jewel",3,60000,"necklace","#f5c96a","#e2574c","Last seen at a charity gala, round someone else's neck."],
 ["harbourstar","The Harbour Star","jewel",4,1500000,"bigdiamond","#5ad1ff","","A blue diamond the size of a walnut. Stolen in 1974 and never seen again. Until now."],
 ["msgbottle","Message in a bottle","collect",1,350,"msgbottle","#7bd389","","Washed up on the Waterfront. Open it to read the note."],
 ["vinyl","Vintage vinyl record","collect",1,700,"vinyl","#e2574c","","A 1971 pressing, with only a little warp."],
 ["shipbottle","Ship in a bottle","collect",1,1200,"shipbottle","#a06a33","","Nobody knows how they get them in there."],
 ["compass","Brass pocket compass","collect",2,5200,"compass","#d9b45a","","Always points to the harbour, no matter what."],
 ["comic","First-issue comic","collect",2,7500,"comic","#5aa7e0","","Mint condition. Smells like 1962."],
 ["oldmap","Old harbour map","collect",2,9500,"oldmap","#e8d9b0","","Hand-drawn, with an X under the third pier. Use it to go digging."],
 ["rugby","Signed rugby ball","collect",2,11000,"rugby","#e7e2d6","","Signed by the whole 1987 squad. One signature is a smiley face."],
 ["tooth","Dinosaur tooth","collect",3,55000,"tooth","#e8d9b0","","Seventy million years old and still sharp."],
 ["spyglass","Captain's spyglass","collect",3,40000,"spyglass","#a06a33","#f5c96a","From the wreck of the Margaret Ann, 1889."],
 ["meteor","Meteorite fragment","collect",3,70000,"meteor","#5d6676","","Fell on a farm near the city in 1910. Slightly warm."],
 ["statue","Golden kiwi statue","collect",4,650000,"statue","#f5c96a","","Solid gold. Stolen from the museum foyer in broad daylight."],
 ["egg","Jewelled egg","collect",4,900000,"egg","#b77cf0","#f5c96a","Made for a tsar, lost in a card game, found in your hands."],
 ["newspaper","Rolled-up newspaper","weapon",0,5,"newspaper","","","Mostly for flies. +3% fight power.",3],
 ["bikechain","Bike chain","weapon",0,60,"bikechain","#8f96a6","","Swings well, rattles more. +6% fight power.",6],
 ["cricketbat","Cricket bat","weapon",1,400,"cricketbat","#e8d9b0","","Willow, well oiled. +10% fight power.",10],
 ["tyreiron","Tyre iron","weapon",1,350,"tyreiron","#8f96a6","","For tyres. Officially. +12% fight power.",12],
 ["knuckles","Brass knuckles","weapon",2,4000,"knuckles","#d9b45a","","+18% fight power.",18],
 ["nunchucks","Nunchucks","weapon",2,6500,"nunchucks","#33405a","","You've watched the films. +22% fight power.",22],
 ["taser","Taser","weapon",3,45000,"taser","#f5d34a","","Crackles with intent. +32% fight power.",32],
 ["goldbat","Gold-plated baseball bat","weapon",4,400000,"bbat","#ffb547","","Ridiculous. Devastating. +50% fight power.",50],
 ["hivis","Hi-vis vest","armour",0,20,"hivis","#f5d34a","","Nobody questions someone in hi-vis. +2% fight power.",2],
 ["hoodie","Thick hoodie","armour",0,60,"hoodie","#33405a","","Hood up, head down. +3% fight power.",3],
 ["leather","Leather jacket","armour",1,900,"jacket","#5a3420","","Smells like a motorbike. +7% fight power.",7],
 ["helmet","Motorbike helmet","armour",1,1300,"helmet","#e2574c","","Visor's scratched but it'll do. +9% fight power.",9],
 ["stabvest","Stab vest","armour",2,9000,"stabvest","#2f3a2a","","Police issue. Don't ask. +16% fight power.",16],
 ["riot","Riot shield","armour",3,50000,"riot","#9fd3ff","","Clear polycarbonate and full confidence. +26% fight power.",26],
 ["trench","Kevlar trench coat","armour",4,500000,"trench","#3a2a1a","","Bulletproof, rainproof, fashion-forward. +42% fight power.",42],
 ["smallbox","Small mystery box","box",1,900,"box","#a06a33","","Something rattles inside. Open it to find out."],
 ["crate","Mystery crate","box",2,8000,"box","#5a7a3a","","Stencilled 'DO NOT OPEN'. Holds 2 items, often good ones."],
 ["safebox","Locked safe deposit box","box",3,60000,"box","#5d6676","","From a bank vault that no longer exists. 3 items and some cash."],
 ["p_kiwi","Kiwi plushie","plush",0,30,"plush","#7a5a3a","longbeak","Part of the Harbour Plushies set."],
 ["p_penguin","Little blue penguin plushie","plush",0,30,"plush","#3f6fa8","belly beak","Part of the Harbour Plushies set."],
 ["p_seal","Fur seal plushie","plush",0,35,"plush","#8f96a6","whisk","Part of the Harbour Plushies set."],
 ["p_gull","Seagull plushie","plush",0,25,"plush","#e7e2d6","beak wings","Part of the Harbour Plushies set. Will steal your chips."],
 ["p_octo","Octopus plushie","plush",1,300,"plush","#d97bb3","tent","Part of the Harbour Plushies set."],
 ["p_shark","Shark plushie","plush",1,350,"plush","#5aa7e0","fin belly","Part of the Harbour Plushies set."],
 ["p_crab","Crab plushie","plush",1,280,"plush","#e2574c","claws","Part of the Harbour Plushies set."],
 ["p_albatross","Albatross plushie","plush",2,4000,"plush","#efe7d4","wings beak","The rarest of the Harbour Plushies set."],
 ["s_fern","Silver fern stamp","stamp",1,250,"stamp","#2f6b3a","fern","Part of the Rare Stamps set."],
 ["s_ship","Clipper ship stamp","stamp",1,300,"stamp","#1d4a7a","ship","Part of the Rare Stamps set."],
 ["s_plane","Airmail stamp","stamp",1,400,"stamp","#a06a33","plane","Part of the Rare Stamps set."],
 ["s_star","Southern Cross stamp","stamp",2,3000,"stamp","#6a4a8a","star","Part of the Rare Stamps set."],
 ["s_crown","Coronation stamp","stamp",3,30000,"stamp","#8a1a2a","crown","Part of the Rare Stamps set."],
 ["s_jenny","Inverted Harbour Jenny","stamp",4,400000,"stamp","#e2574c","inv","A printing error from 1931: the ship is upside down. Part of the Rare Stamps set."],
 ["c_penny","1911 penny","coin",2,2500,"coin","#b8733a","1d","Part of the Old Coins set."],
 ["c_florin","Silver florin","coin",2,5000,"coin","#c9ced6","2/-","Part of the Old Coins set."],
 ["c_crown","Silver crown","coin",3,40000,"coin","#dfe4ea","5/-","Part of the Old Coins set."],
 ["c_sovereign","Gold sovereign","coin",3,80000,"coin","#f5c96a","£1","Part of the Old Coins set."],
 ["c_doubloon","Pirate doubloon","coin",4,300000,"coin","#ffb547","XII","Spanish gold, from a wreck nobody has found. Part of the Old Coins set."]
];
const NAMES=["Ruby Kahu","Deano","Mack Ferris","Tama Rangi","Sly Petra","Nails","Kiri Wolfe","Spud","Lenny Two-Times","Vex","Moana Steel","Bricks","Jojo Vance","Pip","Rocco","Tui Black","Gator","Mia Cross","Fitz","Bones","Shaz","Lola Diaz","Hemi","Crank","Dutch","Ivy Marsh","Kingi","Slim"];
const HATS=["cap","slick","bald","bandana","beanie","fedora","mohawk","long","headset"];
const SHIRTS=["#e2574c","#273042","#2f6b3a","#6a4a8a","#a06a33","#111","#5aa7e0","#d97bb3"];
const BGS=["#1c5568","#5a2c54","#3a2014","#12313f","#2b1d36","#2a1517","#1d2a1a"];
/* ---------- generated families: 916 more items, built from parts ---------- */
function genItems(){
  const out=[],rarOf=v=>v<150?0:v<2500?1:v<25000?2:v<200000?3:4;
  const add=(id,n,cat,v,sh,c,c2,d,extra={})=>out.push({id,n,cat,r:rarOf(v),v:Math.max(1,Math.round(v)),sh,c,c2,d,...extra});
  const R=s=>rng(hashS(s)),pk=(r,a)=>a[Math.floor(r()*a.length)];
  const cap=s=>s[0].toUpperCase()+s.slice(1);
  // jewellery 4 x 6 x 6 = 144
  const METALS=[["Brass","#c9a24a",0.4],["Silver","#c9ced6",1],["Gold","#f5c96a",4],["Platinum","#e5e9f0",9]];
  const JT=[["ring","jring",1],["chain","jchain",1.4],["bracelet","jbrace",1.2],["brooch","jbrooch",1.1],["pendant","jpend",1.3],["cufflinks","jcuff",0.9]];
  const GEMS=[["",null,1],["pearl","#f4ead2",2.5],["jade","#3fae6a",3],["ruby","#e2574c",6],["sapphire","#3d6fe0",7],["diamond","#bfe0f5",12]];
  const JD=["Hallmarked inside. The pawn shop will ask where you got it.","Came out of a velvet box that came out of someone else's drawer.","Polished up nicely after a night in your pocket.","Heavier than it looks. Worth more than it looks, too.","The clasp is a bit loose. The value isn't."];
  for(const[m,mc,mm]of METALS)for(const[t,ts,tm]of JT)for(const[g,gc,gm]of GEMS)add(`gj_${m}_${t}_${g||"plain"}`.toLowerCase(),`${g?m+" "+g:"Plain "+m.toLowerCase()} ${t}`,"jewel",400*mm*tm*gm,ts,mc,gc,pk(R(m+t+g),JD));
  // plushies 20 x 4 = 80
  const ANIM=[["Kiwi","#7a5a3a","longbeak"],["Tui","#1f3a3a","beak"],["Kea","#4f7a3a","beak wings"],["Weka","#8a6a4a","beak"],["Pukeko","#2c4a8a","beak"],["Little penguin","#3f6fa8","belly beak"],["Fur seal","#8f96a6","whisk"],["Dolphin","#6a8aa8","fin belly"],["Orca","#10141c","fin belly"],["Octopus","#d97bb3","tent"],["Seagull","#e7e2d6","beak wings"],["Shark","#5aa7e0","fin belly"],["Crab","#e2574c","claws"],["Albatross","#efe7d4","wings beak"],["Stingray","#5d6676","fin"],["Seahorse","#f2a33a","fin"],["Sea turtle","#3f7a4a","claws"],["Hedgehog","#7a5a3a","whisk"],["Possum","#6a6a6a","whisk"],["Gecko","#7bd389","claws"]];
  const ED=[["Gift shop",1,null],["Glow-in-the-dark",6,"#b6ff9e"],["Velvet",25,"#6a4a8a"],["Golden",200,"#f5c96a"]];
  for(const[a,ac,ak]of ANIM)for(const[e,em,ec]of ED)add(`gp_${a}_${e||"std"}`.toLowerCase().replace(/\W+/g,"_"),`${e?e+" ":""}${a.toLowerCase()} plushie`.replace(/^./,x=>x.toUpperCase()),"plush",40*em,"plush",ec||ac,ak,e==="Golden"?"Stitched with real gold thread. Only a handful were ever made.":e==="Velvet"?"A limited run for the Harbour Festival. Very soft, very collectable.":e==="Glow-in-the-dark"?"Glows faintly green in the dark. Kids love it. Collectors love it more.":"A cuddly souvenir from the Waterfront gift shop.");
  // figurines 16 x 3 = 48
  const MATS=[["Ceramic","#efe7d4",1],["Jade","#3fae6a",15],["Gold","#f5c96a",120]];
  for(const[a,,ak]of ANIM.slice(0,16))for(const[m,mc,mm]of MATS)add(`gf_${a}_${m}`.toLowerCase().replace(/\W+/g,"_"),`${m} ${a.toLowerCase()} figurine`,"figure",60*mm,"figure",mc,ak,m==="Gold"?"Solid gold, with a little engraved plinth. Heavy enough to be a doorstop.":m==="Jade"?"Carved from one piece of green stone. Cool to the touch.":"Hand-painted. There's a tiny chip on the base.");
  // stamps 12 x 4 + 12 misprints = 60
  const ST=[["Lighthouse","lighthouse"],["Tui","bird"],["Mountain","mountain"],["Steam train","train"],["Pohutukawa","flower"],["Snapper","fish"],["Fern","fern"],["Clipper","ship"],["Airmail","plane"],["Star","star"],["Royal","crown"],["Harbour","ship"]];
  const DEN=[["1c","#a06a33",1],["5c","#2f6b3a",2],["10c","#1d4a7a",4],["50c","#6a4a8a",8]];
  for(const[t,g]of ST){for(const[dn,dc,dm]of DEN)add(`gs_${t}_${dn}`.toLowerCase().replace(/\W+/g,"_"),`${t} ${dn} stamp`,"stamp",20*dm,"stamp",dc,g,"From the 1960s pictorial series. Lightly hinged.");
    add(`gs_${t}_mis`.toLowerCase().replace(/\W+/g,"_"),`${t} misprint stamp`,"stamp",20*8*(80+R(t)()*500),"stamp","#e2574c",g,"Printed in the wrong colour. The post office tried to destroy every sheet. They missed one.")}
  // coins 12 x 3 = 36
  const ERA=["1908","1933","1946","1967","Victorian","Edwardian","Colonial","Shipwreck","Gold rush","Trade token","Jubilee","Centennial"];
  const CM=[["copper","#b8733a",1,"1d"],["silver","#c9ced6",6,"2/-"],["gold","#f5c96a",40,"£"]];
  ERA.forEach((e,i)=>{for(const[m,mc,mm,mk]of CM)add(`gc_${e}_${m}`.toLowerCase().replace(/\W+/g,"_"),`${e} ${m} coin`,"coin",200*mm*(0.8+i*0.08),"coin",mc,mk,pk(R(e+m),["Worn smooth by a century of pockets.","Found in a jar of buttons at an estate sale.","Still has a bit of the shine.","The face on it has seen things."]))});
  // trading cards 40 x 2 = 80
  const LEG=[...NAMES,"Sister Gale","Old Man Reef","The Ferryman","Lady Fog","Doc Marlin","Two-Ton Terry","Mags Pike","Cuz","Swifty","Queenie","Sarge","Nana Ruth"];
  LEG.forEach((n,i)=>{const r=R(n+"card"),base=8+r()*40,chase=i%8===0?12:1,col=pk(r,BGS),ini=n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),no=String(i+1).padStart(2,"0");
    add(`gt_${i}`,`${n} card`,"card",base*chase,"card",col,`b:${ini}`,`Harbour Legends #${no}.${chase>1?" A chase card: hard to pull.":""}`);
    add(`gt_${i}_foil`,`${n} foil card`,"card",base*chase*30,"card",col,`f:${ini}`,`Harbour Legends #${no}, holographic foil.${chase>1?" The chase foil. Collectors fight over these.":""}`)});
  // electronics 5 x 10 x 2 = 100
  const BR=[["Novix","#3a4250",0.7],["Orbo","#e2574c",0.9],["Lumo","#e7e2d6",1.1],["Vekta","#2f6b3a",1.5],["Pulsar","#6a4a8a",2.2]];
  const DEV=[["phone","proto",400],["tablet","tablet",300],["laptop","laptop",900],["games console","console",500],["earbuds","buds",150],["smartwatch","swatch",250],["drone","drone",800],["camera","camera",600],["speaker","speaker",200],["headphones","headphones",220]];
  for(const[b,bc,bm]of BR)for(const[d,ds,dv]of DEV)for(const[cn,cm]of[["Used",0.4],["Boxed",1.3]])add(`ge_${b}_${d}_${cn}`.toLowerCase().replace(/\W+/g,"_"),`${cn} ${b} ${d}`,"elec",dv*bm*cm,ds,bc,null,cn==="Boxed"?"Still sealed. Fell off the back of a truck, apparently.":pk(R(b+d),["Scratched, but it turns on.","Someone else's photos are still on it.","Battery's tired. Aren't we all."]));
  // weapons 14 x 5 = 70, armour 10 x 5 = 50
  const Q=[["Rusty",0.4,0.6,"#8a5a3a"],["Sturdy",1,1,null],["Fine",3,1.35,null],["Masterwork",12,1.8,"#b77cf0"],["Gilded",80,2.4,"#ffb547"]];
  const WB=[["rolling pin","bbat","#c9a06a",20,3],["frying pan","pan","#3a4250",25,4],["spanner","wrench","#8f96a6",30,5],["crowbar","tyreiron","#e2574c",60,7],["pool cue","golf","#a06a33",50,6],["hockey stick","golf","#e7e2d6",80,8],["golf club","golf","#c9ced6",150,9],["cricket bat","cricketbat","#e8d9b0",200,10],["baseball bat","bbat","#a06a33",250,11],["bike chain","bikechain","#8f96a6",120,9],["knuckleduster","knuckles","#c9a24a",900,14],["nunchucks","nunchucks","#33405a",1200,15],["stun baton","taser","#f5d34a",3000,19],["walking cane","bbat","#2a1a10",700,12]];
  const AB=[["hi-vis vest","hivis","#f5d34a",20,2],["hoodie","hoodie","#33405a",40,3],["work gloves","gloves","#c9a06a",30,2],["steel-capped boots","boots","#3a2a1a",120,4],["puffer jacket","jacket","#1d4a7a",250,5],["leather jacket","jacket","#5a3420",600,7],["motorbike helmet","helmet","#e2574c",900,8],["stab vest","stabvest","#2f3a2a",4000,12],["riot shield","riot","#9fd3ff",9000,15],["long coat","trench","#3a2a1a",6000,14]];
  for(const[list,cat]of[[WB,"weapon"],[AB,"armour"]])for(const[b,bs,bc,bv,bf]of list)for(const[q,qv,qf,qc]of Q){const fx=Math.min(60,Math.round(bf*qf));
    add(`g${cat[0]}_${b}_${q}`.toLowerCase().replace(/\W+/g,"_"),`${q} ${b}`,cat,bv*qv,bs,qc||bc,null,`${q==="Gilded"?"Plated in gold, for some reason. ":q==="Masterwork"?"Made by someone who really cared. ":q==="Rusty"?"Seen better days. ":""}+${fx}% fight power when equipped.`,{fx})}
  // vinyl 30 x 2 = 60
  const A=["Southerly","Neon","Rusty","Midnight","Salty","Velvet","Concrete","Harbour","Static","Paper"],N=["Gulls","Pylons","Ferries","Wolves","Daydreams","Jandals","Cranes","Satellites","Echoes","Lanterns"];
  for(let i=0;i<30;i++){const band=`The ${A[i%10]} ${N[(i+Math.floor(i/10)*3)%10]}`,r=R(band),v=40+r()*260,col=pk(r,["#e2574c","#5aa7e0","#f5c96a","#7bd389","#d97bb3","#b77cf0"]);
    add(`gr_${i}`,`${band} LP`,"record",v,"vinyl",col,null,pk(r,["Their only album before the fight.","Pressed in a garage, 500 copies.","The B-side is better. Everyone says so.","Smells faintly of a 1980s flat."]));
    add(`gr_${i}_s`,`${band} LP, signed`,"record",v*25,"vinyl",col,null,"Signed on the sleeve in silver pen by the whole band.")}
  // comics 20 x 3 = 60
  const SER=["Captain Kiwi","The Fog Man","Harbour Hawk","Night Ferry","Gull Force","Dr Static","The Pylon","Miss Midnight","Iron Weka","Rust Bucket","Dockside Detectives","Kea Commandos","Lady Lightning","Crane Kid","The Undertow","Tide Queen","Sky Pirate","Ghost Tram","Bin Raccoon","The Southerly"];
  SER.forEach((s,i)=>{const r=R(s),base=15*(1+r()*4),col=pk(r,["#5aa7e0","#e2574c","#f5c96a","#7bd389","#b77cf0","#d97bb3"]);
    for(const[iss,m]of[["1",30],["50",1],["100",4]])add(`gk_${i}_${iss}`,`${s} #${iss}`,"comic",base*m,"comic",col,null,iss==="1"?"First issue. Bagged and boarded.":iss==="100"?"The anniversary issue, with a fold-out cover.":"A middle issue. Nobody remembers what happens in it.")});
  // fossils and relics 30
  [["Ammonite","shell","#a8875a",900],["Giant ammonite","shell","#8a6a3a",9000],["Shark tooth","tooth","#e8d9b0",400],["Megalodon tooth","tooth","#bfb090",30000],["Moa leg bone","bone","#e8d9b0",22000],["Whale vertebra","bone","#d9ccb0",6000],["Petrified wood","bone","#8a6a4a",700],["Trilobite","shell","#7a6a5a",2500],["Fossil crab","shell","#a06a33",1800],["Insect in amber","amber","#f2a33a",14000],["Gecko in amber","amber","#e88a2a",160000],["Iron meteorite","meteor","#5d6676",45000],["Stony meteorite","meteor","#7a7a6a",12000],["Moon rock","meteor","#c9ced6",900000],["Mammoth tusk fragment","tooth","#efe7d4",80000],["Dinosaur egg","egg","#a8875a",400000,"#7a5a3a"],["Sabre-tooth fang","tooth","#efe7d4",60000],["Whalebone comb","bone","#efe7d4",5000],["Ship's bell","compass","#d9b45a",8000],["Brass porthole","compass","#c9a24a",3500],["Harpoon head","tyreiron","#8f96a6",4000],["Cannonball","ball","#3a4250",1500],["Gold nugget","meteor","#f5c96a",26000],["Silver ingot","bar","#c9ced6",9000],["Gold bar","bar","#f5c96a",95000],["Pirate's spyglass","spyglass","#5a3420",70000,"#f5c96a"],["Captain's logbook","oldmap","#8a6a4a",11000],["Treasure chest key","key","#ffb547",18000],["Lighthouse lens","compass","#bfe0f5",50000],["Sunken crown","jbrooch","#ffb547",1200000,"#e2574c"]]
   .forEach(([n,s,c,v,c2],i)=>add(`gx_${i}`,n,"fossil",v,s,c,c2||null,pk(R(n),["Pulled from the mud under the Docks.","A museum would want this back. You'd rather they didn't know.","Older than the city. Probably older than the harbour.","Came up in a fishing net, tangled in weed."])));
  // junk 6 x 10 = 60
  const ADJ=[["Bent",1],["Soggy",0.8],["Cracked",0.9],["Faded",1],["Sticky",0.7],["Lucky",30]],NOUN=[["spoon","spoon",3],["fork","fork",3],["bus pass","ticket",4],["coat hanger","hanger",2],["traffic cone","cone",12],["trolley wheel","wheel",6],["tennis ball","ball",3],["phone charger","charger",8],["pair of sunnies","sunnies",10],["umbrella","umbrella",5]];
  for(const[a,am]of ADJ)for(const[n,s,nv]of NOUN){const r=R(a+n);add(`gz_${a}_${n}`.toLowerCase().replace(/\W+/g,"_"),`${a} ${n}`,"junk",nv*am,s,pk(r,["#8f96a6","#e2574c","#5aa7e0","#f2a33a","#7bd389","#d97bb3","#c9ced6"]),null,a==="Lucky"?"Someone swore by this. You can feel it, a bit.":pk(r,["Found it. Kept it. Don't know why.","It's junk, but it's your junk.","Worth almost nothing to almost everyone."]))}
  // food and drink 38
  const F=[];
  ["Steak and cheese","Mince","Butter chicken","Bacon and egg","Vege","Pork and puha","Potato top","Apple"].forEach((p,i)=>F.push([`${p} pie`,"pie","#d9a24a",6+i,{happy:15,life:5},"Hot from the warmer at the servo."]));
  ["Volt Berry","Lightning Lime","Midnight Mango","Rocket Cola","Turbo Guava","Static Grape"].forEach((d,i)=>F.push([`${d} energy drink`,"can",["#d97bb3","#7bd389","#f2a33a","#e2574c","#f5d34a","#b77cf0"][i],150+i*80,{energy:15+i*3},"Tastes like a battery dissolved in a lolly."]));
  ["Pale ale","Pilsner","Hazy IPA","Stout","Porter","Lager","Sour","Red ale","Wheat beer","Barleywine"].forEach((b,i)=>F.push([`${b}`,"bottle",["#f2a33a","#f5d34a","#e8b84a","#3a2010","#4a2a1a","#f5c96a","#e2574c","#a0402a","#f5e0a0","#7a3a1a"][i],40+i*12,{happy:40+i*4,nerve:1},"Brewed in the Docks by people who mean it."]));
  ["Long black","Cappuccino","Mochaccino","Iced latte","Chai latte","Double espresso"].forEach((c,i)=>F.push([c,"cup","#efe7d4",5+i,{energy:5+i},"From the cart by the ferry terminal."]));
  [["Hokey pokey","#f5c96a"],["Boysenberry","#b05a8a"],["Goody goody gum drops","#7bd389"],["Feijoa","#c9e09a"]].forEach(([f,c])=>F.push([`${f} ice cream`,"icecream",c,6,{happy:25},"A double scoop. It's already melting."]));
  [["Fish and chips","#d9a24a",14],["Hot chips","#f5c96a",5],["Battered sausage","#a8692a",4],["Paua fritter","#5a7a3a",9]].forEach(([f,c,v])=>F.push([f,"fishchips",c,v,{life:10,happy:10},"Wrapped in newspaper, as it should be."]));
  F.forEach(([n,s,c,v,u,d],i)=>add(`gd_${i}`,n,"food",v,s,c,null,`${d} ${Object.entries(u).map(([k,x])=>`+${x} ${LBL[k]}`).join(", ")}.`,{u}));
  return out;
}
const CAT=[...RAW.map(([id,n,cat,r,v,sh,c,c2,d,fx])=>({id,n,cat,r,v,sh,c,c2,d,fx})),...genItems(),
 // Never drops. Handed to the first 100 people who create a character, numbered in the order they arrived.
 // Bought with real money (or from other players on the market). Spent on refills and Regular status.
 {id:"token",n:"Token",cat:"use",r:2,v:1500,sh:"coin",c:"#f2c14e",c2:"",d:"Hustle's premium currency. Spend tokens on refills and Regular status, or sell them to other players for cash."},
 {id:"founder",n:"Founder's key",cat:"collect",r:4,v:250000,sh:"key",c:"#f2c14e",c2:"",d:"Cut for the first hundred people to walk into Greyhaven. There will never be another."},
 ...SHOP_ARMS.map(a=>({id:a.id,n:a.n,cat:a.def!=null?"armour":"weapon",r:a.price>=1000000?4:a.price>=100000?3:a.price>=10000?2:a.price>=1000?1:0,v:Math.round(a.price*0.6),
   sh:a.sh,c:a.c,c2:"",fx:a.def!=null?Math.round(a.def*0.8):Math.round((a.dmg||0)*(a.shots||1)*0.8),unlimited:true,d:a.d})),
 ...AMMO.map(a=>({id:a.id,n:a.n,cat:"use",r:0,v:Math.round(a.price/a.box*0.6*10)/10,sh:a.sh,c:a.c,c2:"",unlimited:true,d:a.d})),
 {id:"war_trophy",n:"Crew war trophy",cat:"collect",r:3,v:50000,sh:"statue",c:"#e8664f",c2:"",unlimited:true,d:"Handed to everyone on the winning side of a crew war who landed a blow. The engraving lists the other crew's name, misspelled."},
 ...[...CITY_ITEMS,...WORLD_ITEMS].map(it=>({...it,unlimited:true,fx:it.arms?(it.arms.def!=null?Math.round(it.arms.def*0.8):Math.round(it.arms.dmg*(it.arms.shots||1)*0.8)):undefined})),
 ...SEASONS.flatMap(se=>se.items.map(it=>({cat:"collect",c2:"",fx:undefined,...it,season:se.id}))),
 ...TROPHIES.map(it=>({cat:"collect",c2:"",fx:undefined,...it}))];
Object.assign(SHP,ARMS_SHAPES,TRAVEL_SHAPES);
const IT=Object.fromEntries(CAT.map(x=>[x.id,x]));
const SHOPIDS=["med","drink","lager","flatwhite","pie","burner","charm","lotto"];
const FILT=[["all","All",null],["gear","Gear",["weapon","armour"]],["val","Valuables",["jewel","collect","elec","fossil"]],["coll","Collectibles",["plush","figure","stamp","coin","card","record","comic"]],["use","Use",["use","food","box","contraband"]],["junk","Junk",["junk"]]];
const RANKS=[[1,"Nobody"],[3,"Street rat"],[5,"Hustler"],[7,"Hood"],[9,"Soldier"],[11,"Enforcer"],[13,"Lieutenant"],[16,"Underboss"],[20,"Boss"],[25,"Kingpin"]];
const rankOf=l=>{let r=RANKS[0][1];for(const[x,n]of RANKS)if(l>=x)r=n;return r};
export{I,SHP,RAR,RW,CATN,CAT,IT,SHOPIDS,FILT,NAMES,HATS,SHIRTS,BGS,SKIN,LBL,face,rng,hashS,rankOf,RANKS};
