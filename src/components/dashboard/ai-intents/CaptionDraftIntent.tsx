import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  Save,
  Copy,
  Send,
  Check,
  X,
  Loader2,
  Scissors,
  Zap,
  Smile,
  Megaphone,
  Wand2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { aiCreate } from "@/hooks/useAiCreate";
import { logMcpCall } from "@/hooks/useMcpActivity";
import { enqueueInbox } from "@/hooks/useMcpInbox";

export interface CaptionDraftPayload {
  id: string;
  title: string;
  body: string;
  hashtags?: string[];
  platformIds?: string[];
  source?: string;
}

interface Caption {
  id: string;
  title: string;
  body: string;
  hashtags: string[];
  platformIds: string[];
  tags: string[];
  status: "draft" | "ready" | "archived";
  createdAt: string;
}

interface Props {
  payload: CaptionDraftPayload;
  approved?: boolean;
  rejected?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const QUICK_TWEAKS: Array<{
  id: string;
  label: string;
  icon: typeof Scissors;
  hint: string;
}> = [
  { id: "shorter", label: "Shorter", icon: Scissors, hint: "Cut to half the length" },
  { id: "punchier", label: "Punchier", icon: Zap, hint: "Make it snappier and more energetic" },
  { id: "emoji", label: "+ Emoji", icon: Smile, hint: "Sprinkle in 3-4 fitting emojis" },
  { id: "cta", label: "+ CTA", icon: Megaphone, hint: "Add a clear call-to-action line at the end" },
];

interface Variant {
  title: string;
  body: string;
  hashtags: string[];
}

export function CaptionDraftIntent({ payload, approved, rejected, onApprove, onReject }: Props) {
  const navigate = useNavigate();
  // The initial payload becomes variant 0. Additional variants are appended
  // when the user asks for more options.
  const initialVariant: Variant = {
    title: payload.title ?? "",
    body: payload.body ?? "",
    hashtags: payload.hashtags ?? [],
  };
  const [variants, setVariants] = useState<Variant[]>([initialVariant]);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = variants[activeIdx] ?? initialVariant;

  const [title, setTitle] = useState(initialVariant.title);
  const [body, setBody] = useState(initialVariant.body);
  const [hashtags, setHashtags] = useState<string[]>(initialVariant.hashtags);
  const [tweaking, setTweaking] = useState<string | null>(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [saved, setSaved] = useState(false);

  const switchToVariant = (idx: number) => {
    const v = variants[idx];
    if (!v) return;
    setActiveIdx(idx);
    setTitle(v.title);
    setBody(v.body);
    setHashtags(v.hashtags);
  };

  const generateMoreVariants = async () => {
    if (generatingMore) return;
    setGeneratingMore(true);
    const seed = variants[0]?.body || body;
    const res = await aiCreate.captions({
      topic: `Write 3 alternative versions of this caption — each with a distinct angle (bold hook, storytelling, question-led). Keep the same intent, don't invent facts.\n\nOriginal:\n${seed}`,
      count: 3,
    });
    setGeneratingMore(false);
    const fresh = (res?.captions ?? []).map((c) => ({
      title: c.title || "Variant",
      body: c.body || "",
      hashtags: c.hashtags ?? [],
    }));
    if (fresh.length === 0) return;
    setVariants((prev) => [...prev, ...fresh]);
    // Auto-jump to the first newly-added variant.
    const nextIdx = variants.length;
    setActiveIdx(nextIdx);
    const v = fresh[0];
    setTitle(v.title);
    setBody(v.body);
    setHashtags(v.hashtags);
    toast.success(`Generated ${fresh.length} variants`);
  };

  const useThisVariant = () => {
    // Commit the currently displayed values back into the active variant slot,
    // so the "carousel" reflects the user's edits before saving.
    setVariants((prev) =>
      prev.map((v, i) => (i === activeIdx ? { title, body, hashtags } : v)),
    );
    toast(`Using variant ${activeIdx + 1} of ${variants.length}`);
  };

  const applyTweak = async (tweak: (typeof QUICK_TWEAKS)[number]) => {
    if (tweaking) return;
    setTweaking(tweak.id);
    const res = await aiCreate.captions({
      topic: `Rewrite this caption. ${tweak.hint}. Keep the same intent, don't invent facts.\n\nCaption:\n${body}`,
      count: 1,
    });
    setTweaking(null);
    const next = res?.captions?.[0];
    if (!next) return;
    setBody(next.body || body);
    if (next.hashtags?.length) setHashtags(next.hashtags);
    toast.success(`Applied "${tweak.label}"`);
  };
  // Silence "declared but not read" on `active` — kept for future readonly views.
  void active;

  const doSaveToLibrary = () => {
    const caption: Caption = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled caption",
      body: body.trim(),
      hashtags: hashtags.filter(Boolean),
      platformIds: payload.platformIds ?? [],
      tags: ["ai"],
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    pushLocalCollection<Caption>("library", "captions", [caption]);
    logMcpCall({
      tool: "create_caption_draft",
      status: "success",
      summary: `Saved to library: ${caption.title}`,
      resources: [{ kind: "caption", id: caption.id, label: caption.title }],
      payload: caption as unknown as Record<string, unknown>,
    });
    setSaved(true);
    toast.success("Saved to library", {
      description: caption.title,
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          // Remove the just-saved caption from the library store.
          try {
            const key = "smmpilot:library:captions";
            const raw = window.localStorage.getItem(key);
            const list = raw ? (JSON.parse(raw) as Caption[]) : [];
            const next = list.filter((c) => c.id !== caption.id);
            window.localStorage.setItem(key, JSON.stringify(next));
            // Fire a storage event so useLocalCollection subscribers refresh.
            window.dispatchEvent(new StorageEvent("storage", { key }));
            setSaved(false);
            toast("Undone");
          } catch {
            /* noop */
          }
        },
      },
    });
    onApprove();
  };

  const doCopy = async () => {
    const full = `${body}${hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : ""}`;
    await navigator.clipboard.writeText(full);
    toast.success("Copied");
  };

  const doSendToStudio = () => {
    // Prefill the create studio via sessionStorage so the create page can pick it up.
    try {
      window.sessionStorage.setItem(
        "smmpilot:create-studio:prefill",
        JSON.stringify({ title, body, hashtags, platformIds: payload.platformIds ?? [] }),
      );
    } catch {
      /* noop */
    }
    navigate("/dashboard/create");
    toast("Opened in Create Studio");
  };

  const doEnqueueForApproval = () => {
    enqueueInbox({
      kind: "caption-draft",
      source: payload.source ?? "ai-command:caption-draft",
      needsApproval: false,
      payload: {
        ...payload,
        title,
        body,
        hashtags,
      },
    });
    toast.success("Queued for library import");
    onApprove();
  };

  const done = approved || saved;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 space-y-3",
        done && "border-brand-green/40 bg-brand-green/5",
        rejected && "border-destructive/30 bg-destructive/5 opacity-70",
        !done && !rejected && "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Caption draft</span>
            {done && (
              <Badge className="text-[10px] h-5 bg-brand-green/20 text-brand-green border-brand-green/30">
                Saved
              </Badge>
            )}
            {rejected && (
              <Badge variant="destructive" className="text-[10px] h-5">
                Dismissed
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Edit inline, apply a quick tweak, then save.
          </p>
        </div>
        {!done && !rejected && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onReject} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {!rejected && (
        <>
          {/* Variant carousel — only surfaces once >1 exists */}
          {variants.length > 1 && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={done || activeIdx === 0}
                  onClick={() => switchToVariant(activeIdx - 1)}
                  aria-label="Previous variant"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center gap-0.5">
                  {variants.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={done}
                      onClick={() => switchToVariant(i)}
                      aria-label={`Variant ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === activeIdx ? "w-4 bg-primary" : "w-1.5 bg-primary/30 hover:bg-primary/60",
                      )}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={done || activeIdx >= variants.length - 1}
                  onClick={() => switchToVariant(activeIdx + 1)}
                  aria-label="Next variant"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Variant {activeIdx + 1}/{variants.length}
                </span>
                {!done && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={useThisVariant}
                  >
                    <Check className="h-3 w-3" />
                    Use this one
                  </Button>
                )}
              </div>
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Caption title"
            className="h-8 text-xs"
            disabled={done}
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="text-xs resize-none"
            disabled={done}
          />
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((h, i) => (
                <Badge key={`${h}-${i}`} variant="secondary" className="text-[10px] h-5">
                  #{h}
                </Badge>
              ))}
            </div>
          )}

          {!done && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TWEAKS.map((t) => {
                const Icon = t.icon;
                const isActive = tweaking === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTweak(t)}
                    disabled={!!tweaking || generatingMore}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-full border transition-all",
                      "border-border/60 bg-background/60 hover:border-primary/50 hover:bg-primary/10",
                      "disabled:opacity-40",
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Icon className="h-2.5 w-2.5 text-primary/80" />
                    )}
                    {t.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={generateMoreVariants}
                disabled={generatingMore || !!tweaking}
                className={cn(
                  "inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-full border transition-all",
                  "border-primary/40 bg-primary/[0.08] text-primary hover:bg-primary/15",
                  "disabled:opacity-40",
                )}
              >
                {generatingMore ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Wand2 className="h-2.5 w-2.5" />
                )}
                More variants
              </button>
            </div>
          )}

          {!done && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button size="sm" className="h-7 gap-1" onClick={doSaveToLibrary}>
                <Save className="h-3 w-3" />
                Save to Library
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={doCopy}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={doSendToStudio}>
                <Send className="h-3 w-3" />
                Studio
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-muted-foreground"
                onClick={doEnqueueForApproval}
                title="Queue in inbox (legacy flow)"
              >
                <Check className="h-3 w-3" />
                Queue
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
