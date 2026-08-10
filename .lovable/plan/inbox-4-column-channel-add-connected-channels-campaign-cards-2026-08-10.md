# Inbox 4-column, channel add, connected channels, campaign cards, schedule dialog

Five UI upgrades based on the reference images. Mobile layouts stay exactly as they are today unless noted.

## 1. Inbox: fourth column when a conversation is open

Today the console is 3 columns (rail → list → thread). Add a fourth right-hand context column that appears only on large screens when a conversation is selected, matching the reference.

Right column contents:
- Contact header: avatar with channel badge, name, handle/phone, email, "View full profile" link.
- CONVERSATION block: Status pill (Open / Snoozed / Resolved, clickable to change), Agent (assignee), message count.
- TAGS block: clickable tag chips (Booking, Complaint, Follow-up, Product Question, Resolved, Urgent, VIP) — selected tags filled, unselected outlined.
- OPT-INS block: per-channel Yes/No rows for the channels the contact is reachable on.
- AI HANDOVER block: "Bot" pill plus "Take over" action that pauses automation for that thread.

Thread column also gains the reference's top bar and tabs:
- Header row: contact + channel name on the left, "Assign" dropdown and "Open/Status" dropdown on the right.
- Tabs under the header: Messages | Notes | Orders | Activity. Messages is the existing bubble view; Notes reuses the existing notes drawer content inline; Activity shows a simple event log (received, assigned, replied, status changed); Orders shows an empty/not-connected state.

Layout: `lg:grid-cols-[3.5rem_19rem_minmax(0,1fr)]` when nothing is selected, `xl:grid-cols-[3.5rem_19rem_minmax(0,1fr)_20rem]` when a thread is open. Below `xl` the context column collapses into an info button in the thread header that opens a sheet with the same blocks. Mobile stays byte-identical to today (rail + list + bottom sheet thread).

## 2. "+" add-channel button in the inbox rail

Below the last channel icon in the platform rail (e.g. YouTube), add a dashed circular `+` button. Clicking it opens the existing `ConnectAccountDialog` so users can integrate another channel without leaving the inbox. Present on both desktop and mobile rails.

## 3. Settings → Connected channels UI

Rework the grid in `ConnectedPanelNew.tsx` to match the reference:
- Toolbar: full-width search on the left; "Check all", "Filters", "Sort" (filled/primary), and "Actions" buttons on the right.
- Cards: rounded card with round avatar plus small platform glyph badge at its corner, name + `ACTIVE` badge on one line (wraps below the name when long), a small `+` icon button top-right, the `@handle` as a colored link, and the profile type ("Facebook Page", "X Profile", "LinkedIn Profile") underneath.
- Card footer separated by a hairline: "Open", "Reconnect", and a compact grid/more icon button.
- Responsive: 4 columns on desktop, 2 on tablet, 1 on mobile.
- Existing behaviors (status filters, disconnect, reconnect, health) stay wired.

## 4. Campaign card UI

Restyle `CampaignCard` in `src/pages/dashboard/Campaigns.tsx` to the reference layout:
- Header: gradient rounded icon tile, small uppercase eyebrow ("CAMPAIGN"), name, `…` menu top-right.
- Status pill with a colored dot plus a secondary count pill (e.g. "3 posts").
- Meta grid: two-up tiles with icon + uppercase label + value — Next run, Channels, Active days (spans full width).
- Stats row: three bordered tiles — Generated, Posts, Failed — numbers in accent/foreground colors.
- Footer: primary "Run now" button plus outline Pause/Resume.
- Keeps the existing collapsible post list under the footer and current click/select behavior.

## 5. Publish unified schedule dialog

Extend `ScheduleComposerScaffold` (used by both Schedule and Edit dialogs) into the reference's three-pane composer on desktop:
- Left pane: "Media" library panel with upload and grid-view icon buttons, a "Search files..." input, a Root breadcrumb chip, and a scrollable FILES grid of thumbnails with name and size; selected assets get a check badge and attach to the post.
- Center pane: Channel selector showing chosen accounts as removable chips; Caption textarea with emoji button; a row with "Get Caption" / "Save Caption" and a right-aligned character counter pill; the "AI composer tools" card (Open Studio link + AI Caption, AI Image, Repurpose, Review, Best time) with tag chips; "Attached Media" section with an "N SELECTED" pill and removable thumbnails; per-network options (e.g. Instagram → Feed / Reels / Stories); Campaign section.
- Right pane: "Network Preview" with account chips, the network label, and the live preview card; empty state prompts to choose a channel.
- Header stays the "SCHEDULE COMPOSER / New Publishing Item" eyebrow + title with a circular X.
- Sticky footer: helper text on the left, Cancel / Save Draft / Schedule Post on the right.
- Below `lg` the three panes collapse into the current stacked flow with the existing eye toggle, so tablet and mobile behavior is preserved.

## Technical notes

- Files touched: `src/components/engage/InboxConsole.tsx` (plus new `InboxContextPanel.tsx` and `InboxThreadTabs.tsx`), `src/components/settings/ConnectedPanelNew.tsx`, `src/pages/dashboard/Campaigns.tsx`, `src/components/publish/ScheduleComposerScaffold.tsx` and a new `MediaLibraryPane.tsx`.
- Tags, status, assignee and notes reuse existing `useInboxMessages`, `useTeamMembers`, `useSavedReplies` and the notes drawer store — no new backend or tables.
- Media pane reads from the existing library assets hook; no new storage buckets.
- All colors come from semantic tokens; no hardcoded hex or `text-white`.
