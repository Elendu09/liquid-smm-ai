import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, X, ShieldCheck, FileText, CalendarClock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMcpInbox, type McpInboxItem } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";

const KIND_META = {
  "caption-draft": { icon: FileText, label: "Caption draft", tool: "create_caption_draft" },
  "scheduled-post": { icon: CalendarClock, label: "Scheduled post", tool: "queue_cross_platform_post" },
} as const;

function summarize(item: McpInboxItem): string {
  const p = item.payload as Record<string, unknown>;
  if (item.kind === "caption-draft") return String(p.title ?? p.body ?? "Untitled caption");
  if (item.kind === "scheduled-post") {
    const platforms = Array.isArray(p.platformIds) ? (p.platformIds as string[]).join(", ") : "";
    const when = typeof p.scheduledAt === "string" ? new Date(p.scheduledAt).toLocaleString() : "";
    return `${platforms}${when ? ` · ${when}` : ""}`;
  }
  return item.source;
}

export function ApprovalPanel() {
  const { pending, approve, reject, enqueue } = useMcpInbox();

  const onApprove = (it: McpInboxItem) => {
    approve(it.id);
    logMcpCall({
      tool: KIND_META[it.kind].tool,
      status: "success",
      summary: `Approved ${KIND_META[it.kind].label.toLowerCase()}: ${summarize(it)}`,
      resources: [{ kind: it.kind === "caption-draft" ? "caption" : "scheduled-post", id: it.id, label: summarize(it) }],
      payload: it.payload,
    });
    toast.success("Approved — will apply on next open");
  };

  const onReject = (it: McpInboxItem) => {
    reject(it.id);
    logMcpCall({
      tool: KIND_META[it.kind].tool,
      status: "error",
      summary: `Rejected ${KIND_META[it.kind].label.toLowerCase()}: ${summarize(it)}`,
      resources: [],
      payload: it.payload,
    });
    toast.success("Rejected");
  };

  const simulateCaption = () => {
    enqueue({
      kind: "caption-draft",
      source: "mcp:create_caption_draft",
      needsApproval: true,
      payload: {
        title: "Sample MCP caption",
        body: "This caption was proposed by an AI assistant and is waiting for your approval.",
        hashtags: ["ai", "smm"],
        platformIds: ["instagram"],
      },
    });
    toast.success("Sample pending caption added");
  };

  const simulatePost = () => {
    enqueue({
      kind: "scheduled-post",
      source: "mcp:queue_cross_platform_post",
      needsApproval: true,
      payload: {
        caption: "AI-proposed cross-platform post awaiting approval.",
        platformIds: ["instagram", "twitter"],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hashtags: ["ai"],
      },
    });
    toast.success("Sample pending post added");
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Pending approvals</h3>
            <p className="text-[11px] text-muted-foreground">
              Items proposed by MCP tools marked <code className="text-[10px]">needsApproval</code>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={simulateCaption} aria-label="Simulate pending caption">
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Sample caption
          </Button>
          <Button size="sm" variant="outline" onClick={simulatePost} aria-label="Simulate pending post">
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Sample post
          </Button>
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Nothing waiting. Approved items are applied to the app on the matching page's next open.
        </p>
      ) : (
        <ul className="space-y-2">
          {pending.map((it) => {
            const meta = KIND_META[it.kind];
            const Icon = meta.icon;
            return (
              <li
                key={it.id}
                className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {meta.label}
                    </Badge>
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40">
                      pending
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2 break-words">{summarize(it)}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => onApprove(it)}
                    aria-label={`Approve ${meta.label}`}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => onReject(it)}
                    aria-label={`Reject ${meta.label}`}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
