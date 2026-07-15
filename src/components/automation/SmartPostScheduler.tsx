import { useMemo, useState } from "react";
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { logRun } from "@/hooks/useRunHistory";
import type { Platform } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface SmartPostSchedulerProps {
  selectedPlatforms?: Platform[];
}

export const SmartPostScheduler = ({ selectedPlatforms = [] }: SmartPostSchedulerProps = {}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { posts, add, remove } = useScheduledPosts();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const minCaptionCap = useMemo(
    () => Math.min(...selectedPlatforms.map((p) => p.limits.captionLength).filter(Boolean), 5000),
    [selectedPlatforms]
  );

  const getPostsForDay = (day: number) =>
    posts.filter((p) => {
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 glow-blue">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Smart Post Scheduler</h3>
            <p className="text-sm text-muted-foreground">Plan and automate cross-platform posting</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h4 className="text-lg font-semibold">{months[month]} {year}</h4>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayPosts = day ? getPostsForDay(day) : [];
          const isSelected = day === selectedDay;
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          return (
            <div
              key={index}
              onClick={() => day && setSelectedDay(day)}
              className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border transition-all cursor-pointer ${
                day ? "hover:border-primary/50" : ""
              } ${isSelected ? "border-primary bg-primary/5" : "border-border/50"} ${isToday ? "bg-primary/10" : ""}`}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>{day}</div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className="text-[10px] md:text-xs p-1 rounded bg-primary/20 text-primary truncate flex items-center gap-1"
                      >
                        {post.platformIds[0] && <PlatformIcon platform={post.platformIds[0]} size="xs" />}
                        <span className="truncate hidden md:inline">{post.caption.slice(0, 20)}</span>
                      </div>
                    ))}
                    {dayPosts.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayPosts.length - 2} more</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border animate-fade-in-scale">
          <h5 className="font-semibold mb-3">{months[month]} {selectedDay}, {year}</h5>
          <div className="space-y-2">
            {getPostsForDay(selectedDay).length > 0 ? (
              getPostsForDay(selectedDay).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex -space-x-1">
                      {post.platformIds.map((pid) => (
                        <div key={pid} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-card">
                          <PlatformIcon platform={pid} size="xs" />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{post.caption.slice(0, 60)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{post.platformIds.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        remove(post.id);
                        toast.success("Post deleted");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No posts scheduled for this day</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Scheduled", value: `${posts.length} posts` },
          { label: "This Month", value: `${posts.filter((p) => new Date(p.scheduledAt).getMonth() === month).length} posts` },
          { label: "Platforms", value: `${selectedPlatforms.length} active` },
          { label: "Best Time", value: "10:00 AM" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-lg font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <SchedulePostDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        platforms={selectedPlatforms}
        captionCap={minCaptionCap}
        onSave={(post) => {
          add(post);
          setDialogOpen(false);
          toast.success("Post scheduled");
        }}
      />
    </div>
  );
};

function SchedulePostDialog({
  open,
  onClose,
  platforms,
  captionCap,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  platforms: Platform[];
  captionCap: number;
  onSave: (post: { caption: string; mediaUrl?: string; scheduledAt: string; platformIds: string[] }) => void;
}) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [selected, setSelected] = useState<string[]>(platforms.map((p) => p.id));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a post</DialogTitle>
          <DialogDescription>
            Caption max length: {captionCap} chars (lowest cap among selected platforms).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="post-caption">Caption</Label>
            <Textarea
              id="post-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, captionCap))}
              placeholder="Write your caption…"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length} / {captionCap}
            </p>
          </div>
          <div>
            <Label htmlFor="post-media">Media URL (optional)</Label>
            <Input id="post-media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="post-date">Date</Label>
              <Input id="post-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="post-time">Time</Label>
              <Input id="post-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {platforms.length > 1 && (
            <div>
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {platforms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => (v ? [...prev, p.id] : prev.filter((x) => x !== p.id)))
                      }
                    />
                    <PlatformIcon platform={p.id} size="xs" />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!caption.trim()) return toast.error("Caption is required");
              if (!selected.length) return toast.error("Select at least one platform");
              onSave({
                caption: caption.trim(),
                mediaUrl: mediaUrl.trim() || undefined,
                scheduledAt: new Date(`${date}T${time}`).toISOString(),
                platformIds: selected,
              });
              setCaption("");
              setMediaUrl("");
            }}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
