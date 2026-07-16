import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot, Plus, Trash2, Power, LayoutGrid, List } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  ListView,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

interface BotRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runs: number;
}

const seed: BotRule[] = [
  { id: "r1", name: "Welcome new followers", trigger: "New follower", action: "Send welcome DM", enabled: true, runs: 128 },
  { id: "r2", name: "Auto-like niche hashtags", trigger: "Hashtag #photography", action: "Like recent posts", enabled: true, runs: 542 },
  { id: "r3", name: "Reply to keywords", trigger: 'Comment contains "price"', action: "Reply with DM prompt", enabled: false, runs: 34 },
];

export default function BotRulesView() {
  const [view, setView] = useViewMode("engage-bot", "grid", );
  const { items, setItems, add, update, remove } = useLocalCollection<BotRule>("engage", "bot-rules");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");

  useEffect(() => { if (items.length === 0) setItems(seed); }, [items.length, setItems]);

  const filtered = useMemo(
    () => items.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const addRule = () => {
    if (!name.trim()) return;
    add({ id: crypto.randomUUID(), name: name.trim(), trigger: "Custom", action: "Custom", enabled: false, runs: 0 });
    setName("");
    toast.success("Rule created");
  };

  const RuleCard = ({ r, dense = false }: { r: BotRule; dense?: boolean }) => (
    <div className={cn("flex items-start gap-3", dense ? "p-3" : "p-4")}>
      <div className={cn(
        "rounded-lg flex items-center justify-center flex-shrink-0",
        r.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        dense ? "w-9 h-9" : "w-10 h-10",
      )}>
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold truncate">{r.name}</h3>
          <Switch
            checked={r.enabled}
            onCheckedChange={(v) => { update(r.id, { enabled: v }); toast(v ? "Rule enabled" : "Rule disabled"); }}
            aria-label={r.enabled ? "Disable rule" : "Enable rule"}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-medium text-foreground/80">When</span> {r.trigger} · <span className="font-medium text-foreground/80">then</span> {r.action}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Power className="h-3 w-3" /> {r.runs.toLocaleString()} runs
          </span>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            aria-label="Delete rule" onClick={() => { remove(r.id); toast.success("Rule deleted"); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules…"
        viewToggle={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Cards", icon: (p) => <LayoutGrid {...p} /> },
              { value: "list", label: "List", icon: (p) => <List {...p} /> },
            ]}
          />
        }
        actions={
          <div className="flex gap-1.5">
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRule()}
              placeholder="New rule name…" className="h-9 w-40 sm:w-56"
              aria-label="New rule name"
            />
            <Button size="sm" onClick={addRule} disabled={!name.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card hover:shadow-md transition-shadow">
              <RuleCard r={r} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
              No rules yet — add your first above.
            </div>
          )}
        </div>
      ) : (
        <ListView items={filtered} getKey={(r) => r.id} renderItem={(r) => <RuleCard r={r} dense />} />
      )}
    </div>
  );
}
