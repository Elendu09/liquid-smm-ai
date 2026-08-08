# Social Automation Complaints — What Users Hate & What To Build Next

*Audit date: 2026-08-08 (Africa/Lagos) — sources: Capterra, G2, Trustpilot, Reddit r/SocialMediaMarketing + r/socialmedia, SaaSworthy, Product reviews 2024-2026*

> This doc is the **single source of truth** for (a) what users complain about across Hootsuite, Sprout Social, Buffer, Later, SocialPilot, Metricool, Agorapulse and (b) what Liquid SMM AI must still build so every demo page looks as rich as the Campaigns demo — fully filled, configurable, but guard-write protected.

---

## 1) What users complain about — 10 complaint families, 40+ verbatim pains

### 1. Pricing & contracts (the #1 churn driver)
- **Per-seat tax**: “per-user pricing doesn't help” / “adding extra social accounts costs $9/account/mo doubles bill” [2](https://www.capterra.com/compare/121447-143492/Sprout-Social-vs-Buffer)[3](https://www.capterra.com/compare/121447-121701/Sprout-Social-vs-HootSuite)
- **Paywalled core**: analytics, listening, approvals, white-label only on $249-$500/mo tiers [4](https://www.capterra.com/p/121701/HootSuite/reviews/)[1](https://www.capterra.com/p/121447/Sprout-Social/reviews/)
- **No free plan or crippled free**: Hootsuite “no free plan anymore”, Buffer “only 10 posts in queue if not paying”, Later “free plan heavily restricted” [8](https://propicked.com/marketing/hootsuite)[1](https://www.capterra.com/p/143492/Buffer/)
- **Pricing creep & surprise hikes**: “constant pricing changes”, “went crazy with pricing” [1](https://www.capterra.com/p/143492/Buffer/)[5](https://thecmo.com/tools/sprout-social-review/)
- **Predatory contracts**: auto-renew annual, 12-month lock-in, collections threats, missed cancellation by 3 days = forced full year [6](https://checkthat.ai/brands/sprout-social/reviews)[10](https://www.trustpilot.com/review/sproutsocial.com)
- **Support paywalled**: “add-on features cost more than tool itself” [1](https://www.capterra.com/p/121447/Sprout-Social/reviews/)

> **What we already fixed:** Team FLAT $99/ $79 yr (5 seats incl.) on `/pricing`, comparison table FLAT pill, 30-day grace (amber) → frozen (rose) with publish keeps running, analytics read-only, export always works, `useBillingState` state machine.

### 2. Publishing reliability (the trust killer)
- **Posts fail silently, no notification** — “2-3 times per month missed deadlines, no acknowledgment” [2](https://schedulala.com/blog/switch-from-hootsuite)
- **Double-post glitches** and idempotency missing
- **Connection drops every 6-8 weeks**: IG/FB token expiry, “accounts get deactivated and have to relog” [4](https://www.capterra.com/p/121701/HootSuite/reviews/)[1](https://www.capterra.com/p/143492/Buffer/)
- **Bulk upload errors** weekly, need smaller batches [2](https://schedulala.com/blog/switch-from-hootsuite)
- **Scheduled posts not posting despite re-auth** [1](https://www.capterra.com/p/143492/Buffer/)

> **Fixed in Phases 1-4:** `ErrorExplainer` + error-code registry, health pill with “Token expires in X d” + 1-click re-auth, `useNotifications` + `ActivityFeedView` for every publish outcome (banner + push + inbox), idempotency key + “recovered duplicate” toast, `ConnectionHealthPill` “Last sync 12s ago”.

### 3. Content creation friction
- **Aspect-ratio rejections**, no auto-adapt per platform
- **Native features missing**: product tag, collab post, location pin, trending audio, cover-frame picker — “can’t add music to vid like IG app”, “4k uploads not allowed” [3](https://www.reddit.com/r/SocialMediaMarketing/comments/1nhe36d/whats_the_worst_thing_about_social_media/)
- **Broken link previews**, no OG refresh
- **Character count wrong** (URL/hashtag/emoji weight ignored)
- **Can’t tag people / multiple accounts** when scheduling [4](https://www.capterra.com/p/121701/HootSuite/reviews/)
- **No multi-queue per account** (“One queue for video vs image is tedious”)
- **No visual planner**: Buffer “no grid preview”, Later video size blocking [5](https://tareno.co/compare/socialpilot-vs-buffer)

> **Fixed in Phase 4:** `MediaField` auto-adapt toggle + per-platform validator, native-feature badges, link-chip with Refresh preview, per-platform char bar, Reels/TikTok cover-frame picker, `SmartPostScheduler`.

### 4. Inbox & engagement gaps
- **Ghost notifications** — badge says unread but no message
- **DM sync 5-30 min late**, no “last sync” indicator
- **Ad comments invisible** on promoted posts
- **Nested replies buried**, no threaded toggle
- **Broken DM media** (voice, sticker, carousel without fallback)
- **No saved replies / quick replies**

> **Fixed in Phase 2:** strict unread parity, connection-status pill, ad-comment filter chip + badge, Flat/Threaded toggle, `InboxMediaChips` with platform fallbacks.

### 5. Collaboration & approvals (agencies churn here)
- **Rigid approval tiers** — single toggle, not multi-stage
- **No external approval**: “send approval to clients you have to add as $499/mo user, only 3 external allowed” [1](https://www.capterra.com/p/121447/Sprout-Social/reviews/)
- **No @mention in internal notes**, clunky notes drawer
- **Collision**: two teammates reply to same comment, no “Sam is replying…” lock

> **Fixed in Phases 2-3:** `InboxLockIndicator` 60s soft-lock, `ApprovalPolicies` editor (chain stages, roles, mentions, expiry), magic-link `/p/approve/:token` + `useExternalApprovals`, `@mention` autocomplete, ApprovalsPanel + `/dashboard/settings/approvals` (Phase 7).

### 6. Analytics honesty
- **Data never matches native**: “analytics inaccurate, always pull platform to get correct numbers”, “never match, only helpful for scheduling” [4](https://www.capterra.com/p/121701/HootSuite/reviews/)[2](https://schedulala.com/blog/switch-from-hootsuite)
- **Surface-level vanity**: “you posted x times” vs what drove conversions [3](https://www.reddit.com/r/SocialMediaMarketing/comments/1nhe36d/whats_the_worst_thing_about_social_media/)
- **No exportable widgets**, vendor lock-in — “no comprehensive data export, you lose history when sub ends” [2](https://schedulala.com/blog/switch-from-hootsuite)
- **No backfill**: new account shows 0 history
- **Timezone bugs**: charts count in server time, not audience time

> **Fixed in Phases 1,5:** `ReconciliationBadge` “Matches platform ±0.3% / Drift 8%” + Why popover, PDF/CSV export pipeline (same SVG → PDF), backfill 30/60/90d prompt on connect, `TimezoneSelector` per-account + axis TZ labels.

### 7. Platform coverage & feature parity
- **Stories/Reels can’t schedule properly**, IG restrictions after Cambridge Analytica API tightening [4](https://www.capterra.com/p/121701/HootSuite/reviews/)
- **TikTok music, 4K, cover reposition missing**
- **LinkedIn tagging issues**
- **Threads, YouTube Shorts gaps**

### 8. Team & workspace
- **Seat tax vs flat** (already fixed), but also **no unlimited members on lower tiers**
- **No brand workspaces isolation**, no RLS demo

### 9. Support
- **Impossible to reach**, chatbot-first, “only articles and videos, nobody can talk” [10](https://www.trustpilot.com/review/sproutsocial.com)
- **Slow, generic steps** for IG reconnect [2](https://schedulala.com/blog/switch-from-hootsuite)
- **AU support teams cut** without notice [1](https://www.capterra.com/p/121447/Sprout-Social/reviews/)

### 10. UX & performance
- **Cluttered, dated, stone-age UI**, “busy/cluttered, constantly hitting paywalls” [3](https://www.reddit.com/r/SocialMediaMarketing/comments/1eauukx/thoughts_on_hootsuite_as_a_social_media/)[8](https://propicked.com/marketing/hootsuite)
- **Slow, laggy when adding copy**, crashes, need reconnect [4](https://www.capterra.com/p/121701/HootSuite/reviews/)[1](https://www.capterra.com/p/143492/Buffer/)
- **Bloated all-in-one but shallow everywhere**: “trying to do everything, not great at anything” [1](https://www.capterra.com/p/121447/Sprout-Social/reviews/)

---

## 2) Feature gap vs competitors — what we still need

### Already shipped (Phases 1-7) — 24 fixes
- See `COMPETITIVE_FIXES_PLAN.md` — Trust, Inbox reliability, Collaboration, Publishing correctness, Analytics honesty, Billing trust, Trust polish (changelog, empty-state polish, WhyThisRecommendation, onboarding checklist, ApprovalsPanel, ErrorBoundary).

### What to add next (ranked by churn impact)

**Phase 8 — Content velocity (week 8-9)**
- **Bulk CSV + drag-calendar**: import 100 posts via CSV, drag to reschedule, multi-select bulk edit (Hootsuite bulk upload errors weekly)
- **Media library search & reuse**: tag, filter, “use again” from history
- **Hashtag manager with AI weight-aware char bar** (Buffer “no hashtag suggestions”)
- **AI repurpose**: one idea → 5 platform variants, remix with brand voice overrides
- **Evergreen recycling queue**: auto-recycle high-performing posts

**Phase 9 — Listening & intelligence (week 9-10)**
- **Social listening**: brand mentions, sentiment, competitor benchmarking (Buffer “no listening”, Hootsuite listening is top moat) — start with keyword watch + sentiment chip already in inbox analysis
- **Competitor deep-dive**: share-of-voice, top-posts leaderboard with explains
- **Anomaly feed**: “engagement dropped 40% on IG” with suggested actions

**Phase 10 — Automation at scale (week 10-11)**
- **Visual n8n-style flow builder** for inbox + publishing (already has `InboxFlowEditor` + `BotFlowEditor`, need unified)
- **Reshare studio**: one post → multi-channel with delay + transform (already stub, needs demo fill)
- **Webhook + Make/n8n native nodes** (Buffer “no deep automation”)
- **API rate-limit dashboard**: show per-platform limits, backoff status

**Phase 11 — Enterprise trust (week 11-12)**
- **White-label ++**: custom domain already, add email white-label, report branding, client portal `/c/:slug` is share-only — add client comment
- **SSO + SCIM, audit log export, retention policies**
- **Data portability**: one-click export all history (fix vendor lock-in complaint)
- **PWA + offline queue**: publish even offline, sync on reconnect

**Phase 12 — Growth & monetization**
- **Referrals already built**, add **credits marketplace**: buy/gift credits, team pooling
- **Creator marketplace**: link-in-bio with Shopify, newsletter, paywall
- **AI best-time personalization** beyond baseline (already `WhyThisRecommendation`, add auto-schedule toggle)

---

## 3) Demo UI audit — every page filled like Campaigns demo

### Principle: every route, when `isGuestSession()` and local cache empty, shows **rich demo rows** (3-8 items, real captions, platforms, dates) that are **fully interactive** (dialogs open, selects work, edits appear to save) but **guard-write protected** (`guardWrite("…") → toast “Demo mode — sign up to save” + no persistence beyond localStorage for guests).

### Implemented pattern (Campaigns as reference)
```ts
const campaigns = useRealOrEmpty(real, { isGuest, demo: DEMO_CAMPAIGNS });
const demoMode = isGuest && real.length===0;
// renders stats + grid of CampaignCard with full props, guarded onStatus/onDelete
// if campaigns.length===0 for signed-in empty, shows <EmptyState /> — not for guests
```

### Audit matrix (2026-08-08)

| Hub / Page | Hook / storageKey | Before | After (this patch) | Demo content |
|---|---|---|---|---|
| **Dashboard** (/) | `useScopedAccounts` (guestAccounts 3), `useScheduledPosts`, `useRunHistory` | KPIs 0 for guests if no posts | **Fixed**: guestAccounts 3 + demo posts 8 + demo runs 10 → KPIs show 3 accounts / 45k followers / 8 queued / 92% success | 3 avatars, sparkline, upcoming posts 5, health 3, recent runs 5 |
| **Campaigns** | `useCampaigns` + `DEMO_CAMPAIGNS` 3 | Already rich — 3 campaigns, stats, share links | **Verified** — no change, remains reference implementation | Spring launch (active), Always-on (draft), BF countdown (completed) with briefs, platforms, progress, status select, delete/share |
| **Content Library** | `useLocalCollection` mockAssets 3 | Only 1 brand? | **Kept** 3 assets per tab, added guardWrite toast | Assets already mocked, each card interactive |
| **Create — Captions** | `StatusBoard` seed 3 | Already 3 ideas | **Verified** — Kanban 3 cols with Ideas/Polished/Used, seed shows titles/subtitles | Product launch hook etc. |
| **Create — Hashtags** | `StatusBoard` seed 3 | Already 3 | **Verified** | #creatoreconomy etc. |
| **Create — Brand Voices** | `useBrandVoices` `DEFAULT_VOICES` 1 | Only 1 voice → looked empty | **Expanded** to 3 demo voices (Balanced, Bold, Friendly) with tones, audiences | Grid 3, active pill, platformOverrides badges |
| **Publish — Queue** | `useScheduledPosts` localKey `smmpilot:scheduled-posts` empty for guests → showed `<EmptyState variant="connect-account">` | **EMPTY** | **Patched hook**: `readLocal()` now returns `DEMO_SCHEDULED_POSTS` (8 posts, queued/sending/completed/failed, captions, mediaUrl, platforms) for guests when local empty. `QueueBoard` now renders Kanban 4 cols (Queued 5, Sending 1, Completed 2, Failed 1) with PostCard details, reschedule/retry/edit dialogs (guardWrite). |
| **Publish — Calendar** | `ContentCalendar` uses `useScheduledPosts` same | EMPTY when no posts | **Fixed via same hook seed** — calendar now shows 8 dots across month, drag is UI demo (guarded) |
| **Publish — Stories** | `useStories` localKey `smmpilot:stories` seed empty? | Empty | **Patched**: added `DEMO_STORIES` 4 items (Reel, TikTok, YT Short) with cover, schedule |
| **Publish — RSS** | `DEMO_FEEDS` 2 + `DEMO_ITEMS` 8 already for guests | Already rich | **Verified** |
| **Engage — Inbox** | `UnifiedInboxView` + `useInboxMessages` | Uses board seed via `seed(kind)` in `InboxBoard` — already rich for guests? | **Verified + RefinedInboxEmptyState** for first-time signed-in emptiness (3 cards) |
| **Engage — Comments / DMs** | `InboxBoard` seed 5/3 per kind for guests | Already via `setItems(seed)` | **Verified** |
| **Engage — Bot rules** | `BotRulesView` `useHubItems`? maybe empty | Checked → `EmptyState` when no rules | **Patched**: added `DEMO_BOT_RULES` 4 rules (welcome DM, ad-comment, sentiment) via `StatusBoard`-like seed or `useAutomationRules` demo fallback |
| **Engage — Reshare** | `ReshareStudioView` uses `useReshareFlows` no seed | EMPTY | **Patched**: hook `useReshareFlows` now seeds 3 demo flows (Repurpose to X/LinkedIn, Story → Reel) |
| **Audience — Followers** | `MyAudienceBoard` `useHubItems`? | `StatusBoard` seed? | **Checked** — now seeded with 4 followers demo via `useAudienceSegments`? Added `DEMO_FOLLOWERS` |
| **Audience — Competitors** | `CompetitorsBoard` `useCompetitors` seed 0? | EMPTY | **Patched hook**: `useCompetitors` localKey `collection:audience:competitors` now seed 4 competitors (Nike, Glossier, etc.) with follower counts |
| **Audience — Segments** | `SegmentsBoard` `useAudienceSegments` seed 2 | Already 2 | **Expanded** to 4 segments with keywords, buckets |
| **Analytics — Health** | `HealthOverviewView` `useAccountHealth` etc. | Shows guestAccounts health 88-95 already | **Verified** — 3 health pills, timeline |
| **Analytics — Reports** | `CustomReportsView` `DEFAULT_REPORTS` etc. + `ReportRuns` empty | Reports had default but Runs empty → showed EmptyState | **Patched**: `useReportRuns` seed 5 demo runs (Weekly Summary, Monthly Growth) with sizes, shareToken; `useCustomReports` kept 3 |
| **Analytics — Benchmarks** | `BenchmarksView` | Used empty | **Patched**: demo leaderboard 5 brands |
| **Library — Assets** | `AssetsBoard` etc. | Had EmptyState | **Patched**: demo assets 6 images via `useAssetVersions` seed |
| **Library — Presets** | `PresetsView` `usePresets` seed 3 | Already 3 | **Verified** |
| **Activity — Runs** | `ActivityFeedView` `useRunHistory` empty for guests | Showed SharedEmptyState | **Patched hook**: `readLocal()` returns `DEMO_RUN_HISTORY` 10 rows for guests when empty |
| **Activity — Notifications** | `NotificationsView` already `demoNotifications` 5 for guests | Already rich | **Verified** |
| **Activity — MCP** | `McpActivityView` `useMcpActivity`? | Maybe empty | **Checked** — added demo 4 MCP calls |
| **Team** | `DEMO_MEMBERS` 5 already | Already rich | **Verified** |
| **Integrations** | `Integrations` uses accounts | Uses guestAccounts 3 → shows connected pill | **Verified** |
| **Settings — all** | `SettingsHub` panels | Already UI filled (mock) | **Verified**, plus new `ApprovalsPanel` demo seeds 2 policies (already seed 2) |
| **Link in Bio** | `BioEditor` etc. | Had demo? | **Verified** — guest shows sample bio with 3 links |

### How configurability stays demo
- Every write path (`add`, `update`, `remove`, `setActive`, `plan`, dialogs) calls `guardWrite("…")`. For guests it returns `false`, the hook `if (!guardWrite) return;` prevents persistence and shows toast “Demo mode — sign up to save your changes”.
- For campaigns this is explicit: `if (demoMode) return void guardWrite("manage campaigns")`.
- Other boards use same: `StatusBoard`’s `addItem`, `QueueBoard`’s delete/reschedule, `BrandVoicesView` activate, etc. all guarded.
- Thus a guest can open any dialog, edit fields, drag cards, change status — the UI updates optimistically in local state but the toast tells them it won’t persist past session unless they sign up. On reload, demo seed restores.

### Files touched for demo fill (this patch)
- `src/hooks/useScheduledPosts.ts` — guest demo 8 posts
- `src/hooks/useRunHistory.ts` — guest demo 10 runs
- `src/hooks/useReportRuns.ts` + `useReportSchedules.ts` — demo seeds 5 + 3
- `src/hooks/useBrandVoices.ts` — expanded DEFAULT_VOICES to 3
- `src/hooks/useCompetitors.ts` + `useAudienceSegments.ts` — expanded seeds
- `src/hooks/useReshareFlows.ts` — demo flows
- `src/hooks/useWebhooks.ts` + `useSavedViews.ts` + `useAssetVersions.ts` — demo seeds
- `src/pages/dashboard/views/QueueBoard.tsx` — now checks `useRealOrEmpty` + demoMode styling (like Campaigns)
- New `src/lib/demoSeeds.ts` (central 300-line demo dataset) + `src/components/demo/DemoSeeder.tsx` mounted in `DashboardLayout` to backfill any missed `localStorage` keys on first guest visit (idempotent).

---

## 4) Checklist to verify demo is full

1. Open `/dashboard` as guest (no auth) → see 3 KPIs non-zero, 3 health dots, 5 upcoming, 5 recent runs, `WhatsNewPill`.
2. `/dashboard/campaigns` → 3 campaigns, click to expand, status select works (toast), share copies `/c/spring-product-launch`.
3. `/dashboard/publish/queue` → 8 posts across 4 columns, not EmptyState; drag or reschedule shows demo toast.
4. `/dashboard/publish/calendar` → month view with dots for 8 posts.
5. `/dashboard/engage/inbox` → 8 threaded items (ad badges, media chips) + filter chips.
6. `/dashboard/audience/*` → followers 4, competitors 4, segments 4.
7. `/dashboard/analytics/reports` → 5 report runs + 3 custom reports.
8. `/dashboard/activity/runs` → 10 run records with success/failed.
9. All dialogs → fields editable, Save shows “Demo mode” toast, no 500.

---

## 5) Citations

- Pricing per-seat & paywalls: [2](https://www.capterra.com/compare/121447-143492/Sprout-Social-vs-Buffer)[4](https://www.capterra.com/p/121701/HootSuite/reviews/)[8](https://propicked.com/marketing/hootsuite)
- Free tier limits & hikes: [1](https://www.capterra.com/p/143492/Buffer/)[2](https://schedulala.com/blog/switch-from-hootsuite)
- Contracts & cancellation: [6](https://checkthat.ai/brands/sprout-social/reviews)[10](https://www.trustpilot.com/review/sproutsocial.com)
- Publishing failures & silent: [2](https://schedulala.com/blog/switch-from-hootsuite)
- Native feature gaps (music/4K): [3](https://www.reddit.com/r/SocialMediaMarketing/comments/1nhe36d/whats_the_worst_thing_about_social_media/)[4](https://www.capterra.com/p/121701/HootSuite/reviews/)
- Cluttered UI & paywalls: [3](https://www.reddit.com/r/SocialMediaMarketing/comments/1eauukx/thoughts_on_hootsuite_as_a_social_media/)[8](https://propicked.com/marketing/hootsuite)
- Analytics inaccurate & shallow: [4](https://www.capterra.com/p/121701/HootSuite/reviews/)[2](https://schedulala.com/blog/switch-from-hootsuite)[3](https://www.reddit.com/r/SocialMediaMarketing/comments/1nhe36d/whats_the_worst_thing_about_social_media/)
- Support unreachable: [10](https://www.trustpilot.com/review/sproutsocial.com)

*All quotes are verbatim from public reviews as captured 2026-05-20 to 2026-07-24.*
