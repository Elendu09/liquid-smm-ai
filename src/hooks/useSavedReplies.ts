import { useCallback, useMemo } from "react";
import { useContentTemplates } from "@/hooks/useContentTemplates";

/**
 * Saved replies (canned responses) for the unified inbox. Stored in the
 * existing `content_templates` table under the `saved-reply` tool key so they
 * sync remotely for signed-in users and stay local for guests — no new schema.
 */
export const SAVED_REPLY_KEY = "saved-reply";

export interface SavedReply {
  id: string;
  name: string;
  body: string;
  tags: string[];
  usageCount: number;
}

export function useSavedReplies() {
  const { rows, upsert, remove, incrementUsage } = useContentTemplates(SAVED_REPLY_KEY);

  const replies = useMemo<SavedReply[]>(
    () =>
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        body: r.body,
        tags: r.tags,
        usageCount: r.usageCount,
      })),
    [rows],
  );

  const save = useCallback(
    (reply: { id?: string; name: string; body: string; tags?: string[] }) => {
      upsert({
        id: reply.id,
        platform: "all",
        toolKey: SAVED_REPLY_KEY,
        name: reply.name.trim() || "Untitled reply",
        body: reply.body.trim(),
        tags: reply.tags ?? [],
      });
    },
    [upsert],
  );

  /** Fills {{name}} / {{handle}} placeholders before the reply is sent. */
  const render = useCallback(
    (body: string, vars: { name?: string; handle?: string; platform?: string }) =>
      body
        .replace(/\{\{\s*name\s*\}\}/gi, vars.name ?? "there")
        .replace(/\{\{\s*handle\s*\}\}/gi, vars.handle ?? "")
        .replace(/\{\{\s*platform\s*\}\}/gi, vars.platform ?? ""),
    [],
  );

  return { replies, save, remove, incrementUsage, render };
}
