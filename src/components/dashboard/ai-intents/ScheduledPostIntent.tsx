import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarClock,
  Check,
  X,
  Clock,
  Sunrise,
  CalendarDays,
  Repeat,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useScheduledPosts, type Recurrence } from "@/hooks/useScheduledPosts";
import { useAccounts } from "@/contexts/AccountContext";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { logMcpCall } from "@/hooks/useMcpActivity";

export interface ScheduledPostPayload {
  id: string;
  caption: string;
  platformIds: string[];
  scheduledAt: string;
  mediaUrls?: string[];
  hashtags?: string[];
  source?: string;
}

interface Props {
  payload: ScheduledPostPayload;
  approved?: boolean;
  rejected?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

/** Format a Date for <input type="datetime-local"> in the user's local zone. */
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(v: string) {
  // Interpreted as local time
  return new Date(v);
}

function inOneHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}
function tomorrowAt9() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}
function nextMondayAt9() {
  const d = new Date();
  const day = d.getDay(); // 0..6
  const add = ((1 - day + 7) % 7) || 7;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function ScheduledPostIntent({ payload, approved, rejected, onApprove, onReject }: Props) {
  const navigate = useNavigate();
  const { add } = useScheduledPosts();
  const { accounts } = useAccounts();

  const connectedPlatformIds = useMemo(
    () => [...new Set(accounts.map((a) => a.platformId))],
    [accounts],
  );

  const initialWhen = useMemo(() => {
    const d = new Date(payload.scheduledAt);
    return isNaN(d.getTime()) ? inOneHour() : d;
  }, [payload.scheduledAt]);

  const [caption, setCaption] = useState(payload.caption ?? "");
  const [whenLocal, setWhenLocal] = useState(toLocalInputValue(initialWhen));
  const [platformIds, setPlatformIds] = useState<string[]>(
    (payload.platformIds ?? []).filter(Boolean),
  );
  const [recurrenceFreq, setRecurrenceFreq] =
    useState<Recurrence["freq"] | "none">("none");
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);
  const [saved, setSaved] = useState(false);

  const togglePlatform = (id: string) => {
    setPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const applyQuickTime = (d: Date) => setWhenLocal(toLocalInputValue(d));

  const doSchedule = () => {
    const when = fromLocalInputValue(whenLocal);
    if (isNaN(when.getTime())) {
      toast.error("Pick a valid date & time");
      return;
    }
    if (!caption.trim()) {
      toast.error("Caption can't be empty");
      return;
    }
    if (platformIds.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    const recurrence: Recurrence | undefined =
      recurrenceFreq !== "none"
        ? { freq: recurrenceFreq, count: Math.max(1, recurrenceCount) }
        : undefined;

    const first = add(
      {
        caption: caption.trim(),
        scheduledAt: when.toISOString(),
        platformIds,
        hashtags: payload.hashtags,
        mediaUrl: payload.mediaUrls?.[0],
      },
      recurrence ? { recurrence } : undefined,
    );

    logMcpCall({
      tool: "queue_cross_platform_post",
      status: "success",
      summary: `Scheduled ${platformIds.length} platform${platformIds.length === 1 ? "" : "s"} for ${format(when, "MMM d, h:mm a")}${
        recurrence ? ` (×${recurrence.count} ${recurrence.freq})` : ""
      }`,
      resources: [{ kind: "scheduled-post", id: first.id, label: caption.slice(0, 60) }],
      payload: { ...first, recurrence },
    });

    setSaved(true);
    toast.success(
      recurrence
        ? `Scheduled ${recurrence.count} posts (${recurrence.freq})`
        : `Scheduled for ${format(when, "MMM d, h:mm a")}`,
      {
        duration: 6000,
        action: {
          label: "Open queue",
          onClick: () => navigate("/dashboard/publish/queue"),
        },
      },
    );
    onApprove();
  };

  const done = approved || saved;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 space-y-3",
        done && "border-brand-green/40 bg-brand-green/5",
        rejected && "border-destructive/30 bg-destructive/5 opacity-70",
        !done && !rejected && "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Scheduled post</span>
            {done && (
              <Badge className="text-[10px] h-5 bg-brand-green/20 text-brand-green border-brand-green/30">
                Scheduled
              </Badge>
            )}
            {rejected && (
              <Badge variant="destructive" className="text-[10px] h-5">
                Dismissed
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Adjust time, platforms, or caption — then schedule directly.
          </p>
        </div>
        {!done && !rejected && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onReject} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {done && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[11px]"
            onClick={() => navigate("/dashboard/publish/queue")}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Queue
          </Button>
        )}
      </div>

      {!rejected && !done && (
        <>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="text-xs resize-none"
            placeholder="Caption"
          />

          {/* When */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              When
            </label>
            <Input
              type="datetime-local"
              value={whenLocal}
              onChange={(e) => setWhenLocal(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              <QuickTimeChip icon={Clock} label="+1h" onClick={() => applyQuickTime(inOneHour())} />
              <QuickTimeChip icon={Sunrise} label="Tomorrow 9am" onClick={() => applyQuickTime(tomorrowAt9())} />
              <QuickTimeChip icon={CalendarDays} label="Next Mon 9am" onClick={() => applyQuickTime(nextMondayAt9())} />
            </div>
          </div>

          {/* Platforms */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              Platforms
            </label>
            <div className="flex flex-wrap gap-1.5">
              {connectedPlatformIds.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No accounts connected yet.</p>
              )}
              {connectedPlatformIds.map((pid) => {
                const active = platformIds.includes(pid);
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => togglePlatform(pid)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10.5px] px-2 py-1 rounded-full border transition-all capitalize",
                      active
                        ? "border-primary/50 bg-primary/15 text-foreground"
                        : "border-border/60 bg-background/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground",
                    )}
                  >
                    <PlatformIcon platform={pid} size="xs" />
                    {pid}
                    {active && <Check className="h-2.5 w-2.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              Repeat
            </label>
            <div className="flex items-center gap-1.5">
              <Select
                value={recurrenceFreq}
                onValueChange={(v) => setRecurrenceFreq(v as Recurrence["freq"] | "none")}
              >
                <SelectTrigger className="h-8 text-xs w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-off</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {recurrenceFreq !== "none" && (
                <>
                  <span className="text-[11px] text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(Number(e.target.value) || 1)}
                    className="h-8 w-16 text-xs"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button size="sm" className="h-7 gap-1" onClick={doSchedule}>
              <Check className="h-3 w-3" />
              Schedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1"
              onClick={() => navigate("/dashboard/publish/queue")}
            >
              <ArrowUpRight className="h-3 w-3" />
              Open queue
            </Button>
          </div>
        </>
      )}

      {done && (
        <p className="text-[11px] text-muted-foreground">
          {caption.slice(0, 80)}
          {caption.length > 80 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function QuickTimeChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Clock;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-full border transition-all",
        "border-border/60 bg-background/60 hover:border-primary/50 hover:bg-primary/10",
      )}
    >
      <Icon className="h-2.5 w-2.5 text-primary/80" />
      {label}
    </button>
  );
}
