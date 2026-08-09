import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import type { TeamMember } from "@/hooks/useTeamMembers";

/**
 * useMentions
 *
 * Fix 4.4 — "@mention" autocomplete in private inbox notes. Returns the
 * current caret position, the active mention (if any), and a list of
 * candidate teammates to autocomplete.
 *
 * The hook is text-only; the calling component renders the dropdown and
 * owns the textarea state.
 */
export interface MentionCandidate {
  /** Display name in the dropdown. */
  name: string;
  /** Underline handle used in the note (e.g. "@sam"). */
  handle: string;
  /** Role label, e.g. "Admin" — surfaces next to the name in the dropdown. */
  role: string;
  /** Optional initials for the avatar. */
  initials: string;
}

const HANDLES_CACHE: Record<string, string> = {};

function handleFor(member: TeamMember): string {
  if (HANDLES_CACHE[member.id]) return HANDLES_CACHE[member.id];
  const fromName = (member.name ?? "user").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
  const handle = `@${fromName}`;
  HANDLES_CACHE[member.id] = handle;
  return handle;
}

function initialsFor(name: string) {
  return (name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function useMentions() {
  const { members } = useTeamMembers();
  const candidates: MentionCandidate[] = useMemo(() => {
    return members.map((m) => ({
      name: m.name,
      handle: handleFor(m),
      role: m.role ?? "Member",
      initials: initialsFor(m.name),
    }));
  }, [members]);

  return { candidates };
}

/**
 * MentionAutocomplete
 *
 * A small, focused autocomplete input that renders the textarea, listens
 * for an active mention (text immediately after an "@"), and renders a
 * floating dropdown above the caret when matches exist.
 */
export function MentionAutocomplete({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const { candidates } = useMentions();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [active, setActive] = useState<{ start: number; query: string } | null>(null);
  const [highlight, setHighlight] = useState(0);

  // Detect the active mention whenever the text or caret changes.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? 0;
    // Walk back to the most recent "@" before the caret that is at the
    // start of the text or preceded by whitespace.
    let i = pos - 1;
    while (i >= 0) {
      const ch = value[i];
      if (ch === "@") {
        const prev = i === 0 ? " " : value[i - 1];
        if (/\s|^/.test(prev)) {
          const query = value.slice(i + 1, pos);
          if (/^[a-zA-Z0-9_-]*$/.test(query)) {
            setActive({ start: i, query });
            return;
          }
        }
        break;
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    setActive(null);
  }, [value]);

  const matches = useMemo(() => {
    if (!active) return [] as MentionCandidate[];
    const q = active.query.toLowerCase();
    return candidates
      .filter((c) => c.handle.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [active, candidates]);

  useEffect(() => { setHighlight(0); }, [active?.query]);

  const insert = (candidate: MentionCandidate) => {
    if (!active) return;
    const before = value.slice(0, active.start);
    const after = value.slice(active.start + 1 + active.query.length);
    const next = `${before}${candidate.handle} ${after}`;
    onChange(next);
    setActive(null);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      const caret = before.length + candidate.handle.length + 1;
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!active || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(matches[highlight]);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-md border border-border/60 bg-background px-2.5 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      {active && matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-64 overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-xl backdrop-blur-xl">
          <div className="border-b border-border/60 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mention teammate
          </div>
          <ul className="max-h-44 overflow-y-auto p-1">
            {matches.map((c, i) => (
              <li key={c.handle}>
                <button
                  type="button"
                  onClick={() => insert(c)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left",
                    i === highlight && "bg-muted",
                  )}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {c.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium">{c.name}</span>
                    <span className="block text-[9px] text-muted-foreground">{c.handle} · {c.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
