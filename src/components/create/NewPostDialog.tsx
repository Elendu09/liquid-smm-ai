import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Send, BookMarked, Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { aiCreate } from "@/hooks/useAiCreate";
import { pushLocalCollection, useLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts, type Recurrence } from "@/hooks/useScheduledPosts";
import { useAccounts } from "@/contexts/AccountContext";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const PLATFORMS = ["instagram", "twitter", "tiktok", "linkedin", "facebook"];

export interface PostTemplate {
  id: string;
  name: string;
  caption: string;
  platformIds: string[];
  createdAt: string;
}

export function NewPostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { accounts } = useAccounts();
  const { add: addScheduled } = useScheduledPosts();
  const { items: templates, add: addTemplate, remove: removeTemplate } =
    useLocalCollection<PostTemplate>("publish", "templates");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>([accounts[0]?.platformId ?? "instagram"]);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [recFreq, setRecFreq] = useState<"none" | Recurrence["freq"]>("none");
  const [recCount, setRecCount] = useState(4);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const applyTemplate = (t: PostTemplate) => {
    setTitle(t.name);
    setCaption(t.caption);
    setSelected(t.platformIds.length ? t.platformIds : selected);
    toast.success(`Template “${t.name}” applied`);
  };

  const aiAssist = async () => {
    if (!topic.trim()) { toast.error("Add a topic first"); return; }
    setBusy(true);
    const res = await aiCreate.captions({ topic, count: 1, platform: selected[0] });
    setBusy(false);
    if (!res?.captions?.[0]) return;
    const c = res.captions[0];
    if (!title) setTitle(c.title);
    setCaption(`${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}`);
    toast.success("AI draft inserted");
  };

  const persistTemplateIfRequested = () => {
    if (!saveTemplate) return;
    const name = templateName.trim() || title.trim() || "Untitled template";
    addTemplate({
      id: crypto.randomUUID(),
      name,
      caption,
      platformIds: selected,
      createdAt: new Date().toISOString(),
    });
    toast.success(`Template “${name}” saved`);
  };

  const saveDraft = () => {
    if (!title.trim() || !caption.trim()) { toast.error("Title and caption required"); return; }
    pushLocalCollection("create", "drafts", [{
      id: crypto.randomUUID(), title: title.trim(), status: "draft",
      caption, platform: selected[0] ?? "instagram",
      createdAt: new Date().toISOString(),
    }]);
    persistTemplateIfRequested();
    toast.success("Draft saved to Studio");
    reset(); onOpenChange(false);
  };

  const scheduleNow = () => {
    if (!caption.trim() || !scheduleAt || selected.length === 0) {
      toast.error("Caption, schedule time, and platform required"); return;
    }
    const recurrence: Recurrence | undefined =
      recFreq !== "none" ? { freq: recFreq, count: Math.max(1, recCount) } : undefined;
    addScheduled(
      { caption, scheduledAt: new Date(scheduleAt).toISOString(), platformIds: selected },
      { recurrence },
    );
    persistTemplateIfRequested();
    toast.success(recurrence ? `Queued ${recurrence.count} recurring posts` : "Queued");
    reset(); onOpenChange(false);
  };

  const reset = () => {
    setTitle(""); setTopic(""); setCaption(""); setScheduleAt("");
    setRecFreq("none"); setRecCount(4); setSaveTemplate(false); setTemplateName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>New post</DialogTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="mr-6">
                  <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                  Templates {templates.length > 0 && <span className="ml-1 text-muted-foreground">({templates.length})</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                {templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No templates yet. Tick “Save as template” below.</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 group">
                        <button
                          onClick={() => applyTemplate(t)}
                          className="flex-1 text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors"
                        >
                          <p className="font-medium truncate">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{t.caption.slice(0, 60)}</p>
                        </button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => { removeTemplate(t.id); toast.success("Template removed"); }}>
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
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
                <button key={p} onClick={() => toggle(p)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1.5 transition-colors",
                    selected.includes(p) ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}>
                  <PlatformIcon platform={p} size="xs" />
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Schedule for</label>
              <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Repeat className="h-3 w-3" /> Recurrence
              </label>
              <div className="flex gap-1.5">
                <Select value={recFreq} onValueChange={(v) => setRecFreq(v as typeof recFreq)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {recFreq !== "none" && (
                  <Input type="number" min={1} max={52} value={recCount}
                    onChange={(e) => setRecCount(Number(e.target.value) || 1)}
                    className="w-16" aria-label="Occurrences" />
                )}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Checkbox checked={saveTemplate} onCheckedChange={(c) => setSaveTemplate(!!c)} />
              Save as reusable template
            </label>
            {saveTemplate && (
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name (defaults to title)" className="h-8 text-xs" />
            )}
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
