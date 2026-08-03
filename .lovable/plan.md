# Plan: AI memory, credit metering, unified Studio, and Campaigns

## What I verified first
- The command bar already sends a bounded history (`HISTORY_TURNS`) to `ai-command`, and that function has a history-aware system prompt. So memory exists but is shallow and local to the command bar only.
- No edge function currently writes to `credit_balances` / `credit_events`. Credits are granted at signup and displayed, but **nothing is ever debited** — the meter is cosmetic today.
- There is no campaigns page or campaigns table anywhere in the project.
- `Create` hub has separate `Studio` (`CreateStudio.tsx`) and `AI Studio` (`AiCreateView.tsx`) tabs.

---

## Phase 1 — AI memory that actually persists and sharpens
- Persist every AI turn to `ai_command_history` reliably (it already exists) and raise recall depth from a flat slice to a two-layer memory:
  - **Recent turns** — last ~8 verbatim exchanges.
  - **Rolling summary** — a short, model-written running summary of older turns, stored per user, refreshed every N turns so long sessions stay cheap but contextual.
- Send both to `ai-command` plus a lightweight workspace snapshot (connected platforms, active brand, recent drafts/scheduled posts, current route) so the assistant answers "reschedule that", "same platforms", "use my usual tone" correctly.
- Expose memory in the UI: history sheet gets search, per-entry "reuse prompt", and a "forget this turn" control.
- Share the same memory service with AI Studio and Campaigns so all AI surfaces see one conversation.

## Phase 2 — Honest, transparent credit metering
- Add a shared server module used by **every** AI edge function (`ai-command`, `ai-create`, `ai-engage`, `ai-home-summary`, `notif-ai-summary`, voice speak/transcribe, campaign generation).
- Flow per call: check balance → refuse with a clear 402 if empty → run → debit actual cost after completion → write a `credit_events` row with feature name, model, tokens, and where it was triggered from.
- Pricing is published in-app: a rate card (e.g. caption pack, hashtag research, voice minute, campaign generation) so users see the cost **before** they click. Failed calls and keyless-fallback calls cost 0.
- UI: cost hint on AI buttons, a live toast showing "−N credits" after each run, and Settings → Billing usage broken down by feature with the full ledger.
- Guest/demo mode never debits and never shows a real balance.

## Phase 3 — Merge Studio + AI Studio into one page
- Replace the two tabs with a single **Studio** route with internal sections, keeping old URLs redirecting in.
- Layout: composer on the left (caption, media, platform tabs), live multi-platform previews on the right, AI panel docked alongside instead of a separate page.
- Upgrades: AI variants inline (tone/length/hook rewrites), hashtag + first-comment generation in place, brand-voice selector, per-platform overrides, character/limit checks, image attachment and AI image generation, one-click "schedule" or "add to campaign".
- Visual pass consistent with the Instrument Serif dashboard styling and glass surfaces.

## Phase 4 — Campaigns (researched against Metricool, Buffer, Hootsuite, Later, Sprout)
Common denominators those tools ship, and what we build:
- **Campaign object**: name, objective, brand, date range, platforms, budget/target KPIs, color/tag, status (draft, active, paused, completed).
- **Campaign board**: grid + list + timeline (Gantt-style) view of all campaigns with progress bars.
- **Campaign detail**: brief, content calendar filtered to the campaign, post list with approval state, asset shelf, notes, and team assignment.
- **Tagging**: every scheduled post can belong to a campaign, so existing calendar/queue views gain a campaign filter and colored labels.
- **AI campaign builder**: from a brief (goal, audience, duration, platforms) generate a full content plan — themes, posting cadence, per-post captions and hashtags — previewed as a table the user approves before it becomes scheduled posts. Metered via Phase 2.
- **Campaign analytics**: rollup of reach, engagement, clicks, and posts for the campaign's posts and window, with per-platform breakdown and best/worst performing posts.
- **Lifecycle**: duplicate campaign, archive, export report, and schedule a recurring campaign report.

## Phase 5 — Wiring and polish
- Sidebar/nav entry for Campaigns, campaign filters in Publish/Calendar/Analytics, notifications for campaign milestones and end-of-campaign summaries.
- Guest demo data for Campaigns so visitors see a populated example.

---

## Technical notes
- New tables: `campaigns`, `campaign_posts` link (or a `campaign_id` column on `scheduled_posts`), plus an AI memory summary column/table. All with RLS scoped to `auth.uid()` and explicit GRANTs.
- Credit debits happen server-side only, inside the edge functions, so the balance cannot be manipulated from the browser.
- Campaign analytics reuse the existing `post_metrics` / rollup functions rather than a new collector.

## Suggested build order
Phase 2 first (it protects everything else), then 1, then 3, then 4–5.
