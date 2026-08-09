# Dialog polish, single-row hub headers, and column stroke UI

## 1. Create draft dialog (NewPostDialog)
Restyle to match the reference:
- Header: compact pencil-in-square icon + "Create draft" title, an "Autosaved" status pill, and a text "Close ✕" control on the right (replacing the oversized gradient icon block).
- Platforms: square platform tiles in a row with brand-colored icons, a checked badge on selected tiles, a dashed "+" tile to add more, and a "N platform selected" caption below.
- Caption: single bordered field with a bottom toolbar (emoji, hashtag, AI sparkle) on the left and a live `0 / 2,200` counter on the right.
- Keep existing media, schedule, and save/schedule actions; only layout and styling change.

## 2. Edit scheduled post dialog (PostSlotDialog)
Match the second reference:
- Header row with calendar icon, title, one-line subtitle, and a circular close button.
- Caption card with the same bottom toolbar + counter + active-platform chip; "Add a first comment" as a separate rounded field below.
- Platform grid: all supported platforms as brand tiles with check badges, "N platforms selected" plus a "Clear" link, and per-platform status chips underneath.
- Keep auto-adapt toggle, validator panel, preview column, schedule row, and Delete / Cancel / Save actions; restyle spacing only.

## 3. One header row across dashboard hubs
- Change `PageHeader` usage so the hub tabs render beside the title on the same row (as the `actions` slot), horizontally scrollable on mobile.
- Remove the duplicate tab row currently rendered below the header in Create, Publish, Engage, Audience, Analytics, Activity, Library, Link-in-bio hubs.
- Settings hub keeps its current layout, untouched.

## 4. Onboarding setup — no skip on step 1
Hide the Skip control while the wizard is on the first step; it reappears from step 2 onward.

## 5. Fix page "reload" flash and shimmer placement
- The layout currently swaps the whole page for a full-page shimmer on every route change, so clicking a sub-tab (e.g. Activity → MCP) looks like a reload and hides the header.
- Fix: keep the hub header and tabs mounted, and show the shimmer only in the content area below the tabs, using a suspense/loading boundary around the routed view instead of the layout-level timer.

## 6. Top performing posts in the insights panel
Add a "Top performing posts" section directly below "Unresolved" in the calendar insights panel, using the existing top-posts data (thumbnail, caption line, engagement %), with a "View all" link.

## 7. Column header stroke UI
For board columns in Publish, Create, Library and Activity: replace the card-styled column with a flat column whose header has a colored top stroke per status (e.g. queued = indigo, sending = blue, completed = green, failed = red), uppercase label, and a count chip — no card background or border around the column body.

## Technical notes
- Files: `src/components/create/NewPostDialog.tsx`, `src/components/publish/PostSlotDialog.tsx`, `src/components/dashboard/shell/PageHeader.tsx`, `HubTabs.tsx`, `KanbanBoard.tsx`, `StatusBoard.tsx`, all `src/pages/dashboard/hubs/*.tsx` except `SettingsHub.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/onboarding/OnboardingWizard.tsx`, `src/components/publish/CalendarInsightsPanel.tsx`.
- `KanbanColumnDef` gains an optional accent token so each hub can set stroke colors; all colors come from semantic tokens, no hardcoded hex.
- Frontend/presentation only — no schema, backend, or data-flow changes.
