import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, Trophy, Send, Layers, Clock, Zap, Save, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { aiCreate, type GeneratedCaption } from "@/hooks/useAiCreate";
import { pushHubItems } from "@/hooks/useHubItems";
import { useBrandVoices, serializeVoice } from "@/hooks/useBrandVoices";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

type Variant = GeneratedCaption & { label: string; score: number };
const BASE_LABELS = ["A · Hook-first", "B · Story", "C · Bold + CTA", "D · Question", "E · Listicle", "F · Data-driven", "G · Behind-scenes", "H · Urgency", "I · Social-proof", "J · How-to"];

const TONES = [
  "open with a punchy hook, keep it snappy.",
  "story-driven, 2-3 sentence narrative.",
  "bold statement + clear call to action.",
  "start with a provocative question.",
  "listicle — 3 bullets, scannable.",
  "data-driven — include a stat or number.",
  "behind the scenes — personal, authentic.",
  "urgency — limited time, FOMO.",
  "social proof — testimonial or result.",
  "how-to — step-by-step value.",
];

/**
 * Enhanced Template Variant Generator — creates multiple versions of one post automatically.
 * - Choose count (3/5/8/10), auto-generates distinct tones
 * - Shows scoring, bulk save & staggered auto-schedule
 */
export function ComposeVariantsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { active } = useBrandVoices();
  const { add } = useScheduledPosts();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [count, setCount] = useState("3");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const scoreCaption = (c: GeneratedCaption): number => {
    let s = 60;
    if (/[!?]/.test(c.title)) s += 8;
    if (c.body.length > 40 && c.body.length < 500) s += 12;
    if (/\bcta\b|comment|dm|link in bio|tap|save|share/i.test(c.body)) s += 10;
    const emojiCount = (c.body.match(/\p{Extended_Pictographic}/gu) ?? []).length;
    if (emojiCount >= 1 && emojiCount <= 3) s += 6;
    if (c.hashtags.length >= 5 && c.hashtags.length <= 10) s += 4;
    return Math.min(100, s);
  };

  const generate = async () => {
    if (!topic.trim()) { toast.error("Add a topic"); return; }
    const n = parseInt(count, 10) || 3;
    setBusy(true);
    setVariants([]);
    const voiceLine = serializeVoice(active, platform);
    const angles = Array.from({ length: n }, (_, i) => `${active?.tone ?? "engaging"} — ${TONES[i % TONES.length]}`);
    const runs = await Promise.all(
      angles.map((tone) =>
        aiCreate.captions({
          topic: voiceLine ? `${topic}\n\nBRAND VOICE:\n${voiceLine}` : topic,
          tone,
          platform,
          count: 1,
        }),
      ),
    );
    const out: Variant[] = runs
      .map((r, i) => {
        const c = r?.captions?.[0];
        if (!c) return null;
        return { ...c, label: BASE_LABELS[i] ?? `Variant ${i+1}`, score: scoreCaption(c) };
      })
      .filter(Boolean) as Variant[];
    setBusy(false);
    if (out.length === 0) { toast.error("Nothing came back — try again"); return; }
    setVariants(out);
    toast.success(`Generated ${out.length} variants automatically`);
    if (autoSchedule) {
      // auto-schedule staggered by 2 hours
      out.forEach((v, idx) => {
        const when = new Date(Date.now() + (idx+1)*2*60*60*1000).toISOString();
        add({
          caption: `${v.title}\n\n${v.body}\n\n${v.hashtags.map(h=>"#"+h).join(" ")}`,
          scheduledAt: when,
          platformIds: [platform],
          hashtags: v.hashtags,
        } as any);
      });
      toast.success(`Auto-scheduled ${out.length} variants staggered 2h apart`);
    }
  };

  const copyOne = async (i: number, v: Variant) => {
    const text = `${v.title}\n\n${v.body}\n\n${v.hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const saveWinner = async (v: Variant) => {
    await pushHubItems("create-captions", [{
      id: crypto.randomUUID(),
      title: v.title,
      subtitle: v.body.slice(0, 140),
      status: "polished",
      createdAt: new Date().toISOString(),
      metadata: { body: v.body, hashtags: v.hashtags, variant: v.label, score: v.score, platform, topic },
    }]);
    toast.success(`"${v.label}" saved as polished caption`);
  };

  const saveAll = async () => {
    await pushHubItems("create-captions", variants.map(v=> ({
      id: crypto.randomUUID(),
      title: v.title,
      subtitle: v.body.slice(0, 140),
      status: "polished",
      createdAt: new Date().toISOString(),
      metadata: { body: v.body, hashtags: v.hashtags, variant: v.label, score: v.score, platform, topic },
    })));
    toast.success(`Saved all ${variants.length} variants`);
    onOpenChange(false);
    setVariants([]);
    setTopic("");
  };

  const scheduleAll = () => {
    variants.forEach((v, idx) => {
      const when = new Date(Date.now() + (idx+1)*2*60*60*1000).toISOString();
      add({
        caption: `${v.title}\n\n${v.body}\n\n${v.hashtags.map(h=>"#"+h).join(" ")}`,
        scheduledAt: when,
        platformIds: [platform],
        hashtags: v.hashtags,
      } as any);
    });
    toast.success(`Scheduled ${variants.length} variants staggered`);
  };

  const winner = variants.length ? variants.reduce((a, b) => (a.score >= b.score ? a : b)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Template Variant Generator
          </DialogTitle>
          <DialogDescription>Creates multiple versions of one post automatically — pick count, tones, auto-save or auto-schedule.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {active && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Using voice: <span className="font-medium text-foreground">{active.name}</span>
              <span>· {active.tone}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_150px] gap-2">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic — e.g. launching v2 pricing" />
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 variants</SelectItem>
                <SelectItem value="5">5 variants</SelectItem>
                <SelectItem value="8">8 variants</SelectItem>
                <SelectItem value="10">10 variants</SelectItem>
              </SelectContent>
            </Select>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              {["instagram", "tiktok", "twitter", "linkedin", "facebook", "threads", "youtube"].map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs font-medium">Auto-schedule variants</p>
                <p className="text-[11px] text-muted-foreground">Stagger by 2h in queue automatically</p>
              </div>
            </div>
            <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} />
          </div>
          <Button onClick={generate} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {busy ? `Generating ${count} variants…` : `Generate ${count} variants automatically`}
          </Button>

          {variants.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Badge variant="secondary" className="text-[10px]">{variants.length} generated</Badge>
                <span className="text-[11px] text-muted-foreground">Winner: {winner?.label} · {winner?.score}/100</span>
                <div className="ml-auto flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={saveAll}><Save className="h-3.5 w-3.5 mr-1" /> Save all</Button>
                  <Button size="sm" onClick={scheduleAll}><Calendar className="h-3.5 w-3.5 mr-1" /> Schedule all staggered</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {variants.map((v, i) => {
                  const isWinner = v === winner;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3 flex flex-col gap-2 relative",
                        isWinner ? "border-primary bg-primary/[0.04]" : "border-border/60",
                      )}
                    >
                      {isWinner && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                          <Trophy className="h-2.5 w-2.5" /> Top score
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{v.label}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium tabular-nums",
                          v.score >= 85 ? "bg-emerald-500/15 text-emerald-500" :
                          v.score >= 70 ? "bg-amber-500/15 text-amber-500" :
                                         "bg-muted text-muted-foreground",
                        )}>{v.score}/100</span>
                      </div>
                      <p className="text-sm font-semibold">{v.title}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6 flex-1">{v.body}</p>
                      <div className="flex flex-wrap gap-1">
                        {v.hashtags.slice(0, 5).map((h) => (
                          <Badge key={h} variant="secondary" className="text-[10px] h-4 px-1.5">#{h}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => copyOne(i, v)}>
                          {copied === i ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                          {copied === i ? "Copied" : "Copy"}
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => saveWinner(v)}>
                          <Send className="h-3.5 w-3.5 mr-1" /> Use
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
