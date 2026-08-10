import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Route,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAccounts } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";
import {
  RESHARE_PLATFORM_IDS,
  createDefaultReshareFlow,
  defaultTransform,
  platformName,
  type ReshareFlow,
} from "@/config/reshare";
import { useReshareFlows } from "@/hooks/useReshareFlows";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReshareStudio() {
  const { accounts } = useAccounts();
  const { items, add, update, remove, duplicate } = useReshareFlows();
  const [editingFlow, setEditingFlow] = useState<ReshareFlow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const connectedIds = useMemo(
    () => Array.from(new Set(accounts.map((account) => account.platformId))),
    [accounts]
  );

  const stats = useMemo(() => {
    const enabled = items.filter((f) => f.enabled).length;
    const delivered = items.reduce((sum, f) => sum + f.metrics.delivered, 0);
    return { enabled, delivered, total: items.length };
  }, [items]);

  const handleCreate = () => {
    const newFlow = createDefaultReshareFlow("instagram");
    setEditingFlow(newFlow);
    setIsCreating(true);
  };

  const handleEdit = (flow: ReshareFlow) => {
    setEditingFlow(flow);
    setIsCreating(false);
  };

  const handleSave = (flow: ReshareFlow) => {
    if (isCreating) {
      add(flow);
      toast.success("Reshare flow created");
    } else {
      update(flow.id, flow);
      toast.success("Reshare flow updated");
    }
    setEditingFlow(null);
    setIsCreating(false);
  };

  const handleDelete = (flow: ReshareFlow) => {
    remove(flow.id);
    toast.success("Flow deleted");
  };

  const handleDuplicate = (flow: ReshareFlow) => {
    duplicate(flow);
    toast.success("Flow duplicated");
  };

  const handleRun = (flow: ReshareFlow) => {
    update(flow.id, {
      lastRunAt: new Date().toISOString(),
      metrics: {
        ...flow.metrics,
        runs: flow.metrics.runs + 1,
        delivered: flow.metrics.delivered + flow.destinations.filter((d) => d.enabled).length,
      },
    });
    toast.success("Test delivery sent", { description: "This was a dry run" });
  };

  return (
    <div className="space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
      {/* Header — title + New Flow stay side-by-side on every screen,
          exactly like desktop/tablet (no stacking on mobile) */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reshare Studio</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Automatically distribute content across multiple platforms
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Flow
        </Button>
      </div>

      {/* Stats — always 3-across (mobile too, exactly like tablet/desktop),
          just compacted so nothing wraps */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs truncate">Active Flows</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{stats.enabled}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">{stats.total} total flows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs truncate">Posts Delivered</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{stats.delivered}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardDescription className="text-[10px] sm:text-xs truncate">Connected Channels</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{connectedIds.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">Ready to receive content</p>
          </CardContent>
        </Card>
      </div>

      {/* Editor */}
      {editingFlow && (
        <FlowEditor
          flow={editingFlow}
          connectedIds={connectedIds}
          onSave={handleSave}
          onCancel={() => {
            setEditingFlow(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* Flows List */}
      {!editingFlow && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Flows</h2>
          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Route className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm font-medium">No reshare flows yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first flow to start distributing content
                </p>
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Flow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  onEdit={() => handleEdit(flow)}
                  onDelete={() => handleDelete(flow)}
                  onDuplicate={() => handleDuplicate(flow)}
                  onRun={() => handleRun(flow)}
                  onToggle={() => {
                    update(flow.id, { enabled: !flow.enabled });
                    toast(flow.enabled ? "Flow paused" : "Flow enabled");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowCard({
  flow,
  onEdit,
  onDelete,
  onDuplicate,
  onRun,
  onToggle,
}: {
  flow: ReshareFlow;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRun: () => void;
  onToggle: () => void;
}) {
  const enabledCount = flow.destinations.filter((d) => d.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{flow.name}</CardTitle>
              <Badge variant={flow.enabled ? "default" : "secondary"}>
                {flow.enabled ? "Active" : "Paused"}
              </Badge>
            </div>
            <CardDescription className="mt-1">{flow.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRun}>
                <Play className="mr-2 h-4 w-4" />
                Test Run
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {flow.enabled ? "Pause" : "Enable"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={flow.sourcePlatform} showBackground size="sm" />
            <span className="text-muted-foreground">→</span>
            <div className="flex -space-x-2">
              {flow.destinations
                .filter((d) => d.enabled)
                .slice(0, 3)
                .map((dest) => (
                  <PlatformIcon
                    key={dest.platformId}
                    platform={dest.platformId}
                    showBackground
                    size="sm"
                    className="ring-2 ring-background"
                  />
                ))}
              {enabledCount > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
                  +{enabledCount - 3}
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span>{enabledCount} destinations</span>
            <span>{flow.metrics.delivered} delivered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlowEditor({
  flow,
  connectedIds,
  onSave,
  onCancel,
}: {
  flow: ReshareFlow;
  connectedIds: string[];
  onSave: (flow: ReshareFlow) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ReshareFlow>(flow);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (draft.destinations.filter((d) => d.enabled).length === 0) {
      toast.error("Select at least one destination");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onSave(draft);
      setSaving(false);
    }, 300);
  };

  const toggleDestination = (platformId: string) => {
    setDraft((current) => {
      const existing = current.destinations.find((d) => d.platformId === platformId);
      if (existing) {
        return {
          ...current,
          destinations: current.destinations.map((d) =>
            d.platformId === platformId ? { ...d, enabled: !d.enabled } : d
          ),
        };
      }
      return {
        ...current,
        destinations: [
          ...current.destinations,
          {
            platformId,
            enabled: true,
            transform: defaultTransform(current.sourcePlatform, platformId),
            delayMinutes: 0,
          },
        ],
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Flow</CardTitle>
        <CardDescription>Configure how content is distributed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Flow Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g., Cross-platform distribution"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="What does this flow do?"
          />
        </div>

        <div className="space-y-3">
          <Label>Source Platform</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RESHARE_PLATFORM_IDS.map((platformId) => {
              const selected = draft.sourcePlatform === platformId;
              const connected = connectedIds.includes(platformId);
              return (
                <button
                  key={platformId}
                  type="button"
                  onClick={() => setDraft({ ...draft, sourcePlatform: platformId })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <PlatformIcon platform={platformId} showBackground size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{platformName(platformId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {connected ? "Connected" : "Preview"}
                    </p>
                  </div>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Destinations</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RESHARE_PLATFORM_IDS.filter((id) => id !== draft.sourcePlatform).map((platformId) => {
              const selected = draft.destinations.some(
                (d) => d.platformId === platformId && d.enabled
              );
              const connected = connectedIds.includes(platformId);
              return (
                <button
                  key={platformId}
                  type="button"
                  onClick={() => toggleDestination(platformId)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <PlatformIcon platform={platformId} showBackground size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{platformName(platformId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {connected ? "Connected" : "Preview"}
                    </p>
                  </div>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Save Flow
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReshareStudio;
