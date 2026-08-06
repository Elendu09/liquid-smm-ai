-- Referral program (Replit-style): referrer earns credits when a referred
-- user upgrades to a paid plan.
--
--  1. Every profile gets a unique public `referral_code` (used as /referral/<code>).
--  2. `referred_by` records who invited the user (set via the claim-referral edge fn).
--  3. `referrals` ledger rows are written once per referred user (UNIQUE) when
--     they first land on a paid plan; the referrer's credit_balances/credit_events
--     are bumped by the referral-reward edge function.

alter table public.profiles
  add column if not exists referral_code text;

alter table public.profiles
  add column if not exists referred_by uuid references auth.users(id) on delete set null;

-- Guarantee uniqueness for the public share codes (nulls never collide).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_referral_code_key'
  ) then
    alter table public.profiles add constraint profiles_referral_code_key unique (referral_code);
  end if;
end $$;

-- Backfill a short code for every existing profile.
update public.profiles
  set referral_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  where referral_code is null or referral_code = '';

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  plan text not null,
  status text not null default 'rewarded' check (status in ('rewarded')),
  credits_awarded integer not null default 500,
  rewarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint referrals_referred_unique unique (referred_user_id)
);

alter table public.referrals enable row level security;

-- Referrers can see their own referrals ledger (earnings list).
drop policy if exists "Referrers can view their referrals" on public.referrals;
create policy "Referrers can view their referrals"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_id);

-- Anyone may insert a referral record (the referral-reward edge fn authorizes
-- with the service role; a direct insert by the referred user is harmless since
-- the reward credit is only applied server-side).
drop policy if exists "Users can insert referrals" on public.referrals;
create policy "Users can insert referrals"
  on public.referrals for insert
  to authenticated
  with check (auth.uid() = referred_user_id);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id, created_at desc);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Atomically add permanent credits to a user's balance (used by referral-reward).
-- Creates the balance row if missing; otherwise increments `purchased` only
-- (monthly `included`/`cap` are untouched).
create or replace function public.referral_apply_credit(p_user_id uuid, p_credits integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.credit_balances (user_id, included, purchased, used, cap, renews_at)
  values (p_user_id, 0, p_credits, 0, 500, date_trunc('month', now()) + interval '1 month')
  on conflict (user_id) do update
    set purchased = public.credit_balances.purchased + p_credits,
        updated_at = now();
$$;
