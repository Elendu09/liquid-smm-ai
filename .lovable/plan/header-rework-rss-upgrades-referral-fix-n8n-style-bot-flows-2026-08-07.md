# Header rework, RSS upgrades, referral fix, n8n-style bot flows

## 1. Hub headers = section shortcuts (not new actions)

Every hub header action row currently invents new buttons ("New post", "Take the tour", "Templates"). Replace them with the hub's own sections, matching what the main dashboard does.

- Create: Studio · Captions · Hashtags · Brand Voice
- Library: Captions · Assets · Presets & Templates
- Publish / Engage / Audience / Analytics / Activity: same treatment — the header row mirrors that hub's tabs, nothing else.

Each button links to its section route; the first one stays visually primary. No tour/templates buttons anywhere in hub headers.

## 2. RSS: move AI rewrite into the preview dialog

- Remove the standalone sparkle "AI rewrite" button from each RSS item card (only Preview + Import remain).
- Inside the item Preview dialog, rewrite becomes a proper block: a Rewrite with AI button showing its credit cost, the rewritten text in an editable area, plus Revert and "Use this text" so the import uses the rewritten caption.
- Feed-level "AI rewrite" toggle (add feed, bulk import, explore): when enabled, every item imported from that feed is rewritten automatically before the draft is created, and each rewrite is charged once through the existing credit meter. When disabled, no AI call and no charge. Cost is shown up front next to the toggle, and a low-balance state disables the toggle instead of failing silently mid-import.

## 3. RSS → Publish import quality

Make imported items land in Publish as ready-to-schedule posts:

- Carry the item image into the post as media, plus title/link/summary through the feed's caption template.
- Let the user pick target channels and a schedule slot at import time (default = the feed's channels), and support "Add to queue" so it slots into the next free publishing time instead of sitting as an undated draft.
- Imported posts are tagged with their source feed so they are recognisable in the Publish queue and calendar, and re-importing the same item is blocked.

## 4. Referral: fix the broken data layer

The referral feature reads `profiles.referral_code`, `profiles.referred_by` and a `referrals` table — none of these exist in the database (verified against the live schema), so referral pages error, the project currently fails to typecheck in `useReferrals.ts` and the MCP referral tool, and no link can be issued. The migration below is what clears both the runtime error and the build errors.

- Add `referral_code` (unique) and `referred_by` to profiles, and create the `referrals` ledger (referrer, referred user, plan, credits awarded, timestamp) with access rules so a user only sees their own referrals and the referral edge functions can write.
- Issue a referral code automatically for every user (new signups on profile creation, plus a backfill for existing accounts) so the share link always exists rather than being minted on first page visit.
- Referral page then shows the live link, copy/share, the ledger and lifetime credits earned; the public `/referral/:code` lookup resolves against the new column.

## 5. Bot rules: n8n-style visual flow editor

Upgrade the existing linear flow editor into a canvas closer to the reference screenshots:

- Node canvas with pan/zoom, drag-to-position nodes, and drawn connector edges with arrow ports instead of a fixed left-to-right strip.
- Right-side "What happens next?" node picker panel, grouped by AI / Action / Condition / Flow / Trigger, searchable, inserting the node connected to the selected output port.
- Per-node config opens in a side panel: parameters, enable/disable, duplicate, delete.
- Run controls: Test flow (dry run showing which nodes would fire), active/inactive switch, save.
- Node model extended with position and explicit edges so branching is possible, keeping existing linear rules loadable.

This lays the groundwork for the later "repurpose content" and "reshare media across platforms" nodes, which are not part of this change.

## Technical notes

- Header work is presentation-only: `HeaderActionRow` usage in each `src/pages/dashboard/hubs/*Hub.tsx`, driven from the same tab definitions already in those files.
- RSS: `src/pages/dashboard/RssFeeds.tsx` (card actions, preview dialog), `src/hooks/useRssFeeds.ts` (`importItem` gains media/channels/schedule + auto-rewrite path), rewrite calls go through the existing `aiCreate.rewrite` op and `_shared/credits.ts` rate card.
- Referral: one migration adding the columns, the `referrals` table with GRANTs + RLS, a unique-code generator and signup trigger; `useReferrals.ts` simplified once codes are guaranteed.
- Bot flows: extend `FlowNode` in `src/hooks/useAutomationRules.ts` with `position` and an `edges` list; rebuild `src/components/engage/BotFlowEditor.tsx` as a canvas plus node-picker panel, persisting to the same rules store.
