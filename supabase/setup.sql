-- =====================================================================
-- LIO TWEAKS — complete Supabase setup
-- Supabase → SQL Editor → New query → paste ALL of this → Run.
-- Safe to run more than once. Safe to run on top of the earlier SQL.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PROFILES — one row per user, holds membership
--    Users can READ their own row only. Nobody can change membership
--    from the website — only the Stripe webhook (service_role key).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  membership  text not null default 'free',
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
create unique index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

alter table public.profiles drop constraint if exists profiles_membership_check;
alter table public.profiles add constraint profiles_membership_check check (membership in ('free', 'pro'));

alter table public.profiles enable row level security;

-- Remove any old policies that might let users edit their own membership
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy %I on public.profiles', p.policyname);
  end loop;
end $$;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- Auto-create a profile row for every new account
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- Helper used by the policies below
create or replace function public.is_pro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and membership = 'pro');
$$;


-- ---------------------------------------------------------------------
-- 2. SAVED_PROFILES — users' saved settings
-- ---------------------------------------------------------------------
create table if not exists public.saved_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  profile_name  text not null,
  profile_type  text not null,
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
alter table public.saved_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.saved_profiles alter column user_id set default auth.uid();

alter table public.saved_profiles drop constraint if exists saved_profiles_profile_type_check;
alter table public.saved_profiles add constraint saved_profiles_profile_type_check
  check (profile_type in ('fortnite', 'controller', 'keyboard_mouse', 'studio_design'));
alter table public.saved_profiles drop constraint if exists saved_profiles_profile_name_check;
alter table public.saved_profiles add constraint saved_profiles_profile_name_check
  check (char_length(profile_name) between 1 and 60);
alter table public.saved_profiles drop constraint if exists saved_profiles_settings_size;
alter table public.saved_profiles add constraint saved_profiles_settings_size
  check (pg_column_size(settings) < 8000);

create index if not exists saved_profiles_user_idx on public.saved_profiles (user_id, updated_at desc);

-- Keep updated_at current, and stop rows being moved to another user
create or replace function public.saved_profiles_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.user_id := old.user_id;
  return new;
end; $$;
drop trigger if exists saved_profiles_touch on public.saved_profiles;
create trigger saved_profiles_touch before update on public.saved_profiles
  for each row execute procedure public.saved_profiles_before_update();

-- Profile limit: Free 10, Pro 100 (enforced by the database, not the website)
create or replace function public.can_add_profile()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.saved_profiles where user_id = (select auth.uid()))
         < case when public.is_pro() then 100 else 10 end;
$$;

alter table public.saved_profiles enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'saved_profiles' loop
    execute format('drop policy %I on public.saved_profiles', p.policyname);
  end loop;
end $$;

create policy "Read own saved profiles" on public.saved_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own saved profiles (within limit)" on public.saved_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_add_profile());
create policy "Update own saved profiles" on public.saved_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own saved profiles" on public.saved_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- 3. PRO_CONTENT — premium guides and presets
--    Only Pro members can read these rows. The website never contains
--    this content, so it can't be unlocked by editing website code.
-- ---------------------------------------------------------------------
create table if not exists public.pro_content (
  id       text primary key,
  kind     text not null check (kind in ('guide', 'preset')),
  tool     text,
  title    text not null,
  summary  text not null default '',
  body     jsonb not null default '{}'::jsonb,
  sort     int not null default 0
);
alter table public.pro_content enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'pro_content' loop
    execute format('drop policy %I on public.pro_content', p.policyname);
  end loop;
end $$;

create policy "Pro members can read pro content" on public.pro_content for select to authenticated
  using (public.is_pro());

-- Content (re-running this updates it)
insert into public.pro_content (id, kind, tool, title, summary, sort, body) values
('pro-pc-playbook', 'guide', null, 'Advanced PC Performance Playbook',
 'Memory profiles, bottleneck testing, frame-time tuning and more.', 1,
 '{"intro":"Work through these in order. Test one change at a time with the same game and the same scene so you can trust the result.",
   "steps":[
    ["Turn on your RAM''s rated speed","Many PCs run memory slower than it''s rated. In your BIOS, enable XMP (Intel) or EXPO / DOCP (AMD). Check Task Manager › Performance › Memory afterwards — Speed should match the kit''s rating. If the PC becomes unstable, turn it back off."],
    ["Confirm dual-channel memory","Task Manager › Performance › Memory shows Slots used. Two sticks in the slots your motherboard manual recommends (usually 2 and 4) run in dual-channel, which can noticeably raise FPS on CPU-limited games."],
    ["Find your real bottleneck","Turn on a performance overlay (NVIDIA App, AMD Adrenalin or Xbox Game Bar with Win + G). If GPU usage sits near 95–100%, lower graphics settings or use upscaling. If GPU usage is well below that while FPS is low, the CPU is the limit — lower view distance, player-count-heavy settings and background apps instead."],
    ["Watch frame times, not just FPS","Stutter shows up as spikes in frame time even when average FPS looks fine. Use the overlay''s frame-time graph; a flat line feels smooth."],
    ["Cap FPS just below refresh with adaptive sync","With G-SYNC or FreeSync on, a frame cap a few FPS below your refresh rate (for example 141 on 144Hz) keeps you inside the adaptive-sync range and avoids tearing and extra latency."],
    ["Enable Resizable BAR if supported","On modern GPUs and motherboards, Resizable BAR (Smart Access Memory on AMD) can help some games. It''s a BIOS setting; your GPU software shows whether it''s active."],
    ["Check thermals under load","Play for 20 minutes with the overlay on. If clocks drop as temperatures climb, clean dust, improve airflow, or adjust the fan curve."],
    ["Keep a clean background","Disable overlays you don''t use (Discord, Steam, launchers) and pause cloud sync while gaming."]],
   "tip":"Write down your before-and-after results for each change. If something doesn''t help, put it back."}'::jsonb),

('pro-fn-competitive', 'guide', null, 'Fortnite Competitive Configuration',
 'A complete tournament-style setup with reasoning for every setting.', 2,
 '{"intro":"This is the setup most competitive players start from: maximum clarity and consistency, minimum distraction. Adjust visuals up only if your FPS stays locked.",
   "steps":[
    ["Lock your frame rate","Set Frame Rate Limit to your refresh rate. A locked frame rate matters more than a higher but unstable one."],
    ["Rendering Mode","Performance mode gives the highest and most stable FPS on most PCs. Use DirectX 12 only if your PC holds your refresh rate comfortably and you prefer the visuals."],
    ["View Distance high, everything else low","In DirectX modes, keep View Distance on Far or Epic so distant players render, and set Shadows Off, Effects Low, Post Processing Low."],
    ["Textures by VRAM","Medium textures on 6 GB cards, High on 8 GB or more. Textures barely affect FPS until you run out of memory."],
    ["NVIDIA Reflex On + Boost","Reduces system latency on NVIDIA cards."],
    ["Turn on Visualize Sound Effects","Footsteps and gunfire on screen are valuable even with a good headset."],
    ["Build & edit multipliers","Raise build and edit multipliers slightly so you can turn quickly while building without changing your aim."],
    ["Practice routine","Spend 10 minutes in a Creative warm-up map before playing ranked — consistent settings plus consistent warm-up beats constant tweaking."]],
   "tip":"Save this as a Fortnite profile in Lio Tweaks so you can restore it after a game update resets your settings."}'::jsonb),

('pro-fn-lowend', 'guide', null, 'Fortnite on Low-End PCs & Laptops',
 'Get the most out of older hardware and laptops.', 3,
 '{"intro":"Older and lower-power PCs can still run Fortnite smoothly with the right setup.",
   "steps":[
    ["Use Performance rendering mode","Settings › Video › Rendering Mode › Performance. Restart Fortnite after switching."],
    ["Lower 3D resolution carefully","Start at 100% and lower in steps of 5% until FPS is steady. Below about 75% the image gets very soft."],
    ["Plug in your laptop","Laptops often slow down on battery. Keep the charger in and set Windows power mode to Best performance."],
    ["Force the dedicated GPU","Settings › System › Display › Graphics › add FortniteClient-Win64-Shipping.exe › High performance."],
    ["Cap at a frame rate you can hold","If you have a 60Hz screen, cap at 60. A steady 60 feels better than jumping between 50 and 90."],
    ["Free up memory","Close browsers and launchers. With 8 GB of RAM this makes a noticeable difference."],
    ["Keep it cool","Raise the back of a laptop for airflow and clean dust from vents."]],
   "tip":"If you have 8 GB of RAM, adding a second matching stick is often the best value upgrade for Fortnite."}'::jsonb),

('pro-ct-tuning', 'guide', null, 'Advanced Controller Tuning',
 'Deadzone testing, response curves and paddle layouts.', 4,
 '{"intro":"Fine-tuning these takes a few sessions, but the result is a controller that feels like an extension of your hands.",
   "steps":[
    ["Find your minimum deadzone","In Creative, set the right-stick deadzone to its lowest value. Let go of the stick: if the camera drifts, raise it by 1% until it stops. Do the same for the left stick. That''s your minimum — add 1% as a safety margin."],
    ["Choose a response curve","Exponential is slower near the center, giving fine control for small aim corrections. Linear is direct and predictable for fast tracking. Try each for a full session."],
    ["Use advanced look settings","If your game has advanced options, a short ramp-up time helps fast turns without making small adjustments twitchy."],
    ["Separate build and edit speed","Build and edit multipliers let you rotate faster while building. Raise them in small steps until edits feel snappy but not hard to control."],
    ["Map paddles to keep your thumb on the stick","Put jump and your most-used build piece or edit on the back paddles. Your right thumb should never have to leave the aim stick in a fight."],
    ["Lock it in","Once it feels right, save the profile and leave it for at least a week of play."]],
   "tip":"The Pro presets in the Controller Lab are good starting points for each of these approaches."}'::jsonb),

('pro-kbm-sens', 'guide', null, 'Find Your Perfect Mouse Sensitivity',
 'A step-by-step sensitivity-matching method.', 5,
 '{"intro":"This narrowing method helps you find a sensitivity that suits your arm, desk and playstyle — then you can stop changing it.",
   "steps":[
    ["Set a fixed DPI","Choose 800 or 1600 in your mouse software and don''t change it again."],
    ["Pick two extremes","Set your in-game sensitivity much higher than normal and play a short aim routine, then much lower. Note which felt closer to right."],
    ["Halve the gap","Choose a value halfway between your current setting and the better-feeling extreme. Test again."],
    ["Repeat 4–5 times","Each round narrows the range. Stop when the two values feel almost the same."],
    ["Check the 180° test","Your sensitivity should let you turn around with a comfortable arm swipe without running out of mousepad."],
    ["Commit for two weeks","Muscle memory needs time. Don''t change it unless something feels clearly wrong."]],
   "tip":"Save the result as a Keyboard & Mouse profile so you can restore it on any PC."}'::jsonb),

('pro-network', 'guide', null, 'Exclusive Tutorial: Reduce Online Lag',
 'Find and fix network problems that cost you fights.', 6,
 '{"intro":"Many problems that feel like low FPS are really network issues. These steps find and fix the most common ones.",
   "steps":[
    ["Turn on the in-game network stats","Most shooters can show ping and packet loss. Packet loss above 0% is a bigger problem than slightly higher ping."],
    ["Use Ethernet","A wired connection removes most Wi-Fi spikes. If you can''t run a cable, powerline adapters or a mesh node near your PC are the next best options."],
    ["Pick the closest server region","Choose the matchmaking region nearest to you rather than Auto if Auto picks a distant one."],
    ["Stop background uploads","Cloud backups, game downloads and video uploads on any device in your home can cause spikes. Pause them while you play."],
    ["Restart your router","A restart can clear up a router that has been running for weeks."],
    ["Check for router QoS","Many routers have a QoS or gaming mode that prioritizes your PC or console. Enable it if available."],
    ["Test at different times","If lag only happens in the evening, your internet provider''s network may be busy. Note the times and contact them."]],
   "tip":"If ping is fine but you still see rubber-banding, check packet loss — that''s usually the real cause."}'::jsonb),

('preset-builder', 'preset', 'controller', 'Pro Builder',
 'Fast build and edit speed with stable aim for heavy builders.', 10,
 '{"settings":{"look":56,"aim":44,"build":86,"edit":90,"ldz":7,"rdz":5,"layout":"builder-pro","style":"builder","aimPref":"exponential"}}'::jsonb),
('preset-zb-tracker', 'preset', 'controller', 'Zero Build Tracker',
 'Smooth tracking aim tuned for Zero Build fights.', 11,
 '{"settings":{"look":50,"aim":46,"build":50,"edit":55,"ldz":9,"rdz":6,"layout":"combat-pro","style":"zerobuild","aimPref":"exponential"}}'::jsonb),
('preset-precision', 'preset', 'controller', 'Precision Aim',
 'Lower sensitivity for long-range accuracy.', 12,
 '{"settings":{"look":40,"aim":32,"build":60,"edit":62,"ldz":9,"rdz":6,"layout":"builder-pro","style":"defensive","aimPref":"exponential"}}'::jsonb),
('preset-drift-safe', 'preset', 'controller', 'Drift-Safe',
 'Higher deadzones for older controllers with stick drift.', 13,
 '{"settings":{"look":52,"aim":45,"build":62,"edit":64,"ldz":15,"rdz":13,"layout":"default","style":"balanced","aimPref":"exponential"}}'::jsonb)
on conflict (id) do update set
  kind = excluded.kind, tool = excluded.tool, title = excluded.title,
  summary = excluded.summary, body = excluded.body, sort = excluded.sort;


-- ---------------------------------------------------------------------
-- 4. CHECK YOUR WORK — you should see exactly these policies:
--    profiles: 1 (SELECT) · saved_profiles: 4 (SELECT, INSERT, UPDATE, DELETE)
--    pro_content: 1 (SELECT)
-- ---------------------------------------------------------------------
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'saved_profiles', 'pro_content')
order by tablename, cmd;


-- ---------------------------------------------------------------------
-- 5. OPTIONAL — give yourself Pro for testing (change the email first)
-- ---------------------------------------------------------------------
-- update public.profiles set membership = 'pro'
-- where id = (select id from auth.users where email = 'you@example.com');
