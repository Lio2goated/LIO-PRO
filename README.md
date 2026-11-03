# LIO TWEAKS — setup guide
Created and owned by **slpet lio**

## What's in this folder

```
lio-tweaks/
├─ public/                  ← the website (this is what visitors see)
│  ├─ index.html            ← all pages and layout
│  └─ assets/
│     ├─ css/styles.css     ← colors, fonts, design
│     └─ js/                ← one file per feature
│        ├─ config.js       ← Supabase URL/key and limits  ← edit here
│        ├─ core.js         ← page switching, messages
│        ├─ auth.js         ← sign up, log in, password reset
│        ├─ profiles.js     ← saved profiles
│        ├─ tool-pc.js      ← PC Analyzer
│        ├─ tool-system.js  ← System Information
│        ├─ tool-fortnite.js
│        ├─ tool-controller.js
│        ├─ tool-kbm.js     ← Keyboard & Mouse Lab
│        ├─ tool-studio.js  ← Controller Studio
│        ├─ data-guides.js  ← free guide text  ← add guides here
│        ├─ data-games.js   ← supported games  ← add games here
│        ├─ guides.js, dashboard.js, pro.js, app.js
├─ netlify/functions/       ← Stripe payment code (runs on Netlify's servers)
├─ supabase/setup.sql       ← database tables + security rules
├─ netlify.toml, package.json
```

## Step 1 — Supabase (accounts and saved profiles)
1. Supabase → **SQL Editor** → New query → paste all of `supabase/setup.sql` → **Run**.
   The last result table should list: profiles (1 policy), saved_profiles (4), pro_content (1).
2. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: your Netlify address, e.g. `https://lio-tweaks.netlify.app`
   - **Redirect URLs**: add the same address.
   This makes confirmation and password-reset emails send people back to your site.

## Step 2 — Put the site on Netlify

**Option A — drag and drop (quickest, no payments yet)**
Drag the **`public`** folder onto Netlify's Deploys page. Everything works except
the "Get Lio Tweaks Pro" button, which will say checkout isn't switched on yet.

**Option B — GitHub (needed for Pro payments)**
1. Upload this whole `lio-tweaks` folder to a GitHub repository.
2. Netlify → Add new site → Import from Git → pick the repository.
   Netlify reads `netlify.toml` automatically.

## Step 3 — Stripe (Pro payments, Option B only)
1. Stripe (Test mode first) → create product **Lio Tweaks Pro**, **$15/month recurring**. Copy the **Price ID** (`price_...`).
2. Stripe → Settings → Billing → **Customer portal** → Save (enables "Manage Subscription").
3. Netlify → Site configuration → **Environment variables**, add:
   - `STRIPE_SECRET_KEY` — `sk_test_...`
   - `STRIPE_PRICE_ID` — `price_...`
   - `SUPABASE_URL` — `https://hbyqplzdzkuiibhaofcg.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API → service_role (**never put this in the website files**)
   - `STRIPE_WEBHOOK_SECRET` — from step 4
4. Stripe → Developers → **Webhooks** → Add endpoint
   - URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_...`) into Netlify, then **redeploy**.
5. Test with card `4242 4242 4242 4242`, any future date, any CVC.
6. When it works, repeat with **live** keys, a live price and a live webhook.

## Giving yourself Pro for testing
In Supabase SQL Editor (change the email):
```sql
update public.profiles set membership = 'pro'
where id = (select id from auth.users where email = 'you@example.com');
```

## Adding things later
- **New guide**: copy one entry in `data-guides.js` and change the text.
- **New game**: add it to `data-games.js`, then tag guides with `game: "its-id"`.
- **New Pro guide**: add a row to `pro_content` in Supabase and its title to `PRO_CATALOG` in `data-guides.js`.

## Security notes
- Membership can only be changed by the Stripe webhook (server). Users can only read their own row.
- Pro guides and presets are stored in Supabase and only sent to verified Pro members.
- Saved-profile limits (Free 10 / Pro 100) are enforced by the database.
- The publishable Supabase key in `config.js` is meant to be public. Secret keys live only in Netlify.
