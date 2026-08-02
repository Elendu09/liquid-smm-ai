import { useMemo, useState } from "react";
import { LayoutGrid, PanelsTopLeft } from "lucide-react";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { InboxBoard } from "./InboxBoard";
import { InboxConsole } from "@/components/engage/InboxConsole";
import { cn } from "@/lib/utils";
import { InboxTriageBar } from "@/components/engage/InboxTriageBar";
import type { Intent, Sentiment } from "@/hooks/useInboxAnalysis";

/**
 * Unified inbox. Defaults to the three-pane triage console (channel rail →
 * conversation list → thread) and keeps the classic kanban board available
 * as a secondary view.
 */
export function UnifiedInboxView() {
  const [mode, setMode] = useState<"console" | "board">("console");
  const [kind, setKind] = useState<"comment" | "dm">("comment");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [intent, setIntent] = useState<Intent | "all">("all");
  const { items: comments } = useInboxMessages("comment");
  const { items: dms } = useInboxMessages("dm");

  const items = useMemo(() => [...comments, ...dms], [comments, dms]);

  return (
    <div>
      <div className="px-4 pt-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 border-b border-border/60">
          <div className="flex gap-1">
            {([
              { id: "console", label: "Console", icon: PanelsTopLeft },
              { id: "board", label: "Board", icon: LayoutGrid },
            ] as const).map(({ id, label, icon: Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  aria-pressed={active}
                  className={cn(
                    "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
          {mode === "board" && (
            <div className="flex gap-1 pb-1">
              {(["comment", "dm"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    kind === k
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k === "comment" ? "Comments" : "DMs"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <InboxTriageBar
        items={mode === "console" ? items : kind === "comment" ? comments : dms}
        sentiment={sentiment}
        intent={intent}
        onSentiment={setSentiment}
        onIntent={setIntent}
      />

      {mode === "console" ? (
        <InboxConsole sentiment={sentiment} intent={intent} />
      ) : (
        <InboxBoard
          key={kind}
          kind={kind}
          sentiment={sentiment}
          intent={intent}
          title={kind === "comment" ? "Comments" : "Direct Messages"}
          description={
            kind === "comment"
              ? "Every comment across your accounts in one board."
              : "All inbound DMs, sorted by conversation state."
          }
        />
      )}
    </div>
  );
}
