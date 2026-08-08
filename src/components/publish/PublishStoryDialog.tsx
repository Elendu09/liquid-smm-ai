import { useState } from "react";
import { Zap, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublishOutcome } from "@/hooks/usePublishOutcome";
import { useAccounts } from "@/contexts/AccountContext";
import type { StoryItemFull } from "./NewStoryDialog";

/**
 * Publish-or-schedule flow for an existing story. "Publish now" pushes it
 * straight to `live`; "Schedule for later" moves it to `scheduled` with
 * the chosen ISO datetime. Every publish goes through usePublishOutcome so
 * it is reflected as a notification + run-history row (fix 3.2) and is
 * idempotent against double-clicks (fix 3.4).
 */
export function PublishStoryDialog({
  story,
  open,
  onOpenChange,
  onUpdate,
}: {
  story: StoryItemFull | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (id: string, patch: Partial<StoryItemFull>) => void;
}) {
  const [when, setWhen] = useState("");
  const { accounts } = useAccounts();
  const publish = usePublishOutcome();

  if (!story) return null;

  const platform = story.platform ?? "instagram";
  const account = accounts.find((a) => a.platformId === platform);

  const publishNow = async () => {
    const draftId = story.id;
    const result = await publish({
      draftId,
      platform,
      accountHandle: account?.username,
      accountId: account?.id,
      body: async () => {
        onUpdate(story.id, { status: "live", scheduledAt: new Date().toISOString() });
        // Simulated network latency so the duplicate-protection window is real.
        await new Promise((r) => setTimeout(r, 400));
        return { postId: draftId };
      },
    });
    if (result.duplicate) {
      onUpdate(story.id, { status: "live", scheduledAt: new Date().toISOString() });
    }
    if (result.ok) onOpenChange(false);
  };

  const schedule = async () => {
    if (!when) return;
    onUpdate(story.id, { status: "scheduled", scheduledAt: new Date(when).toISOString() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish {story.title}</DialogTitle>
          <DialogDescription>
            {(story.slides?.length ?? 0)} slide{(story.slides?.length ?? 0) === 1 ? "" : "s"}. Pick "now" to go live immediately, or set a time. Every publish is logged in Activity and the Notifications bell.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Schedule time</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={schedule} disabled={!when}>
            <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Schedule
          </Button>
          <Button onClick={publishNow}>
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Publish now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
