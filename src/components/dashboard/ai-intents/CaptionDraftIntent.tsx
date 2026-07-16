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

export function CaptionDraftIntent({ payload, approved, rejected, onApprove, onReject }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(payload.title ?? "");
  const [body, setBody] = useState(payload.body ?? "");
  const [hashtags, setHashtags] = useState<string[]>(payload.hashtags ?? []);
  const [tweaking, setTweaking] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
                const active = tweaking === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTweak(t)}
                    disabled={!!tweaking}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10.5px] px-2 py-1 rounded-full border transition-all",
                      "border-border/60 bg-background/60 hover:border-primary/50 hover:bg-primary/10",
                      "disabled:opacity-40",
                    )}
                  >
                    {active ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Icon className="h-2.5 w-2.5 text-primary/80" />
                    )}
                    {t.label}
                  </button>
                );
              })}
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
