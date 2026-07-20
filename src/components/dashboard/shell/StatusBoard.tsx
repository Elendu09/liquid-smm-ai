import { useEffect, useMemo, useState, ReactNode } from "react";
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

  const card = (i: StatusItem, dense = false): ReactNode => (
    <div className={cn("flex items-start gap-3", dense ? "p-3" : "p-3")}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{i.title}</p>
        {i.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{i.subtitle}</p>
        )}
        {i.meta && <p className="text-[11px] text-muted-foreground mt-1">{i.meta}</p>}
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
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
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
    </div>
  );
}
