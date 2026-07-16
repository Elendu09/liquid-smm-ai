import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** If true, submits immediately instead of just inserting. */
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

  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Reset active on query / open changes, clamped to filtered length.
  useEffect(() => {
    setActive((cur) => {
      if (!filtered.length) return 0;
      return Math.min(cur, filtered.length - 1);
    });
  }, [filtered.length, open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Keep the active row visible within the scroll container.
  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[active];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [active, open, filtered.length]);

  const pick = useCallback(
    (i: number) => {
      const cmd = filtered[i];
      if (cmd) onPick(cmd);
    },
    [filtered, onPick],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => (filtered.length ? (a + 1) % filtered.length : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => (filtered.length ? (a - 1 + filtered.length) % filtered.length : 0));
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setActive(Math.max(0, filtered.length - 1));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (filtered.length) {
          e.preventDefault();
          e.stopPropagation();
          pick(active);
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, filtered, active, pick, onClose]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      id="slash-menu"
      role="listbox"
      aria-label="Slash commands"
      aria-activedescendant={filtered[active] ? `slash-item-${filtered[active].id}` : undefined}
      className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-xl shadow-lg overflow-hidden z-30 animate-in fade-in-0 slide-in-from-bottom-1 duration-150"
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Slash commands
        </span>
        <span className="normal-case tracking-normal text-muted-foreground/70 hidden sm:inline">
          ↑↓ nav · <kbd className="font-mono">Tab</kbd>/<kbd className="font-mono">↵</kbd> pick · <kbd className="font-mono">Esc</kbd> close
        </span>
      </div>
      <div
        ref={listRef}
        className="max-h-[min(60vh,18rem)] overflow-y-auto overscroll-contain py-1"
      >
        {filtered.map((c, i) => {
          const Icon = c.icon;
          const isActive = i === active;
          return (
            <button
              key={c.id}
              id={`slash-item-${c.id}`}
              type="button"
              role="option"
              aria-selected={isActive}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                isActive ? "bg-primary/15" : "hover:bg-primary/10",
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
                <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5 truncate">{c.hint}</div>
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
