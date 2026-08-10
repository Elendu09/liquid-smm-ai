import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
  Loader2,
  Eye,
  ArrowUpRight,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NewPostDialog, type NewPostInitial } from "@/components/create/NewPostDialog";
import { useContentTemplates } from "@/hooks/useContentTemplates";
import { useBrandVoices, serializeVoice, PLATFORM_LABELS, type PlatformKey } from "@/hooks/useBrandVoices";
import { aiCreate } from "@/hooks/useAiCreate";
import { cn } from "@/lib/utils";
import { PanelSection } from "@/components/shared/PanelSection";

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

const TONE_OPTIONS = [
  "Punchy & bold",
  "Warm & conversational",
  "Authoritative & expert",
  "Playful & witty",
  "Story-driven",
  "Data-driven",
  "Inspirational",
  "Contrarian",
];

const AUDIENCE_OPTIONS = [
  "Founders & operators",
  "Creators & marketers",
  "Designers & builders",
  "SMB owners",
  "Enterprise buyers",
  "Gen-Z community",
  "Developers",
  "General audience",
];

const PLATFORM_OPTIONS: PlatformKey[] = [
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "facebook",
];

const DATA_SOURCES = [
  { id: "brand-voice", label: "My brand voice" },
  { id: "recent-posts", label: "Recent top posts" },
  { id: "trending", label: "Trending in niche" },
  { id: "audience-insights", label: "Audience insights" },
] as const;

const CATEGORY_ACCENT: Record<PromptTemplate["category"], string> = {
  Reflection: "text-violet-500 bg-violet-500/10 ring-violet-500/20",
  Discovery: "text-sky-500 bg-sky-500/10 ring-sky-500/20",
  Learning: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
  Playbook: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20",
  Engagement: "text-rose-500 bg-rose-500/10 ring-rose-500/20",
  Announcement: "text-indigo-500 bg-indigo-500/10 ring-indigo-500/20",
};

function CategoryBadge({ label }: { label: PromptTemplate["category"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        CATEGORY_ACCENT[label],
      )}
    >
      {label}
    </span>
  );
}

export function TemplatesSection() {
  const navigate = useNavigate();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [newPost, setNewPost] = useState<NewPostInitial | null>(null);
  const { upsert: upsertContentTemplate } = useContentTemplates();
  const { active: activeVoice } = useBrandVoices();

  // Remix controls
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [tone, setTone] = useState<string>(TONE_OPTIONS[0]);
  const [audience, setAudience] = useState<string>(AUDIENCE_OPTIONS[0]);
  const [platform, setPlatform] = useState<PlatformKey>("instagram");
  const [angle, setAngle] = useState("");
  const [sources, setSources] = useState<Record<string, boolean>>({
    "brand-voice": true,
  });

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

  const runRemix = async () => {
    if (!active) return;
    setRemixing(true);
    const enabledSources = DATA_SOURCES.filter((s) => sources[s.id]).map((s) => s.label);
    const voiceBlock =
      sources["brand-voice"] && activeVoice ? serializeVoice(activeVoice, platform) : "";

    const topic = [
      `Rewrite this template into a finished post for ${PLATFORM_LABELS[platform]}.`,
      `Tone: ${tone}.`,
      `Audience: ${audience}.`,
      angle ? `Angle to emphasize: ${angle}.` : "",
      enabledSources.length ? `Draw from: ${enabledSources.join(", ")}.` : "",
      voiceBlock ? `\nBrand voice:\n${voiceBlock}` : "",
      `\nTemplate:\n${bodyValue}`,
    ]
      .filter(Boolean)
      .join(" ");

    const res = await aiCreate.captions({ topic, tone, platform, count: 1 });
    setRemixing(false);
    if (!res?.captions?.length) return;
    const first = res.captions[0];
    const merged = [first.body, first.hashtags?.length ? `\n\n${first.hashtags.join(" ")}` : ""].join("");
    setDraft(merged);
    setEditing(true);
    setRemixOpen(false);
    toast.success("Remix applied — review and tweak before using");
  };

  const toggleSource = (id: string, v: boolean) =>
    setSources((s) => ({ ...s, [id]: v }));

  return (
    <div className="block">
      <PanelSection
        icon={Lightbulb}
        title="Prompt templates"
        description="Prompt-ready starters for your next post — pick one, remix it, ship it."
        accent="from-violet-500 via-fuchsia-500/50 to-transparent"
      >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => openPreview(t.id)}
              className={cn(
                "group relative flex flex-col rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all",
                "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={cn("grid h-8 w-8 place-items-center rounded-lg ring-1", CATEGORY_ACCENT[t.category])}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="grid h-6 w-6 -translate-x-1 translate-y-1 place-items-center rounded-full bg-muted text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <h3 className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug">{t.title}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">{t.short}</p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                <CategoryBadge label={t.category} />
                <span className="text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Use template
                </span>
              </div>
            </button>
          );
        })}
      </div>
      </PanelSection>

      {/* Show more → opens the AI Idea generator page */}
      <div className="mt-3 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/create/studio?section=ai")}
        >
          <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
          Show more — create an AI idea
        </Button>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <active.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <DialogTitle className="text-xl leading-snug">{active.title}</DialogTitle>
                <DialogDescription>{active.short}</DialogDescription>
              </DialogHeader>

              {/* Mobile: Preview / Edit toggle */}
              <div className="sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 rounded-xl text-[11px] gap-1.5 border-primary/30 text-primary"
                  onClick={() => setEditing((e) => !e)}
                >
                  {editing ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

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
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setRemixOpen(true)}
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

      {/* Advanced AI Remix Controls */}
      <Dialog open={remixOpen} onOpenChange={setRemixOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <DialogTitle>Steer the remix</DialogTitle>
            <DialogDescription>
              Set tone, audience, platform, and data sources. The AI will rewrite the template and drop it back into the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformKey)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Angle to emphasize (optional)</Label>
              <Input
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="e.g. focus on measurable outcomes"
                className="h-9"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Pull from</Label>
              <div className="grid grid-cols-2 gap-2">
                {DATA_SOURCES.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={!!sources[s.id]}
                      onCheckedChange={(v) => toggleSource(s.id, !!v)}
                    />
                    <span className="text-xs">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="ghost" size="sm" onClick={() => setRemixOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={runRemix} disabled={remixing} className="gap-1.5">
              {remixing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Remixing…
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Remix & apply
                </>
              )}
            </Button>
          </DialogFooter>
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
