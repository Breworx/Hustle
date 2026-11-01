// Illustrations drawn in code: item icons, player portraits and district skylines.
import {I,SHP,IT,SKIN,HATS,SHIRTS,BGS,face,rng,hashS} from "./catalog.js";

// Night palettes for the three districts (the skyline art is the one bold element in the interface).
export const DISTRICT_ART={
  water:{id:"water",seed:7,sky:["#0b1d2a","#1f5266"],far:"#143341",near:"#0a1820",lamp:"#f0a43a",neon:"#5fd3ff"},
  old:{id:"old",seed:23,sky:["#15122a","#4a2c57"],far:"#272040",near:"#120f1d",lamp:"#f5c96a",neon:"#ff6fc8"},
  docks:{id:"docks",seed:41,sky:["#1b130e","#5a3218"],far:"#33231a",near:"#120d0a",lamp:"#ff9a3d",neon:"#ffb547"},
  heights:{id:"heights",seed:67,sky:["#0f0c24","#3b2d6e"],far:"#1f1a3d",near:"#0b0918",lamp:"#e8e2ff",neon:"#9f8cff"},
  airport:{id:"airport",seed:83,sky:["#08131f","#1f4a6e"],far:"#16283a",near:"#081018",lamp:"#bfe3ff",neon:"#6db7e8"},
  island:{id:"island",seed:97,sky:["#1a0710","#6a1f3a"],far:"#3a1424",near:"#12050b",lamp:"#ffd27a",neon:"#ff5fa0"}
};

export function itemSvg(id,cls="ia"){const it=IT[id];if(!it)return `<svg class="${cls}" viewBox="0 0 48 48"></svg>`;
  return `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${it.sh.startsWith("I:")?I[it.sh.slice(2)]:SHP[it.sh](it.c,it.c2)}</svg>`}
export const iconSvg=(name,cls="ia")=>`<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${I[name]||""}</svg>`;

// Every player gets a stable portrait generated from their id.
export function portraitSvg(seed){const r=rng(hashS(String(seed||"x")));const pk=a=>a[Math.floor(r()*a.length)];
  return face({skin:pk(SKIN),hat:pk(HATS),shirt:pk(SHIRTS),bg:pk(BGS),shades:r()<.18,glasses:r()<.18,beard:r()<.3,scar:r()<.15,grin:r()<.55,chain:r()<.15,lips:r()<.25})}
export const npcFaceSvg=f=>face(f);
// A player's chosen look (indices into the wardrobe lists), drawn the same way as generated faces.
export const WARDROBE={SKIN,HATS,SHIRTS,BGS};
export function lookSvg(l){return face({skin:SKIN[l.skin]||SKIN[0],hat:HATS[l.hat]||HATS[0],shirt:SHIRTS[l.shirt]||SHIRTS[0],bg:BGS[l.bg]||BGS[0],
  shades:!!l.shades,glasses:!!l.glasses,beard:!!l.beard,scar:!!l.scar,grin:!!l.grin,chain:!!l.chain,lips:!!l.lips})}

const skyCache={};
export function skyline(d){
  if(skyCache[d.id])return skyCache[d.id];
  const r=rng(d.seed),W=400,H=150;let s=`<svg class="sky" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="g${d.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.sky[0]}"/><stop offset="1" stop-color="${d.sky[1]}"/></linearGradient><radialGradient id="m${d.id}"><stop offset="0" stop-color="#fff6dd" stop-opacity=".5"/><stop offset="1" stop-color="#fff6dd" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g${d.id})"/>`;
  for(let i=0;i<34;i++)s+=`<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*55).toFixed(1)}" r="${(r()*0.9+0.3).toFixed(2)}" fill="#fff" opacity="${(r()*0.6+0.2).toFixed(2)}" ${r()<0.35?`class="twinkle" style="animation-delay:-${(r()*3).toFixed(1)}s"`:""}/>`;
  const mx=320-d.seed;s+=`<circle cx="${mx}" cy="30" r="34" fill="url(#m${d.id})"/><circle cx="${mx}" cy="30" r="13" fill="#f4ead2"/><circle cx="${mx+6}" cy="26" r="13" fill="${d.sky[0]}" opacity=".5"/>`;
  const base=d.id==="water"?118:132;
  let x=-5;while(x<W){const w=14+r()*26,h=40+r()*62;s+=`<rect x="${x.toFixed(1)}" y="${(base-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h+30}" fill="${d.far}"/>`;if(r()<0.25)s+=`<circle cx="${(x+w/2).toFixed(1)}" cy="${(base-h-3).toFixed(1)}" r="1.4" fill="#ff3b3b" class="blink" style="animation-delay:-${(r()*1.2).toFixed(1)}s"/>`;x+=w+1}
  if(d.id==="docks"){for(const cx of[60,250]){s+=`<path d="M${cx} ${base} V40 M${cx-8} 44 H${cx+70} M${cx+60} 44 V72" stroke="#e2574c" stroke-width="3" fill="none"/><path d="M${cx} 40 L${cx+70} 44 M${cx} 40 L${cx-8} 44" stroke="#e2574c" stroke-width="1.5"/><rect x="${cx+52}" y="72" width="16" height="9" fill="#5aa7e0"/><circle cx="${cx}" cy="38" r="2.2" fill="#ff3b3b" class="blink"/>`}
    for(let i=0;i<9;i++){const cx=r()*360,cols=["#2f6b3a","#5aa7e0","#a06a33","#e2574c","#6a4a8a"];s+=`<rect x="${cx.toFixed(1)}" y="${base-10-(i%2)*9}" width="24" height="9" fill="${cols[i%5]}" opacity=".85"/>`}}
  if(d.id==="old"){s+=`<rect x="180" y="40" width="22" height="${base-40}" fill="${d.far}"/><path d="M178 42 L191 16 L204 42z" fill="${d.far}"/><circle cx="191" cy="52" r="6" fill="#f5c96a" opacity=".9"/><path d="M191 52v-4M191 52h3" stroke="${d.far}" stroke-width="1.2"/>`}
  x=-3;let k=0;while(x<W){const w=20+r()*34,h=22+r()*48,top=base-h;
    if(d.id==="old"&&r()<0.4)s+=`<path d="M${x} ${top} L${x+w/2} ${top-12} L${x+w} ${top}z" fill="${d.near}"/>`;
    s+=`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h+40}" fill="${d.near}"/>`;
    for(let wy=top+6;wy<base-6;wy+=8)for(let wx=x+4;wx<x+w-5;wx+=7)if(r()<0.3)s+=`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="4" fill="${r()<0.8?d.lamp:"#9fd3ff"}" opacity="${(0.55+r()*0.45).toFixed(2)}"/>`;
    if(r()<0.35&&w>28){const sw=Math.min(w-8,26);s+=`<rect x="${(x+4).toFixed(1)}" y="${(top+10).toFixed(1)}" width="${sw.toFixed(1)}" height="6" rx="2" fill="none" stroke="${k++%2?d.neon:"#ff5fc8"}" stroke-width="1.4" class="sg" style="animation-delay:-${(r()*5).toFixed(1)}s"/>`}
    x+=w+2+r()*4}
  if(d.id==="water"){s+=`<rect y="${base}" width="${W}" height="${H-base}" fill="#05101a"/>`;for(let i=0;i<46;i++){const wx=r()*W,wy=base+3+r()*(H-base-4);s+=`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${(4+r()*12).toFixed(1)}" height="1" fill="${r()<0.3?d.neon:d.lamp}" opacity="${(0.2+r()*0.45).toFixed(2)}"/>`}
    s+=`<path d="M140 ${base+4} h60 l-6 7 h-48z" fill="#0d2230"/><rect x="152" y="${base-3}" width="34" height="7" fill="#e7e2d6" opacity=".8"/>`}
  else s+=`<rect y="${base}" width="${W}" height="${H-base}" fill="#07090d"/><rect y="${base}" width="${W}" height="1" fill="${d.lamp}" opacity=".25"/>`;
  s+=`<path d="M24 ${H} V${base-38} q0-6 8-6 h6" stroke="#2b3240" stroke-width="2.5" fill="none"/><ellipse cx="38" cy="${base-41}" rx="5" ry="2.5" fill="${d.lamp}"/><path d="M33 ${base-40} L10 ${H} H66z" fill="${d.lamp}" opacity=".12"/></svg>`;
  return skyCache[d.id]=s;
}
