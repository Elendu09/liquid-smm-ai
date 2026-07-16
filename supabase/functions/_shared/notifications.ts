// Shared notification emission helper for edge functions.
// Reads notification_rules for dedupe by group_key and inserts into notifications.
// Usage:
//   import { emitNotification } from "../_shared/notifications.ts";
//   await emitNotification(admin, { userId, type, severity, title, message, groupKey, ... });

// deno-lint-ignore-file no-explicit-any
export interface EmitParams {
  userId: string;
  type: "engagement" | "system" | "milestone" | "alert" | "reminder";
  severity?: "info" | "success" | "warning" | "critical";
  title: string;
  message: string;
  groupKey?: string;
  platformId?: string;
  postId?: string;
  accountId?: string;
  actionUrl?: string;
  metric?: Record<string, unknown>;
  dedupeWindowHours?: number; // default 24
}

export async function emitNotification(admin: any, p: EmitParams) {
  const dedupeHours = p.dedupeWindowHours ?? 24;

  if (p.groupKey) {
    const cutoff = new Date(Date.now() - dedupeHours * 3600_000).toISOString();
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", p.userId)
      .eq("group_key", p.groupKey)
      .gte("created_at", cutoff)
      .limit(1);
    if (existing && existing.length > 0) {
      return { skipped: true, reason: "deduped" };
    }
  }

  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: p.userId,
      type: p.type,
      severity: p.severity ?? "info",
      title: p.title,
      message: p.message,
      group_key: p.groupKey ?? null,
      platform_id: p.platformId ?? null,
      post_id: p.postId ?? null,
      account_id: p.accountId ?? null,
      action_url: p.actionUrl ?? null,
      metric: p.metric ?? null,
    })
    .select("id")
    .single();

  if (error) return { skipped: true, reason: error.message };
  return { skipped: false, id: data?.id };
}
