import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BioTheme {
  handle: string;
  headline: string;
  accent: string;
  background: "solid" | "gradient" | "dark";
}

const ACCENTS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#10B981", "#0EA5E9"];
const BGS: BioTheme["background"][] = ["solid", "gradient", "dark"];

const KEY = "smmpilot:library:link-bio-theme";

export function loadBioTheme(): BioTheme {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

const defaults: BioTheme = {
  handle: "@yourbrand",
  headline: "Build your world",
  accent: ACCENTS[0],
  background: "gradient",
};

export function EditThemeDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave?: (t: BioTheme) => void;
}) {
  const [theme, setTheme] = useState<BioTheme>(defaults);

  useEffect(() => {
    if (open) setTheme(loadBioTheme());
  }, [open]);

  const save = () => {
    window.localStorage.setItem(KEY, JSON.stringify(theme));
    onSave?.(theme);
    toast.success("Theme saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" strokeWidth={1.75} /> Edit theme
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Handle</label>
            <Input value={theme.handle} onChange={(e) => setTheme({ ...theme, handle: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={theme.headline} onChange={(e) => setTheme({ ...theme, headline: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Accent</label>
            <div className="flex gap-1.5">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTheme({ ...theme, accent: c })}
                  aria-label={`Accent ${c}`}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform",
                    theme.accent === c ? "border-foreground scale-110" : "border-border/40 hover:scale-105",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Background</label>
            <div className="flex gap-1.5">
              {BGS.map((b) => (
                <button
                  key={b}
                  onClick={() => setTheme({ ...theme, background: b })}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors",
                    theme.background === b
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save theme</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
