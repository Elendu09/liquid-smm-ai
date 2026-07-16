import { useEffect, useMemo, useRef } from "react";
import {
  FileText,
  CalendarClock,
  Hash,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  Eraser,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Text inserted into the prompt when the command is chosen. */
  insert: string;
  /** If true, submits immediately instead of just inserting. */
  submit?: boolean;
  /** Optional client-side side-effect (e.g. clear history). */
  action?: "clear-history";
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "caption",
    label: "/caption",
    hint: "Draft caption ideas",
    icon: FileText,
    insert: "Draft 3 caption ideas about ",
  },
  {
    id: "schedule",
    label: "/schedule",
    hint: "Queue a cross-platform post",
    icon: CalendarClock,
    insert: "Schedule a post for tomorrow 9am on ",
  },
  {
    id: "hashtags",
    label: "/hashtags",
    hint: "Suggest hashtags for a topic",
    icon: Hash,
    insert: "Give me 15 hashtags for ",
  },
  {
    id: "queue",
    label: "/queue",
    hint: "Open the scheduled queue",
    icon: ArrowUpRight,
    insert: "Open the scheduled queue",
    submit: true,
  },
  {
    id: "analytics",
    label: "/analytics",
    hint: "Jump to analytics",
    icon: BarChart3,
    insert: "Open analytics",
    submit: true,
  },
  {
    id: "improve",
    label: "/improve",
    hint: "Rewrite my last caption punchier",
    icon: Wand2,
    insert: "Rewrite the last caption to be punchier and add a CTA",
    submit: true,
  },
  {
    id: "clear",
    label: "/clear",
    hint: "Reset conversation memory",
    icon: Eraser,
    insert: "",
    action: "clear-history",
  },
];

interface Props {
  query: string; // text after the "/"
  open: boolean;
  onPick: (cmd: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ query, open, onPick, onClose }: Props) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(
      (c) => c.id.includes(q) || c.label.includes(q) || c.hint.toLowerCase().includes(q),
    );
  }, [query]);

  const activeRef = useRef(0);
  useEffect(() => {
    activeRef.current = 0;
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        activeRef.current = Math.min(filtered.length - 1, activeRef.current + 1);
        forceRepaint();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeRef.current = Math.max(0, activeRef.current - 1);
        forceRepaint();
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filtered[activeRef.current]) {
          e.preventDefault();
          onPick(filtered[activeRef.current]);
        }
      }
    };
    // Force a repaint on arrow nav without re-rendering the parent.
    const forceRepaint = () => {
      const el = document.getElementById("slash-menu");
      if (!el) return;
      el.querySelectorAll<HTMLButtonElement>("[data-slash-item]").forEach((b, i) => {
        b.dataset.active = String(i === activeRef.current);
      });
    };
    window.addEventListener("keydown", handler, true);
    forceRepaint();
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, filtered, onPick, onClose]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      id="slash-menu"
      role="listbox"
      aria-label="Slash commands"
      className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-xl shadow-lg overflow-hidden z-30 animate-in fade-in-0 slide-in-from-bottom-1 duration-150"
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        Slash commands
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              data-slash-item
              data-active={i === 0}
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(c);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                "hover:bg-primary/10 data-[active=true]:bg-primary/15",
              )}
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-foreground leading-tight">{c.label}</div>
                <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{c.hint}</div>
              </div>
              {c.submit && (
                <span className="text-[9px] uppercase tracking-wider text-primary/80 font-semibold">
                  run
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
