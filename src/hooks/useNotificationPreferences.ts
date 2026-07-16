import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChannelMap = Partial<
  Record<
    "engagement" | "milestone" | "alert" | "reminder" | "system",
    { inapp?: boolean; toast?: boolean; email?: boolean; push?: boolean }
  >
>;

export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number;
  timezone?: string;
}

export interface NotificationPreferences {
  channels: ChannelMap;
  quietHours: QuietHours;
  digestMode: "off" | "daily" | "weekly";
  mutedPlatforms: string[];
  mutedAccounts: string[];
}

export interface NotificationRule {
  ruleKey: string;
  type: string;
  params: Record<string, unknown>;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  channels: {
    engagement: { inapp: true, toast: true, email: false, push: false },
    milestone: { inapp: true, toast: true, email: false, push: false },
    alert: { inapp: true, toast: true, email: true, push: false },
    reminder: { inapp: true, toast: false, email: false, push: false },
    system: { inapp: true, toast: false, email: false, push: false },
  },
  quietHours: { enabled: false, startHour: 22, endHour: 7, timezone: "UTC" },
  digestMode: "off",
  mutedPlatforms: [],
  mutedAccounts: [],
};

export const DEFAULT_RULES: NotificationRule[] = [
  { ruleKey: "engagement.viral", type: "engagement", enabled: true, params: { multiplier: 5, windowHours: 24 } },
  { ruleKey: "engagement.high", type: "engagement", enabled: true, params: { commentsThreshold: 100 } },
  { ruleKey: "health.followerDrop", type: "alert", enabled: true, params: { pct: 5 } },
  { ruleKey: "health.tokenExpiry", type: "alert", enabled: true, params: { warnHours: 48 } },
  { ruleKey: "health.quota", type: "alert", enabled: true, params: { pct: 85 } },
  { ruleKey: "health.syncGap", type: "alert", enabled: true, params: { hours: 24 } },
  { ruleKey: "reminder.draftAging", type: "reminder", enabled: true, params: { days: 7 } },
];

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("notification_preferences").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("notification_rules").select("*").eq("user_id", uid),
      ]);
      if (cancelled) return;
      if (p) {
        setPrefs({
          channels: (p.channels as unknown as ChannelMap) ?? DEFAULT_PREFS.channels,
          quietHours: (p.quiet_hours as unknown as QuietHours) ?? DEFAULT_PREFS.quietHours,
          digestMode: (p.digest_mode as NotificationPreferences["digestMode"]) ?? "off",
          mutedPlatforms: p.muted_platforms ?? [],
          mutedAccounts: p.muted_accounts ?? [],
        });
      }
      if (r && r.length) {
        const byKey = new Map(r.map((row) => [row.rule_key, row]));
        setRules(
          DEFAULT_RULES.map((d) => {
            const row = byKey.get(d.ruleKey);
            return row
              ? { ruleKey: row.rule_key, type: row.type, params: (row.params as Record<string, unknown>) ?? d.params, enabled: row.enabled }
              : d;
          }),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePreferences = useCallback(
    async (next: NotificationPreferences) => {
      setPrefs(next);
      if (!userId) return;
      await supabase.from("notification_preferences").upsert(
        {
          user_id: userId,
          channels: next.channels as never,
          quiet_hours: next.quietHours as never,
          digest_mode: next.digestMode,
          muted_platforms: next.mutedPlatforms,
          muted_accounts: next.mutedAccounts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    },
    [userId],
  );

  const saveRule = useCallback(
    async (rule: NotificationRule) => {
      setRules((prev) => prev.map((r) => (r.ruleKey === rule.ruleKey ? rule : r)));
      if (!userId) return;
      await supabase.from("notification_rules").upsert(
        {
          user_id: userId,
          rule_key: rule.ruleKey,
          type: rule.type,
          params: rule.params,
          enabled: rule.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,rule_key" },
      );
    },
    [userId],
  );

  return { prefs, rules, loading, savePreferences, saveRule };
}
