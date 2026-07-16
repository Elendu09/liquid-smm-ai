import { supabase } from "@/integrations/supabase/client";
import type { NotificationSeverity, NotificationType } from "./useNotifications";

export interface EmitAppNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  groupKey?: string;
  platformId?: string;
  postId?: string;
  accountId?: string;
  actionUrl?: string;
  metric?: Record<string, unknown>;
  dedupeWindowHours?: number;
}

/**
 * Fire a notification for the current signed-in user.
 * Backed by the `notif-emit` edge function, which validates the JWT and
 * deduplicates by `groupKey`. Falls back silently in demo/anon sessions.
 *
 * Use for system-level events triggered by app code paths:
 *  - AI job finished (batch caption, bulk hashtag, report generation)
 *  - Integration connected / disconnected
 *  - Team member joined / permission change
 *  - Plan/billing update, credits low
 */
export async function emitAppNotification(input: EmitAppNotificationInput) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { skipped: true, reason: "anon" };
    const { data, error } = await supabase.functions.invoke("notif-emit", { body: input });
    if (error) {
      console.warn("emitAppNotification failed", error);
      return { skipped: true, reason: error.message };
    }
    return data ?? { skipped: false };
  } catch (e) {
    console.warn("emitAppNotification error", e);
    return { skipped: true, reason: (e as Error).message };
  }
}
