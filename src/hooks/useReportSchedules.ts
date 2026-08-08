import { useCallback } from "react";
import { DEMO_REPORT_SCHEDULES } from "@/lib/demoSeeds";
import { createRemoteCollection } from "./_remoteCollection";

export type Cadence = "daily" | "weekly-mon" | "weekly-fri" | "monthly";

export const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "Every day at 9:00 AM",
  "weekly-mon": "Every Monday at 9:00 AM",
  "weekly-fri": "Every Friday at 5:00 PM",
  monthly: "1st of every month at 9:00 AM",
};

export interface ReportSchedule {
  id: string;
  name: string;
  templateId?: string | null;
  cadence: Cadence;
  cadenceLabel: string;
  timezone: string;
  recipients: string[];
  format: string;
  sections: string[];
  active: boolean;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  sharePublic: boolean;
  createdAt: string;
}

interface Row {
  id: string;
  name: string;
  template_id: string | null;
  cadence: string;
  timezone: string;
  recipients: string[] | null;
  format: string;
  sections: unknown;
  filters: unknown;
  next_run_at: string | null;
  last_run_at: string | null;
  active: boolean;
  share_public: boolean;
  created_at: string;
}

const store = createRemoteCollection<ReportSchedule, Row>({
  table: "report_schedules",
  localKey: "smmpilot:reports:schedules",
  seed: DEMO_REPORT_SCHEDULES as any,
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => {
    const cadence = (r.cadence as Cadence) ?? "weekly-mon";
    return {
      id: r.id,
      name: r.name,
      templateId: r.template_id,
      cadence,
      cadenceLabel: CADENCE_LABEL[cadence] ?? r.cadence,
      timezone: r.timezone,
      recipients: r.recipients ?? [],
      format: r.format,
      sections: Array.isArray(r.sections) ? (r.sections as string[]) : [],
      active: r.active,
      nextRunAt: r.next_run_at,
      lastRunAt: r.last_run_at,
      sharePublic: r.share_public,
      createdAt: r.created_at,
    };
  },
  toInsertRow: (s, userId) => ({
    id: s.id,
    user_id: userId,
    template_id: s.templateId ?? null,
    name: s.name,
    cadence: s.cadence,
    timezone: s.timezone,
    recipients: s.recipients,
    format: s.format,
    sections: s.sections,
    filters: {},
    next_run_at: s.nextRunAt ?? null,
    last_run_at: s.lastRunAt ?? null,
    active: s.active,
    share_public: s.sharePublic,
    created_at: s.createdAt,
  }),
  toUpdateRow: (p) => {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.cadence !== undefined) row.cadence = p.cadence;
    if (p.timezone !== undefined) row.timezone = p.timezone;
    if (p.recipients !== undefined) row.recipients = p.recipients;
    if (p.format !== undefined) row.format = p.format;
    if (p.sections !== undefined) row.sections = p.sections;
    if (p.active !== undefined) row.active = p.active;
    if (p.sharePublic !== undefined) row.share_public = p.sharePublic;
    if (p.lastRunAt !== undefined) row.last_run_at = p.lastRunAt;
    return row;
  },
});

export function useReportSchedules() {
  const items = store.useItems();
  const add = useCallback((s: ReportSchedule) => store.add(s), []);
  const update = useCallback((id: string, patch: Partial<ReportSchedule>) => store.update(id, patch), []);
  const remove = useCallback((id: string) => store.remove(id), []);
  return { items, add, update, remove };
}
