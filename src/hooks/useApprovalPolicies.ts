import { useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// These tables are not in the generated DB types yet; use an untyped view of the client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { isGuestSession } from "@/hooks/useGuest";

/**
 * useApprovalPolicies
 *
 * Fix 4.2 — rigid approval tiers. Brands and agencies need a chain of
 * stages (Intern → Manager → Client) instead of a single on/off switch.
 * A policy is a list of stages; each stage can require a role, an external
 * magic-link approver, or a mention before it can advance.
 */

export type ApprovalRole = "owner" | "admin" | "editor" | "viewer" | "external";
export type ApprovalChannel = "any" | "instagram" | "tiktok" | "youtube" | "twitter" | "facebook" | "linkedin";

export interface ApprovalStage {
  id: string;
  /** Display name e.g. "Intern drafts". */
  label: string;
  /** Required role. "external" = external client magic link. */
  requiredRole: ApprovalRole;
  /** The user must @mention at least one of these handles before approving. */
  mustMention?: string[];
  /** Auto-advance after this many hours if no one acts. */
  autoExpireHours?: number;
  /** Send a Slack-style channel notification on entry. */
  notifyChannel?: string;
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  description?: string;
  /** Optional brand binding. null = applies to all brands. */
  brandId?: string | null;
  /** Optional channel binding. "any" = applies to all channels. */
  channel?: ApprovalChannel;
  /** Tags that bind a draft to this policy. */
  tags?: string[];
  stages: ApprovalStage[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "smmpilot:approval-policies";

const SEED: ApprovalPolicy[] = [
  {
    id: "policy-std-internal",
    name: "Internal review (2 stages)",
    description: "Drafts go from intern to manager before being scheduled.",
    channel: "any",
    tags: [],
    enabled: true,
    stages: [
      { id: "stage-1", label: "Intern drafts", requiredRole: "editor", mustMention: ["@brand-safety"] },
      { id: "stage-2", label: "Manager reviews", requiredRole: "admin", autoExpireHours: 48 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "policy-client-approval",
    name: "Client approval (external magic link)",
    description: "Drafts are sent to a client email via magic link. No account required.",
    channel: "any",
    tags: ["client"],
    enabled: true,
    stages: [
      { id: "stage-1", label: "Internal edit", requiredRole: "editor" },
      { id: "stage-2", label: "Client approves", requiredRole: "external", autoExpireHours: 72, notifyChannel: "#client-approvals" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let cache: ApprovalPolicy[] = readLocal();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function setCache(next: ApprovalPolicy[]) { cache = next; emit(); }

function readLocal(): ApprovalPolicy[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ApprovalPolicy[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fall through */ }
  return SEED;
}

function writeLocal(next: ApprovalPolicy[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) setCache(readLocal());
  });
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // eslint-disable-next-line no-restricted-syntax -- synth-ok: fallback id
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useApprovalPolicies() {
  const items = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => cache,
    () => cache,
  );

  useEffect(() => {
    if (isGuestSession()) return; // guests already loaded SEED
    // For real users, try a future `approval_policies` table; fall back to local.
    (async () => {
      try {
        const { data, error } = await db.from("approval_policies").select("*").order("created_at", { ascending: true });
        if (!error && data && data.length) {
          // Map remote → local shape.
          const remote = data.map((row: { id: string; name: string; description: string | null; brand_id: string | null; channel: string; tags: string[] | null; stages: ApprovalStage[]; enabled: boolean; created_at: string; updated_at: string }) => ({
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            brandId: row.brand_id ?? null,
            channel: (row.channel ?? "any") as ApprovalChannel,
            tags: row.tags ?? [],
            stages: row.stages ?? [],
            enabled: row.enabled,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          writeLocal(remote);
        }
      } catch { /* keep local */ }
    })();
  }, []);

  const add = (draft: Omit<ApprovalPolicy, "id" | "createdAt" | "updatedAt">): ApprovalPolicy => {
    const now = new Date().toISOString();
    const next: ApprovalPolicy = { ...draft, id: uid(), createdAt: now, updatedAt: now };
    writeLocal([...items, next]);
    void db.from("approval_policies").insert({
      id: next.id,
      name: next.name,
      description: next.description ?? null,
      brand_id: next.brandId ?? null,
      channel: next.channel ?? "any",
      tags: next.tags ?? [],
      stages: next.stages,
      enabled: next.enabled,
      created_at: now,
      updated_at: now,
    }).then(() => { /* fire and forget */ });
    return next;
  };

  const update = (id: string, patch: Partial<ApprovalPolicy>) => {
    const next = items.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p);
    writeLocal(next);
    const cur = next.find((p) => p.id === id);
    if (cur) {
      void db.from("approval_policies").update({
        name: cur.name,
        description: cur.description ?? null,
        brand_id: cur.brandId ?? null,
        channel: cur.channel ?? "any",
        tags: cur.tags ?? [],
        stages: cur.stages,
        enabled: cur.enabled,
        updated_at: cur.updatedAt,
      } as never).eq("id", id);
    }
  };

  const remove = (id: string) => {
    writeLocal(items.filter((p) => p.id !== id));
    void db.from("approval_policies").delete().eq("id", id);
  };

  const forContext = (ctx: { brandId?: string | null; channel?: ApprovalChannel; tags?: string[] }) => {
    return items.find((p) => {
      if (!p.enabled) return false;
      if (p.brandId && p.brandId !== ctx.brandId) return false;
      if (p.channel && p.channel !== "any" && p.channel !== ctx.channel) return false;
      if (p.tags && p.tags.length > 0) {
        const has = (ctx.tags ?? []).some((t) => p.tags!.includes(t));
        if (!has) return false;
      }
      return true;
    }) ?? null;
  };

  const stats = useMemo(() => ({
    total: items.length,
    enabled: items.filter((p) => p.enabled).length,
    externalCount: items.filter((p) => p.stages.some((s) => s.requiredRole === "external")).length,
  }), [items]);

  return { items, add, update, remove, forContext, stats };
}
