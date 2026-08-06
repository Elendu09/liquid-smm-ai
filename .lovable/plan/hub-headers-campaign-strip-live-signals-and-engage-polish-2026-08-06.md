# Hub headers, campaign strip, live signals, and Engage polish

## 1. Consistent header action row on every hub

Today only the main dashboard has the three-up glass action row (Quick action / Take the tour / Activity) that fits on one line across desktop, tablet and mobile. Create, Publish, Engage, Audience, Analytics, Library and Activity hubs pass no actions at all.

- Extract the dashboard's button styling into a shared `HeaderActionRow` (shell component) with one primary glass button plus outline buttons, using the same `grid grid-cols-3 ... md:flex` responsive behaviour so it never wraps or overflows.
- Give each hub a contextual set of three actions:
  - Create: New post, Take the tour, Templates
  - Publish: Schedule post, Take the tour, Queue
  - Engage: Reply/Saved replies, Take the tour, Bot rules
  - Audience: Add competitor, Take the tour, Segments
  - Analytics: New report, Take the tour, Exports
  - Library: Upload asset, Take the tour, Presets
  - Activity: Run history, Take the tour, Notifications
- Keep the tab strip below unchanged.

## 2. Campaigns: horizontal sliding stat strip

The three stat cards (Campaigns / Active now / Posts planned) stack vertically on mobile. Convert to a snap-scrolling horizontal strip on small screens (same pattern as the dashboard KPI strip) and keep the 3-column grid from `sm` up.

## 3. Replace "Coming next" chips with real features

Remove the roadmap chip row in the calendar toolbar and ship the three items:

- **Realtime unread** — subscribe to inbox message inserts/updates and show a live unread count badge on the Engage tab, the Inbox hub tab, and the mobile bottom-nav Engage item.
- **Live follower spark** — small sparkline of recent follower history rendered next to the follower KPI, refreshing with account metrics.
- **Campaign tags** — scheduled posts can carry a campaign; show a campaign tag chip on calendar/queue cards and allow filtering the calendar by campaign.

## 4. Engage visual overhaul (mobile/tablet first)

- Triage bar: turn the 5 metric tiles into a compact horizontal snap strip on mobile, condensed two-line tiles; sentiment/intent chips become a single scrollable row each with clearer active state.
- Console: on mobile/tablet use a stacked flow — channel rail as a horizontal pill scroller, conversation list full-width, and the thread opening as a full-height sheet with a sticky reply composer (instead of the cramped three-column squeeze). Desktop keeps the three-pane layout.
- Consistent glass cards, larger tap targets (min 44px), unread dot + platform badge on each conversation row, and clear empty states.

## Technical notes

- New shell component `src/components/dashboard/shell/HeaderActionRow.tsx`, exported from `shell/index.ts`, used by all hub layouts and `Dashboard.tsx`.
- Realtime unread via a `useUnreadInbox` hook using a Supabase channel on inbox messages, with guest/demo fallback to local data.
- Follower spark reads existing account metrics history; renders a lightweight inline SVG/Recharts sparkline.
- Campaign tags reuse `useCampaigns` and the existing scheduled-post campaign association; no schema change unless a `campaign_id` column is missing, in which case a migration adds it with matching GRANT/RLS.
- Engage mobile thread uses the existing Sheet primitive; no data-layer changes.
