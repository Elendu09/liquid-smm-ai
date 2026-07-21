import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";
import type { ReportData } from "@/lib/reportAnalytics";

export interface ReportRun {
  id: string;
  name: string;
  templateId?: string | null;
  template: string;
  period: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  format: string;
  size: string;
  sizeBytes: number;
  sections: string[];
  data?: ReportData | null;
  status: string;
  whitelabel: boolean;
  storagePath?: string | null;
  shareToken?: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  name: string;
  template_id: string | null;
  period_start: string | null;
  period_end: string | null;
  period_label: string | null;
  format: string;
  size_bytes: number | null;
  storage_path: string | null;
  sections: unknown;
  data: unknown;
  status: string;
  share_token: string | null;
  whitelabel: boolean | null;
  created_at: string;
}

const TEMPLATE_LABEL: Record<string, string> = {
  weekly: "Weekly Summary",
  monthly: "Monthly Growth",
  engagement: "Engagement Analysis",
  content: "Content Performance",
};

function humanSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes > 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

const store = createRemoteCollection<ReportRun, Row>({
  table: "report_runs",
  localKey: "smmpilot:reports:runs",
  seed: [],
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    templateId: r.template_id,
    template: TEMPLATE_LABEL[r.template_id ?? ""] ?? r.template_id ?? "Custom",
    period: r.period_label ?? "—",
    periodStart: r.period_start,
    periodEnd: r.period_end,
    format: r.format,
    size: humanSize(r.size_bytes ?? 0),
    sizeBytes: r.size_bytes ?? 0,
    sections: Array.isArray(r.sections) ? (r.sections as string[]) : [],
    data: (r.data as ReportData | null) ?? null,
    status: r.status,
    whitelabel: !!r.whitelabel,
    storagePath: r.storage_path,
    shareToken: r.share_token,
    createdAt: r.created_at,
  }),
  toInsertRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    template_id: item.templateId ?? null,
    name: item.name,
    period_start: item.periodStart ?? null,
    period_end: item.periodEnd ?? null,
    period_label: item.period,
    format: item.format,
    size_bytes: item.sizeBytes,
    storage_path: item.storagePath ?? null,
    sections: item.sections,
    data: item.data ?? null,
    status: item.status ?? "success",
    share_token: item.shareToken ?? null,
    whitelabel: item.whitelabel,
    created_at: item.createdAt,
  }),
  toUpdateRow: (p) => {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.status !== undefined) row.status = p.status;
    if (p.data !== undefined) row.data = p.data;
    if (p.sections !== undefined) row.sections = p.sections;
    if (p.whitelabel !== undefined) row.whitelabel = p.whitelabel;
    if (p.shareToken !== undefined) row.share_token = p.shareToken;
    return row;
  },
});

export function useReportRuns() {
  const items = store.useItems();
  const add = useCallback((run: ReportRun) => store.add(run), []);
  const update = useCallback((id: string, patch: Partial<ReportRun>) => store.update(id, patch), []);
  const remove = useCallback((id: string) => store.remove(id), []);
  return { items, add, update, remove };
}

export const reportRunsStore = store;
