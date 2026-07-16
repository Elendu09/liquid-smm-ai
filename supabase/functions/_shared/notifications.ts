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

function inQuietHours(quiet: any): boolean {
  if (!quiet || quiet.enabled === false) return false;
  const start = Number(quiet.startHour ?? 22); // 22:00
  const end = Number(quiet.endHour ?? 7); // 07:00
  const tz = String(quiet.timezone ?? "UTC");
  let hour: number;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz });
    hour = Number(fmt.format(new Date()));
  } catch {
    hour = new Date().getUTCHours();
  }
  // e.g. 22 -> 7 wraps midnight
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

export async function emitNotification(admin: any, p: EmitParams) {
  const dedupeHours = p.dedupeWindowHours ?? 24;
  const severity = p.severity ?? "info";

  // --- Respect user preferences (critical always passes) ---
  if (severity !== "critical") {
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("channels, quiet_hours, muted_platforms, muted_accounts")
      .eq("user_id", p.userId)
      .maybeSingle();

    if (prefs) {
      // Per-type disable via channels[type].inapp === false
      const typeChannels = prefs.channels?.[p.type];
      if (typeChannels && typeChannels.inapp === false) {
        return { skipped: true, reason: "type_disabled" };
      }
      // Muted platform / account
      if (p.platformId && Array.isArray(prefs.muted_platforms) && prefs.muted_platforms.includes(p.platformId)) {
        return { skipped: true, reason: "platform_muted" };
      }
      if (p.accountId && Array.isArray(prefs.muted_accounts) && prefs.muted_accounts.includes(p.accountId)) {
        return { skipped: true, reason: "account_muted" };
      }
      if (inQuietHours(prefs.quiet_hours)) {
        return { skipped: true, reason: "quiet_hours" };
      }
    }
  }

  // --- Dedupe by group_key ---
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
      severity,
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

