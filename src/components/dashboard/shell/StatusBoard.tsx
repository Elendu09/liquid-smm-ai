import { useMemo, useState, ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Trash2, type LucideIcon } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHubItems } from "@/hooks/useHubItems";
import { useGuest } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";
import { PanelSection } from "@/components/shared/PanelSection";
import { MediaThumb } from "@/components/shared/MediaThumb";

export interface StatusItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  meta?: string;
  createdAt: string;
}

interface StatusBoardConfig<S extends string> {
  storageKey: string; // e.g. "audience:followers"
  hubKey: string; // for view persistence
  columns: KanbanColumnDef<S>[];
  seed: StatusItem[];
  icon: LucideIcon;
  searchPlaceholder?: string;
  addPlaceholder?: string;
  emptyLabel?: string;
  title?: string;
  description?: string;
}

export function StatusBoard<S extends string>({
  storageKey,
  hubKey,
  columns,
  seed,
  icon: Icon,
  searchPlaceholder = "Search…",
  addPlaceholder = "Add new…",
  emptyLabel,
  title,
  description,
}: StatusBoardConfig<S>) {
  const [view, setView] = useViewMode(hubKey, "kanban");
  const { guardWrite } = useGuest();
  const { items, add, update, remove } = useHubItems(storageKey, seed as StatusItem[]);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        !search
          ? true
          : (i.title + " " + (i.subtitle ?? "")).toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const addItem = () => {
    if (!newTitle.trim()) return;
    if (!guardWrite("add items")) return;
    void add({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      status: columns[0].id,
      createdAt: new Date().toISOString(),
    });
    setNewTitle("");
    toast.success("Added");
  };

  const STATUS_PREVIEWS: Record<string, string> = {
    mine: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60",
    team: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&auto=format&fit=crop&q=60",
    favorite: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=60",
  };

  const card = (i: StatusItem, dense = false): ReactNode => {
    const preview = (i as unknown as { imageUrl?: string }).imageUrl ?? STATUS_PREVIEWS[i.status] ?? STATUS_PREVIEWS.mine;
    const isVideo = (i as unknown as { type?: string }).type === "video" || (preview && /\.(mp4|webm|mov)/i.test(preview));
    return (
      <div className="group overflow-hidden flex flex-col">
        <div className={cn("relative overflow-hidden bg-muted/30", dense ? "h-16" : "aspect-[16/10]")}>
          <MediaThumb url={preview} alt={i.title} className="h-full w-full" onPlay={(u) => window.open(u, "_blank", "noopener")} />
          {isVideo && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">Video</span>}
        </div>
        <div className={cn("flex items-start gap-2", dense ? "p-2.5" : "p-3")}>
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold tracking-tight truncate leading-none">{i.title}</p>
            {i.subtitle && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{i.subtitle}</p>
            )}
            {i.meta && <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{i.meta}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
            aria-label={`Delete ${i.title}`}
            onClick={() => {
              if (!guardWrite("delete items")) return;
              void remove(i.id);
              toast.success("Deleted");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      <PanelSection
        icon={Icon}
        title={title ?? "Board"}
        description={description ?? "Every card has a live image preview; videos show a Play overlay. Drag to move columns."}
        accent="from-primary via-primary/50 to-transparent"
      >
        <ToolbarBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          viewToggle={<ViewToggle value={view} onChange={setView} />}
          actions={
            <div className="flex gap-1.5">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder={addPlaceholder}
                className="h-9 w-40 sm:w-56"
                aria-label={addPlaceholder}
              />
              <Button size="sm" onClick={addItem} disabled={!newTitle.trim()} aria-label="Add">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {view === "kanban" ? (
          <KanbanBoard
            columns={columns}
            items={filtered as any}
            getKey={(i: any) => i.id}
            getStatus={(i: any) => i.status}
            onMove={(item: any, _from, to) => {
              if (!guardWrite("move items")) return;
              void update(item.id, { status: to });
              toast.success(`Moved to ${to}`);
            }}
            renderItem={(i: any) => card(i)}
          />
        ) : (
          <ListView
            items={filtered}
            getKey={(i) => i.id}
            emptyLabel={emptyLabel ?? "Nothing here yet."}
            renderItem={(i) => card(i, true)}
          />
        )}
      </PanelSection>
    </div>
  );
}
