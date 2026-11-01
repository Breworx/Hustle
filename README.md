# Backstreet

A multiplayer crime game set in a rain-soaked harbour city. Pull jobs across six districts, train, fight locals and other players, run a crew, spring friends from the cells, collect and trade 1,000 limited items on a player market, climb from sleeping rough in a doorway to a penthouse on the Moon, and invest in eighteen companies whose prices follow real ones.

Built with React and Vite, on Supabase (database, sign-in and live updates), hosted on Vercel.

## How it's put together

- **Every rule runs on the server.** Game tables live in a private `game` schema the public API can't touch. The browser can only call the `public.*` functions in `supabase/01_schema.sql`, and each one checks who's calling before doing anything. Nobody can give themselves cash from the browser console.
- **Live updates.** Chat messages and notifications (you were attacked, your item sold) arrive instantly through Supabase Realtime, with polling as a fallback.
- **Limited items.** Every collectible has a fixed number of copies that will ever exist, from a few thousand for common junk down to a single copy for the rarest. Each drop is like pulling one copy out of a bag holding every copy left, so scarce items are very hard to find and get harder as they're found. Once all copies are out, the only way to get one is from another player. Food, consumables and mystery boxes never run out. The first 100 characters each get a numbered Founder's key.
- **Tokens.** The premium currency. Players buy them through Stripe, or buy and sell them with each other on the market for game cash, so nobody has to pay to get them. They're spent on once-a-day refills and 30-day Regular status (faster regen). Limited items and mystery boxes are never sold for real money. Tokens only enter the game when Stripe confirms a payment, and each payment can only be counted once.
- **Crews.** Players start or join crews (up to 25 members) with a private crew chat, a shared vault, officers, and respect earned from fights won against outsiders. Crews have their own rankings.
- **People.** Private messages, a contacts list, profiles with chosen looks, taglines, name colours and skyline backdrops.
- **Every day.** A daily reward with a 7-day streak, three daily goals (all three earn a mystery box and a token), and a first-steps guide that pays new players for learning the ropes.
- **Homes.** 31 steps, from sleeping rough in a doorway to a penthouse on the Moon. Each raises your mood and stamina limits and brings perks: faster healing, mugging protection, shorter A&E stays, cheaper or instant travel, and a free daily item. Everyone starts homeless.
- **Garage.** 16 rides, from a stolen bike to a private submarine: quicker, cheaper travel and better job odds.
- **Careers.** Six legitimate day jobs with ten ranks each. Clock in once a day for a wage; promotions make the career's perk stronger.
- **Story missions.** Eight stories told by recurring characters, 40 missions in all, from Aunty Rose's dairy to The Big One on Casino Island.
- **Medals.** 126 medals earned automatically as your numbers grow. Wear any one as your title.
- **Crew wars.** A crew leader declares war on another crew for $100,000 from the vault. For 48 hours members can attack the enemy anywhere in the city; every win scores points, bigger targets are worth more. The winners take 20% of the losers' vault, respect and a war trophy each. Leaders can surrender.
- **Travel the country.** Sixteen towns from the Bay of Islands to Invercargill, each with its own shop of local goods: 114 items you can't get anywhere else, from mānuka honey and Bluff oysters to an ice axe or an Antarctic meteorite. Stock is shared by every player and comes back slowly, the rare pieces very slowly. Walk, hitchhike, stow away on a truck (and risk getting caught), take the coach, the scenic train, a rental car, a campervan, a flight, a charter plane or your own ride from the garage. Each way costs a different amount, takes a different time and lets you carry a different amount back. Travel gear like a tramping pack, a roof box, a coach pass or a gold frequent flyer card makes trips cheaper, faster or roomier. While you're away, jobs, the gym and fights wait at home.
- **Armoury and turn-based fights.** Over thirty weapons, armour pieces and throwables to buy, plus ammo. You carry one melee weapon, one sidearm and one long gun, wear armour on your head, body, hands, legs and feet, and pack up to three throwables. Everything has a weight and strength sets how much you can carry. Fights with other players go turn by turn: each turn you pick a weapon, throw something or run, and they answer. Hits land on a part of the body, where armour soaks up its share. Pepper spray blinds, flashbangs stun, smoke makes you hard to hit and Molotovs burn.
- **Companies.** Players start legitimate businesses (forty-two kinds, from a food truck to a shipping line), hire other players and set their wages. Everyone works one shift a day: the company earns money, pays wages from its funds, and builds reputation towards ten stars. More stars mean more revenue, more staff and a stronger perk for everyone who works there. Owners can sell: list the business at an asking price or take offers. The buyer gets the staff, the stars and the money in the bank, and the seller pays a 5% broker's fee.
- **Turf.** Crews earn influence in each district from jobs and fights. The crew that runs a district takes a 3% cut of every job done there.
- **Seasonal events.** Summer Heatwave, Winter Storms, Halloween Night, Fireworks Week and The Christmas Heist, every year, each with limited items and trophies for the top ten.
- **Collection log.** Every item a player has ever owned, with progress by category.
- **Fair play.** New characters can't use the market for their first day, Founder's keys can't be sold, crewmates can't attack each other, chat and messages are rate-limited, players can report messages, and admins can ban, mute, delete messages and adjust accounts. Every admin action is logged.
- **Real stock moves.** `supabase/03_stock_feed.sql` fetches each real company's close after the US market shuts and moves its game twin by the same percentage.

## Set it up (about 15 minutes, all doable on an iPad)

### 1. Create the database

1. Go to supabase.com, sign in and choose **New project**. Pick a region close to your players (Sydney for NZ) and save the database password somewhere safe.
2. When it's ready, open **SQL Editor** in the left menu, then **New query**.
3. Open `supabase/01_schema.sql` here on GitHub, tap **Raw**, select all and copy. Paste into the SQL Editor and tap **Run**. You should see "Success. No rows returned".
4. Do the same with `supabase/02_content.sql` (items, jobs and companies). It's long, so give it a few seconds.
5. Do the same with `supabase/03_stock_feed.sql` (the daily stock feed). If it complains about `pg_cron` or `pg_net`, go to **Database → Extensions**, switch both on, and run it again.

### 2. Sign-in settings

Go to **Authentication → Sign In / Providers → Email**.

- **While you're testing with friends,** you can switch **Confirm email** off so new players can play straight away.
- **Before a public launch,** switch it back on. Confirmed emails make it much harder for one person to make lots of accounts. Supabase's built-in email only sends a few messages an hour, so add your own email provider under **Authentication → Emails → SMTP settings** (Resend and Postmark both have free tiers).
- **Optional bot check:** create a free Cloudflare Turnstile widget at dash.cloudflare.com (Turnstile, then Add widget, with your Vercel address as the domain). Put its **secret key** in Supabase: in **Authentication**, find **Bot and Abuse Protection**, switch on **Enable CAPTCHA protection** and choose Turnstile. Then put its **site key** in Vercel as `VITE_TURNSTILE_SITE_KEY` and redeploy. Do both halves, or sign-in will fail.

Then go to **Authentication → URL Configuration** and set **Site URL** to your Vercel address once you have it (step 3).

### 3. Put it online

1. Go to vercel.com, choose **Add New → Project** and import this GitHub repo. Vercel detects Vite on its own.
2. Before deploying, open **Environment Variables** and add two values from Supabase (**Project Settings → API**):
   - `VITE_SUPABASE_URL`: the Project URL
   - `VITE_SUPABASE_ANON_KEY`: the `anon` `public` key (never the `service_role` key)
3. Tap **Deploy**. When it's done, open the address, create an account and pick a street name.

### 4. Make yourself an admin

Create your character in the game first. Then in the Supabase **SQL Editor**, run this with your street name:

```sql
update game.players set is_admin = true where name = 'YourName';
```

Reload the game and an **Admin** link appears at the bottom of the menu. From there you can see sign-ups and revenue, search players, ban or mute them, give or take cash, tokens and items, deal with reported messages, and make other people admins.

### 5. Install it on your iPad

Open the game in Safari, tap **Share**, then **Add to Home Screen**. It opens full screen like an app, with its own icon. Players can do the same on any phone.

### 6. Switch on payments (when you're ready to take money)

The game runs fine without this. The Buy buttons just say payments aren't switched on yet.

1. **Fill in the terms page.** Open `src/pages/legal.jsx` and replace the two values at the top with your name or business and a contact email. It's a plain-English draft, so have it checked before you take real money.
2. **Stripe account.** Sign up at stripe.com and fill in your business details and bank account. Do everything below in **test mode** first (the toggle at the top of the Stripe dashboard).
3. **Copy your secret key.** In Stripe, go to **Developers → API keys** and copy the **Secret key** (starts `sk_test_`).
4. **Create the two functions in Supabase.** Go to **Edge Functions → Deploy a new function → Via editor**.
   - Name the first one `create-checkout`. Paste in `supabase/functions/create-checkout/index.ts` and deploy.
   - Name the second one `stripe-webhook`. Paste in `supabase/functions/stripe-webhook/index.ts`. Before deploying, switch **Verify JWT** off: Stripe can't sign in, and the function checks Stripe's own signature instead.
5. **Tell Stripe where to send payments.** In Stripe, go to **Developers → Webhooks → Add endpoint**.
   - URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   - Save, then copy the **Signing secret** (starts `whsec_`).
6. **Add the secrets in Supabase.** Go to **Edge Functions → Secrets** and add three:
   - `STRIPE_SECRET_KEY`: the key from step 3
   - `STRIPE_WEBHOOK_SECRET`: the signing secret from step 5
   - `SITE_URL`: your Vercel address, like `https://backstreet.vercel.app`
7. **Test a purchase.** Buy a pack in the game using Stripe's test card `4242 4242 4242 4242`, any future expiry date and any CVC. The tokens should land in your stash within a few seconds.
8. **Go live.** Switch Stripe to live mode. Repeat steps 3, 5 and 6 with the live keys.

Pack prices are in NZD and include GST. They're set in the `token_packs` table in `01_schema.sql`. Once you're registered for GST, or selling to a lot of overseas players, look at **Stripe Tax** to handle tax for you. If a player asks for a refund, refund the payment in the Stripe dashboard and remove their unspent tokens.

## Changing the game

- Jobs, fighters, districts and stories: `src/game/content.js`
- Items: `src/game/catalog.js`
- Companies: `src/game/stocks.js`
- Homes: `src/game/homes.js`
- Careers, vehicles and medals: `src/game/life.js`
- Story missions: `src/game/missions.js`
- Seasonal events and their items: `src/game/seasons.js`
- Kinds of company: `src/game/companies.js`
- Weapons, armour and ammo: `src/game/arms.js`
- Towns, ways to travel, travel gear and local goods: `src/game/travel.js`

After changing any of these, run `npm run gen-sql` to rebuild `supabase/02_content.sql`, then run that file in the SQL Editor again. The game rules themselves (odds, payouts, cooldowns) are in `supabase/01_schema.sql`.

## Run it locally

```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```
