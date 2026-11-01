import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

// Every game action is a database function. Errors come back as the plain sentence the server raised.
export async function call(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    const e = new Error(error.message || "Something went wrong.");
    e.code = error.message;
    throw e;
  }
  return data;
}
