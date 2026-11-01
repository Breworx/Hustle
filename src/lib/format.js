export const money = n => "$" + Math.floor(Number(n) || 0).toLocaleString("en-NZ");
export const money2 = n => "$" + (Number(n) || 0).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const short = n => { n = Number(n) || 0; return n >= 1e6 ? "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "m" : n >= 1e4 ? "$" + Math.round(n / 1e3) + "k" : money(n); };
export const num = n => (Number(n) || 0).toLocaleString("en-NZ");
export const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };
export function ago(t) {
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 45) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago";
  if (s < 86400) return Math.round(s / 3600) + " h ago"; return Math.round(s / 86400) + " d ago";
}
export const pct = p => Math.round(p) + "%";
export const oddsColor = p => p >= 65 ? "var(--seaglass)" : p >= 35 ? "var(--sodium)" : "var(--brick)";
export const oddsClass = p => p >= 65 ? "good" : p >= 35 ? "warn" : "bad";
