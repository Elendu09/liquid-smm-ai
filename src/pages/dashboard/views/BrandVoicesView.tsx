import { useMemo, useRef, useState } from "react";
import {
  Sparkles, Plus, Pencil, Trash2, Check, Star, Copy, Download,
  Upload, Search, FlaskConical, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBrandVoices, voiceStrength, VOICE_PRESETS,
  type BrandVoice,
} from "@/hooks/useBrandVoices";
import { BrandVoiceDialog } from "@/components/create/BrandVoiceDialog";
import { ComposeVariantsDialog } from "@/components/create/ComposeVariantsDialog";
import { cn } from "@/lib/utils";

export default function BrandVoicesView() {
  const {
    items, add, remove, activeId, setActive, update,
    duplicate, importVoices, exportVoices,
  } = useBrandVoices();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandVoice | null>(null);
  const [q, setQ] = useState("");
  const [tryOpen, setTryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((v) =>
      [v.name, v.tone, v.audience, v.archetype ?? "", (v.dos ?? []).join(" "), (v.donts ?? []).join(" ")]
        .join(" ").toLowerCase().includes(t),
    );
  }, [items, q]);

  const activate = (v: BrandVoice) => {
    setActive(v.id);
    toast.success(`"${v.name}" is now your active voice`);
  };

  const openEdit = (v: BrandVoice) => { setEditing(v); setOpen(true); };
  const openNew = () => { setEditing(null); setOpen(true); };

  const makeDefault = (v: BrandVoice) => {
    items.forEach((x) => update(x.id, { isDefault: x.id === v.id }));
    toast.success(`"${v.name}" set as default`);
  };

  const addPreset = (p: typeof VOICE_PRESETS[number]) => {
    if (items.some((x) => x.name.toLowerCase() === p.name.toLowerCase())) {
      toast.error(`"${p.name}" is already in your library`);
      return;
    }
    add({ ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString(), isDefault: false });
    toast.success(`Added "${p.name}"`);
  };

  const doExport = () => {
    const json = exportVoices();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `brand-voices-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} voice${items.length > 1 ? "s" : ""}`);
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      const n = importVoices(text);
      toast.success(`Imported ${n} voice${n === 1 ? "" : "s"}`);
    } catch {
      toast.error("Invalid voice file");
    }
  };

  const stats = useMemo(() => ({
    total: items.length,
    complete: items.filter((v) => voiceStrength(v) >= 70).length,
    samples: items.reduce((n, v) => n + v.samples.length, 0),
  }), [items]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-serif italic text-2xl sm:text-3xl leading-tight">Brand voices</h2>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Reusable personas that steer every AI generation across Create, Publish and Engage —
            tone, cadence, dos and don'ts, all wired into the same prompt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.currentTarget.value = ""; }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={doExport} disabled={items.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTryOpen(true)} disabled={!activeId}>
            <FlaskConical className="h-4 w-4 mr-1.5" /> Try in A/B
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" /> New voice
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Total voices" value={stats.total} />
        <Stat label="Ready to ship" value={`${stats.complete}/${stats.total}`} />
        <Stat label="Reference samples" value={stats.samples} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search voices, tones, audience…" className="pl-9" />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          {q ? "No voices match that search." : "No voices yet. Start from a preset below."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((v) => {
            const isActive = v.id === activeId;
            const strength = voiceStrength(v);
            const accent = v.color ?? "#3b82f6";
            return (
              <article
                key={v.id}
                className={cn(
                  "group relative rounded-2xl border p-4 space-y-3 transition-all overflow-hidden",
                  isActive ? "border-primary shadow-sm" : "border-border/60 bg-card hover:border-border",
                )}
                style={isActive ? undefined : { background: `linear-gradient(180deg, ${accent}0A, transparent 60%)` }}
              >
                <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />

                <header className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg shrink-0"
                      style={{ background: `${accent}22`, color: accent }}
                    >
                      {v.emoji ?? "✨"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold truncate">{v.name}</h3>
                        {v.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{v.tone}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-1 shrink-0">
                      <Check className="h-2.5 w-2.5" /> Active
                    </span>
                  )}
                </header>

                {v.description && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">"{v.description}"</p>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {v.archetype && <Chip>🎭 {v.archetype}</Chip>}
                  <Chip>👥 {v.audience || "—"}</Chip>
                  <Chip capitalize>📝 {v.length}</Chip>
                  <Chip capitalize>😊 {v.emojis}</Chip>
                </div>

                {(v.dos.length > 0 || v.donts.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {v.dos.slice(0, 2).map((d, i) => (
                      <span key={`d${i}`} className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 truncate max-w-[140px]">✓ {d}</span>
                    ))}
                    {v.donts.slice(0, 2).map((d, i) => (
                      <span key={`x${i}`} className="text-[10px] px-1.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 truncate max-w-[140px]">✕ {d}</span>
                    ))}
                  </div>
                )}

                {/* Strength meter */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Voice strength</span>
                    <span className="tabular-nums">{strength}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${strength}%`,
                        background: strength >= 80 ? "hsl(160 84% 45%)" : strength >= 55 ? "hsl(38 92% 55%)" : accent,
                      }}
                    />
                  </div>
                </div>

                <footer className="flex items-center justify-between pt-2 border-t border-border/40">
                  <Button size="sm" variant={isActive ? "ghost" : "outline"} onClick={() => activate(v)} disabled={isActive}>
                    {isActive ? "In use" : "Use voice"}
                  </Button>
                  <div className="flex items-center gap-0.5">
                    {!v.isDefault && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Set default" onClick={() => makeDefault(v)}>
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Duplicate"
                      onClick={() => { const c = duplicate(v.id); if (c) toast.success(`Duplicated as "${c.name}"`); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => openEdit(v)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {items.length > 1 && !v.isDefault && (
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive"
                        title="Delete"
                        onClick={() => { remove(v.id); toast.success("Voice removed"); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Preset gallery */}
      <section className="pt-4 border-t border-border/60">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Wand2 className="h-4 w-4 text-primary" /> Start from a preset
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Curated voices for common brand archetypes — one click to add and tweak.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {VOICE_PRESETS.map((p) => {
            const added = items.some((x) => x.name.toLowerCase() === p.name.toLowerCase());
            return (
              <button
                key={p.name}
                onClick={() => addPreset(p)}
                disabled={added}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all",
                  added
                    ? "border-border/40 opacity-50 cursor-not-allowed"
                    : "border-border/60 hover:border-primary hover:-translate-y-0.5 hover:shadow-sm",
                )}
                style={{ background: `linear-gradient(180deg, ${p.color}12, transparent)` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base" style={{ color: p.color }}>{p.emoji}</span>
                  <span className="text-xs font-semibold truncate">{p.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{p.tone}</p>
                {added && <span className="mt-1.5 inline-block text-[9px] text-muted-foreground">Already added</span>}
              </button>
            );
          })}
        </div>
      </section>

      <BrandVoiceDialog open={open} onOpenChange={setOpen} editing={editing} />
      <ComposeVariantsDialog open={tryOpen} onOpenChange={setTryOpen} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold font-serif italic tabular-nums">{value}</div>
    </div>
  );
}

function Chip({ children, capitalize }: { children: React.ReactNode; capitalize?: boolean }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground truncate", capitalize && "capitalize")}>
      {children}
    </span>
  );
}
