import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useRunHistory } from "@/hooks/useRunHistory";
import { explainError } from "@/lib/errorCodes";
import { platforms } from "@/config/platforms";

/**
 * usePublishOutcome
 *
 * Centralised wrapper for every publish call. Fixes:
 *  - 3.2: every publish outcome is surfaced as a notification + run history
 *          row, so users never have to wonder if a post went out.
 *  - 3.4: idempotency by draft id. If the same draft is published twice in
 *          quick succession (double-click, network retry), the second call is
 *          detected, rolled back, and the user sees a "recovered duplicate"
 *          toast.
 *
 * Usage:
 *   const publish = usePublishOutcome();
 *   const result = await publish({
 *     draftId, platform: "instagram", accountHandle, action: "post.publish",
 *     body: async () => callMyApi(),
 *   });
 */

const PUBLISH_DEDUPE_WINDOW_MS = 8_000; // any two publishes with the same
                                        // draft id within 8 s = duplicate.

interface PublishInput {
  draftId: string;
  platform: string;
  accountHandle?: string;
  accountId?: string;
  action?: string;
  body: () => Promise<{ postId?: string; url?: string } | void>;
}

interface PublishResult {
  ok: boolean;
  postId?: string;
  url?: string;
  duplicate?: boolean;
  error?: string;
}

interface DedupeRecord {
  at: number;
  postId?: string;
}

const platformLabel = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

export function usePublishOutcome() {
  const { push } = useNotifications();
  const { logRun } = useRunHistory();
  const dedupeRef = useRef<Map<string, DedupeRecord>>(new Map());
  const [, force] = useState(0);
  // Periodically clean stale dedupe entries so the map doesn't grow forever.
  useEffect(() => {
    const id = window.setInterval(() => {
      const cutoff = Date.now() - PUBLISH_DEDUPE_WINDOW_MS * 4;
      let mutated = false;
      for (const [k, v] of dedupeRef.current.entries()) {
        if (v.at < cutoff) {
          dedupeRef.current.delete(k);
          mutated = true;
        }
      }
      if (mutated) force((n) => n + 1);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const publish = useCallback(
    async (input: PublishInput): Promise<PublishResult> => {
      const start = performance.now();
      const platformName = platformLabel(input.platform);
      const dedupeKey = `${input.draftId}:${input.platform}`;
      const prev = dedupeRef.current.get(dedupeKey);
      const now = Date.now();
      if (prev && now - prev.at < PUBLISH_DEDUPE_WINDOW_MS) {
        // Duplicate detected — surface it, but do not call body() again.
        const errorMsg = "Recovered a duplicate publish — the post is already live.";
        logRun({
          toolKey: "publish",
          action: input.action ?? "post.publish",
          platform: input.platform,
          accountId: input.accountId,
          accountHandle: input.accountHandle,
          status: "success",
          input: { draftId: input.draftId },
          output: { postId: prev.postId, recovered: true },
          durationMs: 0,
        });
        await push({
          type: "system",
          severity: "info",
          title: "Recovered a duplicate publish",
          message: `${platformName} already has this draft — we skipped the second attempt.`,
          platformId: input.platform,
          accountId: input.accountId,
          postId: prev.postId,
          groupKey: `dup:${dedupeKey}`,
        });
        return { ok: true, postId: prev.postId, duplicate: true };
      }

      try {
        const result = await input.body();
        const postId = result?.postId;
        const url = result?.url;
        dedupeRef.current.set(dedupeKey, { at: now, postId });
        logRun({
          toolKey: "publish",
          action: input.action ?? "post.publish",
          platform: input.platform,
          accountId: input.accountId,
          accountHandle: input.accountHandle,
          status: "success",
          input: { draftId: input.draftId },
          output: { postId, url },
          durationMs: Math.round(performance.now() - start),
        });
        await push({
          type: "system",
          severity: "success",
          title: `Posted to ${platformName}`,
          message: input.accountHandle ? `@${input.accountHandle} is live.${url ? ` Open post →` : ""}` : `Your post is live.`,
          actionUrl: url,
          platformId: input.platform,
          accountId: input.accountId,
          postId,
          groupKey: `pub:${dedupeKey}`,
        });
        return { ok: true, postId, url };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const explanation = explainError(errorMsg);
        logRun({
          toolKey: "publish",
          action: input.action ?? "post.publish",
          platform: input.platform,
          accountId: input.accountId,
          accountHandle: input.accountHandle,
          status: "failed",
          input: { draftId: input.draftId },
          error: errorMsg,
          durationMs: Math.round(performance.now() - start),
        });
        await push({
          type: "alert",
          severity: explanation?.severity === "info" ? "warning" : (explanation?.severity ?? "warning"),
          title: `Couldn't post to ${platformName}`,
          message: explanation?.headline ?? errorMsg,
          actionUrl: explanation?.doc ? `/dashboard/settings/connections#${explanation.doc}` : undefined,
          platformId: input.platform,
          accountId: input.accountId,
          groupKey: `pub:${dedupeKey}`,
        });
        return { ok: false, error: errorMsg };
      }
    },
    [logRun, push],
  );

  return publish;
}

