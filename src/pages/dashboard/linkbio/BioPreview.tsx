import { useState } from "react";
import { Smartphone, Tablet, Monitor, Sun, Moon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBioConfig } from "./state/bioConfig";
import { BioPage } from "./renderer/BioPage";

type Device = "mobile" | "tablet" | "desktop";

const deviceDims: Record<Device, { w: number; h: number; radius: string; border: string }> = {
  mobile: { w: 300, h: 600, radius: "rounded-[36px]", border: "border-[10px]" },
  tablet: { w: 460, h: 620, radius: "rounded-[28px]", border: "border-[10px]" },
  desktop: { w: 640, h: 540, radius: "rounded-xl", border: "border-4" },
};

export default function BioPreview() {
  const cfg = useBioConfig();
  const [device, setDevice] = useState<Device>("mobile");
  const [dark, setDark] = useState(true);
  const dims = deviceDims[device];

  return (
    <div className="h-full flex flex-col bg-muted/30 border-l border-border/50">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-md bg-background/80 border border-border/50 text-[11px] text-muted-foreground max-w-md mx-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="truncate">bio.smmsaas.com/{cfg.slug}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle preview theme"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
          <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-background/70 p-0.5">
            {(
              [
                { id: "mobile", icon: Smartphone },
                { id: "tablet", icon: Tablet },
                { id: "desktop", icon: Monitor },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={cn(
                  "h-6 w-6 rounded flex items-center justify-center transition-colors",
                  device === d.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={`Preview ${d.id}`}
              >
                <d.icon className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Device frame */}
      <div className={cn("flex-1 flex items-center justify-center p-6 overflow-auto", dark ? "bg-slate-950/40" : "bg-slate-100/60")}> 
        <div
          className={cn("bg-slate-900 border-slate-900 shadow-2xl overflow-hidden", dims.radius, dims.border)}
          style={{ width: dims.w, height: dims.h }}
        >
          <BioPage config={cfg} compact={device === "mobile"} />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground bg-card/60">
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" /> Live preview
        </span>
        <span>Changes save automatically</span>
      </div>
    </div>
  );
}
