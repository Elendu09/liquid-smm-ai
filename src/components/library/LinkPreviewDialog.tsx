import { Smartphone, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadBioTheme } from "@/components/library/EditThemeDialog";
import { cn } from "@/lib/utils";

interface Link {
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  status: string;
}

export function LinkPreviewDialog({
  open,
  onOpenChange,
  links,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  links: Link[];
}) {
  const theme = loadBioTheme();
  const bg =
    theme.background === "dark"
      ? "bg-slate-950 text-white"
      : theme.background === "gradient"
        ? "text-white"
        : "bg-white text-slate-900";
  const gradientStyle =
    theme.background === "gradient"
      ? { background: `linear-gradient(160deg, ${theme.accent}, #0F172A)` }
      : {};
  const live = links.filter((l) => l.status === "live");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" strokeWidth={1.75} /> Mobile preview
          </DialogTitle>
        </DialogHeader>
        <div className="mx-auto w-[280px] h-[560px] rounded-[36px] border-8 border-slate-900 bg-slate-900 shadow-xl overflow-hidden">
          <div className={cn("h-full overflow-y-auto p-5 flex flex-col items-center gap-3", bg)} style={gradientStyle}>
            <div
              className="w-20 h-20 rounded-full border-2"
              style={{ background: theme.accent, borderColor: "rgba(255,255,255,0.4)" }}
            />
            <p className="text-lg font-bold">{theme.handle}</p>
            <p className="text-xs opacity-80 text-center">{theme.headline}</p>
            <div className="w-full space-y-2 mt-3">
              {live.length === 0 ? (
                <p className="text-[11px] opacity-60 text-center py-4">No live links yet.</p>
              ) : (
                live.map((l) => (
                  <div
                    key={l.id}
                    className="w-full rounded-xl bg-white/95 text-slate-900 px-3 py-2.5 text-sm font-medium flex items-center justify-between shadow-sm"
                  >
                    <span className="truncate">{l.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0 ml-2" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
