// Map outlines for the travel page, one small file per country in public/world/.
const cache = {};
export function loadOutline(iso) {
  if (!cache[iso]) cache[iso] = fetch(`/world/${iso}.json`).then(r => { if (!r.ok) throw new Error("No map"); return r.json(); }).catch(e => { delete cache[iso]; throw e; });
  return cache[iso];
}
