import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
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
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { aiCreate } from "@/hooks/useAiCreate";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

const PLATFORMS = ["instagram", "twitter", "tiktok", "linkedin", "facebook"];

/**
 * Uses ai-create captions to generate one post per day for the next 7 days
 * around a chosen topic, at 10:00 local time. Every generated post lands in the
 * scheduled queue as status="paused" so the user can review before letting
 * them go live.
 */
export function AiFillWeekDialog({
  open,
  onOpenChange,
  startDate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** First day to fill (defaults to today). */
  startDate?: Date;
}) {
  const { add } = useScheduledPosts();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("friendly");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setPlatforms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generate = async () => {
    if (!topic.trim() || platforms.length === 0) {
      toast.error("Topic and at least one platform are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await aiCreate.captions({
        topic: topic.trim(),
        tone,
        platform: platforms[0],
        count: 7,
      });
      const captions = res?.captions ?? [];
      if (!captions.length) {
        toast.error("AI returned no captions — try a different topic.");
        return;
      }
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(10, 0, 0, 0);
      captions.slice(0, 7).forEach((c, i) => {
        const when = new Date(start);
        when.setDate(when.getDate() + i);
        add({
          caption: c.body ?? c.title ?? "",
          hashtags: c.hashtags,
          scheduledAt: when.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platformIds: platforms,
          status: "paused", // require explicit resume in QueueBoard
        });
      });
      toast.success(`Filled week with ${Math.min(captions.length, 7)} AI drafts — resume from Queue when ready.`);
      onOpenChange(false);
      setTopic("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate captions");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Fill Week
          </DialogTitle>
          <DialogDescription>
            Generate 7 posts (one per day at 10:00 local) around a topic. All drafts start paused
            for review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. sustainable fashion tips"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="friendly / bold / witty" />
          </div>
          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-colors",
                    platforms.includes(id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/60 text-muted-foreground",
                  )}
                >
                  <PlatformIcon platform={id} size="xs" />
                  <span className="capitalize">{id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={generate} disabled={busy || !topic.trim()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Generate 7 drafts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
