import { Lock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLockRemaining } from "@/hooks/useInboxLock";

/**
 * InboxLockIndicator
 *
 * Fix 4.1 — the "collision problem". When a teammate is already typing a
 * reply to this conversation, we show a small lock + remaining time so the
 * second viewer knows to wait instead of duplicating work.
 */
export function InboxLockIndicator({
  lockedBy,
  lockedUntil,
  meId,
  onTakeOver,
}: {
  lockedBy: string | null | undefined;
  lockedUntil: string | null | undefined;
  meId: string | null;
  onTakeOver?: () => void;
}) {
  if (!lockedBy || !lockedUntil) return null;
  const mine = lockedBy === meId;
  const remaining = formatLockRemaining(lockedUntil);
  const expired = remaining === "expired";
  if (expired) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        mine
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
      title={mine ? "You are replying to this thread" : `${lockedBy} is replying`}
    >
      <Lock className="h-2.5 w-2.5" />
      <span className="truncate">
        {mine ? "You" : lockedBy} · {remaining}
      </span>
      {!mine && onTakeOver && (
        <button
          type="button"
          onClick={onTakeOver}
          className="ml-1 inline-flex items-center gap-0.5 rounded bg-background/40 px-1 py-0.5 text-[9px] underline-offset-2 hover:underline"
          aria-label="Take over this conversation"
        >
          <MoreHorizontal className="h-2.5 w-2.5" /> take over
        </button>
      )}
    </div>
  );
}
