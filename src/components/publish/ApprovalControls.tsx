import { useState } from "react";
import { CheckCircle2, XCircle, Send, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useScheduledPosts, type ApprovalStatus, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_META: Record<ApprovalStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border/60" },
  pending: { label: "Pending approval", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function ApprovalBadge({ status }: { status?: ApprovalStatus }) {
  const meta = STATUS_META[status ?? "draft"];
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", meta.className)}>
      {meta.label}
    </Badge>
  );
}

/**
 * Approval workflow controls: draft → pending → approved / rejected.
 * Used inside EventDetailsDialog. Rejected posts keep their scheduled time
 * but are marked so the send simulator can skip them.
 */
export function ApprovalControls({ post }: { post: ScheduledPost }) {
  const { update } = useScheduledPosts();
  const status: ApprovalStatus = post.approvalStatus ?? "draft";
  const [reason, setReason] = useState(post.rejectionReason ?? "");

  const setStatus = (next: ApprovalStatus, extra: Partial<ScheduledPost> = {}) => {
    update(post.id, {
      approvalStatus: next,
      approvedAt: next === "approved" ? new Date().toISOString() : undefined,
      approvedBy: next === "approved" ? "you" : undefined,
      rejectionReason: next === "rejected" ? reason || "No reason provided" : undefined,
      ...extra,
    });
    const label = STATUS_META[next].label.toLowerCase();
    toast.success(`Marked as ${label}`);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Approval
          </span>
          <ApprovalBadge status={status} />
        </div>
        {post.approvedAt && status === "approved" && (
          <span className="text-[11px] text-muted-foreground">
            {new Date(post.approvedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {status === "rejected" && (
        <p className="text-[11px] text-destructive">
          Reason: {post.rejectionReason}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("pending")}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Request approval
          </Button>
        )}
        {status === "pending" && (
          <>
            <Button size="sm" onClick={() => setStatus("approved")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
            </Button>
            <div className="flex-1 min-w-40 flex items-center gap-1.5">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="h-8 text-xs"
              />
              <Button size="sm" variant="destructive" onClick={() => setStatus("rejected")}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
              </Button>
            </div>
          </>
        )}
        {status === "approved" && (
          <Button size="sm" variant="ghost" onClick={() => setStatus("draft")}>
            <Clock3 className="h-3.5 w-3.5 mr-1.5" /> Reset to draft
          </Button>
        )}
        {status === "rejected" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("pending")}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Resubmit
          </Button>
        )}
      </div>
    </div>
  );
}
