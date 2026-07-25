## Goal

Make the 8-step Onboarding Setup a **one-time, first-run only** experience that meaningfully shapes the dashboard afterward, and rebuild its Step 2 (Connect accounts) to look like the Buffer channel picker screenshot.

---

## Part 1 — Show setup once, tour is the only re-entry

Today `DashboardLayout` auto-opens the wizard whenever `state.completed === false`, and buttons in `Dashboard.tsx`, `DashboardSidebar.tsx`, and `SettingsPanels.tsx` re-dispatch `smmpilot:open-onboarding` to reopen it.

Changes:
- Add a `smmpilot:onboarding-seen` flag (localStorage + `profiles.onboarding_state.seen`) set on first close/complete of the wizard.
- `DashboardLayout`: only auto-open when `!state.completed && !seen`. Remove the `open-onboarding` window-event listener entirely so nothing else can pop the setup back up.
- Remove/repoint every "open setup" trigger to the **tour** instead:
  - `Dashboard.tsx` "Take the tour" already fires tour — leave it. Any leftover setup buttons removed.
  - `DashboardSidebar.tsx`: the setup entry becomes "Take the tour" firing `smmpilot:open-onboarding-tour`.
  - `SettingsPanels.tsx` line 281: replace "Re-run setup" with "Replay tour".
- Keep a hidden dev-only reset in Settings → Advanced ("Reset onboarding") that clears the flags — not surfaced as a primary action.

Result: users see the setup exactly once; afterwards only the guided tour is reachable.

---

## Part 2 — Each step actually configures the dashboard

Right now the wizard writes to `profiles.onboarding_state` but the dashboard barely reads it. Wire every step to a concrete dashboard effect:

| Step | Field | Dashboard effect |
|---|---|---|
| 1 Welcome | `name` | Replace "Welcome back" in `PageHeader` with "Welcome, {name}". |
| 2 Connect | `connectedPlatformIds` | Pre-seed `AccountContext` selected filters; hide `ConnectChannelsSection` platforms already picked; KPI strip filters to these platforms. |
| 3 Niches | `niches` | Passed as context to `ai-command`, `ai-create`, caption/hashtag generators; drives Templates filter in `TemplatesSection`. |
| 4 Goals | `goals` | Reorders Dashboard Kanban lanes + `HomeSummaryCard` KPIs: `grow`→followers first, `sales`→conversions/link clicks, `community`→engagement/DMs, `time`→automation runs. Also filters "What's next" suggestions in `OnboardingScoreCard`. |
| 5 Brand voice | `tone`, `brandDescription` | Default tone in `GenerateCaptionsDialog`, `ComposeVariantsDialog`, `AiBriefDialog`; injected into all AI edge-function system prompts. |
| 6 Cadence | `postsPerWeek`, `preferredTimes` | Seeds `useBestTimes` overlay; scheduler defaults new posts to next preferred slot; publish queue shows target vs actual per week. |
| 7 Autonomy | `autonomy` | Sets default in Engagement Bot, DM Automation, Scheduled Post Runner (`manual`/`suggest`/`auto-approval` gate on `guardWrite`-like check). |
| 8 Finish | `completed` | Unlocks `HomeSummaryCard` expand (already gated), marks `seen`, fires a one-time toast "Your dashboard is tuned for {goals[0]}". |

Implementation:
- New selector hook `useOnboardingContext()` in `src/hooks/useOnboardingContext.ts` exposing memoized derived values (goal-ordered lanes, tone, cadence, preferred platforms, ai-system-context string).
- `PageHeader` accepts optional `greetingName`; `Dashboard.tsx` passes it.
- `Dashboard.tsx` reorders `upcoming/health/recent` lanes and KPI tiles based on `goals[0]`.
- `TemplatesSection` filters by niches when present.
- `ai-command` and `ai-create` edge functions accept an `onboarding` block in the request body (niches, tone, goals, brandDescription) and prepend it to the system prompt. Frontend hooks (`useAiCreate`, `useAiCommandHistory`) attach it automatically.
- `Scheduler` / `NewPostDialog` read `preferredTimes` + `postsPerWeek` for default slot + weekly cap warning.
- Automation surfaces read `autonomy` for default toggle values on first mount.

---

## Part 3 — Buffer-style Connect Accounts (Step 2)

Rebuild the Step 2 UI in `OnboardingWizard.tsx` (and reuse in `ConnectAccountDialog.tsx` for consistency) to match the uploaded reference:

- Centered modal-card look with soft off-white surface (in dark mode: elevated `bg-card` with subtle border).
- Title "Connect a New Channel" centered, circular close top-right.
- **3-column responsive grid** (2 cols on mobile) of platform tiles. Each tile:
  - Rounded square (14–16px radius) with the platform's brand-color square logo badge on top (56×56, brand gradient, white glyph — reuse `PlatformIcon` with a new `variant="badge"`).
  - Platform name in semibold below.
  - One-line subtype/hint under the name (e.g. Instagram → "Business, Creator, or Personal"; Facebook → "Page or Group"; LinkedIn → "Page or Profile"; YouTube → "Channel"; TikTok/Threads/Bluesky/Mastodon → "Profile"; Pinterest → "Profile"; Google Business → "Location").
  - Whole tile clickable; selected state = ring in `--primary` + check pill in top-right corner.
- Order matches reference: Instagram, Threads, LinkedIn, Facebook, Bluesky, YouTube, TikTok, Mastodon, Pinterest, then remaining supported platforms.
- Scrollable inner grid capped at ~520px height with fade mask.
- Footer stays: Back / Continue, with counter "{n} selected" left-aligned.

Subtype hints come from a new `platforms.ts` field `connectHint: string`.

---

## Technical notes

- No schema change required — `onboarding_state` JSON already stores everything; add optional `seen: boolean`.
- All new logic is client-side except the two AI edge-function prompt tweaks.
- Guest mode: setup still shows once per browser (localStorage `smmpilot:onboarding-seen`), no DB write.
- Preserves existing tour (`OnboardingTour.tsx`) untouched.

## Files touched

- `src/hooks/useOnboarding.ts` — add `seen` + `markSeen()`.
- `src/hooks/useOnboardingContext.ts` — **new**, derived selectors.
- `src/components/layout/DashboardLayout.tsx` — one-shot open, drop event listener.
- `src/components/layout/DashboardSidebar.tsx` — repoint setup CTA to tour.
- `src/components/settings/SettingsPanels.tsx` — "Replay tour" + hidden reset.
- `src/components/onboarding/OnboardingWizard.tsx` — Buffer-style Step 2, mark seen on close.
- `src/components/accounts/ConnectAccountDialog.tsx` — share the same tile grid.
- `src/config/platforms.ts` — add `connectHint`.
- `src/components/shared/PlatformIcon.tsx` — add `variant="badge"`.
- `src/pages/dashboard/Dashboard.tsx` + `src/components/dashboard/{HomeSummaryCard,TemplatesSection,OnboardingScoreCard,shell/PageHeader}.tsx` — consume `useOnboardingContext`.
- `src/hooks/{useAiCreate,useAiCommandHistory}.ts` — attach onboarding context to AI calls.
- `supabase/functions/ai-command/index.ts` + `supabase/functions/ai-create/index.ts` — accept and prepend onboarding block to system prompt.
- `src/pages/dashboard/Scheduler.tsx` + `src/components/create/NewPostDialog.tsx` — default preferred slot / cadence warning.
