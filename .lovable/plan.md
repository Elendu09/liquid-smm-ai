# Demo campaigns, sidebar keyboard fix, and mobile UI polish

## 1. Public/demo access to Campaigns

Today `/dashboard/campaigns` is registered with the strict `authOnly` guard, so demo (guest) visitors get bounced to `/login`. The page itself already has demo data and write-guards built in.

- Drop `authOnly` from the Campaigns route so guests reach the page like Team does (Team is already guest-viewable with mock members).
- Keep every mutation guarded: status change, delete, and the campaign builder call `guardWrite()` in demo mode, so guests can browse but never write.
- Add a shareable read-only public route `/c/:slug` (outside the dashboard, no auth) that renders a single demo campaign in a clean read-only card: name, objective, brief, platforms, dates, goal progress, plus a "Start free trial" CTA. Slugs map to the existing demo campaign set (e.g. `/c/spring-product-launch`).
- Add a "Copy share link" action on each campaign card; for real campaigns it copies the dashboard URL, for demo campaigns the public `/c/:slug` link.

## 2. Sidebar search stealing keyboard focus on mobile/tablet

Opening the mobile sidebar (a Radix Sheet) auto-focuses the first focusable element, which is the search input, so the on-screen keyboard pops up immediately.

- On the mobile `SheetContent`, prevent auto-focus (`onOpenAutoFocus` prevented) and move initial focus to the panel container instead, so the keyboard only appears when the user taps the search field.
- Keep the ⌘K / Ctrl+K shortcut focusing the search on desktop only (guard the existing focus effect so it never runs on touch/mobile widths).
- Verify accessibility: the sheet still traps focus and Escape still closes it.

## 3. Mobile UI/UX finetune (reference-image direction)

The references show a soft glass, high-radius, floating-panel mobile aesthetic. Applied to our existing dark navy + electric blue tokens — no new palette, no purple/white theme swap.

- Cards and dialogs: larger corner radius on mobile, softer inner border, subtle top-highlight gradient, tighter shadow instead of harsh borders.
- Bottom hub nav: turn into a floating rounded glass pill with a pronounced active-state chip behind the selected icon and a smoothly animated indicator; keep the center Publish label.
- Sheets/drawers: rounded top corners, grab handle, backdrop blur, spring-y open animation.
- Segmented controls (calendar tabs, filters): pill-style groups matching the reference's "Quick / Standard / Deep" selector, with an animated sliding highlight.
- Page headers on mobile: bigger Instrument Serif title, condensed meta row, and stat tiles converted to compact glass cards with a progress underline (like the Reviews/Fish/Focus row in the reference).
- Touch targets: minimum 40px for all icon buttons, circular close buttons kept consistent.

## Technical notes

- Files: `src/App.tsx` (route change + new public route), `src/pages/dashboard/Campaigns.tsx` (share action), new `src/pages/PublicCampaign.tsx`, `src/components/layout/DashboardSidebar.tsx` (sheet focus + shortcut guard), `src/components/dashboard/MobileHubNav.tsx`, `src/index.css` (mobile glass utility tokens), plus targeted mobile classes in shared UI (`card`, `sheet`, `dialog`, `PageHeader`).
- Demo campaign data stays client-side (`DEMO_CAMPAIGNS`); no backend or database change is needed for public sharing of demo campaigns.
- Real user campaigns remain private — the public route only serves the built-in demo set.
