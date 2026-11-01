# Backstreet

A multiplayer crime game set in a rain-soaked harbour city. Pull jobs, train, fight locals and other players, spring friends from the cells, trade 1,000 collectible items on a player market, and invest in eighteen companies whose prices follow real ones.

Built with React and Vite, on Supabase (database, sign-in and live updates), hosted on Vercel.

## How it's put together

- **Every rule runs on the server.** Game tables live in a private `game` schema the public API can't touch. The browser can only call the `public.*` functions in `supabase/01_schema.sql`, and each one checks who's calling before doing anything. Nobody can give themselves cash from the browser console.
- **Live updates.** Chat messages and notifications (you were attacked, your item sold) arrive instantly through Supabase Realtime, with polling as a fallback.
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

- For a quick start, switch **Confirm email** off so new players can play straight away.
- If you leave it on, Supabase's built-in email only sends a few messages an hour. For a public launch, add your own email provider under **Authentication → Emails → SMTP settings**.

Then go to **Authentication → URL Configuration** and set **Site URL** to your Vercel address once you have it (step 3).

### 3. Put it online

1. Go to vercel.com, choose **Add New → Project** and import this GitHub repo. Vercel detects Vite on its own.
2. Before deploying, open **Environment Variables** and add two values from Supabase (**Project Settings → API**):
   - `VITE_SUPABASE_URL`: the Project URL
   - `VITE_SUPABASE_ANON_KEY`: the `anon` `public` key (never the `service_role` key)
3. Tap **Deploy**. When it's done, open the address, create an account and pick a street name.

## Changing the game

- Jobs, fighters, districts and stories: `src/game/content.js`
- Items: `src/game/catalog.js`
- Companies: `src/game/stocks.js`

After changing any of these, run `npm run gen-sql` to rebuild `supabase/02_content.sql`, then run that file in the SQL Editor again. The game rules themselves (odds, payouts, cooldowns) are in `supabase/01_schema.sql`.

## Run it locally

```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```
