import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Brain, Sparkles, Loader2, ShieldAlert, ThumbsUp, MessageCircle, Ban, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { platforms } from "@/config/platforms";
import { limitsFor } from "@/config/engagementLimits";
import { aiEngage, type PostAnalysis } from "@/hooks/useAiEngage";
import { cn } from "@/lib/utils";

const TONES = ["friendly", "professional", "witty", "supportive", "curious"];

interface Props {
  keywords: string;
  negativeKeywords: string;
}

/**
 * Lets the bot actually *read* someone else's post before acting on it:
 * relevance scoring, spam/sensitivity screening, and human-sounding comment
 * drafts that respect each network's length and tone conventions.
 */
export function PostUnderstandingLab({ keywords, negativeKeywords }: Props) {
  const [platform, setPlatform] = useState("instagram");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [tone, setTone] = useState("friendly");
  const [analysis, setAnalysis] = useState<PostAnalysis | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [busy, setBusy] = useState<"analyze" | "draft" | null>(null);

  const limits = useMemo(() => limitsFor(platform), [platform]);
  const kwList = (s: string) => s.split(/[\s,]+/).map((k) => k.trim()).filter(Boolean);

  const analyze = async () => {
    if (!text.trim()) { toast.error("Paste the post you want the bot to read"); return; }
    setBusy("analyze");
    setDrafts([]);
    const res = await aiEngage.analyzePost({
      text,
      author: author || "creator",
      platform,
      keywords: kwList(keywords),
      negativeKeywords: kwList(negativeKeywords),
    });
    setAnalysis(res);
    setBusy(null);
  };

  const draft = async () => {
    if (!text.trim()) { toast.error("Paste a post first"); return; }
    setBusy("draft");
    const res = await aiEngage.draftComment({
      text,
      author: author || "creator",
      platform,
      tone,
      language: analysis?.language,
      count: 3,
    });
    setDrafts(res?.options ?? []);
    setBusy(null);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Read &amp; understand a post</h4>
        <Badge variant="secondary" className="text-[10px]">AI</Badge>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Paste someone else's post. The bot scores relevance against your keywords, screens spam and sensitive topics,
        then writes comments that read human and fit {limits.commentMax.toLocaleString()} characters on this network.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {platforms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs" htmlFor="pul-author">Author handle</Label>
          <Input id="pul-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="@fitness_guru" />
        </div>
      </div>

      <div>
        <Label className="text-xs" htmlFor="pul-text">Their post</Label>
        <Textarea
          id="pul-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the caption or comment thread the bot should understand…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={analyze} disabled={busy !== null}>
          {busy === "analyze" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
          Analyse post
        </Button>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" onClick={draft} disabled={busy !== null}>
          {busy === "draft" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Draft comments
        </Button>
      </div>

      {analysis && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn("text-[10px]", analysis.shouldEngage ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500")}>
              {analysis.shouldEngage ? "Safe to engage" : "Skip this one"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{analysis.topic || "untitled topic"}</Badge>
            <Badge variant="outline" className="text-[10px]">{analysis.sentiment}</Badge>
            <Badge variant="outline" className="text-[10px]">{analysis.language}</Badge>
            {analysis.spam && <Badge className="text-[10px] bg-rose-500/15 text-rose-500 gap-1"><Ban className="h-3 w-3" />spam</Badge>}
            {analysis.sensitive && <Badge className="text-[10px] bg-amber-500/15 text-amber-500 gap-1"><ShieldAlert className="h-3 w-3" />sensitive</Badge>}
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Relevance to your keywords</span><span className="font-medium text-foreground">{analysis.relevance}%</span>
            </div>
            <Progress value={analysis.relevance} className="h-1.5" />
          </div>
          <p className="text-xs text-muted-foreground">{analysis.summary}</p>
          <p className="text-xs"><span className="text-muted-foreground">Why: </span>{analysis.reason}</p>
          {analysis.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.suggestedActions.map((a) => (
                <Badge key={a} variant="secondary" className="text-[10px] gap-1">
                  {a === "like" ? <ThumbsUp className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}{a}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Human-sounding comment options</Label>
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-background/60 p-3 flex items-start gap-2">
              <p className="text-xs flex-1 leading-relaxed">{d}</p>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("text-[10px]", d.length > limits.commentMax ? "text-destructive" : "text-muted-foreground")}>
                  {d.length}/{limits.commentMax}
                </span>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6" aria-label="Copy comment"
                  onClick={() => { void navigator.clipboard.writeText(d); toast.success("Comment copied"); }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
