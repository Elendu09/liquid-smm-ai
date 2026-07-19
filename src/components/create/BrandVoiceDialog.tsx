import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Plus, X, Layers, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBrandVoices,
  type BrandVoice,
  type PlatformKey,
  type PlatformOverride,
  PLATFORM_KEYS,
  PLATFORM_LABELS,
} from "@/hooks/useBrandVoices";
import { PLATFORM_ICON, PLATFORM_ACCENT } from "@/components/create/platformIcons";
import { cn } from "@/lib/utils";

const empty = (): BrandVoice => ({
  id: crypto.randomUUID(),
  name: "",
  tone: "",
  audience: "",
  emojis: "minimal",
  length: "medium",
  dos: [],
  donts: [],
  samples: [],
  createdAt: new Date().toISOString(),
  platformOverrides: {},
});

export function BrandVoiceDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: BrandVoice | null;
}) {
  const { add, update, items } = useBrandVoices();
  const [v, setV] = useState<BrandVoice>(empty());
  const [doInput, setDoInput] = useState("");
  const [dontInput, setDontInput] = useState("");
  const [sampleInput, setSampleInput] = useState("");
  const [openPlatform, setOpenPlatform] = useState<PlatformKey | null>(null);

  useEffect(() => {
    if (open) {
      setV(editing ? { platformOverrides: {}, ...editing } : empty());
      setDoInput(""); setDontInput(""); setSampleInput("");
      setOpenPlatform(null);
    }
  }, [open, editing]);

  const addChip = (kind: "dos" | "donts", value: string) => {
    const t = value.trim();
    if (!t) return;
    setV((prev) => ({ ...prev, [kind]: [...prev[kind], t] }));
    if (kind === "dos") setDoInput(""); else setDontInput("");
  };

  const removeChip = (kind: "dos" | "donts", i: number) =>
    setV((prev) => ({ ...prev, [kind]: prev[kind].filter((_, idx) => idx !== i) }));

  const addSample = () => {
    const t = sampleInput.trim();
    if (!t) return;
    setV((prev) => ({ ...prev, samples: [...prev.samples, t] }));
    setSampleInput("");
  };

  const removeSample = (i: number) =>
    setV((prev) => ({ ...prev, samples: prev.samples.filter((_, idx) => idx !== i) }));

  const setOverride = (p: PlatformKey, patch: Partial<PlatformOverride>) =>
    setV((prev) => ({
      ...prev,
      platformOverrides: {
        ...(prev.platformOverrides ?? {}),
        [p]: { ...(prev.platformOverrides?.[p] ?? {}), ...patch },
      },
    }));

  const clearOverride = (p: PlatformKey) =>
    setV((prev) => {
      const next = { ...(prev.platformOverrides ?? {}) };
      delete next[p];
      return { ...prev, platformOverrides: next };
    });

  const save = () => {
    if (!v.name.trim() || !v.tone.trim()) {
      toast.error("Name and tone are required");
      return;
    }
    if (editing) {
      update(editing.id, v);
      toast.success(`Updated "${v.name}"`);
    } else {
      if (items.some((x) => x.name.toLowerCase() === v.name.toLowerCase())) {
        toast.error("A voice with that name already exists");
        return;
      }
      add(v);
      toast.success(`Voice "${v.name}" created`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {editing ? "Edit brand voice" : "New brand voice"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Founder mode" />
            </div>
            <div>
              <Label>Audience</Label>
              <Input value={v.audience} onChange={(e) => setV({ ...v, audience: e.target.value })} placeholder="Gen-Z SaaS founders" />
            </div>
          </div>
          <div>
            <Label>Tone</Label>
            <Input value={v.tone} onChange={(e) => setV({ ...v, tone: e.target.value })} placeholder="playful, direct, occasionally sarcastic" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emoji use</Label>
              <Select value={v.emojis} onValueChange={(x) => setV({ ...v, emojis: x as BrandVoice["emojis"] })}>
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
              <Select value={v.length} onValueChange={(x) => setV({ ...v, length: x as BrandVoice["length"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (&lt; 120 chars)</SelectItem>
                  <SelectItem value="medium">Medium (120–400)</SelectItem>
                  <SelectItem value="long">Long (400+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ChipList
            label="Do"
            color="emerald"
            values={v.dos}
            input={doInput}
            setInput={setDoInput}
            onAdd={() => addChip("dos", doInput)}
            onRemove={(i) => removeChip("dos", i)}
            placeholder="Lead with a hook"
          />
          <ChipList
            label="Don't"
            color="rose"
            values={v.donts}
            input={dontInput}
            setInput={setDontInput}
            onAdd={() => addChip("donts", dontInput)}
            onRemove={(i) => removeChip("donts", i)}
            placeholder="Corporate jargon"
          />
          <div>
            <Label>Reference samples <span className="text-muted-foreground text-[10px]">(few-shot)</span></Label>
            <div className="flex gap-1.5 mt-1">
              <Textarea
                rows={2}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="Paste a past caption that nails the voice"
              />
              <Button type="button" size="icon" onClick={addSample}><Plus className="h-4 w-4" /></Button>
            </div>
            {v.samples.length > 0 && (
              <ul className="mt-2 space-y-1">
                {v.samples.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
                    <span className="flex-1 whitespace-pre-wrap">{s}</span>
                    <button onClick={() => removeSample(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Platform-specific overrides ─────────────────────── */}
          <div className="rounded-xl border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <Label className="!mb-0">Platform overrides</Label>
              <span className="text-[10px] text-muted-foreground">Same voice, tuned per channel</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {PLATFORM_KEYS.map((p) => {
                const Icon = PLATFORM_ICON[p];
                const override = v.platformOverrides?.[p];
                const enabled = !!override;
                const isOpen = openPlatform === p;
                return (
                  <div key={p} className={cn("rounded-lg border transition-colors", enabled ? "border-primary/50 bg-primary/[0.03]" : "border-border/50")}>
                    <button
                      type="button"
                      onClick={() => setOpenPlatform(isOpen ? null : p)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                    >
                      <Icon className={cn("h-4 w-4", PLATFORM_ACCENT[p])} strokeWidth={1.75} />
                      <span className="text-sm font-medium flex-1">{PLATFORM_LABELS[p]}</span>
                      {enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">Customised</span>
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Tone override</Label>
                            <Input
                              className="h-8 text-xs"
                              placeholder={`(inherits: ${v.tone || "—"})`}
                              value={override?.tone ?? ""}
                              onChange={(e) => setOverride(p, { tone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Length</Label>
                            <Select
                              value={override?.length ?? "__inherit"}
                              onValueChange={(x) => setOverride(p, { length: x === "__inherit" ? undefined : (x as PlatformOverride["length"]) })}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__inherit">Inherit ({v.length})</SelectItem>
                                <SelectItem value="short">Short</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Emoji</Label>
                            <Select
                              value={override?.emojis ?? "__inherit"}
                              onValueChange={(x) => setOverride(p, { emojis: x === "__inherit" ? undefined : (x as PlatformOverride["emojis"]) })}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__inherit">Inherit ({v.emojis})</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="expressive">Expressive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px]">Platform note</Label>
                          <Textarea
                            rows={2}
                            className="text-xs"
                            placeholder={placeholderFor(p)}
                            value={override?.notes ?? ""}
                            onChange={(e) => setOverride(p, { notes: e.target.value })}
                          />
                        </div>
                        {enabled && (
                          <button
                            type="button"
                            onClick={() => clearOverride(p)}
                            className="text-[10px] text-muted-foreground hover:text-destructive"
                          >
                            Clear override
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save changes" : "Create voice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function placeholderFor(p: PlatformKey): string {
  switch (p) {
    case "instagram": return "Hook in the first line, 8-15 hashtags, save-worthy tip.";
    case "tiktok": return "Punchy hook <2s, casual voice, trending sound reference.";
    case "twitter": return "Under 240 chars, one idea, no hashtags unless essential.";
    case "facebook": return "Conversational, longer form OK, question at the end.";
    case "linkedin": return "Thought leadership, story arc, 1 CTA, 3-5 tags.";
  }
}

function ChipList({
  label, color, values, input, setInput, onAdd, onRemove, placeholder,
}: {
  label: string;
  color: "emerald" | "rose";
  values: string[];
  input: string;
  setInput: (s: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  const border = color === "emerald" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-rose-500/30 bg-rose-500/10 text-rose-500";
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1.5 mt-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
        />
        <Button type="button" size="icon" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((val, i) => (
            <span key={i} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]", border)}>
              {val}
              <button onClick={() => onRemove(i)} className="opacity-60 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
