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
  Plus,
  Trash2,
  AlertTriangle,
  Globe2,
  Copy,
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
import {
  useScheduledPosts,
  findConflicts,
  type Recurrence,
} from "@/hooks/useScheduledPosts";
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

// ---------- timezone helpers ----------
const BROWSER_TZ = typeof Intl !== "undefined"
  ? Intl.DateTimeFormat().resolvedOptions().timeZone
  : "UTC";

// A small curated timezone list; user's own tz is always included.
const COMMON_TZS = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** Parts of an instant expressed inside a target IANA timezone. */
function partsInTz(d: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    dtf.formatToParts(d).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour === "24" ? "00" : p.hour),
    minute: Number(p.minute),
  };
}

/** Format an instant Date as a datetime-local string INSIDE tz. */
function toTzLocalInputValue(d: Date, tz: string) {
  const p = partsInTz(d, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Interpret a datetime-local string as wall-clock time INSIDE tz and return
 * the absolute Date. Uses fixed-point iteration on the tz offset.
 */
function fromTzLocalInputValue(v: string, tz: string): Date {
  // Assume UTC first, then correct by the offset that tz maps to at that moment.
  const [datePart, timePart] = v.split("T");
  if (!datePart || !timePart) return new Date(NaN);
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  // Guess: treat v as UTC
  let guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  for (let i = 0; i < 2; i++) {
    const parts = partsInTz(guess, tz);
    const guessAsWallMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const targetMs = Date.UTC(y, m - 1, d, hh, mm);
    const drift = targetMs - guessAsWallMs;
    if (drift === 0) break;
    guess = new Date(guess.getTime() + drift);
  }
  return guess;
}

function tzShortLabel(tz: string) {
  return tz.split("/").slice(-1)[0].replace(/_/g, " ");
}

// ---------- quick-time helpers (return absolute Date) ----------
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
  const day = d.getDay();
  const add = ((1 - day + 7) % 7) || 7;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d;
}

interface Slot {
  id: string;
  local: string; // datetime-local, interpreted in the selected timezone
}

export function ScheduledPostIntent({ payload, approved, rejected, onApprove, onReject }: Props) {
  const navigate = useNavigate();
  const { add, posts } = useScheduledPosts();
  const { accounts } = useAccounts();

  const connectedPlatformIds = useMemo(
    () => [...new Set(accounts.map((a) => a.platformId))],
    [accounts],
  );

  const [timezone, setTimezone] = useState<string>(BROWSER_TZ);

  const initialDate = useMemo(() => {
    const d = new Date(payload.scheduledAt);
    return isNaN(d.getTime()) ? inOneHour() : d;
  }, [payload.scheduledAt]);

  const [caption, setCaption] = useState(payload.caption ?? "");
  const [slots, setSlots] = useState<Slot[]>([
    { id: crypto.randomUUID(), local: toTzLocalInputValue(initialDate, BROWSER_TZ) },
  ]);
  const [platformIds, setPlatformIds] = useState<string[]>(
    (payload.platformIds ?? []).filter(Boolean),
  );
  const [recurrenceFreq, setRecurrenceFreq] =
    useState<Recurrence["freq"] | "none">("none");
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);
  const [saved, setSaved] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState(false);

  const togglePlatform = (id: string) => {
    setPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setConfirmOverride(false);
  };

  const setSlotLocal = (id: string, local: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, local } : s)));
    setConfirmOverride(false);
  };
  const addSlot = (fromLocal?: string) =>
    setSlots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        local: fromLocal ?? prev[prev.length - 1]?.local ?? toTzLocalInputValue(inOneHour(), timezone),
      },
    ]);
  const duplicateSlot = (id: string) => {
    const s = slots.find((x) => x.id === id);
    if (s) addSlot(s.local);
  };
  const removeSlot = (id: string) =>
    setSlots((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));
  const applyQuickTime = (d: Date) => {
    // apply to the first slot
    setSlots((prev) =>
      prev.length === 0
        ? [{ id: crypto.randomUUID(), local: toTzLocalInputValue(d, timezone) }]
        : prev.map((s, i) => (i === 0 ? { ...s, local: toTzLocalInputValue(d, timezone) } : s)),
    );
    setConfirmOverride(false);
  };

  const onTimezoneChange = (nextTz: string) => {
    // Re-anchor each slot: treat the current local as wall-clock in previous tz,
    // then rewrite as wall-clock in the new tz for the same absolute instant.
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        local: toTzLocalInputValue(fromTzLocalInputValue(s.local, timezone), nextTz),
      })),
    );
    setTimezone(nextTz);
    setConfirmOverride(false);
  };

  // Resolve slots → absolute ISOs (for conflict detection + save)
  const resolvedInstants = useMemo(
    () => slots.map((s) => fromTzLocalInputValue(s.local, timezone)),
    [slots, timezone],
  );

  // Conflict detection across every slot × recurrence occurrence
  const conflicts = useMemo(() => {
    if (platformIds.length === 0) return [];
    const all: ReturnType<typeof findConflicts> = [];
    const totalPer = recurrenceFreq === "none" ? 1 : Math.max(1, recurrenceCount);
    resolvedInstants.forEach((base) => {
      for (let i = 0; i < totalPer; i++) {
        const when = new Date(base);
        if (recurrenceFreq === "daily") when.setDate(when.getDate() + i);
        else if (recurrenceFreq === "weekly") when.setDate(when.getDate() + i * 7);
        else if (recurrenceFreq === "monthly") when.setMonth(when.getMonth() + i);
        all.push(
          ...findConflicts(posts, {
            scheduledAt: when.toISOString(),
            platformIds,
            caption,
          }),
        );
      }
    });
    // Also detect duplicates within the batch itself (same instant + platform).
    const seen = new Map<string, number>();
    resolvedInstants.forEach((d) => {
      const key = `${d.getTime()}|${[...platformIds].sort().join(",")}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    });
    const dupWithin = [...seen.entries()].filter(([, n]) => n > 1);
    return { external: all, internalDupCount: dupWithin.length };
  }, [posts, resolvedInstants, platformIds, caption, recurrenceFreq, recurrenceCount]);

  const totalConflicts =
    Array.isArray(conflicts) ? 0 : conflicts.external.length + conflicts.internalDupCount;

  const doSchedule = () => {
    if (!caption.trim()) return toast.error("Caption can't be empty");
    if (platformIds.length === 0) return toast.error("Select at least one platform");
    if (resolvedInstants.some((d) => isNaN(d.getTime())))
      return toast.error("Pick a valid date & time for every slot");

    if (totalConflicts > 0 && !confirmOverride) {
      setConfirmOverride(true);
      toast.warning(
        `${totalConflicts} conflict${totalConflicts === 1 ? "" : "s"} detected — review then confirm again to override.`,
      );
      return;
    }

    const recurrence: Recurrence | undefined =
      recurrenceFreq !== "none"
        ? { freq: recurrenceFreq, count: Math.max(1, recurrenceCount) }
        : undefined;

    const scheduledAts = resolvedInstants.map((d) => d.toISOString());

    const first = add(
      {
        caption: caption.trim(),
        scheduledAt: scheduledAts[0],
        platformIds,
        hashtags: payload.hashtags,
        mediaUrl: payload.mediaUrls?.[0],
        timezone,
        status: "queued",
      },
      { recurrence, scheduledAts },
    );

    const totalCount =
      scheduledAts.length * (recurrence?.count ?? 1);

    logMcpCall({
      tool: "queue_cross_platform_post",
      status: "success",
      summary: `Scheduled ${totalCount} post${totalCount === 1 ? "" : "s"} across ${platformIds.length} platform${platformIds.length === 1 ? "" : "s"} (${tzShortLabel(timezone)})`,
      resources: [{ kind: "scheduled-post", id: first.id, label: caption.slice(0, 60) }],
      payload: { ...first, recurrence, timezone, scheduledAts },
    });

    setSaved(true);
    toast.success(
      totalCount > 1
        ? `Scheduled ${totalCount} posts (${tzShortLabel(timezone)})`
        : `Scheduled for ${format(resolvedInstants[0], "MMM d, h:mm a")} · ${tzShortLabel(timezone)}`,
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
            Bulk-schedule across time slots and platforms with timezone-aware timing.
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
            onChange={(e) => {
              setCaption(e.target.value);
              setConfirmOverride(false);
            }}
            rows={3}
            className="text-xs resize-none"
            placeholder="Caption applied to every slot"
          />

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Globe2 className="h-3 w-3" />
              Timezone
            </label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[BROWSER_TZ, ...COMMON_TZS.filter((t) => t !== BROWSER_TZ)].map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz} {tz === BROWSER_TZ ? "· your device" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slots */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                Time slots ({slots.length})
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 gap-1 text-[10.5px] px-2"
                onClick={() => addSlot()}
              >
                <Plus className="h-3 w-3" />
                Add slot
              </Button>
            </div>
            <div className="space-y-1.5">
              {slots.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <Input
                    type="datetime-local"
                    value={s.local}
                    onChange={(e) => setSlotLocal(s.id, e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    aria-label="Duplicate slot"
                    onClick={() => duplicateSlot(s.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    aria-label="Remove slot"
                    disabled={slots.length === 1}
                    onClick={() => removeSlot(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
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
              Repeat (per slot)
            </label>
            <div className="flex items-center gap-1.5">
              <Select
                value={recurrenceFreq}
                onValueChange={(v) => {
                  setRecurrenceFreq(v as Recurrence["freq"] | "none");
                  setConfirmOverride(false);
                }}
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
                    onChange={(e) => {
                      setRecurrenceCount(Number(e.target.value) || 1);
                      setConfirmOverride(false);
                    }}
                    className="h-8 w-16 text-xs"
                  />
                </>
              )}
            </div>
          </div>

          {/* Conflict warning */}
          {totalConflicts > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {totalConflicts} scheduling conflict{totalConflicts === 1 ? "" : "s"} detected
              </div>
              {!Array.isArray(conflicts) && conflicts.external.slice(0, 3).map((c, i) => (
                <div key={i} className="text-muted-foreground">
                  · {c.kind === "duplicate" ? "Duplicate caption" : "Overlaps within"} {c.minutesApart}m on {c.platformIds.join(", ")}
                </div>
              ))}
              {!Array.isArray(conflicts) && conflicts.internalDupCount > 0 && (
                <div className="text-muted-foreground">
                  · {conflicts.internalDupCount} duplicate slot{conflicts.internalDupCount === 1 ? "" : "s"} inside this batch
                </div>
              )}
              {confirmOverride && (
                <div className="text-amber-600 dark:text-amber-400 pt-1">
                  Confirm again to schedule anyway.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button size="sm" className="h-7 gap-1" onClick={doSchedule}>
              <Check className="h-3 w-3" />
              {confirmOverride && totalConflicts > 0 ? "Schedule anyway" : `Schedule ${slots.length > 1 ? `× ${slots.length}` : ""}`.trim()}
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
            <span className="text-[10.5px] text-muted-foreground self-center ml-auto">
              {tzShortLabel(timezone)} · {slots.length} slot{slots.length === 1 ? "" : "s"}
              {recurrenceFreq !== "none" && ` × ${recurrenceCount} ${recurrenceFreq}`}
            </span>
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
