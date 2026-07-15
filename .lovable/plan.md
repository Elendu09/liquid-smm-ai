
# Plan: Onboarding tour, per-hub feature phases, and a global AI command bar

Big scope, so I'm breaking it into **9 phases**. Each phase is independently shippable and gated behind its own edits — you can approve the whole plan and I'll build phase-by-phase, or ask me to reorder/drop phases.

Nothing here changes DB schema. Onboarding + AI-command history persist in `localStorage` (`smmpilot:*`). AI uses Lovable AI (`google/gemini-3-flash-preview`) through a new edge function, reusing the existing MCP tool pattern.

---

## Phase 0 — Onboarding tour (new user flow)

New `OnboardingWizard` shown on first dashboard visit (flag `smmpilot:onboarded`). Re-openable from Settings → Account and from a "Take the tour" chip in Dashboard header.

Steps (all skippable, progress bar + back/next):
1. **Welcome** — name + role (Creator / Agency / Brand / Ecom).
2. **Connect accounts** — reuses `ConnectAccountDialog`, shows 14 platforms as chips, "Skip for now" allowed.
3. **Niche** — chip multi-select (Fashion, Fitness, SaaS, Food, Travel, Beauty, Gaming, Finance, Education, B2B, Local business, Other-text).
4. **Goals** — Grow followers / Drive sales / Build community / Save time (multi).
5. **Tone & brand voice** — Playful / Professional / Bold / Minimal + short brand description textarea. Seeds AI Studio + Caption Generator defaults.
6. **Posting cadence** — slider (posts/week) + preferred times chips → seeds Scheduler defaults.
7. **AI autonomy** — Manual / Suggest / Auto-with-approval (writes to `smmpilot:automation-settings`, read by existing `get_automation_settings` MCP tool).
8. **Finish** — checklist card pinned to Dashboard until all done ("Connect 1 account", "Save 1 caption", "Schedule 1 post", "Try AI command").

Files: `src/components/onboarding/OnboardingWizard.tsx`, `Step*.tsx` (7 files), `src/hooks/useOnboarding.ts`, `src/components/dashboard/OnboardingChecklistCard.tsx`. Injected in `DashboardLayout`.

---

## Phase 1 — Global AI Command Bar on Dashboard home

Big prompt box at top of `Dashboard.tsx` ("Tell your assistant what to do…") with mic, suggestion chips, and recent-commands drawer.

- New edge function `supabase/functions/ai-command/index.ts` — Lovable AI + AI SDK `streamText` with tool-calling. Tools wrap existing app actions (all client-executable via a new intents inbox):
  - `create_caption_draft`, `queue_cross_platform_post`, `generate_hashtags`, `create_story`, `add_bot_rule`, `create_segment`, `schedule_bulk_from_captions`, `open_page`, `search_analytics`.
- Client hook `useAiCommand.ts` — streams response, renders inline plan ("I'll do X, Y, Z") with Approve/Reject (mirrors existing MCP approval pattern), then routes user to affected page with a highlighted new item.
- `AiCommandHistory` panel (list of past commands with status, affected resource links → click to jump to edit/delete/modify).
- Slash-menu chips: "Plan next week", "Draft 5 captions about {niche}", "Show my worst-performing posts", "Reply to all positive comments".

Files: `src/components/dashboard/AiCommandBar.tsx`, `src/components/dashboard/AiCommandPlan.tsx`, `src/hooks/useAiCommand.ts`, `src/hooks/useAiCommandHistory.ts`, `supabase/functions/ai-command/index.ts`, edit `Dashboard.tsx`.

---

## Phase 2 — Create hub (`/create/*`)

Pages: `studio`, `captions`, `hashtags`, `ai`.

- **CreateStudio**: add "New post" primary button → `NewPostDialog` (title, body, media upload placeholder, platform chips, AI-assist button that calls caption + hashtag tools). Add per-card actions: Edit (dialog), Duplicate, Send to Queue (opens `QueueDialog`), Delete (AlertDialog).
- **CaptionsBoard**: add `GenerateCaptionsDialog` (topic, tone, count, platform) → streams into board. Per-card: Edit, Regenerate variants (dialog), Translate (dialog with language select), Copy, Send to Queue, Delete. Existing bulk bar keeps working.
- **HashtagResearch**: convert flow to `HashtagResearchDialog` (seed keyword + niche prefilled from onboarding). Save-to-library button, per-set copy/delete.
- **AI Studio (`ai`)**: add `AiBriefDialog` (goal, audience, platform → full post kit: caption + hashtags + story hooks + CTA). Save-to-library.

Files: `src/components/create/NewPostDialog.tsx`, `GenerateCaptionsDialog.tsx`, `TranslateCaptionDialog.tsx`, `HashtagResearchDialog.tsx`, `AiBriefDialog.tsx`; edits to the 4 pages.

---

## Phase 3 — Publish hub (`/publish/*`)

Pages: `queue`, `calendar`, `stories`.

- **QueueBoard**: replace inline scheduling with `ScheduleDialog` (date/time picker, timezone, platform per-item overrides, first-comment field, AI "Best time" button using follower analyzer data). Bulk `RescheduleDialog`, `PauseAllDialog`, per-item Edit/Duplicate/Delete dialogs.
- **ContentCalendar**: click empty slot → `QuickScheduleDialog`; click event → `EventDetailsDialog` (edit/move/delete). Add "AI fill week" button → dialog picks captions from library and distributes across empty slots respecting cadence.
- **StoryBoard**: fix broken sections (Story slides list currently placeholder). Add `NewStoryDialog` (slides builder: image/text/poll/quiz), `PublishStoryDialog`, per-slide reorder + delete confirm.

Files: `src/components/publish/ScheduleDialog.tsx`, `RescheduleDialog.tsx`, `QuickScheduleDialog.tsx`, `EventDetailsDialog.tsx`, `AiFillWeekDialog.tsx`, `NewStoryDialog.tsx`; edits to the 3 views.

---

## Phase 4 — Engage hub (`/engage/*`)

Pages: `bot`, `comments`, `dms`.

- **BotRulesView**: `NewRuleDialog` (trigger, condition, action, platform, schedule) + `TestRuleDialog` (dry-run against segment preview). Per-rule Enable/Disable toggle, Edit dialog, Delete confirm, Duplicate.
- **CommentManager**: `ReplyDialog` with AI-drafted replies (3 tones), Bulk-select bar: Mark handled / AI-reply all / Hide / Delete. `FilterDialog` (platform, sentiment, keyword).
- **DMAutomation**: `NewDmFlowDialog` (trigger keyword → templated reply w/ variables), per-flow Edit/Delete/Duplicate, Test-in-sandbox dialog.

Files: `src/components/engage/NewRuleDialog.tsx`, `TestRuleDialog.tsx`, `ReplyDialog.tsx`, `NewDmFlowDialog.tsx`; edits to the 3 views.

---

## Phase 5 — Audience hub (`/audience/*`)

Pages: `followers`, `segments`, `competitors`.

- **FollowerAnalyzer**: add `AnalyzeAccountDialog` (username + platform → runs skyrank), `ExportDialog` (CSV/JSON). Per-follower Details drawer (already partial → complete it).
- **SegmentsBoard**: keep existing preview sheet, add `NewSegmentDialog` (criteria builder), Edit/Duplicate/Delete, "Run automation" links to bot rules with segment prefilled.
- **CompetitorTracker**: `AddCompetitorDialog`, per-competitor Refresh / Compare (dialog side-by-side) / Remove confirm.

Files: `src/components/audience/AnalyzeAccountDialog.tsx`, `NewSegmentDialog.tsx`, `AddCompetitorDialog.tsx`, `CompareCompetitorDialog.tsx`; edits to the 3 views.

---

## Phase 6 — Analytics hub (`/analytics/*`)

Pages: `overview`, `reports`, `health`.

- **Overview (GrowthAnalytics + GrowthStory)**: add `KpiDetailDialog` when clicking a KPI (chart + formula + AI insight). AI "Explain this drop" button on any negative delta → dialog with cause analysis using recent posts data.
- **Reports**: `NewReportDialog` (date range, platforms, metrics), `ScheduleReportDialog` (weekly email — mock in inbox for now), Export PDF/CSV buttons.
- **AccountHealth**: `RunHealthCheckDialog` per account, per-issue Fix-it dialogs (e.g. "posting frequency too low" → jump to Scheduler with cadence prefilled).

Files: `src/components/analytics/KpiDetailDialog.tsx`, `NewReportDialog.tsx`, `ScheduleReportDialog.tsx`, `RunHealthCheckDialog.tsx`; edits.

---

## Phase 7 — Library hub (`/library/*`) + fix broken pages

Pages: `captions` (working), `assets` (BROKEN — route missing; legacy redirect points at `/library/assets` but LibraryHub has no assets route), `link-bio`, `presets`.

- **Add `assets` route + `AssetsBoard.tsx`**: grid of media assets (image/video/doc), `UploadAssetDialog` (Lovable Assets CDN), tag/folder chips, per-asset Preview / Copy URL / Delete / Send to Studio. Fix `LibraryHub` tabs to include Assets.
- **LinkInBio**: `NewLinkDialog`, `EditThemeDialog`, per-link reorder + Edit/Delete, `PreviewDialog` (mobile mock).
- **Presets**: `NewPresetDialog`, Edit/Duplicate/Delete/Set-default per row.
- **CaptionsBoard**: (already done) — just add "New caption" primary button opening `NewCaptionDialog` for parity.

Files: `src/pages/dashboard/views/AssetsBoard.tsx`, `src/components/library/UploadAssetDialog.tsx`, `NewLinkDialog.tsx`, `EditThemeDialog.tsx`, `NewPresetDialog.tsx`, `NewCaptionDialog.tsx`; edit `LibraryHub.tsx`.

---

## Phase 8 — Activity hub (`/activity/*`)

Pages: `runs`, `mcp`, `notifications`.

- **ActivityFeedView**: filters dialog (type, status, date range), per-run Details drawer with re-run button, Bulk clear dialog.
- **McpActivityView**: (approvals already done) — add per-call Details drawer showing full payload + "Re-run" and "Copy as prompt" buttons.
- **NotificationsPanel**: `NotificationSettingsDialog`, bulk mark-read / delete, per-item action buttons routing to source page.

Files: `src/components/activity/RunDetailsDrawer.tsx`, `McpCallDetailsDrawer.tsx`, `NotificationSettingsDialog.tsx`; edits.

---

## Technical section (for me)

- All new dialogs use existing shadcn `Dialog`/`Sheet`/`AlertDialog`; mobile falls back to bottom sheet.
- AI command bar edge function: streaming `text/event-stream`, client uses AI SDK `useChat` with `DefaultChatTransport` pointed at `/functions/v1/ai-command`. Tools use `needsApproval` for any write; approved tools push into existing `useMcpInbox` so all drain-on-mount handlers already work — no duplication.
- "Navigate to what was done" = each inbox item stores `targetRoute` + `resourceId`; the AI plan card and history render `<Link>` to that route with `?highlight=<id>` query param; each board reads the param and scrolls/pulses the matching card.
- Broken-page fix scan: `library/assets` route missing (fixed in Phase 7). I'll audit all legacy redirects in `App.tsx` while I'm there and file any additional missing targets as part of the relevant phase.
- No new npm deps. New MCP tools added incrementally will be extracted + edge function redeployed at end of each phase.

**Suggested build order**: Phase 0 → 1 → 7 (fix broken first) → 2 → 3 → 4 → 5 → 6 → 8.

Want me to start with Phase 0 + 1 together, or reshuffle?
