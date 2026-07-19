import { useState } from "react";
import { toast } from "sonner";
import { Repeat2, Plus, Trash2, Power, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useRecyclingRules, type RecycleCadence } from "@/hooks/useRecyclingRules";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils";

const CADENCES: { value: RecycleCadence; label: string; hint: string }[] = [
  { value: "weekly", label: "Weekly", hint: "Every 7 days" },
  { value: "biweekly", label: "Bi-weekly", hint: "Every 14 days" },
  { value: "monthly", label: "Monthly", hint: "Once per month" },
];

export function RecyclingRulesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { rules, add, remove, toggle, advance } = useRecyclingRules();
  const { add: addPost } = useScheduledPosts();

  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [cadence, setCadence] = useState<RecycleCadence>("weekly");
  const [hour, setHour] = useState(10);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const canSave = name.trim() && caption.trim() && platforms.length > 0;

  const togglePlatform = (id: string) =>
    setPlatforms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const reset = () => {
    setName("");
    setCaption("");
    setCadence("weekly");
    setHour(10);
    setPlatforms([]);
  };

  const save = () => {
    add({ name: name.trim(), caption: caption.trim(), cadence, hour, platformIds: platforms, enabled: true });
    toast.success("Recycling rule created");
    reset();
  };

  const runNow = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    addPost({
      caption: rule.caption,
      mediaUrl: rule.mediaUrl,
      scheduledAt: rule.nextRunAt,
      platformIds: [...rule.platformIds],
      hashtags: rule.hashtags,
    });
    advance(id);
    toast.success(`Queued "${rule.name}" for next slot`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[calc(100vw-2rem)] w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-primary" />
            Recycling rules
          </DialogTitle>
          <DialogDescription>
            Evergreen posts that reschedule themselves on a cadence. Great for tips,
            testimonials, or promo drops you want to keep in rotation.
          </DialogDescription>
        </DialogHeader>

        {/* New rule form */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rrule-name">Name</Label>
              <Input id="rrule-name" placeholder="e.g. Monday tip" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cadence</Label>
              <Select value={cadence} onValueChange={(v) => setCadence(v as RecycleCadence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} <span className="text-muted-foreground ml-1">· {c.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rrule-caption">Caption</Label>
            <Textarea
              id="rrule-caption"
              rows={3}
              placeholder="What should the recycled post say?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.slice(0, 8).map((p) => {
                  const active = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition",
                        active
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <PlatformIcon platform={p.id} size="xs" />
                      <span className="capitalize">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rrule-hour">Hour</Label>
              <Input
                id="rrule-hour"
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
                className="w-20"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={!canSave} onClick={save}>
              <Plus className="h-4 w-4 mr-1" /> Add rule
            </Button>
          </div>
        </div>

        {/* Existing rules */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active rules ({rules.length})
          </h4>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No rules yet. Add one above to keep evergreen posts in rotation.
            </p>
          ) : (
            <ul className="space-y-2">
              {rules.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-xl border border-border/60 bg-card/60 p-3 flex flex-col gap-2",
                    !r.enabled && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.caption}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggle(r.id)} title={r.enabled ? "Pause" : "Enable"}>
                        <Power className={cn("h-3.5 w-3.5", r.enabled ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { remove(r.id); toast.success("Rule removed"); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Repeat2 className="h-3 w-3" /> {CADENCES.find((c) => c.value === r.cadence)?.label}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> {String(r.hour).padStart(2, "0")}:00
                    </Badge>
                    {r.platformIds.map((id) => (
                      <div key={id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted flex items-center gap-1">
                        <PlatformIcon platform={id} size="xs" />
                        <span className="capitalize">{id}</span>
                      </div>
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      Next: {new Date(r.nextRunAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => runNow(r.id)}>Queue now</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
