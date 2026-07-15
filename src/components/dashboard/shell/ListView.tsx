import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListViewProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyLabel?: string;
  className?: string;
}

export function ListView<T>({
  items,
  getKey,
  renderItem,
  emptyLabel = "No items yet",
  className,
}: ListViewProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
        {emptyLabel}
      </div>
    );
  }
  return (
    <ul className={cn("divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden", className)}>
      {items.map((item) => (
        <li key={getKey(item)} className="hover:bg-muted/30 transition-colors">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
