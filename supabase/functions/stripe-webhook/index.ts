// Stripe calls this after a payment. It checks Stripe's signature, then credits the tokens.
// Deploy with "Verify JWT" switched OFF (Stripe doesn't send a Supabase login).
// Secrets needed: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get("stripe-signature") ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, crypto);
  } catch (e) {
    console.error("Bad signature", e);
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid" && s.metadata?.player_id && s.metadata?.pack) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error } = await admin.rpc("credit_purchase", {
        p_session: s.id, p_player: s.metadata.player_id, p_pack: s.metadata.pack, p_amount: s.amount_total ?? 0, p_currency: s.currency ?? "",
      });
      // A failure here makes Stripe retry later. Crediting is safe to repeat: each session is only ever counted once.
      if (error) { console.error("Credit failed", s.id, error.message); return new Response("Credit failed", { status: 500 }); }
    }
  }
  return new Response("ok");
});
