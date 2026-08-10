import { useCallback, useEffect, useState } from "react";
import { Bot, Check, ExternalLink, Hash, Mail, Tag, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { capabilitiesFor } from "@/config/inboxChannels";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

/**
 * Fourth inbox column — contact + conversation context.
 *
 * Presentation-only: statuses/assignees are patched through the callbacks the
 * console already uses, and tags live in a small localStorage map so they
 * survive reloads without needing a new table.
 */

export const INBOX_TAGS = [
  "Booking",
  "Complaint",
  "Follow-up",
  "Product Question",
  "Resolved",
  "Urgent",
  "VIP",
] as const;

const TAG_KEY = "smmpilot:inbox-tags";

function readTags(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(TAG_KEY) ?? "{}") as Record<string, string[]>;
  } catch {
    return {};
  }
}

export function useInboxTags(id?: string) {
  const [map, setMap] = useState<Record<string, string[]>>(readTags);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TAG_KEY) setMap(readTags());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(
    (tag: string) => {
      if (!id) return;
      setMap((prev) => {
        const current = prev[id] ?? [];
        const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
        const out = { ...prev, [id]: next };
        window.localStorage.setItem(TAG_KEY, JSON.stringify(out));
        return out;
      });
    },
    [id],
  );

  return { tags: (id && map[id]) || [], toggle };
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border/60 px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      {children}
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  new: "Open",
  replied: "Open",
  snoozed: "Snoozed",
  resolved: "Resolved",
};

const STATUS_TONE: Record<string, string> = {
  new: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  snoozed: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  resolved: "border-border/60 bg-muted/50 text-muted-foreground",
};

export interface InboxContextPanelProps {
  item: InboxItem;
  messageCount: number;
  botPaused: boolean;
  onStatus: (status: InboxItem["status"]) => void;
  onToggleBot: () => void;
}

export function InboxContextPanel({
  item,
  messageCount,
  botPaused,
  onStatus,
  onToggleBot,
}: InboxContextPanelProps) {
  const { tags, toggle } = useInboxTags(item.id);
  const caps = capabilitiesFor(item.platform);

  const optIns: Array<{ label: string; on: boolean }> = [
    { label: "Direct messages", on: caps.dm },
    { label: "Public replies", on: caps.reply },
    { label: "Email updates", on: false },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      {/* Contact */}
      <div className="px-4 py-4 text-center">
        <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <span className="text-base font-semibold text-muted-foreground">
            {item.author.slice(0, 2).toUpperCase()}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-1">
            <PlatformIcon platform={item.platform} className="h-3.5 w-3.5" />
          </span>
        </span>
        <p className="mt-2 truncate text-sm font-semibold">{item.author}</p>
        <p className="truncate text-xs text-muted-foreground">{item.handle}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
          <Mail className="h-3 w-3" />
          {item.handle.replace("@", "")}@example.com
        </p>
        <Button variant="outline" size="sm" className="mt-3 h-7 w-full rounded-full text-[11px]">
          <ExternalLink className="mr-1.5 h-3 w-3" />
          View full profile
        </Button>
      </div>

      <Block label="Conversation">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-1">
              {(["new", "snoozed", "resolved"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatus(s)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    (item.status === s || (s === "new" && item.status === "replied"))
                      ? STATUS_TONE[item.status]
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Agent</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <UserCheck className="h-3 w-3 text-muted-foreground" />
              {item.assignee ?? "Unassigned"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Messages</span>
            <span className="inline-flex items-center gap-1 font-medium tabular-nums">
              <Hash className="h-3 w-3 text-muted-foreground" />
              {messageCount}
            </span>
          </div>
        </div>
      </Block>

      <Block label="Tags">
        <div className="flex flex-wrap gap-1.5">
          {INBOX_TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  on
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {on ? <Check className="h-2.5 w-2.5" /> : <Tag className="h-2.5 w-2.5" />}
                {t}
              </button>
            );
          })}
        </div>
      </Block>

      <Block label="Opt-ins">
        <div className="space-y-1.5 text-xs">
          {optIns.map((o) => (
            <div key={o.label} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{o.label}</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  o.on
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-border/60 bg-muted/40 text-muted-foreground",
                )}
              >
                {o.on ? "Yes" : "No"}
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block label="AI handover">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              botPaused
                ? "border-border/60 bg-muted/40 text-muted-foreground"
                : "border-primary/40 bg-primary/15 text-primary",
            )}
          >
            <Bot className="h-3 w-3" />
            {botPaused ? "Paused" : "Bot"}
          </span>
          <Button variant="outline" size="sm" className="h-7 rounded-full text-[11px]" onClick={onToggleBot}>
            {botPaused ? "Resume bot" : "Take over"}
          </Button>
        </div>
      </Block>
    </div>
  );
}

export default InboxContextPanel;
