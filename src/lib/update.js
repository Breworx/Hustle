// Spots when a new version of the game has gone live, so open copies (like the one on your home screen) can update.
// It compares the script the page loaded with the one the live index.html points at. No version numbers to bump.
const mine = () => [...document.scripts].map(s => s.src).find(s => /\/assets\/index-[^/]+\.js/.test(s)) || null;
export async function newVersionLive() {
  const cur = mine(); if (!cur) return false;  // not a production build
  try {
    const html = await (await fetch("/", { cache: "no-store" })).text();
    const m = html.match(/\/assets\/index-[^"']+\.js/);
    return !!m && !cur.endsWith(m[0]);
  } catch (e) { return false; }
}
