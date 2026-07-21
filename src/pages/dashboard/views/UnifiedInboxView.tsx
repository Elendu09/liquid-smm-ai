import { useMemo, useState } from "react";
import { MessageCircle, MessageSquare } from "lucide-react";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { InboxBoard } from "./InboxBoard";
import { cn } from "@/lib/utils";

/**
 * Unified inbox — a single surface that lets the user pivot between comments
 * and DMs without leaving the page. Delegates rendering to <InboxBoard/> so
 * the underlying kanban, list, reply, and empty-state behaviour stay in sync.
 */
export function UnifiedInboxView() {
  const [kind, setKind] = useState<"comment" | "dm">("comment");
  const { items: comments } = useInboxMessages("comment");
  const { items: dms } = useInboxMessages("dm");

  const counts = useMemo(
    () => ({
      comment: comments.filter((i) => i.status === "new").length,
      dm: dms.filter((i) => i.status === "new").length,
    }),
    [comments, dms],
  );

  const tabs: { id: "comment" | "dm"; label: string; icon: typeof MessageSquare }[] = [
    { id: "comment", label: "Comments", icon: MessageSquare },
    { id: "dm", label: "Direct Messages", icon: MessageCircle },
  ];

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="flex gap-1 border-b border-border/60">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = kind === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {counts[id] > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                    {counts[id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <InboxBoard
        key={kind}
        kind={kind}
        title={kind === "comment" ? "Comments" : "Direct Messages"}
        description={
          kind === "comment"
            ? "Every comment across your accounts in one board."
            : "All inbound DMs, sorted by conversation state."
        }
      />
    </div>
  );
}
