import { useState } from "react";
import { Sparkles, Plus, Pencil, Trash2, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBrandVoices, type BrandVoice } from "@/hooks/useBrandVoices";
import { BrandVoiceDialog } from "@/components/create/BrandVoiceDialog";
import { cn } from "@/lib/utils";

export default function BrandVoicesView() {
  const { items, remove, activeId, setActive, update } = useBrandVoices();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandVoice | null>(null);
  const [, force] = useState(0); // to re-render after localStorage active toggle

  const activate = (v: BrandVoice) => {
    setActive(v.id);
    force((n) => n + 1);
    toast.success(`"${v.name}" is now your active voice`);
  };

  const openEdit = (v: BrandVoice) => { setEditing(v); setOpen(true); };
  const openNew = () => { setEditing(null); setOpen(true); };

  const makeDefault = (v: BrandVoice) => {
    items.forEach((x) => update(x.id, { isDefault: x.id === v.id }));
    toast.success(`"${v.name}" set as default`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Brand voices</h2>
          <p className="text-sm text-muted-foreground">
            Every AI generation in Create reuses your active voice — tone, dos, don'ts and reference samples.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New voice
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((v) => {
          const isActive = v.id === activeId;
          return (
            <article
              key={v.id}
              className={cn(
                "relative rounded-2xl border p-4 space-y-2 transition-colors",
                isActive ? "border-primary bg-primary/[0.04]" : "border-border/60 bg-card hover:bg-muted/30",
              )}
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold truncate">{v.name}</h3>
                    {v.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{v.tone}</p>
                </div>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> Active
                  </span>
                )}
              </header>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground truncate">👥 {v.audience || "—"}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">📝 {v.length}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">😊 {v.emojis}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">✍ {v.samples.length} samples</span>
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
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => openEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {items.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
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
      <BrandVoiceDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
