import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Palette, Layout, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "./templatePresets";
import { designPresets, DESIGN_PRESET_KEY } from "./designPresets";
import { bioStore } from "@/pages/dashboard/linkbio/state/bioConfig";
import { PanelSection } from "@/components/shared/PanelSection";

type View = "templates" | "designs";

export default function TemplatesView() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("templates");

  const useTemplate = (id: string) => {
    const tpl = linkBioTemplates.find((t) => t.id === id);
    if (!tpl) return;
    localStorage.setItem(APPLIED_TEMPLATE_KEY, id);
    localStorage.setItem(
      "smmpilot:linkbio:seed-links",
      JSON.stringify({ handle: tpl.handle, headline: tpl.headline, links: tpl.links }),
    );
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
    localStorage.setItem(DESIGN_PRESET_KEY, id);
    bioStore.applyDesignPreset({ overrides: preset.overrides });
    toast.success(`"${preset.name}" design applied`, {
      description: "Colors & style updated. Background unchanged.",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* View switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-1">
          <button
            onClick={() => setView("templates")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "templates" ? "bg-background text-foreground shadow-sm ring-1 ring-border/30" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layout className="w-3.5 h-3.5" /> Content templates
          </button>
          <button
            onClick={() => setView("designs")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "designs" ? "bg-background text-foreground shadow-sm ring-1 ring-border/30" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Palette className="w-3.5 h-3.5" /> Design presets
          </button>
        </div>
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          {view === "templates"
            ? `${linkBioTemplates.length} content starters — links & copy only, theme unchanged.`
            : `${designPresets.length} color styles — changes accent, buttons & fonts, not background.`}
        </span>
      </div>

      {view === "templates" ? (
        <PanelSection
          icon={Layout}
          title="Link Bio Templates"
          description="Figma-crafted starter layouts — each preview is a miniature, high-fidelity mock of a real bio page, not a gradient."
          accent="from-violet-500 via-fuchsia-500/40 to-transparent"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkBioTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-[var(--shadow-premium-lg)] hover:border-primary/20 hover:-translate-y-0.5 flex flex-col"
              >
                {/* Figma-style virtual preview — browser chrome + high-fidelity miniature */}
                <div className="relative h-[176px] bg-[#f8f9fb] dark:bg-[#0b1220] p-3 flex flex-col">
                  {/* Browser chrome */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] border border-black/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] border border-black/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] border border-black/10" />
                    </div>
                    <span className="text-[9px] font-medium tracking-wide text-muted-foreground/60 uppercase">Preview · {tpl.category}</span>
                    <span className="h-5 w-5 grid place-items-center rounded-md bg-background border border-border/50 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Miniature bio card */}
                  <div className="flex-1 rounded-xl border border-border/40 bg-white dark:bg-[#111a2e] p-3 shadow-sm flex flex-col items-center justify-center gap-2">
                    <img
                      src={`https://i.pravatar.cc/100?u=${tpl.id}`}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-border/30"
                      loading="lazy"
                    />
                    <div className="text-center">
                      <p className="text-[11px] font-semibold tracking-tight leading-none">{tpl.handle}</p>
                      <p className="mt-1 text-[10px] leading-snug text-muted-foreground line-clamp-2 max-w-[16rem]">{tpl.headline}</p>
                    </div>
                    <div className="w-full space-y-1.5 mt-1">
                      {tpl.links.slice(0, 2).map((l, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-full text-[10px] font-medium py-1.5 px-2.5 truncate rounded-lg border text-center",
                            l.highlight
                              ? "border-primary/30 bg-primary text-primary-foreground"
                              : "border-border/50 bg-muted/40 text-foreground",
                          )}
                        >
                          {l.title}
                        </div>
                      ))}
                      {tpl.links.length > 2 && (
                        <div className="text-center text-[9px] text-muted-foreground">+{tpl.links.length - 2} more</div>
                      )}
                    </div>
                  </div>

                  {/* Figma-style subtle highlight on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-t-2xl ring-1 ring-black/[0.03] dark:ring-white/[0.04]" />
                </div>

                {/* Meta */}
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13px] font-semibold tracking-tight leading-tight truncate">{tpl.name}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tpl.links.length} links</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">{tpl.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" /> Figma crafted
                    </span>
                    <Button size="sm" className="h-7 text-xs gap-1 rounded-full px-3" onClick={() => useTemplate(tpl.id)}>
                      Use template <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelSection>
      ) : (
        <PanelSection
          icon={Palette}
          title="Design presets"
          description="Color & type pairings — your background and theme stay untouched."
          accent="from-cyan-500 via-teal-500/40 to-transparent"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {designPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => useDesign(preset.id)}
                className="group text-left overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all"
              >
                {/* Preview swatch bar like Figma */}
                <div className="h-20 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${preset.swatches[0]} 0%, ${preset.swatches[1]} 100%)` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5">
                    {preset.swatches.map((c, i) => (
                      <div
                        key={i}
                        className={cn("rounded-full border-2 border-white shadow-sm", i === 0 ? "w-7 h-7" : "w-5 h-5")}
                        style={{ background: c }}
                      />
                    ))}
                    <span className="ml-auto text-[10px] font-medium text-white/90 bg-black/20 rounded-full px-2 py-0.5 backdrop-blur">{preset.overrides.radius}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold tracking-tight truncate">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{preset.tagline}</p>
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">{preset.overrides.buttonStyle}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">{preset.overrides.fontPair}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  );
}
