import { useEffect, useState } from "react";
import { History, Trash2, CheckCircle2, XCircle, SkipForward, GitBranch } from "lucide-react";
import { PanelSection } from "@/components/shared/PanelSection";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BotLogEntry {
  id: string;
  rule: string;
  platform: string;
  event: string;
  status: "success" | "error" | "skipped";
  message: string;
  at: string;
}

const SEED: BotLogEntry[] = [
  { id: "l1", rule: "Welcome DM", platform: "instagram", event: "Triggered", status: "success", message: "Sent welcome DM to @new_fan", at: new Date(Date.now() - 4 * 60_000).toISOString() },
  { id: "l2", rule: "Keyword reply — pricing", platform: "twitter", event: "Triggered", status: "success", message: "Replied to mention containing “price”", at: new Date(Date.now() - 18 * 60_000).toISOString() },
  { id: "l3", rule: "Comment triage", platform: "tiktok", event: "Routed", status: "success", message: "Assigned negative comment to Support", at: new Date(Date.now() - 41 * 60_000).toISOString() },
  { id: "l4", rule: "Welcome DM", platform: "instagram", event: "Rate limited", status: "error", message: "Action skipped — 18 DMs in window", at: new Date(Date.now() - 1.2 * 3_600_000).toISOString() },
  { id: "l5", rule: "Hashtag watcher", platform: "youtube", event: "Filtered", status: "skipped", message: "Comment matched exclusion keyword", at: new Date(Date.now() - 2.4 * 3_600_000).toISOString() },
  { id: "l6", rule: "Keyword reply — pricing", platform: "twitter", event: "Triggered", status: "success", message: "Replied to mention containing “price”", at: new Date(Date.now() - 3.1 * 3_600_000).toISOString() },
];

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const STATUS_META: Record<BotLogEntry["status"], { icon: typeof CheckCircle2; label: string; cls: string }> = {
  success: { icon: CheckCircle2, label: "Success", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  error: { icon: XCircle, label: "Failed", cls: "text-rose-600 bg-rose-500/10 border-rose-500/30" },
  skipped: { icon: SkipForward, label: "Skipped", cls: "text-muted-foreground bg-muted/60 border-border/60" },
};

/** Bot activity log — replaces the old rate-limit dashboard. Every rule run,
 *  trigger and skipped action is recorded here as history. */
export function BotHistoryLogs() {
  const { items, setItems } = useLocalCollection<BotLogEntry>("engage", "bot-logs", SEED);
  const [live, setLive] = useState(true);

  // Live simulation: occasionally append a heartbeat entry while “Live” is on.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setItems((prev) => {
        if (prev.length > 40) return prev;
        const entry: BotLogEntry = {
          id: crypto.randomUUID(),
          rule: prev[0]?.rule ?? "Welcome DM",
          platform: prev[0]?.platform ?? "instagram",
          event: "Heartbeat",
          status: "success",
          message: "Rule checked inbox — no new matches",
          at: new Date().toISOString(),
        };
        return [entry, ...prev];
      });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [live, setItems]);

  return (
    <PanelSection
      icon={History}
      title="Bot history log"
      description="Every rule trigger, routed action and skipped attempt — chronological, newest first."
      accent="from-cyan-500 via-sky-500/50 to-transparent"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-muted"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/50")} />
            {live ? "Live" : "Paused"}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
            onClick={() => { setItems([]); toast.success("History cleared"); }}
          >
            <Trash2 className="h-3 w-3" /> Clear
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <GitBranch className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm font-medium">No bot activity yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            When your engagement rules fire, every run shows up here as history.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {items.map((l) => {
            const meta = STATUS_META[l.status];
            const StatusIcon = meta.icon;
            return (
              <div key={l.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <PlatformIcon platform={l.platform} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[13px] font-semibold leading-tight">{l.rule}</p>
                    <span className="text-[10px] text-muted-foreground/70">· {l.event}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.message}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.cls)}>
                    <StatusIcon className="h-3 w-3" /> {meta.label}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">{timeAgo(l.at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelSection>
  );
}
