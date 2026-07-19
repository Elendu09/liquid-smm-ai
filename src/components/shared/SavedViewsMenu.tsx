import { useState } from "react";
import { Bookmark, BookmarkPlus, Check, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedViews, type SavedView } from "@/hooks/useSavedViews";
import { toast } from "sonner";

interface SavedViewsMenuProps<F> {
  scopeKey: string;
  currentFilters: F;
  activeViewId?: string | null;
  onApply: (view: SavedView<F>) => void;
  onClear?: () => void;
}

export function SavedViewsMenu<F>({
  scopeKey,
  currentFilters,
  activeViewId,
  onApply,
  onClear,
}: SavedViewsMenuProps<F>) {
  const { views, save, remove, togglePin } = useSavedViews<F>(scopeKey);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const active = views.find((v) => v.id === activeViewId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full">
          <Bookmark className="h-3.5 w-3.5" />
          <span className="text-xs">{active?.name ?? "Views"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Saved views
        </DropdownMenuLabel>
        {views.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">No saved views yet.</div>
        )}
        {views.map((v) => (
          <DropdownMenuItem
            key={v.id}
            onSelect={(e) => {
              e.preventDefault();
              onApply(v);
              setOpen(false);
            }}
            className="group flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 truncate">
              {v.id === activeViewId && <Check className="h-3 w-3 text-primary" />}
              {v.pinned && <Pin className="h-3 w-3 text-primary" />}
              <span className="truncate">{v.name}</span>
            </span>
            <span className="hidden gap-1 group-hover:flex">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(v.id);
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Pin"
              >
                <Pin className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v.id);
                }}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 p-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this view"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                save(name.trim(), currentFilters);
                toast.success(`Saved view "${name.trim()}"`);
                setName("");
                setOpen(false);
              }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={!name.trim()}
            onClick={() => {
              save(name.trim(), currentFilters);
              toast.success(`Saved view "${name.trim()}"`);
              setName("");
              setOpen(false);
            }}
            aria-label="Save view"
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        </div>
        {onClear && active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onClear();
                setOpen(false);
              }}
              className="text-xs text-muted-foreground"
            >
              Clear active view
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
