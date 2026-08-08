import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, ArrowUpRight, Palette, Layout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "./templatePresets";
import { designPresets, DESIGN_PRESET_KEY } from "./designPresets";
import { bioStore } from "@/pages/dashboard/linkbio/state/bioConfig";

type View = "templates" | "designs";

export default function TemplatesView() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("templates");

  const useTemplate = (id: string) => {
    const tpl = linkBioTemplates.find((t) => t.id === id);
    if (!tpl) return;
    // Only apply CONTENT — do NOT change the theme or background
    localStorage.setItem(APPLIED_TEMPLATE_KEY, id);
    localStorage.setItem(
      "smmpilot:linkbio:seed-links",
      JSON.stringify({ handle: tpl.handle, headline: tpl.headline, links: tpl.links }),
    );
    // Push content to bioStore without touching themeId
    bioStore.set({
      handle: tpl.handle,
      headline: tpl.headline,
      links: tpl.links.map((l, i) => ({
        id: `l${i + 1}`,
        title: l.title,
        url: l.url,
        highlight: l.highlight,
        enabled: true,
      })),
    });
    toast.success(`Template "${tpl.name}" applied`, {
      description: "Starter links loaded. Your theme stays the same.",
    });
    navigate("/dashboard/link-in-bio/pages");
  };

  const useDesign = (id: string) => {
    const preset = designPresets.find((p) => p.id === id);
    if (!preset) return;
    // Apply ONLY color/style overrides — never change theme or background
    localStorage.setItem(DESIGN_PRESET_KEY, id);
    bioStore.applyDesignPreset({ overrides: preset.overrides });
    toast.success(`"${preset.name}" design applied`, {
      description: "Colors & style updated. Background unchanged.",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* View switcher */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <button
            onClick={() => setView("templates")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "templates" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layout className="w-3.5 h-3.5" /> Content templates
          </button>
          <button
            onClick={() => setView("designs")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "designs" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Palette className="w-3.5 h-3.5" /> Design presets
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {view === "templates"
            ? `${linkBioTemplates.length} content starters — links & copy only, theme unchanged.`
            : `${designPresets.length} color styles — changes accent, buttons & fonts, not background.`}
        </span>
      </div>

      {view === "templates" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkBioTemplates.map((tpl) => (
            <Card key={tpl.id} className="group overflow-hidden border-border/50 hover:shadow-md transition-all">
              {/* Preview strip — shows content only, not theme */}
              <div className="relative h-40 p-4 flex flex-col justify-between bg-gradient-to-br from-muted/60 to-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {tpl.category}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground truncate">{tpl.headline}</p>
                  {tpl.links.slice(0, 2).map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full text-[10px] py-1.5 px-2.5 truncate rounded-lg border border-border/60 bg-background/80 text-foreground",
                        l.highlight && "border-primary/40 bg-primary/5",
                      )}
                    >
                      {l.title}
                    </div>
                  ))}
                </div>
              </div>
              {/* Meta */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{tpl.links.length} links</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>
                <div className="flex items-center justify-end pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs gap-1"
                    onClick={() => useTemplate(tpl.id)}
                  >
                    Use template <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {designPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => useDesign(preset.id)}
              className="group relative rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Color swatches */}
              <div className="flex items-center gap-1.5 mb-3">
                {preset.swatches.map((c, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-full border border-border/40 shadow-sm",
                      i === 0 ? "w-8 h-8" : "w-5 h-5",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold truncate">{preset.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{preset.tagline}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {preset.overrides.buttonStyle}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {preset.overrides.radius}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
