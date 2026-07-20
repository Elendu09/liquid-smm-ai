import { useState } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  BookOpen,
  ClipboardList,
  Lightbulb,
  Megaphone,
  HelpCircle,
  Copy,
  Pencil,
  BookmarkPlus,
  Wand2,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { NewPostDialog, type NewPostInitial } from "@/components/create/NewPostDialog";
import { useContentTemplates } from "@/hooks/useContentTemplates";
import { cn } from "@/lib/utils";

export interface PromptTemplate {
  id: string;
  title: string;
  short: string;
  body: string;
  category: "Reflection" | "Discovery" | "Learning" | "Playbook" | "Engagement" | "Announcement";
  icon: LucideIcon;
  tone: string;
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: "lesson-off-plan",
    title: "Share a lesson from something that didn't go to plan",
    short: "Reflect on a setback and share what it taught you.",
    body:
      "Name what happened — briefly. You don't need the full backstory.\n\nThen zoom in on the moment you realized things had shifted. What did you notice? What did you do next?\n\nEnd with the lesson. What do you know now that you didn't before?",
    category: "Reflection",
    icon: RefreshCw,
    tone: "story",
  },
  {
    id: "attention-niche",
    title: "Share what's catching your attention in your niche",
    short: "Engage with one creator, trend, or idea worth signal-boosting.",
    body:
      "Pick one thing you keep coming back to this week — a post, a person, a shift in the space.\n\nSay what it is, and why it matters to you. Add one sharp take of your own.\n\nInvite your audience to share what's catching theirs.",
    category: "Discovery",
    icon: Search,
    tone: "curator",
  },
  {
    id: "books-changed-work",
    title: "Books that changed how I work",
    short: "Share a curated list of books that shaped how you build.",
    body:
      "List 3–5 books that shifted how you work — not the obvious classics, the ones that actually stuck.\n\nFor each, add one line: the idea that changed something for you.\n\nClose with the one you'd hand to your past self.",
    category: "Learning",
    icon: BookOpen,
    tone: "list",
  },
  {
    id: "step-by-step-process",
    title: "My step-by-step process that actually works",
    short: "Break down your personal method for achieving a repeatable result.",
    body:
      "Frame the outcome first — what does this process actually get you?\n\nWalk through the steps in order. Keep each one short and specific. Add the one detail people usually skip.\n\nEnd with the trap to avoid on your first try.",
    category: "Playbook",
    icon: ClipboardList,
    tone: "how-to",
  },
  {
    id: "hot-take",
    title: "Post a hot take your audience needs to hear",
    short: "Take a stance on something quietly under-discussed in your niche.",
    body:
      "Open with the belief in one line — no hedging.\n\nGive the strongest reason it's true, then the counter-argument you actually respect.\n\nClose with what changes if you're right.",
    category: "Engagement",
    icon: Megaphone,
    tone: "opinion",
  },
  {
    id: "ask-audience",
    title: "Ask your audience a question that starts a real conversation",
    short: "Prompt genuine replies with a specific, low-friction question.",
    body:
      "Skip the generic prompt. Pick a specific decision, tension, or trade-off in your space.\n\nGive a bit of context so people know why you're asking.\n\nAsk one clear question — the kind you'd want to answer yourself.",
    category: "Engagement",
    icon: HelpCircle,
    tone: "question",
  },
];

function CategoryBadge({ label }: { label: PromptTemplate["category"] }) {
  return (
    <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0.5">
      {label}
    </Badge>
  );
}

export function TemplatesSection() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [newPost, setNewPost] = useState<NewPostInitial | null>(null);
  const { upsert: upsertContentTemplate } = useContentTemplates();

  const active = TEMPLATES.find((t) => t.id === previewId) ?? null;
  const bodyValue = editing ? draft : active?.body ?? "";

  const openPreview = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setDraft(t.body);
    setEditing(false);
    setPreviewId(id);
  };

  const closePreview = () => {
    setPreviewId(null);
    setEditing(false);
  };

  const copyToClipboard = () => {
    if (!active) return;
    navigator.clipboard.writeText(bodyValue);
    toast.success("Template copied to clipboard");
  };

  const openInComposer = () => {
    if (!active) return;
    setNewPost({ title: active.title, caption: bodyValue });
    closePreview();
  };

  const saveAsReusable = () => {
    if (!active) return;
    upsertContentTemplate({
      platform: "instagram",
      toolKey: "caption-generator",
      name: active.title,
      body: bodyValue,
      tags: [active.category.toLowerCase(), active.tone],
    });
    toast.success("Saved to your template library");
  };

  const aiRemix = () => {
    if (!active) return;
    setNewPost({
      title: `${active.title} · remix`,
      caption: bodyValue + "\n\n[Ask AI to rewrite this in your voice above.]",
    });
    closePreview();
  };

  return (
    <div className="hidden md:block">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Templates
        </h2>
        <span className="text-xs text-muted-foreground">
          Prompt-ready starters for your next post
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => openPreview(t.id)}
              className={cn(
                "group text-left rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4",
                "hover:border-primary/50 hover:-translate-y-0.5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold leading-snug line-clamp-3">{t.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.short}</p>
              <div className="mt-3">
                <CategoryBadge label={t.category} />
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <active.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <DialogTitle className="text-xl leading-snug">{active.title}</DialogTitle>
                <DialogDescription>{active.short}</DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                {editing ? (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={8}
                    className="bg-transparent border-0 focus-visible:ring-0 resize-none p-0 text-sm leading-relaxed"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {bodyValue}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setEditing((e) => !e)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="text-xs">{editing ? "Done editing" : "Edit"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs">Copy</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={saveAsReusable}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span className="text-xs">Save</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={aiRemix}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span className="text-xs">AI remix</span>
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5" onClick={openInComposer}>
                    <Send className="h-3.5 w-3.5" />
                    <span className="text-xs">Use template</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-medium">By SkyRank</span>
                <span>•</span>
                <span>{active.category}</span>
                <span>•</span>
                <span className="capitalize">{active.tone}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NewPostDialog
        open={!!newPost}
        onOpenChange={(o) => { if (!o) setNewPost(null); }}
        initial={newPost ?? undefined}
      />
    </div>
  );
}
