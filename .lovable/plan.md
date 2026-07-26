## Scope

Four focused improvements: onboarding name prefill + account sync, mobile-responsive Webhooks page, and a premium light-mode visual hierarchy across the dashboard.

---

### 1. Prefill full name from signup into Onboarding Step 1

- **`src/pages/Signup.tsx`**: on successful sign-up, persist the entered full name into Supabase auth `user_metadata.full_name` (via `signUp({ options: { data: { full_name } } })`) and also write it to `smmpilot:onboarding` profile.name immediately so Step 1 renders it.
- **`src/hooks/useOnboarding.ts`**: on first load, if `profile.name` is empty, hydrate from `supabase.auth.getUser()` → `user_metadata.full_name` or fall back to email local-part.
- **`src/components/onboarding/OnboardingWizard.tsx`**: Step 1 name input already binds to `profile.name`, so prefill will render automatically; add a subtle "from your account" helper hint under the field when prefilled.

### 2. Two-way sync: Onboarding profile ↔ Account settings

Keep both surfaces truthful so editing one updates the other.

- **New hook `src/hooks/useProfileSync.ts`**: single source of truth combining `auth.user_metadata` + onboarding profile. Exposes `{ fullName, role, brandDescription, tone, timezone, updateProfile() }`. On `updateProfile`, writes to both `supabase.auth.updateUser({ data })` and `useOnboarding.updateProfile()` atomically.
- **`src/components/settings/SettingsPanels.tsx` (Profile panel)**: switch from local state → `useProfileSync`. Any edit here reflects in onboarding profile immediately.
- **`OnboardingWizard.tsx`**: on `finish()` route the save through `useProfileSync` so name/role/brand also land in `auth.user_metadata`.
- **Realtime**: subscribe to `auth.onAuthStateChange` so metadata edits from another tab propagate.

### 3. Webhooks settings page — mobile responsiveness

Bring `src/pages/dashboard/settings/Webhooks.tsx` (and its table/list) in line with other settings pages.

- Replace the fixed-width table with a responsive pattern: `<table>` on `md+`, stacked card list on mobile (`sm:hidden` cards showing URL, event chips, status, actions in a menu).
- Header actions collapse: primary "New webhook" button becomes full-width on mobile; secondary actions move into a `DropdownMenu`.
- Long URLs use `truncate` + tooltip; event badges wrap.
- Dialogs (`NewWebhookDialog`, delete confirm) already use shadcn `Dialog` — verify padding, add `max-h-[90vh] overflow-y-auto` for small screens.
- Match `p-4 sm:p-6 lg:p-8` container spacing used by sibling settings pages.

### 4. Premium light-mode visual hierarchy (dashboard-wide)

Reference direction from the uploaded image: crisp off-white background, tight uppercase kicker (`DISCOVER`), large serif headline, subtle helper line, prominent gradient CTA banner, softer secondary info banner, then content cards with generous whitespace and hairline separators.

Implementation across the design system (light mode only — dark mode untouched):

- **`src/index.css` light tokens**:
  - `--background: 220 20% 98%` (cool off-white), `--card: 0 0% 100%`, `--muted: 220 15% 96%`.
  - `--border: 220 14% 91%` (hairline), `--ring` softened.
  - New semantic tokens: `--kicker` (primary at reduced opacity), `--surface-elevated`, `--banner-gradient: linear-gradient(90deg, hsl(230 90% 55%), hsl(265 85% 55%))`, `--banner-soft: linear-gradient(90deg, hsl(220 100% 97%), hsl(220 100% 94%))`, `--shadow-premium: 0 1px 2px hsl(220 40% 20% / 0.04), 0 8px 24px -12px hsl(220 40% 20% / 0.08)`.
  - Typography scale bump: h1 tighter tracking, more line-height contrast between kicker/title/subtitle.

- **`PageHeader.tsx`**:
  - Add optional `kicker` prop rendered as `text-[11px] font-semibold uppercase tracking-[0.24em] text-primary` above the title (mirrors "DISCOVER").
  - Title stays `Instrument Serif`; description becomes standard sentence-case sans body text (not uppercase caps), matching the reference's "352 influencers on the platform." style.
  - Remove bottom border in light mode; rely on spacing + subtle divider only when actions row wraps.

- **New component `src/components/dashboard/shell/PromoBanner.tsx`**:
  - Two variants: `gradient` (spotlight CTA — indigo→violet with white text, rounded-2xl, right-aligned pill CTA) and `soft` (pale-blue info strip with chevron). Reused for onboarding tips, upgrade prompts, and announcements on dashboard/home/hub pages.

- **`Dashboard.tsx`**:
  - Wrap greeting in new `kicker="Overview"` prop.
  - Replace the current 3-button actions cluster in light mode with a single primary gradient CTA + icon-only secondaries (keeps the reference's clean top bar).
  - Insert `PromoBanner` above KPI strip when relevant (tour reminder, connect-account nudge).
  - KPI tiles: white cards, `shadow-premium`, hairline borders, larger numeric with serif italic accent color.
  - Kanban lanes: remove heavy borders, use `bg-card` + `shadow-premium`, section titles gain kicker treatment.

- **Cards / SectionCard**: unify to `rounded-2xl border border-border/60 bg-card shadow-premium` in light mode; increase internal padding on desktop.

- **Buttons**: Primary uses the new gradient token in light mode for hero CTAs; ghost/outline stays neutral gray.

- Apply the same header + banner pattern to hub pages (Create/Publish/Engage/Audience/Analytics/Library/Activity/Settings/Help) so the hierarchy is consistent, not just Home.

### Technical notes

- All colors remain HSL semantic tokens; no hex in components.
- Dark mode tokens unchanged — light-mode-only visual pass.
- No schema changes. `auth.updateUser` is client-side; no migration.
- Webhooks changes are pure presentational (Tailwind responsive classes + conditional render).

### Out of scope

- Dark mode restyle.
- New backend fields.
- Redesign of dialogs beyond mobile scroll fix.
