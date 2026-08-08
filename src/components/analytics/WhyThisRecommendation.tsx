import { Info, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  reasons: string[];
  confidence?: number; // 0-100
  variant?: "inline" | "icon";
  className?: string;
}

export function WhyThisRecommendation({ reasons, confidence, variant = "inline", className }: Props) {
  const content = (
    <div className="space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> Why this recommendation?</p>
      <ul className="space-y-1.5">
        {reasons.map((r, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {typeof confidence === "number" && (
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium tabular-nums">{confidence}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} />
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "icon") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="Why this recommendation?" className={cn("grid h-6 w-6 place-items-center rounded-full border border-border/60 bg-card hover:bg-muted transition-colors", className)}>
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 text-sm">{content}</PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-7 gap-1 text-xs text-muted-foreground", className)}>
          <Info className="h-3 w-3" /> Why this?
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">{content}</PopoverContent>
    </Popover>
  );
}
