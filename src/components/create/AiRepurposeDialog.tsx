import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Check, Loader2, Shuffle, Zap, CalendarClock, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CharCounter } from "@/components/publish/CharCounter";
import { pushHubItems } from "@/hooks/useHubItems";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useBestTimes } from "@/hooks/useBestTimes";
import { aiCreate } from "@/hooks/useAiCreate";
import { limitFor } from "@/lib/charCount";
import { formatCost } from "@/config/aiCosts";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", tone: "visual + hashtags" },
  { id: "tiktok", label: "TikTok", tone: "punchy + hook" },
  { id: "linkedin", label: "LinkedIn", tone: "professional" },
  { id: "twitter", label: "X", tone: "witty + concise" },
  { id: "facebook", label: "Facebook", tone: "conversational" },
];

interface Variant {
  platform: string;
  label: string;
  tone: string;
  body: string;
  limit: number;
  /** "ai" when the live AI endpoint produced it, "sample" for the offline fallback */
  source: "ai" | "sample";
}

function mockBody(caption: string, platform: string) {
  const base = caption.slice(0, 120);
  switch (platform) {
    case "instagram":
      return `${base} ✨\n\nSave this for later →\n\n#content #creator #growth`;
    case "tiktok":
      return `POV: ${base} 🔥 #fyp #viral`;
    case "linkedin":
      return `${base}\n\nHere's what I learned →\n\nWhat's your take? Comment below.`;
    case "twitter":
      return `${base.slice(0, 200)} 🧵`;
    default:
      return `${base}\n\nWhat do you think? 👇`;
  }
}

/** One platform variant — live AI when possible, offline sample otherwise. */
async function buildVariant(
  caption: string,
  p: (typeof PLATFORMS)[number],
): Promise<Variant> {
  const fallback: Variant = {
    platform: p.id,
    label: p.label,
    tone: p.tone,
    body: mockBody(caption, p.id),
    limit: limitFor(p.id),
    source: "sample",
  };
  try {
    const res = await aiCreate.captions({ topic: caption, platform: p.id, count: 1 });
    const c = res?.captions?.[0];
    if (!c) return fallback;
    const tags = c.hashtags?.length ? `\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` : "";
    return { ...fallback, body: `${c.body}${tags}`, source: "ai" };
  } catch {
    return fallback;
  }
}

export function AiRepurposeDialog({ open, onOpenChange, initialCaption = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialCaption?: string }) {
  const [caption, setCaption] = useState(initialCaption);
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [queued, setQueued] = useState<string | null>(null);
  const { add } = useScheduledPosts();
  const bestTimes = useBestTimes();

  // Pick up a fresh source caption each time the dialog is (re)opened.
  useEffect(() => {
    if (open && initialCaption) setCaption(initialCaption);
  }, [open, initialCaption]);

  const run = async () => {
    if (!caption.trim()) {
      toast.error("Paste a caption first");
      return;
    }
    setBusy(true);
    setVariants([]);
    setQueued(null);
    // Staggered live reveal — each card lands as soon as its variant is ready.
    for (let i = 0; i < PLATFORMS.length; i++) {
      const v = await buildVariant(caption, PLATFORMS[i]);
      setVariants((prev) => [...prev, v]);
    }
    setBusy(false);
    toast.success("5 platform variants ready — live sync");
  };

  const updateBody = (platform: string, body: string) =>
    setVariants((prev) => prev.map((v) => (v.platform === platform ? { ...v, body } : v)));

  const copy = async (v: Variant) => {
    await navigator.clipboard.writeText(v.body);
    setCopied(v.platform);
    setTimeout(() => setCopied(null), 1200);
    toast.success(`Copied ${v.label} variant`);
  };

  /** Best staggered time for the variant at `idx` (2h spacing fallback). */
  const bestTimeFor = (idx: number) => {
    const now = new Date();
    const best = bestTimes.topHoursFor(now.getDay())?.[idx % 3] ?? 10 + idx * 2;
    const when = new Date(now);
    when.setDate(when.getDate() + Math.floor(idx / 3) + 1);
    when.setHours(best, 0, 0, 0);
    return when;
  };

  const queueOne = (v: Variant) => {
    const idx = variants.findIndex((x) => x.platform === v.platform);
    add({
      caption: v.body,
      scheduledAt: bestTimeFor(Math.max(0, idx)).toISOString(),
      platformIds: [v.platform],
      hashtags: v.body.match(/#\w+/g)?.map((h) => h.replace("#", "")) ?? [],
      status: "queued",
    });
    setQueued(v.platform);
    toast.success(`${v.label} variant queued at its best time`);
  };

  const saveAll = async () => {
    const items = variants.map((v) => ({
      id: crypto.randomUUID(),
      title: `${v.label} variant`,
      subtitle: v.body.slice(0, 80),
      status: "idea" as const,
      createdAt: new Date().toISOString(),
      metadata: { body: v.body, platform: v.platform },
    }));
    await pushHubItems("create-captions", items);
    toast.success(`Saved ${items.length} variants to Captions • ${formatCost("create.captions")} each`);
    onOpenChange(false);
  };

  const scheduleAll = async () => {
    if (variants.length === 0) return;
    variants.forEach((v, idx) => {
      add({
        caption: v.body,
        scheduledAt: bestTimeFor(idx).toISOString(),
        platformIds: [v.platform],
        hashtags: v.body.match(/#\w+/g)?.map((h) => h.replace("#", "")) ?? [],
        status: "queued",
      });
    });
    toast.success(`Scheduled ${variants.length} posts at best times • live sync • ${formatCost("create.captions")} used`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shuffle className="h-4 w-4 text-primary" /> AI Repurpose — 1 idea → 5 variants</DialogTitle>
          <DialogDescription>
            Live sync: adapts tone, length and hashtags per platform. Edit any variant before you copy, save or queue it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-auto pr-1">
          <div>
            <label className="text-xs font-medium">Source caption</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Paste your best caption here..." rows={3} className="mt-1" />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Button onClick={run} disabled={busy} size="sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Zap className="h-4 w-4 mr-1.5" />}
                {busy ? "Repurposing…" : "Repurpose live"}
              </Button>
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> 5 platforms</Badge>
              {variants.length > 0 && !busy && (
                <span className="text-[10px] text-muted-foreground">
                  {variants.filter((v) => v.source === "ai").length} AI · {variants.filter((v) => v.source === "sample").length} sample
                </span>
              )}
            </div>
          </div>

          {variants.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {variants.map((v) => (
                <div key={v.platform} className="rounded-xl border border-border/60 bg-card p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                      <PlatformIcon platform={v.platform} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{v.label}</span>
                      <Badge
                        variant={v.source === "ai" ? "default" : "outline"}
                        className={cn("text-[8px] px-1 h-3.5 shrink-0", v.source === "ai" && "bg-emerald-600 hover:bg-emerald-600")}
                      >
                        {v.source === "ai" ? "AI" : "Sample"}
                      </Badge>
                    </span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{v.tone}</span>
                  </div>

                  {/* Editable body — tweak the voice before copying or queuing */}
                  <Textarea
                    value={v.body}
                    onChange={(e) => updateBody(v.platform, e.target.value)}
                    rows={4}
                    className="text-sm leading-relaxed min-h-[96px] resize-y bg-muted/20"
                    aria-label={`${v.label} variant`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <CharCounter text={v.body} platform={v.platform} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(v)} aria-label={`Copy ${v.label} variant`}>
                        {copied === v.platform ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7", queued === v.platform && "text-emerald-500")}
                        onClick={() => queueOne(v)}
                        aria-label={`Queue ${v.label} variant at its best time`}
                        title="Queue at best time"
                      >
                        {queued === v.platform ? <Check className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-wrap items-center">
                    {v.body.match(/#\w+/g)?.slice(0, 3).map((h) => (
                      <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Pencil className="h-2.5 w-2.5" /> editable
                    </span>
                  </div>
                </div>
              ))}
              {busy && variants.length < PLATFORMS.length && (
                <div className="rounded-xl border border-dashed border-border/60 p-3 grid place-items-center text-muted-foreground min-h-[120px]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {variants.length > 0 && (
          <div className="flex justify-end gap-2 pt-3 border-t flex-wrap">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="secondary" onClick={scheduleAll}><Calendar className="h-4 w-4 mr-1.5" /> Schedule 5 at best times</Button>
            <Button onClick={saveAll}><Sparkles className="h-4 w-4 mr-1.5" /> Save all to Captions</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
