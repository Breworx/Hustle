import React from "react";

// DRAFT. Fill in the two values below, then have the wording checked before taking real payments.
export const OPERATOR = "[Your name or business name], New Zealand";
export const CONTACT = "[your contact email]";

export function Legal() {
  return (
    <div className="content" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="page legal">
        <div className="pagehead"><div><h1>Terms, refunds and privacy</h1><p>Backstreet is run by {OPERATOR}. Questions: {CONTACT}.</p></div>
          <a className="btn ghost" href="#/street">Back to the game</a></div>

        <section className="panel"><div className="body stack-sm">
          <h2>Playing</h2>
          <p>Backstreet is a free game. It's fiction: the crimes, fights and companies in it are made up, and nothing in it is advice about real money or real shares. Company prices follow the daily moves of real listed companies for fun only.</p>
          <p>Play fair. One account per person. Don't use scripts or bots, exploit bugs, harass other players or post anything hateful or illegal in chat. We can suspend or close accounts that break these rules, and remove items or cash gained by cheating.</p>
          <p>We may change, rebalance or reset parts of the game, and we may close the game one day. If we close it, we'll give at least 30 days' notice in the game.</p>
        </div></section>

        <section className="panel"><div className="body stack-sm">
          <h2>Tokens and payments</h2>
          <p>You can buy tokens with real money. Tokens are a licence to use a feature of the game. They're not money, have no cash value, can't be exchanged back for real money, and can only be used inside Backstreet. Trading tokens with other players for game cash is allowed. Selling them, or game items, for real money outside the game is not.</p>
          <p>You must be 18 or over to buy tokens, or have a parent or guardian's permission. Payments are handled by Stripe. We never see or store your card details.</p>
          <p>Tokens are delivered to your stash as soon as Stripe confirms your payment. If they haven't arrived within an hour, contact us and we'll sort it out.</p>
        </div></section>

        <section className="panel"><div className="body stack-sm">
          <h2>Refunds</h2>
          <p>If you've bought tokens by mistake and haven't spent or traded any of them, ask within 14 days and we'll refund you in full. Once tokens have been spent or traded, we can't refund them, because they've already been used.</p>
          <p>If something went wrong on our side, such as a payment that went through but no tokens arrived, or a feature you paid for that didn't work, we'll put it right with a refund or a replacement.</p>
          <p>Nothing here limits your rights under the Consumer Guarantees Act 1993 or any other consumer law that applies to you.</p>
        </div></section>

        <section className="panel"><div className="body stack-sm">
          <h2>Privacy</h2>
          <p>We keep your email address so you can sign in, and your game data (your character, items, messages and actions) so the game works. Chat messages and your street name are visible to other players. If you buy tokens, Stripe processes your payment, and we keep a record of what you bought and when.</p>
          <p>We use Supabase to store data and Vercel to host the game. We don't sell your information or use it for advertising.</p>
          <p>You can ask to see your data or have your account deleted at any time by emailing {CONTACT}. This policy follows the New Zealand Privacy Act 2020.</p>
        </div></section>
        <p className="tiny">Last updated {new Date(2026, 10, 1).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}.</p>
      </div>
    </div>
  );
}
