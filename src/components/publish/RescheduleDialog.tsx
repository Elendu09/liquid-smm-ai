import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScheduledPosts, findConflicts, type ScheduledPost } from "@/hooks/useScheduledPosts";

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/**
 * Standalone reschedule dialog for a single queued/failed post.
 * Preserves platform choice; only when + timezone change.
 */
export function RescheduleDialog({
  post,
  open,
  onOpenChange,
}: {
  post: ScheduledPost | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { posts, update } = useScheduledPosts();
  const [when, setWhen] = useState("");
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (post) {
      setWhen(post.scheduledAt.slice(0, 16));
      setTz(post.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [post]);

  if (!post) return null;

  const conflicts = when
    ? findConflicts(posts, {
        scheduledAt: new Date(when).toISOString(),
        platformIds: post.platformIds,
        caption: post.caption,
        ignoreId: post.id,
      })
    : [];

  const save = () => {
    if (!when) return;
    update(post.id, {
      scheduledAt: new Date(when).toISOString(),
      timezone: tz,
      status: "queued",
      sendProgress: 0,
      error: undefined,
      sentAt: undefined,
    });
    toast.success("Post rescheduled");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule post</DialogTitle>
          <DialogDescription className="line-clamp-2">{post.caption || "(no caption)"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>New time</Label>
            <DateTimePicker value={when} onChange={setWhen} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[tz, ...TIMEZONES.filter((t) => t !== tz)].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {conflicts.length > 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠ Overlaps with {conflicts.length} other scheduled post{conflicts.length > 1 ? "s" : ""} on the same platform.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!when}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
