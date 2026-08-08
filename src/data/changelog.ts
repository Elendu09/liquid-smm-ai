export type ChangelogKind = "feature" | "fix" | "polish" | "trust";

export interface ChangelogEntry {
  id: string;
  date: string; // ISO
  title: string;
  summary: string;
  kind: ChangelogKind;
  tags?: string[];
}

export const changelogEntries: ChangelogEntry[] = [
  // May 2026 — Phases 6-7
  { id: "team-plan-2026-05", date: "2026-05-08", title: "Team plan — flat $99, 5 seats included", summary: "New flat-team tier with multi-stage approvals, external magic-link approvals, 90-day backfill, white-label reports and 4h priority chat. Marked as Most popular on /pricing and added to the comparison table with a FLAT pill.", kind: "feature", tags: ["pricing", "team"] },
  { id: "grace-period-2026-05", date: "2026-05-08", title: "30-day billing grace period", summary: "Publishing keeps running for 30 days past due, analytics become read-only, and exports always work. Amber grace banner and rose frozen banner with Update payment / Pause / Export / Reactivate actions.", kind: "trust", tags: ["billing"] },
  { id: "changelog-page-2026-05", date: "2026-05-08", title: "Public changelog at /changelog", summary: "Dated entries grouped by month, kind badges (feature/fix/polish/trust), JSON-LD and a footer link so every fix is discoverable.", kind: "polish", tags: ["changelog"] },
  { id: "inbox-empty-2026-05", date: "2026-05-07", title: "Refined inbox empty state", summary: "Three action cards: connect a channel, build an inbox flow, and create saved replies — replacing the generic empty message.", kind: "polish", tags: ["inbox"] },
  { id: "why-this-2026-05", date: "2026-05-07", title: "Why this recommendation?", summary: "Explainable best-time-to-post reasons with confidence and inline/icon variants, wired into BestTimeInsightsCard.", kind: "feature", tags: ["analytics", "ai"] },
  { id: "onboarding-checklist-2026-05", date: "2026-05-06", title: "Onboarding checklist expansion", summary: "Three new items: inbox flow, approvals, and timezone. Auto-completes when InboxRuleDialog, ApprovalPolicyDialog, or TimezoneSelector save, via localStorage flags.", kind: "polish", tags: ["onboarding"] },
  { id: "whats-new-2026-05", date: "2026-05-06", title: "What's new pill on the dashboard", summary: "Home dashboard pill linking to /changelog so users never miss a shipped fix.", kind: "polish", tags: ["dashboard"] },
  { id: "approvals-panel-2026-05", date: "2026-05-05", title: "Approvals settings + panel", summary: "New /dashboard/settings/approvals route, ApprovalsPanel list, and an Approvals tab in the Settings hub.", kind: "feature", tags: ["approvals"] },
  { id: "error-boundary-2026-05", date: "2026-05-05", title: "Branded error boundary", summary: "App-wide ErrorBoundary wrapping Routes with Try again + Back to home and a console.error of the stack.", kind: "fix", tags: ["reliability"] },
  // April 2026 — Phase 5
  { id: "reconciliation-badge-2026-04", date: "2026-04-22", title: "Reconciliation badge on metrics", summary: "Each metric now shows Matches platform (±0.3%) vs Drift, with a Why? popover.", kind: "trust", tags: ["analytics"] },
  { id: "export-pdf-2026-04", date: "2026-04-18", title: "PDF & CSV export pipeline", summary: "Widgets export to PDF using the same SVG/canvas and to CSV with stable columns.", kind: "feature", tags: ["reports"] },
  { id: "timezone-selector-2026-04", date: "2026-04-15", title: "Per-account timezone selector", summary: "Choose a timezone per connected account; every chart axis is labeled with the chosen TZ.", kind: "fix", tags: ["analytics"] },
  // March 2026 — Phase 4/3
  { id: "idempotency-2026-03", date: "2026-03-28", title: "Idempotency keys for publishing", summary: "Duplicate publish attempts are deduped and the second is rolled back with a recovered duplicate toast.", kind: "fix", tags: ["publishing"] },
  { id: "approval-policies-2026-03", date: "2026-03-20", title: "Approval policies editor + magic links", summary: "Multi-stage chains with roles, mentions, expiry and external magic-link approvals at /p/approve/:token.", kind: "feature", tags: ["approvals"] },
  { id: "historical-backfill-2026-03", date: "2026-03-12", title: "Historical backfill on connect", summary: "Backfill the last 30/60/90 days when connecting an account, with progress in the integration row.", kind: "feature", tags: ["integrations"] },
];
