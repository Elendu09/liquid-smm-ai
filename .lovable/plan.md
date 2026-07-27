## 1. Strict auth ↔ demo separation

**Rule:** demo (guest) and authenticated sessions can never coexist, and trial CTAs never enter demo mode.

- `src/hooks/useGuest.ts`
  - `enableGuest()`: if a Supabase session exists, sign out first (`supabase.auth.signOut()`) before setting the guest flag.
- `src/hooks/useAuthUser.ts` + `src/components/auth/RequireAuth.tsx`
  - When an authenticated `user` is detected, force-clear the guest flag (`disableGuest()`). Guest branch only renders when `!user`.
- `src/pages/Login.tsx` / `src/pages/Signup.tsx`
  - On mount, call `disableGuest()` so opening auth always exits demo.
  - After successful sign-in/sign-up, ensure `disableGuest()` runs before navigating.
- `src/components/landing/Hero.tsx`
  - "Start free trial" (line 171–179) → change `<Link to="/dashboard">` to `/signup` and add `onClick={disableGuest}`.
  - "Get started for free" email form (line 197–218) already routes to `/signup`; add `disableGuest()` in `handleEmailStart` before navigation.
  - "Try live demo" stays as the only demo entry, calls `enableGuest()` (which now signs out first).
- `src/components/landing/CTASection.tsx` and `ToolsShowcase.tsx`
  - Point "Start free trial" / "Start your free trial" buttons to `/signup` (not `/dashboard`).

## 2. Credits UI in dashboard header

- New hook `src/hooks/useCredits.ts`
  - Returns `{ included, used, purchased, cap, renewsAt, history, loading }`.
  - Signed-in: reads from a new `public.credit_balances` (single row per user) + `public.credit_events` (ledger). Realtime subscribe for live updates.
  - Guest: returns local seed matching current Settings demo numbers so the header always renders.
- Migration
  - `credit_balances(user_id pk, included int, used int, purchased int, cap int, renews_at timestamptz)`.
  - `credit_events(id, user_id, kind, delta int, label, created_at)`.
  - GRANTs to `authenticated` + `service_role`; RLS: user can select own rows; inserts via service role only.
  - `handle_new_user` trigger extended to seed a `credit_balances` row (cap=500 free tier).
- New component `src/components/dashboard/shell/CreditsPill.tsx`
  - Compact pill: `✦ 494 / 500` with primary progress bar; hover popover shows Included / Purchased / Renews with a "Purchase credits" button linking to `/dashboard/settings/billing`.
- Mount in `DashboardLayout` header (desktop + mobile top bar), placed next to the notification bell.

## 3. Credits usage UI in Settings (synced with billing)

Rebuild the top of `BillingPanel` (`src/components/settings/SettingsPanels.tsx`) to match the reference:

- **Creative Credits card**
  - Header row: `✦ Creative Credits` + description + `+ Purchase Credits` primary CTA (gradient).
  - Huge numeric `credits remaining` from `useCredits`.
  - Full-width progress bar (`used/cap`).
  - Three-column stat row: **Included** `used/cap`, **Purchased** `n`, **Renews** `date`.
  - "HOW CREDITS WORK" — two pill rows: AI Writing / Content Adaptation with sparkle badges.
  - "CREDIT HISTORY" — list from `credit_events` (icon + label + timestamp + signed delta). Empty state for real users with no events.
- Keep existing Plan / Payment methods / Invoices sections below.
- Data source is the same `useCredits` hook so header pill and settings always stay in sync (realtime + on-focus refetch).

## 4. Team collaboration UI polish (matches reference)

Update `src/pages/dashboard/Team.tsx`:

- **Members section**: header `Members` left, `N person/people` counter right. Owner card becomes a rounded panel with large gradient avatar circle, "YOU" muted tag beside the name, email in primary/blue, and role/status chips (`♛ Owner`, `● Active`) beneath.
- **Invite a teammate panel**: single rounded card, description under title, right-aligned `N / N seats used` counter, single row with email input (pill-shaped, full width), Role select, and gradient `Send invite` button.
- Show `⚠ Seat limit reached. Upgrade to add more teammates.` when member count ≥ plan cap; disable submit and link to Billing.
- Keep existing invite/role dialogs and hooks; only markup + tokens change.

## Technical details

- Realtime channels use unique suffixes (`crypto.randomUUID()`) to avoid the "cannot add callbacks after subscribe()" regression.
- No new secrets; no third-party billing yet — credits are workspace-local until Stripe/Paddle is wired.
- All new tables in `public` include `GRANT` + RLS per project rules.
- Guest mode continues to see seed numbers; every write path already goes through `guardWrite`.

## Files touched

Edit: `useGuest.ts`, `useAuthUser.ts`, `RequireAuth.tsx`, `Login.tsx`, `Signup.tsx`, `Hero.tsx`, `CTASection.tsx`, `ToolsShowcase.tsx`, `DashboardLayout.tsx`, `SettingsPanels.tsx` (BillingPanel), `Team.tsx`.
Create: `useCredits.ts`, `CreditsPill.tsx`, migration for `credit_balances` + `credit_events`.
