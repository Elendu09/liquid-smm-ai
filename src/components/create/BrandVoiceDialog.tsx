import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, Plus, X, Wand2, Loader2, Copy, Check,
  User, Palette, ShieldCheck, MessageSquare, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBrandVoices, serializeVoice, voiceStrength, type BrandVoice } from "@/hooks/useBrandVoices";
import { aiCreate } from "@/hooks/useAiCreate";
import { cn } from "@/lib/utils";

const ARCHETYPES = ["Hero", "Sage", "Rebel", "Creator", "Everyman", "Explorer", "Caregiver", "Magician"];
const EMOJI_CHOICES = ["✨", "🚀", "⚡", "🎯", "📰", "🛍️", "🎨", "🧠", "💎", "🔥", "🌊", "⚖️", "🌱"];

const empty = (): BrandVoice => ({
  id: crypto.randomUUID(),
  name: "",
  tone: "",
  audience: "",
  description: "",
  emojis: "minimal",
  length: "medium",
  dos: [],
  donts: [],
  samples: [],
  keywords: [],
  banned: [],
  signaturePhrases: [],
  ctaLibrary: [],
  formality: 50,
  energy: 55,
  reading: "grade-8",
  perspective: "brand-we",
  hashtagStyle: "few",
  emoji: "✨",
  color: "#3b82f6",
  createdAt: new Date().toISOString(),
});

export function BrandVoiceDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: BrandVoice | null;
}) {
  const { add, update, items } = useBrandVoices();
  const [v, setV] = useState<BrandVoice>(empty());
  const [tab, setTab] = useState("identity");

  // Preview
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (open) {
      setV(editing ? { ...empty(), ...editing } : empty());
      setTab("identity");
      setPreviewText(""); setPreviewTopic("");
    }
  }, [open, editing]);

  const strength = useMemo(() => voiceStrength(v), [v]);

  const patch = (k: keyof BrandVoice, val: unknown) =>
    setV((prev) => ({ ...prev, [k]: val } as BrandVoice));

  const save = () => {
    if (!v.name.trim() || !v.tone.trim()) {
      toast.error("Name and tone are required");
      setTab("identity");
      return;
    }
    if (editing) {
      update(editing.id, { ...v, updatedAt: new Date().toISOString() });
      toast.success(`Updated "${v.name}"`);
    } else {
      if (items.some((x) => x.name.toLowerCase() === v.name.toLowerCase())) {
        toast.error("A voice with that name already exists");
        return;
      }
      add({ ...v, updatedAt: new Date().toISOString() });
      toast.success(`Voice "${v.name}" created`);
    }
    onOpenChange(false);
  };

  const analyzeFromSamples = async () => {
    if (v.samples.length === 0) {
      toast.error("Add at least one reference sample first");
      setTab("samples");
      return;
    }
    setAnalyzing(true);
    const res = await aiCreate.brief({
      topic: `Analyze the writing voice in these samples and return a brief that captures the tone.\n\n${v.samples.map((s, i) => `Sample ${i + 1}: ${s}`).join("\n\n")}`,
      goal: "Extract the underlying brand voice — tone descriptors, dos, don'ts, and a signature hook.",
      audience: v.audience || "general audience",
    });
    setAnalyzing(false);
    if (res) {
      setV((prev) => ({
        ...prev,
        tone: prev.tone || res.caption.slice(0, 120),
        signaturePhrases: [
          ...(prev.signaturePhrases ?? []),
          ...(res.hooks ?? []).slice(0, 3),
        ].slice(0, 6),
        ctaLibrary: prev.ctaLibrary?.length ? prev.ctaLibrary : [res.cta].filter(Boolean),
      }));
      toast.success("Voice traits extracted from samples");
      setTab("identity");
    }
  };

  const runPreview = async () => {
    const topic = previewTopic.trim() || "a friendly product update";
    setPreviewBusy(true);
    const res = await aiCreate.captions({
      topic: `${topic}\n\nBRAND VOICE:\n${serializeVoice(v)}`,
      tone: v.tone,
      platform: "instagram",
      count: 1,
    });
    setPreviewBusy(false);
    const c = res?.captions?.[0];
    if (c) setPreviewText(`${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}`);
    else toast.error("Preview failed — try again");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{ background: `${v.color ?? "#3b82f6"}22`, color: v.color ?? "#3b82f6" }}
            >
              {v.emoji ?? "✨"}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-serif italic text-muted-foreground">
                {editing ? "Editing voice" : "New brand voice"}
              </span>
              <span className="block text-base font-semibold truncate">{v.name || "Untitled voice"}</span>
            </span>
            <StrengthBadge score={strength} className="ml-auto" />
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-5 grid grid-cols-5 h-9">
            <TabsTrigger value="identity" className="text-xs gap-1"><User className="h-3 w-3" />Identity</TabsTrigger>
            <TabsTrigger value="style" className="text-xs gap-1"><Palette className="h-3 w-3" />Style</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs gap-1"><ShieldCheck className="h-3 w-3" />Rules</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs gap-1"><MessageSquare className="h-3 w-3" />Samples</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1"><Eye className="h-3 w-3" />Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="identity" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-3 items-start">
                <div>
                  <Label className="text-xs">Icon</Label>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {EMOJI_CHOICES.slice(0, 10).map((e) => (
                      <button
                        key={e} type="button"
                        onClick={() => patch("emoji", e)}
                        className={cn(
                          "h-7 w-7 rounded-md text-sm hover:bg-muted transition-colors",
                          v.emoji === e && "bg-primary/10 ring-1 ring-primary",
                        )}
                      >{e}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={v.name} onChange={(e) => patch("name", e.target.value)} placeholder="e.g. Founder mode" />
                  </div>
                  <div>
                    <Label>Short description</Label>
                    <Input value={v.description ?? ""} onChange={(e) => patch("description", e.target.value)} placeholder="One line — where and when to use this voice" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tone descriptors</Label>
                  <Input value={v.tone} onChange={(e) => patch("tone", e.target.value)} placeholder="playful, direct, occasionally sarcastic" />
                </div>
                <div>
                  <Label>Audience</Label>
                  <Input value={v.audience} onChange={(e) => patch("audience", e.target.value)} placeholder="Gen-Z SaaS founders" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Archetype</Label>
                  <Select value={v.archetype ?? ""} onValueChange={(x) => patch("archetype", x)}>
                    <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                    <SelectContent>
                      {ARCHETYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Perspective</Label>
                  <Select value={v.perspective ?? "brand-we"} onValueChange={(x) => patch("perspective", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first-person">I / me</SelectItem>
                      <SelectItem value="brand-we">We / us (brand)</SelectItem>
                      <SelectItem value="second-person">You / your (reader)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Accent</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={v.color ?? "#3b82f6"}
                      onChange={(e) => patch("color", e.target.value)}
                      className="h-9 w-12 rounded-md border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{v.color}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="mt-0 space-y-5">
              <SliderRow
                label="Formality" leftLabel="Casual" rightLabel="Formal"
                value={v.formality ?? 50}
                onChange={(n) => patch("formality", n)}
              />
              <SliderRow
                label="Energy" leftLabel="Calm" rightLabel="Hype"
                value={v.energy ?? 55}
                onChange={(n) => patch("energy", n)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Emoji use</Label>
                  <Select value={v.emojis} onValueChange={(x) => patch("emojis", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minimal">Minimal (1–2)</SelectItem>
                      <SelectItem value="expressive">Expressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Length</Label>
                  <Select value={v.length} onValueChange={(x) => patch("length", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (&lt; 120 chars)</SelectItem>
                      <SelectItem value="medium">Medium (120–400)</SelectItem>
                      <SelectItem value="long">Long (400+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reading level</Label>
                  <Select value={v.reading ?? "grade-8"} onValueChange={(x) => patch("reading", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grade-5">Grade 5 — everyone</SelectItem>
                      <SelectItem value="grade-8">Grade 8 — default</SelectItem>
                      <SelectItem value="grade-12">Grade 12 — informed</SelectItem>
                      <SelectItem value="expert">Expert — specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hashtag style</Label>
                  <Select value={v.hashtagStyle ?? "few"} onValueChange={(x) => patch("hashtagStyle", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="few">Few (1–3)</SelectItem>
                      <SelectItem value="many">Many (5–10)</SelectItem>
                      <SelectItem value="niche">Niche only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="mt-0 space-y-4">
              <ChipList label="Do" color="emerald" values={v.dos} onChange={(arr) => patch("dos", arr)} placeholder="Lead with a hook" />
              <ChipList label="Don't" color="rose" values={v.donts} onChange={(arr) => patch("donts", arr)} placeholder="Corporate jargon" />
              <ChipList label="Signature phrases" color="violet" values={v.signaturePhrases ?? []} onChange={(arr) => patch("signaturePhrases", arr)} placeholder="Hot take:" />
              <ChipList label="Preferred CTAs" color="sky" values={v.ctaLibrary ?? []} onChange={(arr) => patch("ctaLibrary", arr)} placeholder="Book a demo" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ChipList label="Prefer words" color="emerald" values={v.keywords ?? []} onChange={(arr) => patch("keywords", arr)} placeholder="ship, craft" />
                <ChipList label="Banned words" color="rose" values={v.banned ?? []} onChange={(arr) => patch("banned", arr)} placeholder="synergy" />
              </div>
            </TabsContent>

            <TabsContent value="samples" className="mt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Reference samples <span className="text-muted-foreground text-[10px]">(few-shot)</span></Label>
                <Button size="sm" variant="outline" onClick={analyzeFromSamples} disabled={analyzing || v.samples.length === 0}>
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                  Analyze samples → voice
                </Button>
              </div>
              <SampleEditor values={v.samples} onChange={(arr) => patch("samples", arr)} />
            </TabsContent>

            <TabsContent value="preview" className="mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                Generate a live caption using this voice to sanity-check tone and length before saving.
              </p>
              <div className="flex gap-2">
                <Input value={previewTopic} onChange={(e) => setPreviewTopic(e.target.value)} placeholder="Topic — e.g. we hit 10k customers" />
                <Button onClick={runPreview} disabled={previewBusy}>
                  {previewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 min-h-[140px] text-sm whitespace-pre-wrap">
                {previewText || <span className="text-muted-foreground text-xs italic">Preview appears here.</span>}
              </div>
              {previewText && (
                <Button size="sm" variant="outline" onClick={async () => {
                  await navigator.clipboard.writeText(previewText);
                  setCopied(true); setTimeout(() => setCopied(false), 1500);
                }}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copied ? "Copied" : "Copy preview"}
                </Button>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-5 py-3 border-t border-border/60 bg-muted/20 gap-2">
          <div className="mr-auto text-[11px] text-muted-foreground hidden sm:block">
            Voice strength: <span className="font-medium text-foreground">{strength}%</span>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save changes" : "Create voice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StrengthBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80 ? "bg-emerald-500/15 text-emerald-500" :
    score >= 55 ? "bg-amber-500/15 text-amber-500" :
                  "bg-muted text-muted-foreground";
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium tabular-nums", tone, className)}>
      {score}% ready
    </span>
  );
}

function SliderRow({
  label, leftLabel, rightLabel, value, onChange,
}: { label: string; leftLabel: string; rightLabel: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>{label}</Label>
        <span className="text-[11px] text-muted-foreground tabular-nums">{value}</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={5} onValueChange={([n]) => onChange(n)} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

function ChipList({
  label, color, values, onChange, placeholder,
}: {
  label: string;
  color: "emerald" | "rose" | "violet" | "sky";
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const map = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-500",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-500",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-500",
  } as const;
  const add = () => {
    const t = input.trim();
    if (!t) return;
    onChange([...values, t]); setInput("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1.5 mt-1">
        <Input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button type="button" size="icon" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((val, i) => (
            <span key={i} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]", map[color])}>
              {val}
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="opacity-60 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SampleEditor({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (!t) return;
    onChange([...values, t]); setInput("");
  };
  return (
    <>
      <div className="flex gap-1.5">
        <Textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a past caption that nails the voice" />
        <Button type="button" size="icon" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {values.length > 0 && (
        <ul className="space-y-1">
          {values.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
              <span className="flex-1 whitespace-pre-wrap">{s}</span>
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
