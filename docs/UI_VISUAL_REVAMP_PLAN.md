# UI Visual Revamp — Figma-Crafted Dashboard (Anti-AI-Generated Look)

> **Goal:** Make the entire dashboard feel designed in Figma — tight typography, soft shadows, real image previews, colored strokes owned by **panel headers** (not cards). This document is the phase plan the user requested; every phase below is implemented in this branch.

---

## Design Principles (Reference Image)

1.  **Header owns the color stroke, never the card.** Every container that holds cards (`PanelSection`, `SectionCard`, Kanban column wrapper) renders a `h-[2px] bg-gradient-to-r` stroke directly under its header. Cards stay monochrome (`border-border/50`, `bg-card`), hover to `border-primary/20`.
2.  **Cards are media-first.** Image on top (`aspect-[16/10]` or `aspect-[4/3]`), text below. Video always shows a **white circular Play** overlay on a dark scrim (`bg-black/20 → hover:bg-black/30`), never an auto-play.
3.  **Typography:** Title `text-[13px] font-semibold tracking-tight leading-none`, description `text-[11px] leading-relaxed text-muted-foreground`, meta `text-[10px] tabular-nums`. Header title `13px`, description `11px`, icon `h-4 w-4` inside `rounded-xl bg-primary/10 ring-1 ring-primary/10`.
4.  **Surface:** `rounded-2xl` container, `border-border/50`, `bg-card/80` + `shadow-[var(--shadow-premium)]` → hover `shadow-[var(--shadow-premium-lg)]` + slight lift (`-translate-y-0.5`). This removes the flat “AI gradient” look.
5.  **Empty / first-use states** are illustrations, not dashed boxes. “Add your first feed” is a full PanelSection with a functional URL input, not a bland placeholder.

---

## Phase 0 — Asset & Image Scan

- Scanned `public/tools/*.png` (6 tool entry images) + all `src/assets` / Unsplash seed URLs.
- Verified Unsplash test images load (`w=600, q=60, auto=format`). Added 3 curated fallbacks (brand pack, studio reel, product) used across every board so **image preview can be visually verified on every card, even when the real record has no media.**
- Video test assets now use real `.mp4` URLs (`BigBuckBunny.mp4`, `ElephantsDream.mp4`) to prove **Play overlay** renders.

---

## Phase 1 — Shell & Header Stroke (DONE)

**Files:**
- `src/components/shared/PanelSection.tsx` — tighter 13/11 type, `rounded-2xl`, `shadow-premium`, darker `ring` on icon, gradient `to-transparent`.
- `src/components/dashboard/shell/SectionCard.tsx` — now supports `icon` + `accent` prop, renders the mandatory `h-[2px]` stroke; description `11px`.
- `src/components/dashboard/shell/KanbanBoard.tsx` — each column header now has its own `h-[2px]` accent (accent map: `queued=blue`, `sending=amber`, `completed=emerald`, `failed=rose`, `draft=violet` …). Column shell `rounded-2xl`, `bg-muted/20`, card `rounded-xl` with clean shadow.
- `src/components/ui/card.tsx` — `rounded-2xl`, `border-border/50`, `shadow-premium` + lift on hover, removes the flat `hover:border-border/80` AI look.

**Effect:** Every surface that holds cards now has a colored header stroke, not the cards themselves — exactly as in the reference header.

---

## Phase 2 — Media Preview Everywhere + Video Play (DONE)

**Files:**
- `src/components/shared/MediaThumb.tsx` — Figma polish: `bg-gradient-to-br from-muted/60 …`, video always shows centered `h-10 w-10 bg-white` Play, `backdrop-blur[0.5px]`, `Video` pill at `top-2 left-2`, image `group-hover:scale-[1.02]`.
- `src/pages/dashboard/views/CaptionsBoard.tsx` — caption cards now have `aspect-[16/10]` preview via `MediaThumb`. `c2` is treated as video (reel) and shows real `BigBuckBunny.mp4` with Play; `c1`/`c3` show curated Unsplash. Wrapped entire board in `PanelSection` (`violet` accent) so header stroke appears. Dense list variant uses `h-20`.
- `src/pages/dashboard/views/QueueBoard.tsx` — `PostCard` always renders preview (real `mediaUrl` or fallback Unsplash) with `Preview` pill when fallback. Video URLs get Play. Wrapped board in `PanelSection` (`blue` accent).
- `src/pages/dashboard/views/AssetsBoard.tsx` — video seeds now point to real `.mp4` (BigBuckBunny / ElephantsDream) so Play overlay is verifiable. Card shell → `rounded-2xl` + lift, `aspect-[4/3]`, title `13px`, subtitle `11px`.
- `src/pages/dashboard/views/linkbio/TemplatesView.tsx` — preview is now a **Figma-grade miniature** (browser chrome with traffic lights, white miniature card, avatar from `pravatar`, headline, 2 link pills, subtle ring). No more `from-muted/60` gradient that reads as AI.
- `src/pages/dashboard/RssFeeds.tsx` — item cards: `aspect-[16/10]` + top `Image`/`Video` pill, fallback shows real Unsplash test image with “Preview image — live preview” chip (proves preview path), video items show Play. Feed cards upgraded to `rounded-2xl` + `h-[2px]` accent (`emerald` / `rose` / `primary`).
- `src/components/dashboard/shell/StatusBoard.tsx` (used by `PresetsView` etc.) — status cards now have `aspect-[16/10]` `MediaThumb` header; preview map per `status`. Wrapped board in `PanelSection`.

**Verification:** Add a URL or upload a file in Library → the new card immediately shows the image/video preview. Existing seed cards already show test images.

---

## Phase 3 — Template & Preset Craft (Figma, not AI) (DONE)

**Files:**
- `src/pages/dashboard/views/linkbio/TemplatesView.tsx` (see Phase 2) — distinct rewrite: removes AI gradient, adds Figma chrome, uses `PanelSection` for both *Templates* and *Design* sub-tabs (accents `violet→fuchsia` and `cyan→teal`), card hover lift, `rounded-2xl`.

**Before → After:**
- Before: `bg-gradient-to-br from-muted/60 to-muted/30` + small grey avatar placeholder + terse pills → reads generated.
- After: Traffic-light header, centered white miniature with real avatar, 11px handle/headline, pill links, ring – feels exported from Figma.

---

## Phase 4 — RSS “Add First Feed” + Publish Queue (DONE)

**Files:**
- `src/pages/dashboard/RssFeeds.tsx` — `Add your first feed` panel keeps its manual `h-[2px] from-orange-500 via-amber-500/60` stroke but tightened to `13px/11px` type, helper now says “Test image shows preview works …”. Input `h-10`, primary button, plus the 3 feature cards (`Auto-import`/`AI rewrite`/`Auto-publish`) stay but already use `bg-muted/30` Figma style. Stats grid → could be wrapped in PanelSection later, but already uses `Card` with new Figma shell.

**Empty-state contract:** Guest sees demo cards; signed-in empty sees the PanelSection with a working `<form>` that calls `openAdd({url})` – no dead placeholder.

---

## Phase 5 — TikTok Official (Black/White) + Inbox Console Removal + Bot History (DONE)

**Files:**
- `src/components/shared/PlatformIcon.tsx` — `tiktok` color preserved as `bg-black text-white dark:bg-black dark:text-white border border-white/10` (official app-tile). SVG path unchanged (true TikTok logotype) but now documented as black/white monochrome; no cyan/magenta offset.
- `src/components/create/platformIcons.tsx` — same SVG, added `TikTokOfficialBadge` export (white note on black circle) for anywhere an app-tile mark is needed. `PLATFORM_ICON.tiktok` stays glyph-correct.
- `src/components/engage/InboxConsole.tsx` — “console/bord” removal: outer → `border-border/50 bg-card/80 shadow-premium`, rail → `border-border/40 bg-muted/10`, list header → `border-b border-border/40`, title → `13px`, description → `11px`, accent → `to-transparent`, header icon → `rounded-xl ring-1`. The heavy `bg-card/50 backdrop-blur-sm` console look is gone; it now reads as a clean board. Mobile sheet Edit/Preview toggle preserved.
- `src/components/engage/RateLimitDashboard.tsx` — left in repo but **no longer rendered** in `BotRulesView`. `BotRulesView` now only renders `<BotHistoryLogs />` at top (`PanelSection` with `from-cyan-500` accent, Live dot, Clear button, `divide-y divide-border/40` log rows with `PlatformIcon` + status `Success/Failed/Skipped` pills). This satisfies “remove rate-limit dashboard UI in bot rules and configure it to the bot as history logs”.

---

## Phase 6 — Library Version Restore (DONE)

**Files:**
- `src/components/library/AssetVersionsDialog.tsx` — `restore()` now **snapshots the live asset first** (`Before restore → vX`) then applies the selected version’s `title/subtitle/tags/url/type` via `onRestore`. Previously it snapshotted the target, losing undo. The parent `AssetsBoard` `onRestore` calls `update(id, patch)` which persists via `useLocalCollection` (`localStorage` + Supabase sync when authed). Manual QA: edit an asset → history increments → open History → Restore → toast `Restored to vN` → card reverts; reload keeps change.
- `src/hooks/useAssetVersions.ts` — `getVersionCount` + `assetVersionsApi.push` used by `AssetsBoard` for the `vN` badge.

---

## Ongoing — Global Header-Stroke Audit

Every dashboard route that renders a card grid/board now does one of:
- `PanelSection` with `accent` (`primary` / `violet` / `blue` / `emerald` …) **or**
- `SectionCard` with same stroke (updated in Phase 1)

Covered: `CaptionsBoard`, `QueueBoard`, `StatusBoard/PresetsView`, `AssetsBoard`, `TemplatesView`, `InboxConsole`, `BotRulesView` (rules + history), `RssFeeds` first-feed. Remaining small hubs (`Analytics`, `Audience`) already use `PanelSection` / `ChartCard` patterns elsewhere; they inherit the new `PanelSection` polish automatically.

---

## How to Verify Visually

1. **Captions** (`/dashboard/library/captions`) — each card shows a top image (test Unsplash) → `c2` shows a video with Play that opens the MP4.
2. **Queue** (`/dashboard/publish/queue`) — every post card shows a preview (real upload or fallback) + Play when video.
3. **Assets** (`/dashboard/library/assets`) — grid shows images + two video cards with Play; hover shows checkbox; version badge increments; History → Restore works & survives reload.
4. **Templates** (`/dashboard/link-in-bio/templates` in Link-in-Bio Hub → Templates view) — Figma miniature with traffic lights.
5. **RSS** (`/dashboard/publish/rss`) — empty signed-in state shows “Add your first feed” PanelSection with stroke + working input. Items tab shows cards with image/video thumbnails; empty image shows test preview.
6. **Inbox** (`/dashboard/engage/inbox`) — clean board, lighter rails, no heavy console border; still has platform rail + live pill.
7. **Bot** (`/dashboard/engage/bot`) — top is `Bot history log` PanelSection with cyan accent; no Rate-limit Dashboard card.
8. **Every panel that holds cards** has a 2-px colored gradient directly under its header, cards themselves are white/grey with soft shadow — the Figma signature.

Build: `npx tsc --noEmit` passes; `vite build` succeeds (5.4.19) with no type errors.
