import { useEffect, useState } from "react";
export const DISTRICT_NAMES = { water: "Waterfront", old: "Old Town", docks: "The Docks" };
export const go = path => { location.hash = "/" + path; };
export function useRoute() {
  const get = () => (location.hash.replace(/^#\/?/, "") || "street");
  const [r, setR] = useState(get);
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return r;
}
