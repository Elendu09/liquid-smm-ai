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

export interface SlashParam {
  /** Placeholder token used inside `insert`, e.g. `<when>` */
  name: string;
  /** Short human label shown in the hint bar. */
  label: string;
  /** Longer example / description */
  hint: string;
  /** Quick-pick suggestions shown as chips */
  suggestions?: string[];
}

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Text inserted into the prompt when the command is chosen. */
  insert: string;
  /** If true, submits immediately instead of just inserting. Reserve for pure page-navigation intents. */
  submit?: boolean;
  /** Optional client-side side-effect (e.g. clear history). */
  action?: "clear-history";
  /** Structured parameters this command expects. */
  params?: SlashParam[];
}


export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "caption",
    label: "/caption",
    hint: "Draft caption ideas",
    icon: FileText,
    insert: "Draft 3 caption ideas about <topic> in a <tone> tone",
    params: [
      {
        name: "topic",
        label: "topic",
        hint: "what should the caption be about?",
        suggestions: ["a new product launch", "a behind-the-scenes moment", "a customer testimonial", "a weekend sale"],
      },
      {
        name: "tone",
        label: "tone",
        hint: "voice for the copy",
        suggestions: ["playful", "professional", "bold", "minimal"],
      },
    ],
  },
  {
    id: "schedule",
    label: "/schedule",
    hint: "Queue a cross-platform post",
    icon: CalendarClock,
    insert: "Schedule a post for <when> on <platforms> — <caption>",
    params: [
      {
        name: "when",
        label: "date/time",
        hint: "when should it publish?",
        suggestions: ["tomorrow 9am", "today 6pm", "next Monday 8am", "Friday 3pm"],
      },
      {
        name: "platforms",
        label: "platforms",
        hint: "one or more platforms",
        suggestions: ["Instagram", "TikTok", "LinkedIn", "X", "Facebook", "YouTube"],
      },
      {
        name: "caption",
        label: "caption",
        hint: "post text (or say 'my last caption')",
        suggestions: ["my last caption", "the draft in Library"],
      },
    ],
  },
  {
    id: "hashtags",
    label: "/hashtags",
    hint: "Suggest hashtags for a topic",
    icon: Hash,
    insert: "Give me 15 hashtags for <topic>",
    params: [
      {
        name: "topic",
        label: "topic",
        hint: "niche or subject",
        suggestions: ["a fitness reel", "a travel photo", "a SaaS launch", "a coffee shop"],
      },
    ],
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

/** Find the active command for the current prompt (by leading /label ). */
export function matchActiveCommand(prompt: string): SlashCommand | null {
  if (!prompt.startsWith("/")) return null;
  return (
    SLASH_COMMANDS.find(
      (c) => prompt === c.label || prompt.startsWith(c.label + " ") || prompt.startsWith(c.label + "\n"),
    ) ?? null
  );
}

/** Return the first unresolved placeholder token (e.g. `<when>`) present in prompt. */
export function nextPlaceholder(prompt: string, cmd: SlashCommand | null): SlashParam | null {
  if (!cmd?.params) return null;
  for (const p of cmd.params) {
    if (prompt.includes(`<${p.name}>`)) return p;
  }
  return null;
}

/** Replace the first `<name>` token in prompt with value. */
export function fillPlaceholder(prompt: string, name: string, value: string): string {
  return prompt.replace(`<${name}>`, value);
}

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
      } else if (e.key === "Enter" || e.key === "Tab" || (e.key === "ArrowRight" && filtered.length === 1)) {
        if (filtered[activeRef.current]) {
          e.preventDefault();
          onPick(filtered[activeRef.current]);
        }
      }
    };
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
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Slash commands
        </span>
        <span className="normal-case tracking-normal text-muted-foreground/70 hidden sm:inline">
          ↑↓ nav · <kbd className="font-mono">Tab</kbd>/<kbd className="font-mono">↵</kbd> pick
        </span>
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
                <div className="text-[12px] font-medium text-foreground leading-tight flex items-center gap-1.5 flex-wrap">
                  <span>{c.label}</span>
                  {c.params?.map((p) => (
                    <span
                      key={p.name}
                      className="text-[9.5px] font-mono px-1 py-0.5 rounded bg-muted/70 text-muted-foreground border border-border/50"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
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
