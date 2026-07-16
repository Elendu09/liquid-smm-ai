import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlashCommand, SlashParam } from "./SlashCommandMenu";

interface Props {
  cmd: SlashCommand;
  prompt: string;
  onPick: (param: SlashParam, value: string) => void;
  onFocusPlaceholder: (param: SlashParam) => void;
}

export function SlashParamHints({ cmd, prompt, onPick, onFocusPlaceholder }: Props) {
  if (!cmd.params?.length) return null;

  // A param is "filled" once its `<name>` placeholder is no longer in the prompt.
  const status = cmd.params.map((p) => ({
    param: p,
    filled: !prompt.includes(`<${p.name}>`),
  }));
  const active = status.find((s) => !s.filled)?.param ?? null;

  return (
    <div className="border-t border-border/50 bg-muted/20 dark:bg-white/[0.015] px-3 py-2 space-y-1.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-150">
      {/* Progress row */}
      <div className="flex items-center gap-1 flex-wrap text-[10.5px]">
        <span className="font-mono text-primary font-semibold">{cmd.label}</span>
        {status.map((s, i) => (
          <div key={s.param.name} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <button
              type="button"
              onClick={() => onFocusPlaceholder(s.param)}
              className={cn(
                "px-1.5 py-0.5 rounded-md font-mono transition-colors flex items-center gap-1",
                s.filled && "bg-brand-green/15 text-brand-green border border-brand-green/30",
                !s.filled && s.param === active && "bg-primary/15 text-primary border border-primary/40 ring-1 ring-primary/20",
                !s.filled && s.param !== active && "bg-muted/60 text-muted-foreground border border-border/60",
              )}
            >
              {s.filled && <Check className="h-2.5 w-2.5" />}
              {s.param.label}
            </button>
            {i === status.length - 1 && null}
          </div>
        ))}
      </div>

      {/* Active param hint + suggestion chips */}
      {active && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[10.5px] text-muted-foreground italic pt-0.5">
            {active.hint}:
          </span>
          {active.suggestions?.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onPick(active, sug)}
              className="text-[10.5px] px-2 py-0.5 rounded-full border border-border/60 bg-background/70 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground text-muted-foreground transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
