import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Check, Loader2, Shuffle, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { pushHubItems } from "@/hooks/useHubItems";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useBestTimes } from "@/hooks/useBestTimes";
import { formatCost } from "@/config/aiCosts";
import { Calendar } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", limit: 2200, tone: "visual + hashtags" },
  { id: "tiktok", label: "TikTok", limit: 150, tone: "punchy + hook" },
  { id: "linkedin", label: "LinkedIn", limit: 3000, tone: "professional" },
  { id: "twitter", label: "X", limit: 280, tone: "witty + concise" },
  { id: "facebook", label: "Facebook", limit: 63206, tone: "conversational" },
];

function mockVariants(caption: string) {
  const base = caption.slice(0, 120);
  return PLATFORMS.map((p) => ({
    platform: p.id,
    label: p.label,
    body:
      p.id === "instagram"
        ? `${base} ✨\n\nSave this for later →\n\n#content #creator #growth`
        : p.id === "tiktok"
        ? `POV: ${base} 🔥 #fyp #viral`
        : p.id === "linkedin"
        ? `${base}\n\nHere's what I learned →\n\nWhat's your take? Comment below.`
        : p.id === "twitter"
        ? `${base.slice(0, 200)} 🧵`
        : `${base}\n\nWhat do you think? 👇`,
  }));
}

export function AiRepurposeDialog({ open, onOpenChange, initialCaption = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialCaption?: string }) {
  const [caption, setCaption] = useState(initialCaption);
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<ReturnType<typeof mockVariants>>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const { add } = useScheduledPosts();
  const bestTimes = useBestTimes();

  const run = async () => {
    if (!caption.trim()) {
      toast.error("Paste a caption first");
      return;
    }
    setBusy(true);
    // simulate live AI streaming with staggered reveal
    const mocks = mockVariants(caption);
    setVariants([]);
    for (let i = 0; i < mocks.length; i++) {
      await new Promise((r) => setTimeout(r, 300 + i * 200));
      setVariants((prev) => [...prev, mocks[i]]);
    }
    setBusy(false);
    toast.success("5 platform variants ready — live sync");
  };

  const copy = async (text: string, platform: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 1200);
    toast.success(`Copied ${platform} variant`);
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
    const now = new Date();
    variants.forEach((v, idx) => {
      // Use best time for platform if available, else stagger by 2h
      const best = bestTimes.topHoursFor(new Date().getDay())?.[idx % 3] ?? (10 + idx * 2);
      const when = new Date(now);
      when.setDate(when.getDate() + Math.floor(idx / 3) + 1);
      when.setHours(best, 0, 0, 0);
      add({
        caption: v.body,
        scheduledAt: when.toISOString(),
        platformIds: [v.platform],
        hashtags: v.body.match(/#\w+/g)?.map((h) => h.replace("#", "")) ?? [],
        status: "queued",
        createdAt: new Date().toISOString(),
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
          <DialogDescription>Live sync: adapts tone, length and hashtags per platform. One caption, five native voices.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-auto pr-1">
          <div>
            <label className="text-xs font-medium">Source caption</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Paste your best caption here..." rows={3} className="mt-1" />
            <div className="flex gap-2 mt-2">
              <Button onClick={run} disabled={busy} size="sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Zap className="h-4 w-4 mr-1.5" />}
                Repurpose live
              </Button>
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> 5 platforms</Badge>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {variants.map((v) => (
                <div key={v.platform} className="rounded-xl border border-border/60 bg-card p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold"><PlatformIcon platform={v.platform} className="h-4 w-4" />{v.label}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(v.body, v.platform)}>
                      {copied === v.platform ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{v.body}</p>
                  <div className="flex gap-1 flex-wrap">
                    {v.body.match(/#\w+/g)?.slice(0, 3).map((h) => (
                      <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                </div>
              ))}
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
