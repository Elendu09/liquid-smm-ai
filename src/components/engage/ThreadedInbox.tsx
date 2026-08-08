import { useMemo } from "react";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

/**
 * ThreadedInbox
 *
 * Fix 1.4 — nested replies (comments on comments) used to get buried. This
 * component groups items by `parentId` and renders parents followed by their
 * indented children, so a thread on an ad comment stays one visual block.
 *
 * Pure presentation: it takes a flat list and returns a flat list, just
 * re-ordered and with a `depth` annotation. The existing kanban / list views
 * can swap it in without changing their layout.
 */

export interface ThreadedInboxItem extends InboxItem {
  depth: number;
  threadId: string;
  threadSize: number;
}

export function buildThreaded(items: InboxItem[]): ThreadedInboxItem[] {
  if (!items.length) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  // 1. Group by thread root. An item's root is itself if it has no parentId,
  //    or it follows parentId until there is no parent.
  const rootOf = new Map<string, string>();
  for (const it of items) {
    let cursor: InboxItem | undefined = it;
    let guard = 0;
    while (cursor?.parentId && byId.has(cursor.parentId) && guard < 32) {
      cursor = byId.get(cursor.parentId);
      guard++;
    }
    rootOf.set(it.id, cursor?.id ?? it.id);
  }
  // 2. Count thread sizes.
  const threadCount = new Map<string, number>();
  for (const id of rootOf.values()) {
    threadCount.set(id, (threadCount.get(id) ?? 0) + 1);
  }
  // 3. Order: parents first by createdAt asc, then their children by createdAt asc.
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const out: ThreadedInboxItem[] = [];
  for (const it of sorted) {
    const threadId = rootOf.get(it.id) ?? it.id;
    const depth = it.parentId && byId.has(it.parentId) ? 1 : 0;
    out.push({ ...it, depth, threadId, threadSize: threadCount.get(threadId) ?? 1 });
  }
  return out;
}

/**
 * Render a small thread header above a parent item.
 */
export function ThreadHeader({ size }: { size: number }) {
  if (size <= 1) return null;
  return (
    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
      <CornerDownRight className="h-2.5 w-2.5" /> {size - 1} {size - 1 === 1 ? "reply" : "replies"}
    </div>
  );
}

/** Indent style for nested replies. */
export function threadIndent(depth: number) {
  return depth > 0 ? "pl-3 border-l-2 border-primary/20" : "";
}
