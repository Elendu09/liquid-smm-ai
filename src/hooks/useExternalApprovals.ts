import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// These tables are not in the generated DB types yet; use an untyped view of the client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { isGuestSession } from "@/hooks/useGuest";

/**
 * useExternalApprovals
 *
 * Fix 4.3 — external approval links. Drafts can be sent to a client via a
 * magic link. The client never creates an account; they get a tokenised
 * URL like /p/approve/:token that opens a read-only preview and lets them
 * approve / reject / request-changes. Every action is logged into the
 * `external_approval_events` table for the audit trail.
 */

export type ExternalApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested" | "expired";

export interface ExternalApproval {
  id: string;
  token: string;
  draftId: string;
  recipientEmail: string;
  recipientName?: string;
  /** Snapshot of the post at the moment we asked, so the client sees a stable view. */
  postSnapshot: {
    caption: string;
    mediaUrl?: string;
    platforms: string[];
    scheduledAt?: string;
  };
  status: ExternalApprovalStatus;
  /** Expiry — after this date the link shows a "this link has expired" page. */
  expiresAt: string;
  /** Audit trail of every action. */
  events: { at: string; action: ExternalApprovalStatus | "viewed" | "link_sent"; by: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "smmpilot:external-approvals";

let cache: ExternalApproval[] = readLocal();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function setCache(next: ExternalApproval[]) { cache = next; emit(); }

function readLocal(): ExternalApproval[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExternalApproval[]) : [];
  } catch { return []; }
}

function writeLocal(next: ExternalApproval[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}

function token() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  // eslint-disable-next-line no-restricted-syntax -- synth-ok: fallback token
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function useExternalApprovals() {
  const items = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => cache,
    () => cache,
  );

  useEffect(() => {
    if (isGuestSession()) return;
    (async () => {
      try {
        const { data, error } = await db
          .from("external_approvals")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          const remote = data.map((row: { id: string; token: string; draft_id: string; recipient_email: string; recipient_name: string | null; post_snapshot: unknown; status: ExternalApprovalStatus; expires_at: string; events: unknown[]; created_at: string; updated_at: string }) => ({
            id: row.id,
            token: row.token,
            draftId: row.draft_id,
            recipientEmail: row.recipient_email,
            recipientName: row.recipient_name ?? undefined,
            postSnapshot: row.post_snapshot as ExternalApproval["postSnapshot"],
            status: row.status,
            expiresAt: row.expires_at,
            events: (row.events ?? []) as ExternalApproval["events"],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          writeLocal(remote);
        }
      } catch { /* keep local */ }
    })();
  }, []);

  const create = useCallback(
    (input: { draftId: string; recipientEmail: string; recipientName?: string; postSnapshot: ExternalApproval["postSnapshot"]; expiresInHours?: number }) => {
      const now = new Date();
      const expires = new Date(now.getTime() + (input.expiresInHours ?? 72) * 3600_000);
      const next: ExternalApproval = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `ea_${Date.now()}`,
        token: token(),
        draftId: input.draftId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        postSnapshot: input.postSnapshot,
        status: "pending",
        expiresAt: expires.toISOString(),
        events: [
          { at: now.toISOString(), action: "link_sent", by: "internal" },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      writeLocal([next, ...items]);
      void db.from("external_approvals").insert({
        id: next.id,
        token: next.token,
        draft_id: next.draftId,
        recipient_email: next.recipientEmail,
        recipient_name: next.recipientName ?? null,
        post_snapshot: next.postSnapshot,
        status: next.status,
        expires_at: next.expiresAt,
        events: next.events,
        created_at: next.createdAt,
        updated_at: next.updatedAt,
      } as never);
      return next;
    },
    [items],
  );

  const recordAction = useCallback(
    (id: string, action: ExternalApproval["events"][number]["action"], by: string, note?: string) => {
      const next = items.map((a) => {
        if (a.id !== id) return a;
        const at = new Date().toISOString();
        const events = [...a.events, { at, action, by, note }];
        const status: ExternalApprovalStatus =
          action === "approved" || action === "rejected" || action === "changes_requested"
            ? (action === "approved" ? "approved" : action === "rejected" ? "rejected" : "changes_requested")
            : a.status;
        return { ...a, status, events, updatedAt: at };
      });
      writeLocal(next);
      const cur = next.find((a) => a.id === id);
      if (cur) {
        void db.from("external_approvals").update({
          status: cur.status,
          events: cur.events,
          updated_at: cur.updatedAt,
        } as never).eq("id", id);
      }
    },
    [items],
  );

  const byToken = useCallback(
    (tok: string) => items.find((a) => a.token === tok) ?? null,
    [items],
  );

  return { items, create, recordAction, byToken };
}
