import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Send,
  Save,
  BookMarked,
  Repeat,
  Eye,
  PenLine,
  BookOpen,
  Megaphone,
  Clapperboard,
  TreePine,
  Newspaper,
  MessageCircle,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { MediaField } from "@/components/publish/MediaField";
import { CaptionField } from "@/components/publish/CaptionField";
import { PlatformPicker } from "@/components/shared/PlatformPicker";
import { aiCreate } from "@/hooks/useAiCreate";
import { useAccounts } from "@/contexts/AccountContext";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { useContentCategories } from "@/hooks/useContentCategories";
import type { Recurrence } from "@/hooks/useScheduledPosts";
import {
  CreateDialogShell,
  CreateDialogPreview,
} from "@/components/create/CreateDialogShell";
import { PostPreviewCard } from "@/components/create/PostPreviewCard";
import { TemplatePanel } from "@/components/create/TemplatePanel";
import type { PostTemplate } from "@/components/create/NewPostDialog";
import { cn } from "@/lib/utils";

export type StudioDraftStatus = "draft" | "review" | "scheduled";

export interface StudioDraft {
  id: string;
  title: string;
  status: StudioDraftStatus;
  caption: string;
  platform: string;
  /** Every channel toggled in the composer — synced to the queue on schedule */
  platformIds?: string[];
  /** First comment — synced to the queue entry so it auto-posts after publish */
  firstComment?: string;
  mediaUrl?: string;
  scheduledAt?: string;
  createdAt: string;
}

export interface NewDraftScheduleExtras {
  scheduleAt: string;
  platformIds: string[];
  firstComment?: string;
  categoryId?: string;
  recurrence?: Recurrence;
}

/** The normal five channels always shown in the unified composer. */
const DEFAULT_CHANNELS = ["instagram", "tiktok", "twitter", "linkedin", "facebook"];

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

/** Colored SVG glyph for a content category (replaces the plain emoji). */
function categoryIconFor(c: { name: string; emoji: string }): LucideIcon {
  const n = c.name.toLowerCase();
  if (/educ|learn|tip|teach|guide/.test(n)) return BookOpen;
  if (/promo|sell|sale|launch|offer/.test(n)) return Megaphone;
  if (/behind|bts|scene/.test(n)) return Clapperboard;
  if (/evergreen|recycl|repur/.test(n)) return TreePine;
  if (/news|trend|update/.test(n)) return Newspaper;
  if (/engage|community|question|poll/.test(n)) return MessageCircle;
  if (/review|testimonial|proof/.test(n)) return Star;
  const emojiMap: Record<string, LucideIcon> = {
    "📚": BookOpen,
    "🎯": Megaphone,
    "🎬": Clapperboard,
    "🌲": TreePine,
  };
  return emojiMap[c.emoji] ?? Tag;
}

interface NewDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The draft being worked on — null hides the dialog */
  draft: StudioDraft | null;
  /** True when the draft already lives in the studio collection (edit mode) */
  isEdit?: boolean;
  /** Patch the draft (functional update in the parent, safe during async AI calls) */
  onChange: (patch: Partial<StudioDraft>) => void;
  /** Persist the draft to the studio */
  onCreate: () => void;
  /** Schedule the draft (parent writes queue + status) */
  onSchedule: (extras: NewDraftScheduleExtras) => void;
}

/**
 * The unified "Create new draft" composer — the full AI-post feature set
 * (channels, AI assist, media, first comment, category, scheduling,
 * recurrence, reusable templates) with a permanent live preview column.
 */
export function NewDraftDialog({
  open,
  onOpenChange,
  draft,
  isEdit = false,
  onChange,
  onCreate,
  onSchedule,
}: NewDraftDialogProps) {
  const { accounts } = useAccounts();
  const { categories } = useContentCategories();
  const navigate = useNavigate();
  const { items: templates, add: addTemplate, remove: removeTemplate } =
    useLocalCollection<PostTemplate>("publish", "templates");

  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [recFreq, setRecFreq] = useState<"none" | Recurrence["freq"]>("none");
  const [recCount, setRecCount] = useState(4);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  // Right-side panel: live preview or the template browser (reference design).
  const [panel, setPanel] = useState<"preview" | "templates">("preview");
  // Mobile/tablet form ⇄ panel flip, driven by the eye toggle in the header.
  const [mobilePanel, setMobilePanel] = useState(false);
  // Which selected network the preview currently shows.
  const [previewPlatform, setPreviewPlatform] = useState<string>("instagram");
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  // Reset per-draft composer state when a different draft is opened —
  // the saved channel selection & first comment come back with the draft.
  useEffect(() => {
    setSelected(draft?.platformIds?.length ? draft.platformIds : draft ? [draft.platform] : []);
    setPreviewPlatform(draft?.platformIds?.[0] ?? draft?.platform ?? "instagram");
    setPanel("preview");
    setMobilePanel(false);
    setTopic("");
    setScheduleAt("");
    setFirstComment(draft?.firstComment ?? "");
    setCategoryId("");
    setRecFreq("none");
    setRecCount(4);
    setSaveTemplate(false);
    setTemplateName("");
    setAiDone(false);
  }, [draft?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the previewed network valid as channels are toggled.
  useEffect(() => {
    if (selected.length && !selected.includes(previewPlatform)) {
      setPreviewPlatform(selected[0]);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (p: string) => {
    const next = selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p];
    const ensured = next.length ? next : [p];
    setSelected(ensured);
    // Persist the full channel selection on the draft so it syncs to the queue.
    onChange({ platform: ensured[0], platformIds: ensured });
  };

  // First comment lives on the draft too — it must ride along when the
  // draft is scheduled or sent to the queue later.
  const updateFirstComment = (v: string) => {
    setFirstComment(v);
    onChange({ firstComment: v });
  };

  const aiAssist = async () => {
    if (!draft) return;
    if (!topic.trim()) { toast.error("Add a topic first"); return; }
    setBusy(true);
    const res = await aiCreate.captions({ topic, count: 1, platform: selected[0] ?? draft.platform });
    setBusy(false);
    if (!res?.captions?.[0]) return;
    const c = res.captions[0];
    if (!draft.title.trim() || draft.title === "Untitled draft") onChange({ title: c.title });
    onChange({ caption: `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` });
    setAiDone(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setAiDone(false), 2600);
    toast.success("AI caption generated — preview updated");
  };

  const applyTemplate = (t: PostTemplate) => {
    onChange({ title: t.name, caption: t.caption });
    if (t.platformIds.length) {
      setSelected(t.platformIds);
      setPreviewPlatform(t.platformIds[0]);
      onChange({ platform: t.platformIds[0], platformIds: t.platformIds });
    }
    // Jump back to the live preview so the inserted template is visible.
    setPanel("preview");
    setMobilePanel(true);
    toast.success(`Template “${t.name}” inserted — preview updated`);
  };

  const toggleTemplatesPanel = () => {
    const next = panel === "templates" ? "preview" : "templates";
    setPanel(next);
    if (next === "templates") setMobilePanel(true); // mobile: jump straight to the panel
  };

  // "+" in the templates header — save the current draft as a personal template.
  const createTemplateFromDraft = () => {
    if (!draft) return;
    if (!draft.caption.trim()) {
      toast.info("Write or generate a caption first, then save it as a template");
      return;
    }
    addTemplate({
      id: crypto.randomUUID(),
      name: draft.title.trim() || "Untitled template",
      caption: draft.caption,
      platformIds: selected,
      createdAt: new Date().toISOString(),
    });
    toast.success("Template saved — find it under Personal");
  };

  const connectChannel = () => {
    onOpenChange(false);
    navigate("/dashboard/settings/integrations");
  };

  const persistTemplateIfRequested = () => {
    if (!saveTemplate || !draft) return;
    const name = templateName.trim() || draft.title.trim() || "Untitled template";
    addTemplate({
      id: crypto.randomUUID(),
      name,
      caption: draft.caption,
      platformIds: selected,
      createdAt: new Date().toISOString(),
    });
    toast.success(`Template “${name}” saved`);
  };

  const handleCreate = () => {
    persistTemplateIfRequested();
    onCreate();
  };

  const handleSchedule = () => {
    if (!draft || !scheduleAt || !draft.caption.trim()) return;
    const recurrence: Recurrence | undefined =
      recFreq !== "none" ? { freq: recFreq, count: Math.max(1, recCount) } : undefined;
    persistTemplateIfRequested();
    onSchedule({
      scheduleAt,
      platformIds: selected,
      firstComment: firstComment.trim() || undefined,
      categoryId: categoryId || undefined,
      recurrence,
    });
  };

  const handle = useMemo(
    () =>
      (
        accounts.find((a) => a.platformId === (previewPlatform ?? draft?.platform))?.username ??
        "yourbrand"
      ).replace(/^@/, ""),
    [accounts, previewPlatform, draft?.platform],
  );

  if (!draft) return null;

  return (
    <CreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit draft" : "Create new draft"}
      description="Write it yourself or let AI draft it, then preview, save or schedule."
      headerActions={
        <>
          {/* Templates toggle — opens the template browser in the side panel */}
          <Button
            variant="outline"
            size="sm"
            aria-pressed={panel === "templates"}
            className={cn(
              panel === "templates" &&
                "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
            )}
            onClick={toggleTemplatesPanel}
          >
            <BookMarked className="h-3.5 w-3.5 mr-1.5" />
            Templates {templates.length > 0 && <span className="ml-1 text-muted-foreground">({templates.length})</span>}
          </Button>

          {/* Eye toggle — tablet/mobile only: flip between edit form and the
              live preview / templates panel without scrolling */}
          <Button
            variant="outline"
            size="icon"
            className={cn("h-8 w-8 rounded-full md:hidden", mobilePanel && "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}
            onClick={() => setMobilePanel((m) => !m)}
            aria-pressed={mobilePanel}
            aria-label={mobilePanel ? "Back to edit" : "Show preview"}
            title={mobilePanel ? "Back to edit" : "Show preview"}
          >
            {mobilePanel ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={handleSchedule} disabled={!scheduleAt || !draft.caption.trim()}>
            <Send className="h-4 w-4 mr-1" />
            Schedule
          </Button>
          <Button onClick={handleCreate}>
            <Save className="h-4 w-4 mr-1" />
            {isEdit ? "Save draft" : "Create draft"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {/* Form column — on mobile/tablet it flips with the side panel via the eye toggle */}
        <div className={cn("space-y-4 min-w-0", mobilePanel && "hidden md:block")}>
          <div>
            <label className={labelClass} htmlFor="new-draft-title">Title</label>
            <Input
              id="new-draft-title"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Give this draft a title"
            />
          </div>

          <PlatformPicker
            selected={selected}
            onToggle={toggle}
            available={DEFAULT_CHANNELS}
            label="Channels"
            size="sm"
          />

          <MediaField
            value={draft.mediaUrl}
            onChange={(url) => onChange({ mediaUrl: url })}
            label="Image"
          />

          <div>
            <label className={labelClass} htmlFor="new-draft-topic">Topic (for AI)</label>
            <div className="flex gap-2">
              <Input
                id="new-draft-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What's the post about?"
              />
              <Button variant="outline" size="sm" onClick={aiAssist} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1.5 hidden sm:inline">AI assist</span>
              </Button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Caption / Body</label>
            <CaptionField
              value={draft.caption}
              onChange={(v) => onChange({ caption: v })}
              placeholder="Write the post copy, or generate it from your image."
              platform={selected[0] ?? draft.platform}
              onAi={aiAssist}
              aiBusy={busy}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                First comment <span className="text-muted-foreground/70">(auto-posts after publish)</span>
              </label>
              <Textarea
                value={firstComment}
                onChange={(e) => updateFirstComment(e.target.value)}
                rows={2}
                placeholder="Drop hashtags or a link so they don't clutter the caption…"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => {
                    const Glyph = categoryIconFor(c);
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="inline-flex items-center gap-1.5">
                          <Glyph className="h-3.5 w-3.5 shrink-0" style={{ color: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Schedule for</label>
              <DateTimePicker value={scheduleAt} onChange={setScheduleAt} placeholder="Pick a date & time" />
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

        {/* Side panel — live preview or the template browser */}
        <div className={cn(!mobilePanel && "hidden md:block")}>
          {panel === "templates" ? (
            <TemplatePanel
              templates={templates}
              onInsert={applyTemplate}
              onRemove={removeTemplate}
              onCreateNew={createTemplateFromDraft}
              hasConnectedAccount={accounts.length > 0}
              onConnectChannel={connectChannel}
            />
          ) : (
            <CreateDialogPreview
              caption={draft.caption}
              platform={previewPlatform}
              platforms={selected}
              activePlatform={previewPlatform}
              onActivePlatformChange={setPreviewPlatform}
              generated={aiDone}
            >
              <PostPreviewCard
                caption={draft.caption}
                mediaUrl={draft.mediaUrl}
                handle={handle}
              />
            </CreateDialogPreview>
          )}
        </div>
      </div>
    </CreateDialogShell>
  );
}

export default NewDraftDialog;
