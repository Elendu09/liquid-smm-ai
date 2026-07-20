import { useCallback, useSyncExternalStore } from "react";

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

const HOOKS_KEY = "smmpilot:webhooks";
const LOG_KEY = "smmpilot:webhook-deliveries";

function readHooks(): Webhook[] {
  try { return JSON.parse(localStorage.getItem(HOOKS_KEY) || "[]"); } catch { return []; }
}
function readLog(): WebhookDelivery[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}

let hooksCache = typeof window !== "undefined" ? readHooks() : [];
let logCache = typeof window !== "undefined" ? readLog() : [];
const hooksListeners = new Set<() => void>();
const logListeners = new Set<() => void>();

function emitHooks() { hooksCache = readHooks(); hooksListeners.forEach((l) => l()); }
function emitLog()   { logCache   = readLog();   logListeners.forEach((l) => l()); }

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === HOOKS_KEY) emitHooks();
    if (e.key === LOG_KEY) emitLog();
  });
}

function writeHooks(next: Webhook[]) {
  localStorage.setItem(HOOKS_KEY, JSON.stringify(next));
  emitHooks();
}
function writeLog(next: WebhookDelivery[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(next.slice(0, 200)));
  emitLog();
}

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
  const hooks = useSyncExternalStore(
    (cb) => (hooksListeners.add(cb), () => hooksListeners.delete(cb)),
    () => hooksCache,
    () => hooksCache,
  );
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
    writeHooks([item, ...readHooks()]);
    return item;
  }, []);

  const update = useCallback((id: string, patch: Partial<Webhook>) => {
    writeHooks(readHooks().map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);

  const remove = useCallback((id: string) => {
    writeHooks(readHooks().filter((h) => h.id !== id));
    writeLog(readLog().filter((d) => d.webhookId !== id));
  }, []);

  const test = useCallback(async (id: string, event: WebhookEvent = "post.published") => {
    const hook = readHooks().find((h) => h.id === id);
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
        mode: "no-cors", // Zapier/Make catch-hooks are cross-origin; we don't need the response body
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
    update(id, {
      lastFiredAt: delivery.at,
      lastStatus: delivery.status,
      failures: ok ? 0 : (hook.failures ?? 0) + 1,
    });
    return { ok, delivery };
  }, [update]);

  return { hooks, log, add, update, remove, test };
}
