# Competitive Pain-Point Plan — Liquid SMM AI

> Goal: turn the platform's most common churn drivers into visible, durable
> differentiators. Each fix below is mapped to a real complaint users have
> with Hootsuite, Sprout, and Buffer.

This document is the source of truth for **what** we will build, **how** the
pieces fit together, **what users will see**, and **how we phase the work**
so we can ship value every sprint without breaking the live app.

---

## 0. Guiding principles

1. **Surface the fix in the UI, not just the data layer.** A bug we fix but
   never explain in-product is a bug users won't trust.
2. **Default to the safe path, expose the powerful one.** Every setting that
   can go wrong (rate limits, double-post retries, approval routing) should
   have a sensible default so a brand-new workspace doesn't accidentally
   spam its audience.
3. **Every issue maps to a single dashboard or empty-state card.** If the
   user can't find the new feature in under 5 seconds, it didn't ship.
4. **No silent failures.** Anywhere a system can fail, we surface a banner,
   a notification, and an inbox entry. Three of the six top complaints are
   some flavour of "the tool swallowed my problem."

---

## 1. Pain-point → fix matrix

| # | Complaint | What users see | Surface area |
|---|-----------|----------------|--------------|
| 1.1 | Ghost notifications — badge says unread but no message | Unread badges now use a strict equality check against the live store; a `0` means zero, never stale | `useUnreadInbox`, hub tabs, account switcher |
| 1.2 | DM sync 5–30 min late | Connection status pill + "Last sync 12 s ago" on every account row | `useAccountHealth`, integrations table, inbox header |
| 1.3 | Ad comment blindness | New "Ad comments" filter chip + green badge on ad-tagged posts | `InboxBoard`, `PostSlotDialog` |
| 1.4 | Nested replies buried | Threaded view mode: "Flat / Threaded" toggle on inbox | `UnifiedInboxView`, `InboxBoard` |
| 1.5 | Broken DM media | Media chips render with platform-aware fallbacks + "Open in {{platform}}" link | `InboxCard`, `ReplyDialog` |
| 2.1 | Aspect-ratio rejections | "Auto-adapt" toggle on every media field; pre-publish validator shows per-platform fits | `MediaField`, `ScheduleDialog` |
| 2.2 | Missing native features | "Native-only" badges next to: product tag, collab post, location pin, trending audio, cover frame | Composer, `NetworkPreview` |
| 2.3 | Broken link previews | Link chip with live OG snapshot + "Refresh preview" button | `MediaField`, `NetworkPreview` |
| 2.4 | Character count miscalc | Per-platform character bar that knows URL weight, hashtag weight, emoji width | `NetworkPreview`, composer |
| 2.5 | Thumbnail choice | Cover-frame picker for Reels/TikTok; "Random" opt-out | `MediaField` |
| 3.1 | Tokens drop frequently | Health pill: "Token expires in 11 d" with 1-click re-auth, 7 d warning | `AccountHealth`, integrations table |
| 3.2 | Silent post failures | Three surfaces: in-app banner, push/email notification (per user prefs), and an entry in the **Activity** hub | `useNotifications`, `ActivityFeedView` |
| 3.3 | Vague error codes | `ErrorExplainer` translates error codes → human sentences; links to the relevant doc | `ScheduleDialog`, `PostSlotDialog`, toast |
| 3.4 | Double-posting glitches | Idempotency key on every publish; if the same draft ID publishes twice, second is auto-rolled-back with a "recovered duplicate" toast | `useScheduledPosts`, post-run hook |
| 4.1 | Collision problem | "Sam is replying…" live indicator on a card; soft-lock for 60 s | `InboxBoard`, `useInboxMessages` |
| 4.2 | Rigid approval tiers | `ApprovalPolicies` editor: chain of stages with custom roles | Settings → Team, new `ApprovalPolicyDialog` |
| 4.3 | No external approval links | Magic-link approval page (no account required); expiry + audit log | `/p/approve/:token` route, new `useExternalApprovals` |
| 4.4 | Clunky internal notes | `@mention` autocomplete in the private-notes drawer; shows avatar + role | `InboxCard` notes drawer |
| 5.1 | Data discrepancies | Reconciliation badge on each metric: "Matches platform (±0.3%) / Drift 8%" with "Why?" popover | `AnalyticsHub`, `PostMetricsCard` |
| 5.2 | Unexportable widgets | PDF export pipeline that renders the same SVG/canvas widget to PDF; CSV uses stable columnar shape | `ReportPreviewDialog`, `useReportRuns` |
| 5.3 | No historical backfill | "Backfill last 30/60/90 d" prompt when a new account is connected; progress in the integration row | `ConnectAccountDialog` |
| 5.4 | Timezone bugs | Account-level timezone selector (default = workspace TZ); every chart axis labeled with the chosen TZ | `AccountContext`, analytics charts |
| 6.1 | Seat tax | Pricing page exposes **per-seat** AND **flat-team** plans; the flat plan is the default CTA | `Pricing.tsx`, `usePlan` |
| 6.2 | Hostage data | 30-day grace period: queue keeps publishing, analytics stays readable in read-only mode, export always available | `usePlan`, `useScheduledPosts`, settings |

Total: **24 fixes**, grouped into **6 themes**. The themes are not
equally sized — section 3 (API stability) and section 4 (collaboration)
are the largest and most strategic.

---

## 2. Architecture — flowchart

```
                        ┌──────────────────────────────┐
                        │  Workspace (user or team)    │
                        └──────────────┬───────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
       ┌──────▼──────┐         ┌───────▼───────┐        ┌───────▼───────┐
       │ Connections │         │  Inbox store  │        │   Publisher   │
       │  (per acct) │         │  comments/DMs │        │  queue + run  │
       └──────┬──────┘         └───────┬───────┘        └───────┬───────┘
              │                        │                        │
   ┌──────────▼──────────┐   ┌─────────▼─────────┐   ┌──────────▼──────────┐
   │ Health + Sync engine│   │ Triage + Assign   │   │ Idempotency layer   │
   │  • token expiry     │   │  • collision lock │   │  • dedupe by id     │
   │  • backfill runner  │   │  • @mentions      │   │  • retry/backoff    │
   │  • 30 s poll        │   │  • saved replies  │   │  • ErrorExplainer   │
   └──────────┬──────────┘   └─────────┬─────────┘   └──────────┬──────────┘
              │                        │                        │
              └────────────┬───────────┴────────────┬───────────┘
                           │                        │
                ┌──────────▼─────────┐    ┌──────────▼─────────┐
                │  Activity feed     │    │   Notifications    │
                │  (audit + runs)    │    │  in-app / email /  │
                │  "recovered dup"   │    │   push per user    │
                └──────────┬─────────┘    └──────────┬─────────┘
                           │                        │
                ┌──────────▼─────────────────────────▼──────────┐
                │              User-facing UI                   │
                │  (Tabs · Inbox · Publisher · Settings · …)    │
                └──────────────────────────────────────────────┘
```

Key idea: every layer writes to the **Activity** feed and the
**Notifications** store on the way up. No silent path exists — even a
successful publish writes a row ("Posted to Instagram ✓") so users can
reconstruct what happened without screenshots.

---

## 3. UI / visual treatment (canva-pixellab style)

**Tone.** Soft, generous, friendly. Muted surfaces, no harsh greys.
Rounded-2xl corners are the default, shadows are very soft, type is
small and tightly tracked.

**Three new visual primitives** that the fixes rely on:

1. **`StatusPill`** — A 24-px-tall, rounded-full pill with a coloured dot,
   label, and optional chevron. Used for every connection, every account,
   every sync state. Replaces the dozen ad-hoc badges we have today.
2. **`EmptyState`** — Already exists; we extend the `variant` registry
   with: `connection-lost`, `rate-limited`, `awaiting-approval`,
   `historical-backfill`, `seat-limit`.
3. **`ExplainPopover`** — A small "Why?" link next to every metric,
   error, and connection status. Opens a side-sheet with the explanation,
   the underlying raw value, and a "copy support bundle" action.

**Colour use** (no redesigning the palette, just stricter rules):
- emerald-500 = healthy / live / on-time
- amber-500 = paused / needs attention / wait
- rose-500 = broken / failed / expiry imminent
- primary = user-initiated (approve, send, retry)
- cyan = system-initiated (sync, backfill, crawl)

**Responsive behaviour** is identical to the work we just shipped on
Engage: 14rem / flexible / 18rem columns on desktop, single column on
mobile, with the block library collapsing into a top drawer on tablet.

**Honest motion.** Every fix animation lasts 180–220 ms. We never use
spinners for things that have a real status — we use a progress bar with
a label. (See the "backfill" UX — Section 5 of the plan.)

---

## 4. Phased delivery

I am intentionally NOT trying to ship all 24 fixes at once. Each phase
is a self-contained, demo-able slice. After every phase, the live app
gets a small marketing surface in the **What's new** panel that calls
out the new fix.

### Phase 1 — Trust (week 1–2) — `in progress`

The issues that hurt most: silent failures, token drops, vague errors.

| Fix | Files |
|-----|-------|
| 3.2 Surface every publish outcome as a notification + activity row | `useNotifications`, `useScheduledPosts`, `ActivityFeedView` |
| 3.3 `ErrorExplainer` component translating error codes to sentences | new `components/shared/ErrorExplainer.tsx`, used in `ScheduleDialog` + toasts |
| 3.1 Account health pill on every account row with token-expiry countdown | `useAccountHealth`, `AccountSwitcher`, integrations table |
| 1.1 Strict unread-count parity (badge can never exceed the live list) | `useUnreadInbox`, hub tabs |

**Why first.** These are the issues that make users assume the tool is
broken. Fixing them is high signal, low risk, and the new surfaces
(getHealthPill, ErrorExplainer) get reused by every later phase.

### Phase 2 — Inbox reliability (week 2–3)

| Fix | Files |
|-----|-------|
| 1.2 Connection-status pill with "last sync 12 s ago" | inbox header, `useAccountHealth` |
| 1.3 Ad-comment filter chip | `InboxBoard` toolbar, `PostSlotDialog` |
| 1.4 Threaded-view toggle | `UnifiedInboxView`, `InboxCard` |
| 1.5 Media chips with platform-aware fallbacks | `InboxCard`, `ReplyDialog` |
| 4.1 Collision indicator + 60 s soft-lock | `useInboxMessages`, `InboxCard` |

### Phase 3 — Collaboration (week 3–4)

| Fix | Files |
|-----|-------|
| 4.2 `ApprovalPolicies` editor (custom multi-stage chains) | new `useApprovalPolicies`, `SettingsHub → Approvals` |
| 4.3 External magic-link approval page | new route `/p/approve/:token`, new `useExternalApprovals` |
| 4.4 `@mention` autocomplete in private notes | `InboxCard` notes drawer, new `useMentions` |
| 5.3 Historical backfill on new account connect | `ConnectAccountDialog`, integration row |

### Phase 4 — Publishing correctness (week 4–5)

| Fix | Files |
|-----|-------|
| 2.1 Auto-adapt media per platform with pre-publish validator | `MediaField`, `ScheduleDialog` |
| 2.2 Native-feature badges (product tag, collab, location, audio, cover) | composer, `NetworkPreview` |
| 2.3 Link-preview chip with OG refresh | `MediaField` |
| 2.4 Per-platform char counter (URL/hashtag/emoji aware) | `NetworkPreview`, composer |
| 2.5 Cover-frame picker for Reels/TikTok | `MediaField` |
| 3.4 Idempotency keys + duplicate-recovery toast | `useScheduledPosts`, post-run hook |

### Phase 5 — Analytics honesty (week 5–6)

| Fix | Files |
|-----|-------|
| 5.1 Reconciliation badge on each metric | `PostMetricsCard`, `AnalyticsHub` |
| 5.2 PDF/CSV export pipeline | `ReportPreviewDialog`, `useReportRuns` |
| 5.4 Per-account timezone selector | `AccountContext`, chart axis labels |

### Phase 6 — Billing trust (week 6–7)

| Fix | Files |
|-----|-------|
| 6.1 Per-seat **and** flat-team plans on the pricing page | `Pricing.tsx`, `usePlan` |
| 6.2 30-day grace period, read-only analytics, always-available export | `usePlan`, `useScheduledPosts` |

### Phase 7 — Trust polish (week 7+)

- Refine empty states.
- "Why this recommendation?" popovers on the AI suggestions.
- Onboarding checklist for the new features.
- Public changelog entries for every shipped fix.

---

## 5. Detailed visual mockups for the highest-value fixes

### 5.1 Connection health pill (fix 1.2 + 3.1)

```
┌──────────────────────────────────────────────────┐
│  @brand · Instagram            [🟢 Connected]   │
│  Last sync 12 s ago · Token expires in 41 d     │
│  ▸ Re-authorize                                  │
└──────────────────────────────────────────────────┘
```

- The pill is colour-coded emerald/amber/rose based on the health score
  from `useAccountHealth`.
- A 7-day warning flips the pill to amber and writes a notification.
- "Re-authorize" is a one-click OAuth retry — it does not require
  navigating away.

### 5.2 Error explainer (fix 3.3)

```
┌──────────────────────────────────────────────────┐
│  ⚠ API Error 190                                 │
│  "Your video is too long for Instagram Reels."  │
│  Reels allow up to 90 s; this draft is 2:14.   │
│  ▸ Trim video   ▸ Move to Feed   ▸ Learn more   │
└──────────────────────────────────────────────────┘
```

- A registry in `lib/errorCodes.ts` maps every error we know about.
- Unknown codes fall through to a "Send to support" action that
  bundles the request ID, account, draft, and recent activity rows.

### 5.3 Threaded inbox (fix 1.4)

```
┌─ Threaded view · 4 of 7 threads open ─────────┐
│ Sam replied to your comment                    │
│   ↳ "Loved it!" — 2 h ago                      │
│   ↳ "Where did you get the soundtrack?" 1 h    │
│ [Open thread →]                                │
└────────────────────────────────────────────────┘
```

- We never auto-collapse; users can pick "Flat" or "Threaded" globally.
- Each nested reply preserves its own status and assignment.

### 5.4 Approval policy editor (fix 4.2)

```
┌── Approval policy: "Brand campaigns" ────────┐
│ Stage 1:  Intern drafts                       │
│   ▸ Required role: editor                     │
│ Stage 2:  Manager edits                       │
│   ▸ Required role: admin                      │
│   ▸ Must mention @brand-safety                │
│ Stage 3:  Client approves                     │
│   ▸ External magic link                       │
│   ▸ Expires in 48 h                            │
│ [+ Add stage]                                  │
└───────────────────────────────────────────────┘
```

- Saved as a JSON policy in `approval_policies` (new table).
- Bound to a brand, a channel, or a tag — the composer picks the right
  policy automatically.

### 5.5 Historical backfill (fix 5.3)

```
┌── Connect @brand · Facebook ────────────────┐
│ Choose what to backfill:                    │
│   ☑ Posts and metrics (90 d) — 2 m         │
│   ☑ Follower history (30 d) — 15 s          │
│   ☐ Comments and DMs (7 d) — 30 s           │
│ [Start backfill]                            │
└─────────────────────────────────────────────┘
```

- Progress is shown inline on the integration row (Phase 1 pill pattern).
- Failed backfill is retryable per facet.

### 5.6 Pricing — flat-team (fix 6.1)

```
┌── Plans ─────────────────────────────────────┐
│ Per-seat    $12/seat  ← Hootsuite's trap     │
│ Flat team   $99 flat  ★ recommended          │
│   • 1 brand · 5 seats included               │
│   • Add seats for $6/seat                    │
│ Agency      $299 flat                        │
│   • 10 brands · unlimited seats              │
└──────────────────────────────────────────────┘
```

- The flat plan is the **primary** CTA, not the per-seat one.
- The per-seat plan is shown second with a small "legacy" tag so it
  doesn't disappear, but we don't lead with it.

### 5.7 Billing grace period (fix 6.2)

```
┌── Your subscription is paused ─────────────┐
│ We'll keep publishing your queue for 30 d. │
│ Analytics are read-only after day 14.       │
│ You can always export your data.           │
│ ▸ Update payment   ▸ Export everything      │
└─────────────────────────────────────────────┘
```

- A single banner replaces the existing "subscription expired" wall.
- The export button works even with no payment method on file.

---

## 6. What I will build first

Given the size of this surface, my recommendation is to deliver
**Phase 1 (Trust) end-to-end** as the next unit of work. That includes:

1. `ErrorExplainer` component + error code registry
2. Account health pill on the account switcher + integrations table
3. Strict unread parity in `useUnreadInbox`
4. Every publish path writes a `useNotifications` row + an activity feed row

After Phase 1 ships, the rest of the fixes follow the same pattern:
**registry → store → component → dashboard surface.** This means the
later phases get cheaper, not more expensive.

The full plan above is captured in this document so the team can pick
up any later phase without re-deriving the architecture.
