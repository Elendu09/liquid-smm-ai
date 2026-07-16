import { useNavigate } from "react-router-dom";
import { Wand2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { linkBioThemes, THEME_STORAGE_KEY } from "./themePresets";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "./templatePresets";

export default function TemplatesView() {
  const navigate = useNavigate();

  const use = (id: string) => {
    const tpl = linkBioTemplates.find((t) => t.id === id);
    if (!tpl) return;
    localStorage.setItem(APPLIED_TEMPLATE_KEY, id);
    localStorage.setItem(THEME_STORAGE_KEY, tpl.themeId);
    localStorage.setItem(
      "smmpilot:linkbio:seed-links",
      JSON.stringify({ handle: tpl.handle, headline: tpl.headline, links: tpl.links }),
    );
    toast.success(`Template "${tpl.name}" applied`, {
      description: "Theme + starter links loaded. Head to Pages to customize.",
    });
    navigate("/dashboard/link-in-bio/pages");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wand2 className="w-3.5 h-3.5 text-primary" />
        {linkBioTemplates.length} ready-made templates — each ships with a matched theme and starter links.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {linkBioTemplates.map((tpl) => {
          const theme = linkBioThemes.find((t) => t.id === tpl.themeId) ?? linkBioThemes[0];
          return (
            <Card key={tpl.id} className="group overflow-hidden border-border/50 hover:shadow-md transition-all">
              {/* Preview strip */}
              <div className={cn("relative h-40 p-4 flex flex-col justify-between", theme.bg, theme.textClass)}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white">
                    {tpl.category}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/40 shadow"
                    style={{ background: theme.accent }}
                  />
                </div>
                <div className="space-y-1.5">
                  {tpl.links.slice(0, 3).map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full text-[10px] py-1.5 px-2 truncate",
                        theme.radius === "sm" && "rounded-sm",
                        theme.radius === "md" && "rounded-md",
                        theme.radius === "xl" && "rounded-xl",
                        theme.radius === "full" && "rounded-full",
                        theme.buttonClass,
                        l.highlight && "ring-2 ring-white/40",
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
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Theme:{" "}
                    <span className="font-medium text-foreground">{theme.name}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs gap-1"
                    onClick={() => use(tpl.id)}
                  >
                    Use template <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
