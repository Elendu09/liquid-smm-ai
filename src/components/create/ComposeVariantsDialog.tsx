import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, Trophy, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { aiCreate, type GeneratedCaption } from "@/hooks/useAiCreate";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { useBrandVoices, serializeVoice } from "@/hooks/useBrandVoices";
import { cn } from "@/lib/utils";

type Variant = GeneratedCaption & { label: string; score: number };
const LABELS = ["A · Hook-first", "B · Story", "C · Bold + CTA"];

/**
 * A/B compose dialog — generates N distinct variants for one topic using
 * the active brand voice. Each variant is scored via a lightweight
 * heuristic (hook strength, CTA presence, emoji balance) so users can
 * pick the winner at a glance.
 */
export function ComposeVariantsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { active } = useBrandVoices();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const scoreCaption = (c: GeneratedCaption): number => {
    let s = 60;
    if (/[!?]/.test(c.title)) s += 8; // curiosity
    if (c.body.length > 40 && c.body.length < 500) s += 12;
    if (/\bcta\b|comment|dm|link in bio|tap|save|share/i.test(c.body)) s += 10;
    const emojiCount = (c.body.match(/\p{Extended_Pictographic}/gu) ?? []).length;
    if (emojiCount >= 1 && emojiCount <= 3) s += 6;
    if (c.hashtags.length >= 5 && c.hashtags.length <= 10) s += 4;
    return Math.min(100, s);
  };

  const generate = async () => {
    if (!topic.trim()) { toast.error("Add a topic"); return; }
    setBusy(true);
    setVariants([]);
    const voiceLine = serializeVoice(active, platform);
    // Three parallel runs with distinct tone directives for real A/B contrast.
    const angles = [
      `${active?.tone ?? "engaging"} — open with a punchy hook, keep it snappy.`,
      `${active?.tone ?? "engaging"} — story-driven, 2-3 sentence narrative.`,
      `${active?.tone ?? "engaging"} — bold statement + clear call to action.`,
    ];
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
        return { ...c, label: LABELS[i], score: scoreCaption(c) };
      })
      .filter(Boolean) as Variant[];
    setBusy(false);
    if (out.length === 0) { toast.error("Nothing came back — try again"); return; }
    setVariants(out);
  };

  const copyOne = async (i: number, v: Variant) => {
    const text = `${v.body}\n\n${v.hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const saveWinner = (v: Variant) => {
    pushLocalCollection("create", "captions", [{
      id: crypto.randomUUID(),
      title: v.title,
      subtitle: v.body.slice(0, 140),
      status: "polished",
      createdAt: new Date().toISOString(),
      body: v.body,
      hashtags: v.hashtags,
    }]);
    toast.success(`"${v.label}" saved as polished caption`);
    onOpenChange(false);
    setVariants([]);
    setTopic("");
  };

  const winner = variants.length ? variants.reduce((a, b) => (a.score >= b.score ? a : b)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> A/B compose variants
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {active && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Using voice: <span className="font-medium text-foreground">{active.name}</span>
              <span>· {active.tone}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic — e.g. launching v2 pricing" />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              {["instagram", "tiktok", "twitter", "linkedin", "facebook"].map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <Button onClick={generate} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {busy ? "Generating 3 variants…" : "Generate A · B · C"}
          </Button>

          {variants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
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
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
