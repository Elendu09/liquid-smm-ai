import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts, findConflicts } from "@/hooks/useScheduledPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

/**
 * Rich Schedule dialog for the Publish → Queue board.
 *
 * Adds three things the SmartPostScheduler sheet doesn't cover on its own:
 *   1. Explicit IANA timezone picker (defaults to browser tz).
 *   2. Per-platform caption overrides (accordion — untouched platforms use the master caption).
 *   3. First-comment field + one-tap "AI best time" suggestion within the next 7 days.
 */

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** Naïve "best time" — 10:00 local next weekday. Deterministic, no API cost. */
function suggestBestTime(tz: string) {
  const now = new Date();
  const cand = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // Skip weekends
  while (cand.getDay() === 0 || cand.getDay() === 6) cand.setDate(cand.getDate() + 1);
  cand.setHours(10, 0, 0, 0);
  // Format for datetime-local (local wall-clock).
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${cand.getFullYear()}-${pad(cand.getMonth() + 1)}-${pad(cand.getDate())}T${pad(cand.getHours())}:${pad(cand.getMinutes())}`;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  initialCaption = "",
  initialPlatformIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialCaption?: string;
  initialPlatformIds?: string[];
}) {
  const { accounts } = useAccounts();
  const { posts, add } = useScheduledPosts();

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [caption, setCaption] = useState(initialCaption);
  const [firstComment, setFirstComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [tz, setTz] = useState(browserTz);
  const [selected, setSelected] = useState<string[]>(
    initialPlatformIds ?? (accounts[0]?.platformId ? [accounts[0].platformId] : ["instagram"]),
  );
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const conflicts = useMemo(
    () =>
      scheduledAt
        ? findConflicts(posts, {
            scheduledAt: new Date(scheduledAt).toISOString(),
            platformIds: selected,
            caption,
          })
        : [],
    [posts, scheduledAt, selected, caption],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const applyBestTime = () => {
    setScheduledAt(suggestBestTime(tz));
    toast.success("Suggested best time added");
  };

  const submit = () => {
    if (!caption.trim() || !scheduledAt || selected.length === 0) {
      toast.error("Caption, time, and at least one platform are required.");
      return;
    }
    const platformOverrides = Object.fromEntries(
      Object.entries(overrides)
        .filter(([id, c]) => selected.includes(id) && c.trim() && c.trim() !== caption.trim())
        .map(([id, c]) => [id, { caption: c.trim() }]),
    );
    add({
      caption: caption.trim(),
      firstComment: firstComment.trim() || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      timezone: tz,
      platformIds: selected,
      platformOverrides: Object.keys(platformOverrides).length ? platformOverrides : undefined,
    });
    toast.success("Scheduled");
    onOpenChange(false);
    // Reset for next open
    setCaption("");
    setFirstComment("");
    setScheduledAt("");
    setOverrides({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogDescription>Timezone, per-platform caption overrides, and first comment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Caption</Label>
            <Textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What's the post about?" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>When</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={tz} onValueChange={setTz}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[browserTz, ...TIMEZONES.filter((t) => t !== browserTz)].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={applyBestTime} className="w-full">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Use AI best-time (weekday · 10:00)
          </Button>

          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {["instagram", "twitter", "tiktok", "linkedin", "facebook", "youtube", "threads", "pinterest"].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-colors",
                    selected.includes(id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <PlatformIcon platform={id} size="xs" />
                  <span className="capitalize">{id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>First comment (optional)</Label>
            <Input value={firstComment} onChange={(e) => setFirstComment(e.target.value)} placeholder="e.g. link in bio ↗" />
          </div>

          {selected.length > 1 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="overrides" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5" /> Per-platform caption overrides
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  {selected.map((id) => (
                    <div key={id} className="space-y-1">
                      <Label className="text-[11px] flex items-center gap-1.5 capitalize">
                        <PlatformIcon platform={id} size="xs" /> {id}
                      </Label>
                      <Textarea
                        rows={2}
                        placeholder={`Optional override for ${id}`}
                        value={overrides[id] ?? ""}
                        onChange={(e) => setOverrides((o) => ({ ...o, [id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
              {conflicts.length} scheduling conflict{conflicts.length > 1 ? "s" : ""} — same platform{" "}
              within ±10min or duplicate caption within 24h.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
