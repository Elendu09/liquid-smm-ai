import { useMemo, useState } from "react";
import { Plus, Trash2, Clock, Wand2, CalendarClock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { guardWrite } from "@/hooks/useGuest";
import {
  useAutolists,
  upcomingSlots,
  formatSlot,
  slotKey,
  DOW_LABELS,
  type Autolist,
} from "@/hooks/useAutolists";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";

const HOURS = [6, 8, 9, 10, 11, 12, 13, 15, 17, 18, 19, 20, 21];
const COLORS = ["217 91% 60%", "280 80% 62%", "160 70% 45%", "35 95% 58%", "340 82% 62%"];

function SlotGrid({ list, onToggle }: { list: Autolist; onToggle: (dow: number, hour: number) => void }) {
  const active = useMemo(() => new Set(list.slots.map((s) => slotKey(s))), [list.slots]);
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[44px_repeat(13,minmax(0,1fr))] gap-1 mb-1">
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[9px] text-center text-muted-foreground tabular-nums">
              {h % 12 === 0 ? 12 : h % 12}
              {h < 12 ? "a" : "p"}
            </div>
          ))}
        </div>
        {DOW_LABELS.map((label, dow) => (
          <div key={label} className="grid grid-cols-[44px_repeat(13,minmax(0,1fr))] gap-1 mb-1">
            <div className="text-[10px] font-medium text-muted-foreground flex items-center">{label}</div>
            {HOURS.map((h) => {
              const on = active.has(`${dow}-${h}-0`);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => onToggle(dow, h)}
                  aria-pressed={on}
                  aria-label={`${label} ${h}:00 slot`}
                  className={cn(
                    "h-5 rounded-[4px] border transition-all",
                    on
                      ? "border-transparent shadow-sm"
                      : "border-border/60 bg-muted/30 hover:bg-muted/70",
                  )}
                  style={on ? { backgroundColor: `hsl(${list.color})` } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AutolistsPanel() {
  const { autolists, add, update, remove, toggle, toggleSlot, weeklyCapacity } = useAutolists();
  const { posts, update: updatePost } = useScheduledPosts();
  const [newName, setNewName] = useState("");

  const queued = useMemo(
    () => posts.filter((p) => (p.status ?? "queued") === "queued"),
    [posts],
  );

  const create = async () => {
    if (!guardWrite("create autolists")) return;
    const name = newName.trim() || `Autolist ${autolists.length + 1}`;
    await add({ name, color: COLORS[autolists.length % COLORS.length] });
    setNewName("");
    toast.success(`"${name}" created — pick its weekly slots`);
  };

  const reflow = (list: Autolist) => {
    if (!guardWrite("reflow the queue")) return;
    const slots = upcomingSlots(list, queued.length || 1);
    if (!slots.length) {
      toast.error("Add at least one time slot first");
      return;
    }
    const targets = queued
      .slice()
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
      .slice(0, slots.length);
    if (!targets.length) {
      toast.info("Nothing queued to reflow");
      return;
    }
    targets.forEach((p, i) => updatePost(p.id, { scheduledAt: slots[i].toISOString() }));
    toast.success(`Reflowed ${targets.length} post${targets.length > 1 ? "s" : ""} into "${list.name}"`);
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div className="mr-auto">
          <h4 className="text-sm font-bold leading-tight">Autolists</h4>
          <p className="text-[11px] text-muted-foreground">
            Recurring time slots — queued posts flow into the next open one.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className="tabular-nums">{weeklyCapacity} slots/week</Badge>
          <Badge variant="outline" className="tabular-nums">{queued.length} queued</Badge>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="New autolist name…"
            className="h-9 sm:w-52"
          />
          <Button size="sm" onClick={create}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>

      {autolists.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
          <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium">No autolists yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create one, tap the weekly grid to set posting slots, then reflow your queue into it.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {autolists.map((list) => {
          const next = upcomingSlots(list, 4);
          return (
            <div key={list.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: `hsl(${list.color})` }} />
                <Input
                  value={list.name}
                  onChange={(e) => update(list.id, { name: e.target.value })}
                  className="h-8 border-transparent bg-transparent px-1 font-semibold focus-visible:border-border"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {list.platformIds.slice(0, 4).map((p) => (
                    <PlatformIcon key={p} platform={p} size="xs" />
                  ))}
                </div>
                <Switch
                  checked={list.active}
                  onCheckedChange={() => toggle(list.id)}
                  aria-label="Toggle autolist"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!guardWrite("delete autolists")) return;
                    remove(list.id);
                  }}
                  aria-label={`Delete ${list.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <SlotGrid list={list} onToggle={(dow, hour) => toggleSlot(list.id, { dow, hour, minute: 0 })} />

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mr-auto">
                  <Clock className="h-3 w-3" />
                  {next.length ? (
                    <span className="tabular-nums">
                      Next:{" "}
                      {next
                        .slice(0, 3)
                        .map((d) =>
                          `${DOW_LABELS[d.getDay()]} ${formatSlot({ dow: d.getDay(), hour: d.getHours(), minute: d.getMinutes() })}`,
                        )
                        .join(" · ")}
                    </span>
                  ) : (
                    <span>No slots selected</span>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => reflow(list)}>
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Reflow queue
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
