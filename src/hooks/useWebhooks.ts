import { useCallback, useSyncExternalStore } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export type WebhookEvent =
  | "post.scheduled"
  | "post.published"
  | "post.failed"
  | "post.approved"
  | "engagement.viral"
  | "engagement.high"
  | "health.alert"
  | "milestone.followers"
  | "mention.received";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  provider: "zapier" | "make" | "n8n" | "custom";
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
  createdAt: string;
  lastFiredAt?: string;
  lastStatus?: "success" | "failed";
  failures: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: "success" | "failed";
  statusCode?: number;
  at: string;
  duration: number; // ms
  error?: string;
}

// ---- Local-only delivery log (per-device history) ----
const LOG_KEY = "smmpilot:webhook-deliveries";
function readLog(): WebhookDelivery[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}
let logCache = typeof window !== "undefined" ? readLog() : [];
const logListeners = new Set<() => void>();
function emitLog() { logCache = readLog(); logListeners.forEach((l) => l()); }
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === LOG_KEY) emitLog(); });
}
function writeLog(next: WebhookDelivery[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(next.slice(0, 200)));
  emitLog();
}

// ---- Remote-backed hooks collection ----
type Row = {
  id: string; label: string | null; url: string; provider: Webhook["provider"];
  secret: string | null; event_types: string[]; active: boolean;
  last_fired_at: string | null; last_status_label: Webhook["lastStatus"] | null;
  failure_count: number; created_at: string;
};

const store = createRemoteCollection<Webhook, Row>({
  table: "notification_webhooks",
  localKey: "smmpilot:webhooks",
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id, name: r.label ?? "Webhook", url: r.url, provider: r.provider ?? "custom",
    events: (r.event_types ?? []) as WebhookEvent[], active: r.active,
    secret: r.secret ?? undefined,
    createdAt: r.created_at,
    lastFiredAt: r.last_fired_at ?? undefined,
    lastStatus: r.last_status_label ?? undefined,
    failures: r.failure_count ?? 0,
  }),
  toInsertRow: (h, userId) => ({
    id: h.id, user_id: userId, label: h.name, url: h.url, provider: h.provider,
    secret: h.secret ?? null, event_types: h.events, active: h.active,
    last_fired_at: h.lastFiredAt ?? null, last_status_label: h.lastStatus ?? null,
    failure_count: h.failures ?? 0, created_at: h.createdAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.label = p.name;
    if (p.url !== undefined) r.url = p.url;
    if (p.provider !== undefined) r.provider = p.provider;
    if (p.secret !== undefined) r.secret = p.secret ?? null;
    if (p.events !== undefined) r.event_types = p.events;
    if (p.active !== undefined) r.active = p.active;
    if (p.lastFiredAt !== undefined) r.last_fired_at = p.lastFiredAt ?? null;
    if (p.lastStatus !== undefined) r.last_status_label = p.lastStatus ?? null;
    if (p.failures !== undefined) r.failure_count = p.failures;
    return r;
  },
});

export const WEBHOOK_EVENTS: { id: WebhookEvent; label: string; description: string }[] = [
  { id: "post.scheduled",       label: "Post scheduled",     description: "A new post has been added to the queue." },
  { id: "post.published",       label: "Post published",     description: "A post successfully went live." },
  { id: "post.failed",          label: "Post failed",        description: "A scheduled post could not publish." },
  { id: "post.approved",        label: "Post approved",      description: "An approver signed off on a post." },
  { id: "engagement.viral",     label: "Post went viral",    description: "Engagement crossed the viral threshold." },
  { id: "engagement.high",      label: "High engagement",    description: "A post is trending above baseline." },
  { id: "health.alert",         label: "Account health alert", description: "Token expiry, rate limit, or connection issue." },
  { id: "milestone.followers",  label: "Follower milestone", description: "You hit a follower milestone." },
  { id: "mention.received",     label: "Mention received",   description: "Your brand was mentioned." },
];

export function useWebhooks() {
  const hooks = store.useItems();
  const log = useSyncExternalStore(
    (cb) => (logListeners.add(cb), () => logListeners.delete(cb)),
    () => logCache,
    () => logCache,
  );

  const add = useCallback((h: Omit<Webhook, "id" | "createdAt" | "failures">) => {
    const item: Webhook = {
      ...h,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      failures: 0,
    };
    void store.add(item);
    return item;
  }, []);

  const update = useCallback((id: string, patch: Partial<Webhook>) => {
    void store.update(id, patch);
  }, []);

  const remove = useCallback((id: string) => {
    void store.remove(id);
    writeLog(readLog().filter((d) => d.webhookId !== id));
  }, []);

  const test = useCallback(async (id: string, event: WebhookEvent = "post.published") => {
    const hook = store.read().find((h) => h.id === id);
    if (!hook) return { ok: false, error: "Not found" };
    const started = performance.now();
    const payload = {
      event,
      test: true,
      firedAt: new Date().toISOString(),
      workspace: "smmpilot",
      sample: {
        postId: "demo-post-1",
        caption: "This is a test payload from your webhook.",
        platforms: ["instagram", "x"],
      },
    };
    let ok = false;
    let status: number | undefined;
    let error: string | undefined;
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          ...(hook.secret ? { "X-Webhook-Secret": hook.secret } : {}),
        },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });
      status = res.status || 0;
      ok = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Network error";
    }
    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId: id,
      event,
      status: ok ? "success" : "failed",
      statusCode: status,
      at: new Date().toISOString(),
      duration: Math.round(performance.now() - started),
      error,
    };
    writeLog([delivery, ...readLog()]);
    void store.update(id, {
      lastFiredAt: delivery.at,
      lastStatus: delivery.status,
      failures: ok ? 0 : (hook.failures ?? 0) + 1,
    });
    return { ok, delivery };
  }, []);

  return { hooks, log, add, update, remove, test };
}
