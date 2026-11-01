// Starts a Stripe Checkout for a token pack.
// The price always comes from the database (public.token_info), never from the browser.
// Secrets needed: STRIPE_SECRET_KEY, SITE_URL (e.g. https://backstreet.vercel.app).
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Act as the signed-in player, so the database checks who they are.
    const asPlayer = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await asPlayer.auth.getUser();
    if (!user) return json({ error: "Please sign in." }, 401);

    const { pack } = await req.json();
    const { data: info, error } = await asPlayer.rpc("token_info");
    if (error) return json({ error: error.message }, 400);
    const k = (info.packs as Array<{ id: string; tokens: number; price_cents: number; currency: string }>).find((p) => p.id === pack);
    if (!k) return json({ error: "Unknown pack." }, 400);

    const site = (Deno.env.get("SITE_URL") ?? req.headers.get("origin") ?? "").replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: k.currency, unit_amount: k.price_cents, product_data: { name: `${k.tokens} Backstreet tokens` } } }],
      client_reference_id: user.id,
      metadata: { player_id: user.id, pack: k.id },
      customer_email: user.email,
      success_url: `${site}/#/tokens?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/#/tokens`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: "Couldn't start the payment. Try again in a minute." }, 500);
  }
});
