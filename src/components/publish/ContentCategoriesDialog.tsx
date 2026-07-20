import { useState } from "react";
import { toast } from "sonner";
import { Tag, Plus, Trash2, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useContentCategories, type CategoryCadence } from "@/hooks/useContentCategories";

const CADENCES: { value: CategoryCadence; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const PALETTE = ["#3B82F6", "#F97316", "#A855F7", "#10B981", "#F43F5E", "#EAB308", "#06B6D4", "#8B5CF6"];

export function ContentCategoriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { categories, add, remove } = useContentCategories();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState(PALETTE[0]);
  const [budget, setBudget] = useState(2);
  const [cadence, setCadence] = useState<CategoryCadence>("weekly");

  const canSave = name.trim().length > 0;

  const save = () => {
    add({ name: name.trim(), emoji: emoji.trim() || "✨", color, weeklyBudget: Math.max(0, budget), cadence });
    toast.success(`Category "${name.trim()}" added`);
    setName(""); setEmoji("✨"); setColor(PALETTE[0]); setBudget(2); setCadence("weekly");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[calc(100vw-2rem)] w-full max-h-[92vh] overflow-y-auto [&>button.absolute]:hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Content categories
              </DialogTitle>
              <DialogDescription>
                Group your posts by intent. Each category has a weekly budget and cadence — great for keeping a
                healthy content mix and for driving recycling rules.
              </DialogDescription>
            </div>
            <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground transition shrink-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Create */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[80px_1fr_120px]">
            <div className="space-y-1.5">
              <Label htmlFor="cat-emoji">Emoji</Label>
              <Input id="cat-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="text-center" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" placeholder="e.g. Case studies" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-budget">Per week</Label>
              <Input id="cat-budget" type="number" min={0} max={50} value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cadence</Label>
              <Select value={cadence} onValueChange={(v) => setCadence(v as CategoryCadence)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CADENCES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={`Pick ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={!canSave} onClick={save}>
              <Plus className="h-4 w-4 mr-1" /> Add category
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories ({categories.length})
          </h4>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="rounded-xl border border-border/60 bg-card/60 p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${c.color}22`, color: c.color }}>
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{c.weeklyBudget}/wk</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{c.cadence}</Badge>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                  onClick={() => { remove(c.id); toast.success("Category removed"); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
