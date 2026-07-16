import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Trash2, CalendarClock, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { RescheduleDialog } from "./RescheduleDialog";

/**
 * Read-only event view for a scheduled post opened from the calendar chip.
 * Actions: reschedule, duplicate, delete. The heavy re-schedule UX lives in
 * RescheduleDialog to keep this dialog compact.
 */
export function EventDetailsDialog({
  post,
  open,
  onOpenChange,
}: {
  post: ScheduledPost | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { remove, add } = useScheduledPosts();
  const [reOpen, setReOpen] = useState(false);
  if (!post) return null;

  const duplicate = () => {
    add({
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      scheduledAt: post.scheduledAt,
      platformIds: [...post.platformIds],
      hashtags: post.hashtags,
      timezone: post.timezone,
      firstComment: post.firstComment,
    });
    toast.success("Post duplicated");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scheduled post</DialogTitle>
            <DialogDescription>
              {format(parseISO(post.scheduledAt), "EEE, MMM d · HH:mm")}
              {post.timezone && <> · <span className="opacity-70">{post.timezone}</span></>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">{post.caption || "(no caption)"}</p>
            {post.firstComment && (
              <div className="rounded-md border border-border/60 bg-muted/40 p-2 text-[12px]">
                <span className="font-medium text-muted-foreground">First comment: </span>
                {post.firstComment}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {post.platformIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 capitalize">
                  <PlatformIcon platform={id} size="xs" />
                  {id}
                </Badge>
              ))}
            </div>
            {post.status && (
              <p className="text-[11px] text-muted-foreground">
                Status: <span className="capitalize font-medium">{post.status}</span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={duplicate}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReOpen(true)}>
              <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Reschedule
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                remove(post.id);
                toast.success("Deleted");
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <RescheduleDialog post={post} open={reOpen} onOpenChange={setReOpen} />
    </>
  );
}
