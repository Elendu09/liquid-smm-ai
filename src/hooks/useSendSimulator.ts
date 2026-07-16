import { useEffect } from "react";
import { readPosts, writePosts, type ScheduledPost } from "@/hooks/useScheduledPosts";

/**
 * Simulates a real-time publishing pipeline for scheduled posts.
 * - When scheduledAt has passed and status is "queued" (or unset), flips to "sending".
 * - Animates sendProgress 0 → 100 over ~4s.
 * - On complete, flips to "completed" (with a small random-failure rate).
 *
 * Mount ONCE at the layout level so it runs across the app.
 */
export function useSendSimulator() {
  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled) return;
      const posts = readPosts();
      const now = Date.now();
      let changed = false;
      const next: ScheduledPost[] = posts.map((p) => {
        const status = p.status ?? "queued";
        if (status === "completed" || status === "failed") return p;
        const due = new Date(p.scheduledAt).getTime();
        if (isNaN(due)) return p;

        // Kick off sending when due
        if (status === "queued" && due <= now) {
          changed = true;
          return { ...p, status: "sending", sendProgress: 5 };
        }
        if (status === "sending") {
          const progress = Math.min(100, (p.sendProgress ?? 0) + 20 + Math.random() * 15);
          if (progress >= 100) {
            changed = true;
            // 8% failure rate — realistic feedback
            const failed = Math.random() < 0.08;
            return failed
              ? {
                  ...p,
                  status: "failed",
                  sendProgress: 100,
                  error: "Platform rejected the request. Retry available.",
                  sentAt: new Date().toISOString(),
                }
              : {
                  ...p,
                  status: "completed",
                  sendProgress: 100,
                  sentAt: new Date().toISOString(),
                };
          }
          changed = true;
          return { ...p, sendProgress: progress };
        }
        return p;
      });
      if (changed) writePosts(next);
    }, 800);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
}
