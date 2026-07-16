import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { linkBioThemes, THEME_STORAGE_KEY, loadActiveThemeId } from "./themePresets";

export default function ThemesView() {
  const [activeId, setActiveId] = useState<string>(loadActiveThemeId());

  const apply = (id: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setActiveId(id);
    const t = linkBioThemes.find((x) => x.id === id);
    toast.success(`Theme applied: ${t?.name ?? id}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        {linkBioThemes.length} handcrafted themes — pick one and it applies instantly to your live bio page.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {linkBioThemes.map((t) => {
          const isActive = t.id === activeId;
          return (
            <Card
              key={t.id}
              className={cn(
                "group relative overflow-hidden border transition-all",
                isActive
                  ? "border-primary/50 ring-2 ring-primary/30 shadow-lg"
                  : "border-border/50 hover:border-border hover:shadow-md",
              )}
            >
              {/* Preview */}
              <div className={cn("relative h-56 flex flex-col items-center justify-center gap-2 p-4", t.bg, t.textClass, t.fontClass)}>
                <div
                  className="w-14 h-14 rounded-full border-2 border-white/40 shadow-md"
                  style={{ background: t.accent }}
                />
                <p className="text-xs font-bold">@yourhandle</p>
                <p className={cn("text-[10px] text-center px-2", t.subTextClass)}>Your headline goes here</p>
                <div className="w-full max-w-[160px] space-y-1.5 mt-1">
                  {["Online classes", "Tutorials", "Shop"].map((l) => (
                    <div
                      key={l}
                      className={cn(
                        "w-full text-[10px] text-center py-1.5",
                        t.radius === "sm" && "rounded-sm",
                        t.radius === "md" && "rounded-md",
                        t.radius === "xl" && "rounded-xl",
                        t.radius === "full" && "rounded-full",
                        t.buttonClass,
                      )}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              {/* Meta */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold truncate">{t.name}</h3>
                  <span
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-background"
                    style={{ background: t.accent }}
                    aria-hidden
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{t.tagline}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {t.buttonStyle}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {t.radius} radius
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {t.fontClass.replace("font-", "")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={isActive ? "secondary" : "default"}
                  className="w-full h-8 text-xs mt-1"
                  onClick={() => apply(t.id)}
                  disabled={isActive}
                >
                  {isActive ? "Applied" : "Apply theme"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
