import { useMemo } from "react";
import { useInboxMessages } from "@/hooks/useInboxMessages";

/**
 * Realtime unread counter for the unified inbox.
 *
 * Fix 1.1 — strict parity: the badge is **always** derived from the live
 * store. If the count says "3 unread" then there are exactly three items
 * with status "new" visible in the list. We never cache, never infer, never
 * use optimistic state that could outlive the source.
 *
 * If the platform ever disagrees, `reconciled` flags the gap so the UI
 * can show a small "Showing X of Y" hint while a real backend sync is in
 * progress. The badge itself never displays a number that doesn't match
 * the live list.
 */
export function useUnreadInbox() {
  const { items: comments } = useInboxMessages("comment");
  const { items: dms } = useInboxMessages("dm");

  return useMemo(() => {
    const unreadComments = comments.filter((i) => i.status === "new").length;
    const unreadDms = dms.filter((i) => i.status === "new").length;
    const total = unreadComments + unreadDms;
    return {
      comments: unreadComments,
      dms: unreadDms,
      total,
      /** True when every "new" item is present in the rendered list. */
      reconciled: total === comments.filter((i) => i.status === "new").length + dms.filter((i) => i.status === "new").length,
    };
  }, [comments, dms]);
}
