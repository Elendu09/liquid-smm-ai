import { useState } from "react";
import { toast } from "sonner";
import { Wand2, Loader2, Copy, Plus, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { aiCreate, type AiBrief } from "@/hooks/useAiCreate";
import { pushHubItems } from "@/hooks/useHubItems";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { MediaField } from "@/components/publish/MediaField";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { platforms as ALL_PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils";

const BRIEF_PLATFORMS = ["instagram", "tiktok", "twitter", "linkedin", "youtube"];

export function AiBriefDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("grow followers");
  const [audience, setAudience] = useState("");
  // Optional visual that guides the brief (tone, setting, product in frame).
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [platform, setPlatform] = useState("instagram");
  const [extraPlatforms, setExtraPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState("playful");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiBrief | null>(null);

  const shownPlatforms = [...BRIEF_PLATFORMS, ...extraPlatforms];
  const addablePlatforms = ALL_PLATFORMS.filter((p) => !shownPlatforms.includes(p.id));

  const run = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    const res = await aiCreate.brief({ topic, goal, audience, platform, tone, imageUrl: imageUrl || undefined });
    setBusy(false);
    if (res) setResult(res);
  };

  const copyAll = async () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}\n\nCTA: ${result.cta}`;
    await navigator.clipboard.writeText(text);
    toast.success("Post kit copied");
  };

  // Store the brief AND a reusable template together in one save.
  const saveToLibrary = async () => {
    if (!result) return;
    pushLocalCollection("publish", "templates", [
      {
        id: crypto.randomUUID(),
        name: topic.trim() || "AI idea template",
        caption: `${result.caption}${result.hashtags.length ? `\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}` : ""}`,
        platformIds: [platform],
        createdAt: new Date().toISOString(),
      },
    ]);
    await pushHubItems("create-ai", [
      {
        id: crypto.randomUUID(),
        title: topic || "AI brief",
        subtitle: result.caption.slice(0, 120),
        status: "generated",
        createdAt: new Date().toISOString(),
        metadata: {
          caption: result.caption,
          hashtags: result.hashtags,
          hooks: result.hooks,
          cta: result.cta,
          platform,
          tone,
          goal,
          audience,
          mediaUrl: imageUrl,
        },
      },
    ]);
    await pushHubItems("create-captions", [
      {
        id: crypto.randomUUID(),
        title: `Brief: ${topic}`,
        subtitle: result.caption.slice(0, 140),
        status: "polished",
        createdAt: new Date().toISOString(),
        metadata: { body: result.caption, hashtags: result.hashtags },
      },
    ]);
    toast.success("Brief + template saved (AI Studio, Captions & Templates)");
    onOpenChange(false);
    setResult(null);
    setTopic("");
    setImageUrl(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" strokeWidth={1.75} /> AI post brief
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Enhanced two-question intro (replaces the bare topic field) */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <p className="text-sm font-semibold">Let&rsquo;s begin with a few questions 🚀</p>
            <div>
              <label
                htmlFor="ai-brief-business"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                What is your business about?
              </label>
              <Input
                id="ai-brief-business"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. my smmsaas website"
              />
            </div>
            <div>
              <label
                htmlFor="ai-brief-audience"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                What is your target audience?
              </label>
              <Textarea
                id="ai-brief-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. small brands that want to grow on Instagram…"
                rows={2}
              />
            </div>
            {/* Visual direction — sits directly under the target audience */}
            <MediaField value={imageUrl} onChange={setImageUrl} label="Image (optional · shapes the brief)" />
          </div>
          {/* Platform logos filter — replaces the old platform dropdown */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" /> Filter by platform
            </p>
            <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Filter by platform">
              {shownPlatforms.map((p) => {
                const on = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p}
                    title={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "rounded-xl border-2 p-2 transition-all",
                      on
                        ? "border-primary bg-primary/5 ring-2 ring-primary/25 scale-105 shadow-sm"
                        : "border-transparent hover:border-border/80 hover:bg-muted/60 hover:scale-105",
                    )}
                  >
                    <PlatformIcon platform={p} size="sm" showBackground />
                  </button>
                );
              })}
              {/* "+" stays last — adds more platforms to the filter row */}
              {addablePlatforms.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Add platform filter"
                      className="grid h-[38px] w-[38px] place-items-center rounded-xl border-2 border-dashed border-border/70 text-muted-foreground transition-all hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 p-2">
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Add platform
                    </p>
                    <div className="max-h-52 space-y-0.5 overflow-y-auto">
                      {addablePlatforms.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setExtraPlatforms((prev) => [...prev, p.id]);
                            setPlatform(p.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                        >
                          <PlatformIcon platform={p.id} size="xs" />
                          <span className="flex-1 text-left">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue placeholder="Goal" /></SelectTrigger>
              <SelectContent>
                {["grow followers", "drive sales", "build community", "educate"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["playful", "professional", "bold", "minimal", "witty"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Green background per the reference mock — label text unchanged */}
          <Button
            onClick={run}
            disabled={busy || !topic.trim()}
            className="w-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-600/40 disabled:bg-emerald-600/50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
            Generate brief
          </Button>

          {result && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Caption</p>
                <Textarea readOnly value={result.caption} rows={4} className="text-sm" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Hooks</p>
                <ul className="space-y-1">
                  {result.hooks.map((h, i) => (
                    <li key={i} className="text-sm rounded-md bg-muted/50 px-2 py-1.5">{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Hashtags</p>
                <div className="flex flex-wrap gap-1">
                  {result.hashtags.map((h) => (
                    <Badge key={h} variant="secondary" className="text-[10px]">#{h}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">CTA</p>
                <p className="text-sm rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5 text-primary font-medium">
                  {result.cta}
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Actions — one line, equal width on mobile, tablet & desktop */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full min-w-0" onClick={copyAll} disabled={!result}>
            <Copy className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">Copy</span>
          </Button>
          <Button className="w-full min-w-0" onClick={saveToLibrary} disabled={!result}>
            <span className="truncate">Save brief + template</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
