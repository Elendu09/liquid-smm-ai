import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useRunHistory } from "@/hooks/useRunHistory";
import { platforms } from "@/config/platforms";

/**
 * PublishEventsBridge
 *
 * A renderless component that listens for cross-cutting publish events and
 * surfaces them as notifications + run history rows. This is the glue that
 * ensures every state-changing publish action leaves a visible trail
 * (fix 3.2 — no silent failures).
 *
 * Mount it once, near the dashboard root.
 */
export function PublishEventsBridge() {
  const { push } = useNotifications();
  const { logRun } = useRunHistory();

  useEffect(() => {
    const onScheduled = (event: Event) => {
      const e = event as CustomEvent<{
        postId: string;
        platformCount: number;
        recurrence: number;
        scheduledAt: string;
        when: string;
      }>;
      const { platformCount, recurrence, when } = e.detail;
      const platformNames = platforms.slice(0, platformCount).map((p) => p.name).join(", ");
      logRun({
        toolKey: "publish",
        action: "post.schedule",
        status: "success",
        output: e.detail,
        durationMs: 0,
      });
      void push({
        type: "reminder",
        severity: "info",
        title: recurrence > 1 ? `${recurrence} posts scheduled` : "Post scheduled",
        message: `Going out ${when}${platformNames ? ` on ${platformNames}` : ""}.`,
        actionUrl: "/dashboard/publish/queue",
        postId: e.detail.postId,
        groupKey: `schedule:${e.detail.postId}`,
      });
    };
    window.addEventListener("smmpilot:publish:scheduled", onScheduled as EventListener);
    return () => window.removeEventListener("smmpilot:publish:scheduled", onScheduled as EventListener);
  }, [push, logRun]);

  return null;
}
