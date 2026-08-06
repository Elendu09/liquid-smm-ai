import { useMemo } from "react";
import { useInboxMessages } from "@/hooks/useInboxMessages";

/**
 * Realtime unread counter for the unified inbox.
 * Backed by the realtime-subscribed inbox store (comments + DMs), so the
 * badge updates live as new messages land or are handled.
 */
export function useUnreadInbox() {
  const { items: comments } = useInboxMessages("comment");
  const { items: dms } = useInboxMessages("dm");

  return useMemo(() => {
    const unreadComments = comments.filter((i) => i.status === "new").length;
    const unreadDms = dms.filter((i) => i.status === "new").length;
    return {
      comments: unreadComments,
      dms: unreadDms,
      total: unreadComments + unreadDms,
    };
  }, [comments, dms]);
}
