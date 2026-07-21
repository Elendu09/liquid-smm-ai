import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Trash2,
  Terminal,
  Info,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/shell";
import { useMcpActivity, type McpActivityEntry, type McpActivityStatus } from "@/hooks/useMcpActivity";
import { ApprovalPanel } from "@/components/dashboard/mcp/ApprovalPanel";
import { McpCallDetailsDrawer } from "@/components/activity/McpCallDetailsDrawer";
import { isGuestSession } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";

const STATUS_META: Record<McpActivityStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  success: { label: "Success", icon: CheckCircle2, className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  error: { label: "Error", icon: XCircle, className: "text-destructive bg-destructive/10 border-destructive/30" },
  pending: { label: "Pending", icon: Loader2, className: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "error", label: "Errors" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

export function McpActivityView() {
  const { entries, clear, remove, log } = useMcpActivity();
  const [filter, setFilter] = useState<FilterId>("all");
  const [detailsFor, setDetailsFor] = useState<McpActivityEntry | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.status === filter)),
    [entries, filter],
  );

  const rerun = (e: McpActivityEntry) => {
    log({
      tool: e.tool,
      status: "pending",
      summary: `Re-run of ${e.tool}`,
      resources: e.resources,
      payload: e.payload,
    });
    toast.success("Re-run queued");
  };

  const simulate = () => {
    log({
      tool: "whoami",
      status: "success",
      summary: "Simulated MCP call from ChatGPT",
      resources: [],
      payload: { note: "This is a test entry; real external MCP calls appear here once a backend queue is wired." },
    });
    toast.success("Sample MCP call logged");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      <ApprovalPanel />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "px-2.5 h-8 rounded-md border text-xs transition-colors",
                filter === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {f.id === "all" ? entries.length : entries.filter((e) => e.status === f.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isGuestSession() && (
            <Button variant="outline" size="sm" onClick={simulate} aria-label="Log a sample MCP call">
              <PlayCircle className="h-4 w-4 mr-1.5" /> Sample call
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clear();
              toast.success("MCP activity cleared");
            }}
            disabled={entries.length === 0}
            aria-label="Clear MCP activity"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Backend note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Local MCP activity is stored in this browser. Calls originating from ChatGPT, Claude or other MCP
          clients appear here once you drain their intents from the inbox (or wire a shared server queue).
        </p>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="No MCP activity yet"
          description="Tool calls from connected AI assistants will appear here with timestamps, status and the resources they touched."
        />
      ) : (
        <ol className="space-y-2">
          {filtered.map((e) => {
            const meta = STATUS_META[e.status];
            const Icon = meta.icon;
            return (
              <li
                key={e.id}
                className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setDetailsFor(e)}
                  className="w-full text-left flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                      meta.className,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", e.status === "pending" && "animate-spin")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                        {e.tool}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{e.summary}</p>
                    {e.resources && e.resources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.resources.map((r) =>
                          r.href ? (
                            <Link
                              key={`${r.kind}:${r.id}`}
                              to={r.href}
                              onClick={(ev) => ev.stopPropagation()}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
                            >
                              {r.kind} · {r.label}
                            </Link>
                          ) : (
                            <span
                              key={`${r.kind}:${r.id}`}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground bg-muted/40"
                            >
                              {r.kind} · {r.label}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <McpCallDetailsDrawer
        open={!!detailsFor}
        onOpenChange={(v) => !v && setDetailsFor(null)}
        entry={detailsFor}
        onRerun={rerun}
        onDelete={(id) => {
          remove(id);
          toast.success("Entry removed");
        }}
      />
    </div>
  );
}
