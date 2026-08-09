import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_SCHEDULED_POSTS } from "@/lib/demoSeeds";
import { isGuestSession } from "@/hooks/useGuest";

type ScheduledPostInsert = Database["public"]["Tables"]["scheduled_posts"]["Insert"];
type ScheduledPostUpdate = Database["public"]["Tables"]["scheduled_posts"]["Update"];

export type Recurrence = { freq: "daily" | "weekly" | "monthly"; count: number };
export type SendStatus = "queued" | "paused" | "sending" | "completed" | "failed";
export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string;
  timezone?: string;
  platformIds: string[];
  platformOverrides?: Record<string, { caption?: string; hashtags?: string[] }>;
  hashtags?: string[];
  firstComment?: string;
  seriesId?: string;
  createdAt: string;
  status?: SendStatus;
  sendProgress?: number;
  error?: string;
  sentAt?: string;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  recycleRuleId?: string;
  categoryId?: string;
  campaignId?: string;
  /** Phase 4 — cover frame offset in seconds (Reels / TikTok / Shorts). */
  coverFrameSec?: number;
  /** Phase 4 — which native features the user enabled on this draft. */
  nativeFeatures?: Record<string, boolean>;
  /** Phase 4 — per-feature data for native features (productTag, collabPost, location, etc.) */
  nativeFeatureData?: Record<string, any>;
}


const STORAGE_KEY = "smmpilot:scheduled-posts";

/* -------------------------------------------------------------------------- */
/* Module-level cache + subscribers (drives useSyncExternalStore)             */
/* -------------------------------------------------------------------------- */

type Mode = "local" | "remote";
let mode: Mode = "local";
let remoteUserId: string | null = null;
let cache: ScheduledPost[] = readLocal();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function setCache(next: ScheduledPost[]) {
  cache = next;
  emit();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* -------------------------------------------------------------------------- */
/* Local (guest) storage                                                       */
/* -------------------------------------------------------------------------- */

function readLocal(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ScheduledPost[];
      if (parsed.length > 0) return parsed;
    }
    if (isGuestSession()) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_SCHEDULED_POSTS)); } catch {}
      return DEMO_SCHEDULED_POSTS;
    }
    return raw ? (JSON.parse(raw) as ScheduledPost[]) : [];
  } catch {
    return isGuestSession() ? DEMO_SCHEDULED_POSTS : [];
  }
}
function writeLocal(next: ScheduledPost[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  setCache(next);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (mode === "local" && e.key === STORAGE_KEY) setCache(readLocal());
  });
}

/* -------------------------------------------------------------------------- */
/* Row mapping                                                                */
/* -------------------------------------------------------------------------- */

type Row = {
  id: string; caption: string; media_url: string | null;
  scheduled_at: string; timezone: string | null;
  platform_ids: string[]; platform_overrides: Record<string, { caption?: string; hashtags?: string[] }>;
  hashtags: string[] | null; first_comment: string | null; series_id: string | null;
  created_at: string; status: SendStatus | null; send_progress: number | null;
  error: string | null; sent_at: string | null;
  approval_status: ApprovalStatus | null; approved_by: string | null;
  approved_at: string | null; rejection_reason: string | null;
  recycle_rule_id: string | null; category_id: string | null;
  campaign_id: string | null;
};

const EXTRA_KEYS = {
  coverFrameSec: "__coverFrameSec",
  nativeFeatures: "__nativeFeatures",
  nativeFeatureData: "__nativeFeatureData",
} as const;

const rowToPost = (r: Row): ScheduledPost => {
  const overrides = r.platform_overrides ?? {};
  // Extract extra fields encoded in platform_overrides
  let coverFrameSec: number | undefined;
  let nativeFeatures: Record<string, boolean> | undefined;
  let nativeFeatureData: Record<string, any> | undefined;
  try {
    const rawCover = (overrides as any)[EXTRA_KEYS.coverFrameSec]?.caption;
    if (rawCover !== undefined) coverFrameSec = Number(rawCover);
    const rawNative = (overrides as any)[EXTRA_KEYS.nativeFeatures]?.caption;
    if (rawNative) nativeFeatures = JSON.parse(rawNative);
    const rawData = (overrides as any)[EXTRA_KEYS.nativeFeatureData]?.caption;
    if (rawData) nativeFeatureData = JSON.parse(rawData);
  } catch {}
  // Strip extra keys from platformOverrides for clean return
  const cleanOverrides = { ...overrides };
  delete (cleanOverrides as any)[EXTRA_KEYS.coverFrameSec];
  delete (cleanOverrides as any)[EXTRA_KEYS.nativeFeatures];
  delete (cleanOverrides as any)[EXTRA_KEYS.nativeFeatureData];
  const hasClean = Object.keys(cleanOverrides).length > 0;

  return {
    id: r.id,
    caption: r.caption,
    mediaUrl: r.media_url ?? undefined,
    scheduledAt: r.scheduled_at,
    timezone: r.timezone ?? undefined,
    platformIds: r.platform_ids ?? [],
    platformOverrides: hasClean ? cleanOverrides : undefined,
    hashtags: r.hashtags ?? undefined,
    firstComment: r.first_comment ?? undefined,
    seriesId: r.series_id ?? undefined,
    createdAt: r.created_at,
    status: r.status ?? undefined,
    sendProgress: r.send_progress ?? undefined,
    error: r.error ?? undefined,
    sentAt: r.sent_at ?? undefined,
    approvalStatus: r.approval_status ?? undefined,
    approvedBy: r.approved_by ?? undefined,
    approvedAt: r.approved_at ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    recycleRuleId: r.recycle_rule_id ?? undefined,
    categoryId: r.category_id ?? undefined,
    campaignId: r.campaign_id ?? undefined,
    coverFrameSec,
    nativeFeatures,
    nativeFeatureData,
  };
};

function postToRow(p: Partial<ScheduledPost>): ScheduledPostUpdate {
  const row: ScheduledPostUpdate = {};
  if (p.caption !== undefined) row.caption = p.caption;
  if (p.mediaUrl !== undefined) row.media_url = p.mediaUrl ?? null;
  if (p.scheduledAt !== undefined) row.scheduled_at = p.scheduledAt;
  if (p.timezone !== undefined) row.timezone = p.timezone ?? null;
  if (p.platformIds !== undefined) row.platform_ids = p.platformIds;
  if (p.platformOverrides !== undefined) row.platform_overrides = p.platformOverrides ?? {};
  if (p.hashtags !== undefined) row.hashtags = p.hashtags ?? null;
  if (p.firstComment !== undefined) row.first_comment = p.firstComment ?? null;
  if (p.seriesId !== undefined) row.series_id = p.seriesId ?? null;
  if (p.status !== undefined) row.status = p.status;
  if (p.sendProgress !== undefined) row.send_progress = p.sendProgress ?? null;
  if (p.error !== undefined) row.error = p.error ?? null;
  if (p.sentAt !== undefined) row.sent_at = p.sentAt ?? null;
  if (p.approvalStatus !== undefined) row.approval_status = p.approvalStatus ?? null;
  if (p.approvedBy !== undefined) row.approved_by = p.approvedBy ?? null;
  if (p.approvedAt !== undefined) row.approved_at = p.approvedAt ?? null;
  if (p.rejectionReason !== undefined) row.rejection_reason = p.rejectionReason ?? null;
  if (p.recycleRuleId !== undefined) row.recycle_rule_id = p.recycleRuleId ?? null;
  if (p.categoryId !== undefined) row.category_id = p.categoryId ?? null;
  if (p.campaignId !== undefined) row.campaign_id = p.campaignId ?? null;
  // Native extras (coverFrameSec, nativeFeatures, nativeFeatureData) are kept in-memory only for now
  // and via decoded platform_overrides (EXTRA_KEYS) for hydration — no extra remote write needed
  return row;
}

/* -------------------------------------------------------------------------- */
/* Remote sync                                                                 */
/* -------------------------------------------------------------------------- */

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let hydrationPromise: Promise<void> | null = null;

async function hydrateRemote(userId: string) {
  const { data } = await supabase
    .from("scheduled_posts")
    .select("*")
    .order("scheduled_at", { ascending: true });
  setCache(((data as Row[] | null) ?? []).map(rowToPost));
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`scheduled_posts:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "scheduled_posts", filter: `user_id=eq.${userId}` },
      async () => {
        const { data: fresh } = await supabase
          .from("scheduled_posts")
          .select("*")
          .order("scheduled_at", { ascending: true });
        setCache(((fresh as Row[] | null) ?? []).map(rowToPost));
      }
    )
    .subscribe();
}

async function ensureAuthMode() {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) {
      mode = "remote";
      remoteUserId = uid;
      await hydrateRemote(uid);
    } else {
      mode = "local";
      remoteUserId = null;
      setCache(readLocal());
    }
  })();
  return hydrationPromise;
}

// React to auth changes for the lifetime of the app
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid && uid !== remoteUserId) {
      mode = "remote";
      remoteUserId = uid;
      hydrationPromise = null;
      void hydrateRemote(uid);
    } else if (!uid && mode !== "local") {
      mode = "local";
      remoteUserId = null;
      if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
      hydrationPromise = null;
      setCache(readLocal());
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Conflict detection (unchanged)                                             */
/* -------------------------------------------------------------------------- */

export interface ScheduleConflict {
  kind: "overlap" | "duplicate";
  post: ScheduledPost;
  platformIds: string[];
  minutesApart: number;
}

export function findConflicts(
  posts: ScheduledPost[],
  candidate: { scheduledAt: string; platformIds: string[]; caption?: string; ignoreId?: string },
  windowMinutes = 10,
): ScheduleConflict[] {
  const when = new Date(candidate.scheduledAt).getTime();
  if (isNaN(when)) return [];
  const conflicts: ScheduleConflict[] = [];
  for (const p of posts) {
    if (p.id === candidate.ignoreId) continue;
    if (p.status === "completed" || p.status === "failed") continue;
    const overlap = p.platformIds.filter((id) => candidate.platformIds.includes(id));
    if (overlap.length === 0) continue;
    const diffMs = Math.abs(new Date(p.scheduledAt).getTime() - when);
    const diffMin = Math.round(diffMs / 60000);
    if (
      candidate.caption &&
      p.caption.trim() === candidate.caption.trim() &&
      diffMs < 24 * 60 * 60 * 1000
    ) {
      conflicts.push({ kind: "duplicate", post: p, platformIds: overlap, minutesApart: diffMin });
      continue;
    }
    if (diffMs <= windowMinutes * 60_000) {
      conflicts.push({ kind: "overlap", post: p, platformIds: overlap, minutesApart: diffMin });
    }
  }
  return conflicts;
}

function advance(date: Date, freq: Recurrence["freq"], step: number) {
  const d = new Date(date);
  if (freq === "daily") d.setDate(d.getDate() + step);
  else if (freq === "weekly") d.setDate(d.getDate() + step * 7);
  else d.setMonth(d.getMonth() + step);
  return d;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function readPosts() { return cache; }
export function writePosts(next: ScheduledPost[]) {
  // Preserved for compatibility with older imports. Only useful in local mode.
  if (mode === "local") writeLocal(next);
  else setCache(next); // optimistic; caller should prefer add/update/remove
}

export function useScheduledPosts() {
  const posts = useSyncExternalStore(subscribe, () => cache, () => cache);

  useEffect(() => { void ensureAuthMode(); }, []);

  const add = useCallback((
    post: Omit<ScheduledPost, "id" | "createdAt" | "seriesId">,
    opts?: { recurrence?: Recurrence; scheduledAts?: string[] },
  ) => {
    const now = new Date().toISOString();
    const seriesId =
      (opts?.recurrence && opts.recurrence.count > 1) ||
      (opts?.scheduledAts && opts.scheduledAts.length > 1)
        ? crypto.randomUUID()
        : undefined;
    const items: ScheduledPost[] = [];

    const slots = opts?.scheduledAts && opts.scheduledAts.length > 0
      ? opts.scheduledAts
      : [post.scheduledAt];

    for (const slot of slots) {
      const base = new Date(slot);
      const count = Math.max(1, opts?.recurrence?.count ?? 1);
      for (let i = 0; i < count; i++) {
        const when = opts?.recurrence
          ? advance(base, opts.recurrence.freq, i).toISOString()
          : base.toISOString();
        items.push({
          ...post,
          id: crypto.randomUUID(),
          createdAt: now,
          scheduledAt: when,
          seriesId: slots.length > 1 || count > 1 ? seriesId : undefined,
          status: post.status ?? "queued",
        });
      }
    }

    if (mode === "remote" && remoteUserId) {
      // Optimistic
      setCache([...items, ...cache]);
      const rows: ScheduledPostInsert[] = items.map((it) => ({
        ...postToRow(it),
        id: it.id,
        user_id: remoteUserId!,
        created_at: it.createdAt,
        scheduled_at: it.scheduledAt,
        caption: it.caption,
      }));
      void supabase.from("scheduled_posts").insert(rows).then(({ error }) => {
        if (error) {
          // Rollback on failure
          const ids = new Set(items.map((i) => i.id));
          setCache(cache.filter((p) => !ids.has(p.id)));
        }
      });
    } else {
      writeLocal([...items, ...cache]);
    }

    // Fix 3.2 — surface the schedule so users never wonder "did that go in?"
    try {
      const first = items[0];
      const when = new Date(first.scheduledAt).toLocaleString();
      const platformCount = post.platformIds?.length ?? 0;
      window.dispatchEvent(
        new CustomEvent("smmpilot:publish:scheduled", {
          detail: {
            postId: first.id,
            platformCount,
            recurrence: opts?.recurrence?.count ?? 1,
            scheduledAt: first.scheduledAt,
            when,
          },
        }),
      );
    } catch { /* telemetry must never block a schedule */ }

    return items[0];
  }, []);

  const remove = useCallback((id: string) => {
    if (mode === "remote") {
      setCache(cache.filter((p) => p.id !== id));
      void supabase.from("scheduled_posts").delete().eq("id", id);
    } else {
      writeLocal(cache.filter((p) => p.id !== id));
    }
  }, []);

  const removeSeries = useCallback((seriesId: string) => {
    if (mode === "remote") {
      setCache(cache.filter((p) => p.seriesId !== seriesId));
      void supabase.from("scheduled_posts").delete().eq("series_id", seriesId);
    } else {
      writeLocal(cache.filter((p) => p.seriesId !== seriesId));
    }
  }, []);

  const update = useCallback((id: string, patch: Partial<ScheduledPost>) => {
    const next = cache.map((p) => (p.id === id ? { ...p, ...patch } : p));
    if (mode === "remote") {
      setCache(next);
      const row = postToRow(patch);
      if (Object.keys(row).length) void supabase.from("scheduled_posts").update(row).eq("id", id);
    } else {
      writeLocal(next);
    }
  }, []);

  const pauseAll = useCallback(() => {
    const next = cache.map((p) =>
      p.status === "queued" ? { ...p, status: "paused" as SendStatus } : p,
    );
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("scheduled_posts")
        .update({ status: "paused" })
        .eq("user_id", remoteUserId)
        .eq("status", "queued");
    } else {
      writeLocal(next);
    }
  }, []);

  const resumeAll = useCallback(() => {
    const next = cache.map((p) =>
      p.status === "paused" ? { ...p, status: "queued" as SendStatus } : p,
    );
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("scheduled_posts")
        .update({ status: "queued" })
        .eq("user_id", remoteUserId)
        .eq("status", "paused");
    } else {
      writeLocal(next);
    }
  }, []);

  return { posts, add, remove, removeSeries, update, pauseAll, resumeAll };
}
