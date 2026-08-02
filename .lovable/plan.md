## What I verified first

- `https://skyrank.digital/api/caption` — **connection fails outright** (no HTTP response, curl code 000). SkyRank is effectively dead right now, so every SkyRank-first tool is silently falling back on each call and paying a 10s timeout before it does.
- `https://text.pollinations.ai` — **200 OK**. The keyless fallback in `src/services/freeAi.ts` and `supabase/functions/_shared/free-ai.ts` is the only thing keeping those tools alive.
- Inbox today: `InboxBoard.tsx` (466 lines) is one generic kanban of `new / replied / snoozed / resolved` with hardcoded demo seed names, plus `UnifiedInboxView` tabs for Comments/DMs and `InboxTriageBar`. It has no per-platform structure, no conversation thread view, and no mentions/reviews/ads-comments channels — which is why it reads as generic.

---

## Phase 1 — Inbox redesign (UI/UX)

Move from "kanban of cards" to a **three-pane triage console**, the pattern every serious social inbox uses (Metricool, Sprout, Buffer):

```text
┌──────────────┬────────────────────┬─────────────────────┐
│ Channel rail │  Conversation list │  Thread + reply     │
│ All          │  ▸ avatar + snippet│  full message chain │
│ Instagram 12 │  ▸ platform badge  │  author context     │
│ TikTok     4 │  ▸ sentiment dot   │  AI draft + tones   │
│ YouTube    2 │  ▸ SLA timer       │  saved replies      │
│ LinkedIn   1 │                    │  assign / status    │
│ ── types ──  │                    │                     │
│ Comments     │                    │                     │
│ DMs          │                    │                     │
│ Mentions     │                    │                     │
│ Reviews      │                    │                     │
└──────────────┴────────────────────┴─────────────────────┘
```

- **Left rail**: real connected accounts from `AccountContext` (not a fixed list), each with an unread count, plus message-type filters. Accounts with nothing connected show a connect prompt instead of fake data.
- **Middle list**: virtualised, grouped by "Needs reply / Waiting / Done", with sentiment dot, intent chip, SLA age turning amber → red, assignee avatar, and multi-select for the existing bulk actions.
- **Right pane**: real conversation thread (message history, not a single bubble), author panel (handle, follower count when available, past interactions), reply composer with tone switcher, AI draft, saved replies, translate, and per-platform character limits + capability flags (e.g. no DMs on YouTube, review-reply rules on Google Business).
- **Mobile/tablet**: rail collapses to a horizontal scrollable chip row; list is full-width; tapping opens the thread as a full-screen sheet with the circular close button already standard in the app.
- Keep the kanban as a secondary view toggle so nothing existing is lost; the console becomes the default.
- Styling stays on the current tokens — Instrument Serif headers, glass surfaces, primary accent, no new colors.
- Guest/demo keeps seeded data; authenticated users see real rows or a proper empty state (existing `isGuestSession` split preserved).

## Phase 2 — Inbox functionality

- Per-platform adapters describing what each network supports (reply, like, hide, delete, DM, review response, char limit) so the UI only offers real actions.
- Thread persistence: an `inbox_threads` shape so replies and history survive reloads, scoped by brand + user with RLS and grants.
- Keyboard triage (`j/k`, `r`, `e`, `a`), snooze presets, and "next unhandled" auto-advance.
- SLA + first-response-time metrics feeding the existing triage bar.

## Phase 3 — Unified AI layer (never fails)

Create one router used by **every** AI surface (`ai-create`, `ai-engage`, `ai-command`, SkyRank tools, inbox drafts):

1. **Lovable AI Gateway** (`google/gemini-3.6-flash`) — primary, server-side, key stays in the edge function.
2. **SkyRank** — demoted to opportunistic, with its timeout cut from 10s to ~4s and a circuit breaker that stops calling it for 5 minutes after a failure (right now every user waits on a dead host).
3. **Keyless public endpoints** — Pollinations (verified live) plus a second unauthenticated wrapper as tertiary.

Rules: shared retry/backoff, per-provider timeout, normalized response shape, one typed error surfaced to the UI (429 → "try again", 402 → credits), and never an empty screen — the caller always gets either text or an explicit, actionable message.

## Phase 4 — The new plain-text AI feature (frontend, zero-login)

A **"Quick AI" plain-text panel** that runs entirely client-side against unauthenticated public endpoints — no OAuth, no keys, no setup:

- Provider list: Pollinations text endpoint (confirmed working) + one or two additional keyless public REST endpoints, tried in order.
- Optional Puter.js loaded lazily from its CDN as an extra keyless provider, behind the same router interface so a CDN outage can't break the page.
- Security: output is rendered as plain text only (no HTML injection), prompts are stripped of anything resembling credentials before leaving the browser, `private: true` is sent where supported, requests are aborted on unmount, and this path is used **only** for non-sensitive prompts. Anything touching account data, tokens, or customer messages stays on the server path in Phase 3.
- Surfaces: a lightweight text tool in the AI command bar and inline "rephrase / shorten / translate" actions in the inbox composer.

## Phase 5 — Trial credits

Proposed grant, wired to the existing `credit_balances` / `credit_events` tables:

| | Credits | Notes |
|---|---|---|
| Guest/demo | 0 (unmetered mock) | demo responses only, never touches the ledger |
| New signup trial | **100** | granted once on first sign-in, 14-day window |
| Free plan (post-trial) | 25 / month | resets monthly |

Cost per action: caption/hashtags/short text = 1, inbox AI draft = 1, long-form or image = 3, voice = 2. Keyless frontend providers (Phase 4) cost **0** — that's the safety valve so a user out of credits still gets a usable answer with a "using free mode" hint. Balance is deducted server-side (never trusted from the client), with a top-up path already present in Settings → Billing.

## Technical notes

- New: an AI router module shared by edge functions, per-platform inbox capability config, and the three-pane inbox components under `src/components/engage/`.
- Modified: `InboxBoard.tsx`, `UnifiedInboxView.tsx`, `InboxTriageBar.tsx`, `src/services/skyrank.ts` (timeout + circuit breaker), `supabase/functions/_shared/free-ai.ts`, `ai-create`, `ai-engage`, `ai-command`.
- Database: inbox thread/message tables and a trial-grant column, each with GRANTs and RLS in the same migration.
- No new paid dependencies; Puter.js is loaded from CDN on demand.
