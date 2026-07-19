import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Reply, Clock, Check, RotateCcw, User, Sparkles } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { analyzeMessage, snippetFor, SENTIMENT_STYLE, INTENT_LABEL } from "@/hooks/useInboxAnalysis";

type InboxStatus = "new" | "replied" | "snoozed" | "resolved";

export interface InboxItem {
  id: string;
  author: string;
  handle: string;
  platform: string;
  message: string;
  createdAt: string;
  status: InboxStatus;
  kind: "comment" | "dm";
}

const columns: KanbanColumnDef<InboxStatus>[] = [
  { id: "new", label: "New", emptyLabel: "Inbox zero ✨" },
  { id: "replied", label: "Replied", emptyLabel: "Nothing replied yet" },
  { id: "snoozed", label: "Snoozed", emptyLabel: "No snoozed items" },
  { id: "resolved", label: "Resolved", emptyLabel: "Nothing resolved yet" },
];

const seed = (kind: "comment" | "dm"): InboxItem[] => {
  const now = Date.now();
  const base = kind === "comment"
    ? [
        { author: "Jordan Lee", handle: "@jordan.creates", platform: "instagram", message: "This reel is 🔥 how did you edit it?" },
        { author: "Sam Rivera", handle: "@samr", platform: "tiktok", message: "Where's the sound from?" },
        { author: "Priya Kapoor", handle: "@priyak", platform: "youtube", message: "Do a follow-up please!" },
        { author: "Alex Chen", handle: "@alexc", platform: "instagram", message: "Great tips 🙌" },
      ]
    : [
        { author: "Marta Silva", handle: "@marta.design", platform: "instagram", message: "Hi! Are you open to collabs?" },
        { author: "Ken Fujita", handle: "@kenf", platform: "twitter", message: "Loved your post — quick question…" },
        { author: "Rosa Bianchi", handle: "@rosab", platform: "linkedin", message: "Can I share this internally?" },
      ];
  return base.map((b, i) => ({
    id: `${kind}-${i}`,
    ...b,
    createdAt: new Date(now - i * 3600_000).toISOString(),
    status: "new" as InboxStatus,
    kind,
  }));
};

function InboxCard({
  item,
  onReply,
  onSnooze,
  onResolve,
  onReopen,
  onQuickReply,
}: {
  item: InboxItem;
  onReply: () => void;
  onSnooze: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onQuickReply: (text: string) => void;
}) {
  const { sentiment, intent } = useMemo(() => analyzeMessage(item.message), [item.message]);
  const snippet = useMemo(() => snippetFor(intent, item.author), [intent, item.author]);
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold truncate">{item.author}</span>
            <PlatformIcon platform={item.platform} className="h-3 w-3 flex-shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{item.handle}</p>
        </div>
      </div>
      <p className="text-sm text-foreground line-clamp-3">{item.message}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-0.5">
          {item.status !== "replied" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Reply" onClick={onReply}>
              <Reply className="h-3.5 w-3.5" />
            </Button>
          )}
          {item.status === "new" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Snooze" onClick={onSnooze}>
              <Clock className="h-3.5 w-3.5" />
            </Button>
          )}
          {item.status !== "resolved" ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Mark resolved" onClick={onResolve}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Reopen" onClick={onReopen}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface InboxBoardProps {
  kind: "comment" | "dm";
  title: string;
  description?: string;
}

export function InboxBoard({ kind, title, description }: InboxBoardProps) {
  const [view, setView] = useViewMode(`engage-${kind}`, "kanban");
  const { items, setItems, update } = useLocalCollection<InboxItem>("engage", kind);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxStatus | "all">("all");

  useEffect(() => {
    if (items.length === 0) setItems(seed(kind));
  }, [items.length, setItems, kind]);

  const filtered = useMemo(() => {
    let out = items;
    if (filter !== "all") out = out.filter((i) => i.status === filter);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((i) => i.message.toLowerCase().includes(q) || i.author.toLowerCase().includes(q));
    }
    return out;
  }, [items, filter, search]);

  const actions = (item: InboxItem) => ({
    onReply: () => {
      update(item.id, { status: "replied" });
      toast.success(`Reply sent to ${item.author}`);
    },
    onSnooze: () => {
      update(item.id, { status: "snoozed" });
      toast(`${item.author} snoozed for 24h`);
    },
    onResolve: () => {
      update(item.id, { status: "resolved" });
      toast.success("Marked resolved");
    },
    onReopen: () => {
      update(item.id, { status: "new" });
      toast("Reopened");
    },
  });

  const filterChips: [InboxStatus | "all", string][] = [
    ["all", "All"],
    ["new", "New"],
    ["replied", "Replied"],
    ["snoozed", "Snoozed"],
    ["resolved", "Resolved"],
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        filters={
          <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Filter by status">
            {filterChips.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                aria-pressed={filter === val}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-8",
                  filter === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(i) => i.id}
          getStatus={(i) => i.status}
          onMove={(item, _from, to) => {
            update(item.id, { status: to });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(i) => <InboxCard item={i} {...actions(i)} />}
        />
      ) : (
        <ListView
          items={filtered}
          getKey={(i) => i.id}
          emptyLabel="No conversations match your filters."
          renderItem={(i) => (
            <div className="p-4">
              <InboxCard item={i} {...actions(i)} />
            </div>
          )}
        />
      )}
    </div>
  );
}
