import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiCreate } from "@/hooks/useAiCreate";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useAccounts } from "@/contexts/AccountContext";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const PLATFORMS = ["instagram", "twitter", "tiktok", "linkedin", "facebook"];

export function NewPostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { accounts } = useAccounts();
  const { add: addScheduled } = useScheduledPosts();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>([accounts[0]?.platformId ?? "instagram"]);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const aiAssist = async () => {
    if (!topic.trim()) {
      toast.error("Add a topic first");
      return;
    }
    setBusy(true);
    const res = await aiCreate.captions({ topic, count: 1, platform: selected[0] });
    setBusy(false);
    if (!res?.captions?.[0]) return;
    const c = res.captions[0];
    if (!title) setTitle(c.title);
    setCaption(`${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}`);
    toast.success("AI draft inserted");
  };

  const saveDraft = () => {
    if (!title.trim() || !caption.trim()) {
      toast.error("Title and caption required");
      return;
    }
    pushLocalCollection("create", "drafts", [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        status: "draft",
        caption,
        platform: selected[0] ?? "instagram",
        createdAt: new Date().toISOString(),
      },
    ]);
    toast.success("Draft saved to Studio");
    reset();
    onOpenChange(false);
  };

  const scheduleNow = () => {
    if (!caption.trim() || !scheduleAt || selected.length === 0) {
      toast.error("Caption, schedule time, and platform required");
      return;
    }
    addScheduled({
      caption,
      scheduledAt: new Date(scheduleAt).toISOString(),
      platformIds: selected,
    });
    toast.success("Queued");
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setTitle("");
    setTopic("");
    setCaption("");
    setScheduleAt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch teaser" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic (for AI)</label>
            <div className="flex gap-2">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's the post about?" />
              <Button variant="outline" size="sm" onClick={aiAssist} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1.5 hidden sm:inline">AI assist</span>
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} placeholder="Write your caption…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Platforms</label>
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1.5 transition-colors",
                    selected.includes(p)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted",
                  )}
                >
                  <PlatformIcon platform={p} size="xs" />
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Schedule for (optional)</label>
            <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={saveDraft}>Save draft</Button>
          <Button onClick={scheduleNow} disabled={!scheduleAt}>
            <Send className="h-4 w-4 mr-1" /> Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
