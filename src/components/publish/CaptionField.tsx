import { useRef } from "react";
import { Smile, Hash, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const QUICK_EMOJI = ["🚀", "🔥", "✨", "🎉", "💡", "❤️", "👀", "📈"];

interface CaptionFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  limit?: number;
  /** Platform shown as a small chip in the toolbar. */
  platform?: string;
  /** Optional AI action; hidden when omitted. */
  onAi?: () => void;
  aiBusy?: boolean;
  className?: string;
  id?: string;
}

/**
 * Caption input styled like the reference: one bordered card with a
 * bottom toolbar (emoji / hashtag / AI) on the left and a live counter
 * on the right.
 */
export function CaptionField({
  value,
  onChange,
  placeholder = "Write your caption…",
  rows = 5,
  limit = 2200,
  platform,
  onAi,
  aiBusy,
  className,
  id,
}: CaptionFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (text: string) => {
    const el = ref.current;
    if (!el) return onChange(value + text);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const over = value.length > limit;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/10 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/25",
        className,
      )}
    >
      <Textarea
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-0.5">
        <div className="flex items-center gap-1">
          <div className="group relative">
            <button
              type="button"
              aria-label="Insert emoji"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute bottom-8 left-0 z-20 hidden gap-0.5 rounded-lg border border-border/60 bg-popover p-1 shadow-md group-focus-within:pointer-events-auto group-focus-within:flex group-hover:pointer-events-auto group-hover:flex">
              {QUICK_EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insert(e)}
                  className="grid h-7 w-7 place-items-center rounded-md text-base hover:bg-muted"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-label="Insert hashtag"
            onClick={() => insert("#")}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Hash className="h-4 w-4" />
          </button>
          {onAi && (
            <button
              type="button"
              aria-label="Improve with AI"
              onClick={onAi}
              disabled={aiBusy}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] tabular-nums",
              over ? "font-semibold text-destructive" : "text-muted-foreground",
            )}
          >
            {value.length.toLocaleString()} / {limit.toLocaleString()}
          </span>
          {platform && <PlatformIcon platform={platform} size="sm" showBackground />}
        </div>
      </div>
    </div>
  );
}

export default CaptionField;
