import { useState } from "react";
import { Copy, Check, Share2, Globe, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import LinkInBioBuilder from "@/components/automation/LinkInBioBuilder";
import { linkBioThemes, loadActiveThemeId } from "./themePresets";

export default function PagesView() {
  const [copied, setCopied] = useState(false);
  const [themeId] = useState(loadActiveThemeId());
  const theme = linkBioThemes.find((t) => t.id === themeId) ?? linkBioThemes[0];
  const bioUrl = "smmsaas.com/@yourhandle";

  const copy = () => {
    navigator.clipboard.writeText(`https://${bioUrl}`);
    setCopied(true);
    toast.success("Bio URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero */}
      <Card
        className={cn(
          "relative overflow-hidden border border-border/50 shadow-sm",
        )}
      >
        <div className={cn("absolute inset-0 opacity-90", theme.bg)} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" aria-hidden />
        <div className="relative grid gap-5 p-6 sm:p-8 md:grid-cols-[1.5fr_auto] md:items-center">
          <div className="min-w-0 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live · Theme: {theme.name}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Your bio page — one link, endless destinations.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Craft a beautiful, branded page for your links. Change themes any time from the
              Themes tab, or start from a template.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/60 min-w-0">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate max-w-[180px] sm:max-w-none">{bioUrl}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={copy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <Button size="sm" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
            </div>
          </div>
          <div className="hidden md:block relative">
            <div className="w-[160px] h-[300px] rounded-[28px] border-8 border-slate-900 shadow-2xl overflow-hidden rotate-3">
              <div className={cn("h-full flex flex-col items-center gap-2 p-3", theme.bg, theme.textClass)}>
                <div className="w-12 h-12 rounded-full border-2 border-white/40 mt-2" style={{ background: theme.accent }} />
                <p className="text-[10px] font-bold">@yourhandle</p>
                <div className="w-full space-y-1.5 mt-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("w-full text-[9px] text-center py-1.5 rounded-lg", theme.buttonClass)}>
                      Link {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Smartphone className="absolute -top-2 -right-2 h-4 w-4 text-muted-foreground/60" />
          </div>
        </div>
      </Card>

      {/* Builder */}
      <LinkInBioBuilder />
    </div>
  );
}
