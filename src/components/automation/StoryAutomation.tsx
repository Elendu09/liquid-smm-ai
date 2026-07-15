import { useState } from "react";
import { Film, Clock, Eye, Link2, BarChart3, Plus, Sparkles, Layout, ShoppingBag, Clapperboard, BarChart2, HelpCircle, Timer, Quote, ShoppingCart, Star, Lightbulb, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import type { Platform } from "@/config/platforms";

const defaultTemplates = [
  { id: "t1", name: "Product Showcase", icon: "ShoppingBag", category: "Sales", uses: 1240 },
  { id: "t2", name: "Behind the Scenes", icon: "Clapperboard", category: "Engagement", uses: 890 },
  { id: "t3", name: "Poll Template", icon: "BarChart2", category: "Interactive", uses: 2100 },
  { id: "t4", name: "Q&A Story", icon: "HelpCircle", category: "Interactive", uses: 1560 },
  { id: "t5", name: "Countdown Timer", icon: "Timer", category: "Promo", uses: 780 },
  { id: "t6", name: "Quote of the Day", icon: "Quote", category: "Content", uses: 1890 },
];

const templateIcons: Record<string, typeof ShoppingBag> = {
  ShoppingBag, Clapperboard, BarChart2, HelpCircle, Timer, Quote, Layout,
};

interface Template { id: string; name: string; icon: string; category: string; uses: number }
interface Story { id: string; title: string; time: string; templateId?: string; mediaUrl?: string; status: string }

const defaultStories: Story[] = [
  { id: "s1", title: "Morning Motivation", time: "09:00", status: "scheduled" },
  { id: "s2", title: "Product Teaser", time: "14:00", status: "scheduled" },
  { id: "s3", title: "Live Announcement", time: "18:00", status: "scheduled" },
];

const highlights = [
  { id: 1, name: "Products", stories: 12, icon: ShoppingCart },
  { id: 2, name: "Reviews", stories: 8, icon: Star },
  { id: 3, name: "Tips", stories: 15, icon: Lightbulb },
  { id: 4, name: "Team", stories: 6, icon: Users },
];

const storyAnalytics = [
  { id: 1, title: "Yesterday's Poll", views: 2847, taps: 342, replies: 89, exitRate: "12%" },
  { id: 2, title: "BTS Content", views: 1923, taps: 156, replies: 45, exitRate: "18%" },
  { id: 3, title: "Product Launch", views: 4521, taps: 678, replies: 234, exitRate: "8%" },
];

interface StoryAutomationProps {
  selectedPlatforms?: Platform[];
}

export const StoryAutomation = ({ selectedPlatforms = [] }: StoryAutomationProps = {}) => {
  const scope = selectedPlatforms[0]?.id ?? "default";
  const [autoPost, setAutoPost] = useState(true);
  const [optimalTiming, setOptimalTiming] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const stories = useLocalCollection<Story>("story-automation-list", scope, defaultStories);
  const templates = useLocalCollection<Template>("story-templates", scope, defaultTemplates);

  const [storyDialog, setStoryDialog] = useState<{ open: boolean; editing?: Story }>({ open: false });
  const [templateDialog, setTemplateDialog] = useState(false);
  const [highlightView, setHighlightView] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20">
            <Film className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Story Automation</h3>
            <p className="text-sm text-muted-foreground">Automate your story posting and engagement</p>
          </div>
        </div>
        <Button
          onClick={() => setStoryDialog({ open: true })}
          className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Story
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Stories Today", value: String(stories.items.length), icon: Film, color: "text-pink-500" },
          { label: "Total Views", value: "12.4K", icon: Eye, color: "text-primary" },
          { label: "Avg. Completion", value: "78%", icon: BarChart3, color: "text-brand-green" },
          { label: "Link Taps", value: "342", icon: Link2, color: "text-brand-purple" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Story Templates
            </h4>
            <Button variant="outline" size="sm" onClick={() => setTemplateDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Custom
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.items.map((template) => {
              const Icon = templateIcons[template.icon] ?? Layout;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:border-primary/50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-pink-500" />
                  </div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground">{template.uses} uses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Auto Settings
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">Auto-Post Stories</p>
                  <p className="text-xs text-muted-foreground">Post at optimal times</p>
                </div>
                <Switch
                  checked={autoPost}
                  onCheckedChange={(v) => {
                    setAutoPost(v);
                    toast(v ? "Auto-post enabled" : "Auto-post disabled");
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">AI Timing</p>
                  <p className="text-xs text-muted-foreground">Optimize for engagement</p>
                </div>
                <Switch
                  checked={optimalTiming}
                  onCheckedChange={(v) => {
                    setOptimalTiming(v);
                    toast(v ? "AI timing enabled" : "AI timing disabled");
                  }}
                />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold mb-4">Story Highlights</h4>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map((highlight) => (
                <button
                  key={highlight.id}
                  onClick={() => setHighlightView(highlight.id)}
                  className="text-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 p-0.5 mx-auto mb-1 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      <highlight.icon className="h-5 w-5 text-pink-500" />
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate">{highlight.name}</p>
                  <p className="text-xs text-muted-foreground">{highlight.stories}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Stories */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Scheduled Stories
        </h4>
        <div className="space-y-3">
          {stories.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No stories scheduled yet.</p>
          )}
          {stories.items.map((story) => (
            <div
              key={story.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{story.title}</p>
                  <p className="text-sm text-muted-foreground">{story.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand-green/10 text-brand-green border-brand-green/30">
                  {story.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setStoryDialog({ open: true, editing: story })}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    stories.remove(story.id);
                    toast.success("Story deleted");
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Analytics */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Recent Story Performance
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Story</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Taps</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Replies</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Exit Rate</th>
              </tr>
            </thead>
            <tbody>
              {storyAnalytics.map((story) => (
                <tr key={story.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 font-medium">{story.title}</td>
                  <td className="p-3 text-right text-brand-green">{story.views.toLocaleString()}</td>
                  <td className="p-3 text-right text-primary">{story.taps}</td>
                  <td className="p-3 text-right text-brand-purple">{story.replies}</td>
                  <td className="p-3 text-right text-muted-foreground">{story.exitRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Story Dialog */}
      <StoryDialog
        key={storyDialog.editing?.id ?? (storyDialog.open ? "new" : "closed")}
        state={storyDialog}
        templates={templates.items}
        onClose={() => setStoryDialog({ open: false })}
        onSave={(story) => {
          if (storyDialog.editing) {
            stories.update(storyDialog.editing.id, story);
            toast.success("Story updated");
          } else {
            stories.add({ ...story, id: crypto.randomUUID(), status: "scheduled" });
            toast.success("Story scheduled");
          }
          setStoryDialog({ open: false });
        }}
      />

      {/* Custom Template Dialog */}
      <TemplateDialog
        open={templateDialog}
        onClose={() => setTemplateDialog(false)}
        onSave={(t) => {
          templates.add({ ...t, id: crypto.randomUUID(), uses: 0, icon: "Layout" });
          setTemplateDialog(false);
          toast.success("Template created");
        }}
      />

      {/* Highlight View Dialog */}
      <Dialog open={highlightView !== null} onOpenChange={() => setHighlightView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{highlights.find((h) => h.id === highlightView)?.name} Highlight</DialogTitle>
            <DialogDescription>
              {highlights.find((h) => h.id === highlightView)?.stories} stories saved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: highlights.find((h) => h.id === highlightView)?.stories ?? 0 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-lg bg-gradient-to-br from-pink-500/40 to-orange-500/40 flex items-center justify-center">
                <Film className="h-6 w-6 text-white/80" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function StoryDialog({
  state,
  templates,
  onClose,
  onSave,
}: {
  state: { open: boolean; editing?: Story };
  templates: Template[];
  onClose: () => void;
  onSave: (s: Omit<Story, "id" | "status">) => void;
}) {
  const [title, setTitle] = useState(state.editing?.title ?? "");
  const [time, setTime] = useState(state.editing?.time ?? "09:00");
  const [templateId, setTemplateId] = useState<string | undefined>(state.editing?.templateId);
  const [mediaUrl, setMediaUrl] = useState(state.editing?.mediaUrl ?? "");


  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.editing ? "Edit Story" : "Create Story"}</DialogTitle>
          <DialogDescription>
            {state.editing ? "Update your scheduled story." : "Schedule a new story to auto-post."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="story-title">Title</Label>
            <Input id="story-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning Motivation" />
          </div>
          <div>
            <Label htmlFor="story-time">Time</Label>
            <Input id="story-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="story-media">Media URL (optional)</Label>
            <Input id="story-media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error("Title is required");
                return;
              }
              onSave({ title: title.trim(), time, templateId, mediaUrl: mediaUrl.trim() || undefined });
            }}
          >
            {state.editing ? "Save changes" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: { name: string; category: string }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Content");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Template</DialogTitle>
          <DialogDescription>Create a reusable story template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tpl-name">Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Template" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Sales", "Engagement", "Interactive", "Promo", "Content"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!name.trim()) {
                toast.error("Name is required");
                return;
              }
              onSave({ name: name.trim(), category });
              setName("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
