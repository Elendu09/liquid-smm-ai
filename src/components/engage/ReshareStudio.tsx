import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  DatabaseZap,
  Download,
  ExternalLink,
  FileJson,
  Filter,
  Globe2,
  History,
  Layers3,
  Link2,
  Loader2,
  MoreHorizontal,
  Network,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Split,
  Trash2,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAccounts } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";
import {
  RESHARE_CAPABILITIES,
  RESHARE_MODES,
  RESHARE_PLATFORM_IDS,
  capabilityFor,
  createDefaultReshareFlow,
  createN8nWebhookPayload,
  createN8nWorkflowJson,
  defaultTransform,
  destinationReadiness,
  flowHealth,
  normalizeTargetList,
  platformName,
  platformShortName,
  supportedMediaLabel,
  type ReshareDestination,
  type ReshareFlow,
  type ReshareMode,
  type ReshareTransform,
} from "@/config/reshare";
import { platforms } from "@/config/platforms";
import { useReshareFlows } from "@/hooks/useReshareFlows";
import { isGuestSession } from "@/hooks/useGuest";

const PANEL_CLASS = "rounded-2xl border border-border/60 bg-card/70 shadow-sm";
const SOFT_PANEL_CLASS = "rounded-xl border border-border/60 bg-background/60";
const TRANSFORMS: Array<{ id: ReshareTransform; label: string; description: string }> = [
  { id: "native", label: "Keep native", description: "Preserve the source voice and format." },
  { id: "adapt", label: "Adapt copy", description: "Rewrite for destination limits and tone." },
  { id: "shorten", label: "Shorten", description: "Condense the caption without losing the CTA." },
  { id: "thread", label: "Split thread", description: "Turn long copy into connected posts." },
  { id: "visual", label: "Visual-first", description: "Prioritize media and generate a short caption." },
];

type StudioTab = "builder" | "flows" | "n8n";

function createId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
}

function createFlowId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatRelative(date?: string) {
  if (!date) return "Never";
  const delta = Math.max(0, Date.now() - new Date(date).getTime());
  const mins = Math.round(delta / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function copyText(value: string, successMessage: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast.error("Clipboard access is unavailable in this preview");
    return;
  }
  void navigator.clipboard.writeText(value).then(
    () => toast.success(successMessage),
    () => toast.error("Could not copy to clipboard"),
  );
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("JSON export downloaded");
}

function metricChange(value: number) {
  return value > 0 ? `+${value}%` : `${value}%`;
}

function platformGroupLabel(platformId: string) {
  if (["instagram", "tiktok", "youtube", "pinterest", "snapchat"].includes(platformId)) return "Visual networks";
  if (["facebook", "twitter", "linkedin", "threads", "bluesky", "reddit"].includes(platformId)) return "Social networks";
  if (["telegram", "discord", "whatsapp"].includes(platformId)) return "Messaging channels";
  return "Business listings";
}

function destinationTone(readiness: "ready" | "adapt" | "blocked") {
  if (readiness === "ready") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  if (readiness === "adapt") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  return "text-rose-500 bg-rose-500/10 border-rose-500/20";
}

function readinessLabel(readiness: "ready" | "adapt" | "blocked") {
  if (readiness === "ready") return "Ready to publish";
  if (readiness === "adapt") return "Needs adaptation";
  return "Connect to unlock";
}

function destinationIcon(platformId: string, selected: boolean) {
  return (
    <div className={cn("relative rounded-xl p-0.5 transition-colors", selected ? "ring-2 ring-primary/40" : "")}>
      <PlatformIcon platform={platformId} showBackground size="lg" />
      {selected && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  accent,
  detail,
}: {
  label: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  detail: string;
}) {
  return (
    <div className={cn(SOFT_PANEL_CLASS, "group relative overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30") }>
      <div className={cn("absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20", accent)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {change && <span className="mb-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">{change}</span>}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl border", accent, "border-current/20")}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StudioHeader({
  tab,
  onTabChange,
  onNew,
}: {
  tab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  onNew: () => void;
}) {
  const tabs: Array<{ id: StudioTab; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = [
    { id: "builder", label: "Route builder", icon: Route, hint: "Design a delivery path" },
    { id: "flows", label: "Live flows", icon: Layers3, hint: "Monitor reshare automations" },
    { id: "n8n", label: "n8n bridge", icon: Webhook, hint: "Export and receive events" },
  ];
  return (
    <div className="mb-5 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10"><Network className="h-3 w-3" /></span>
            Republish engine
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Move one idea everywhere.</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Adapt a source post into platform-native deliveries, route it through approvals, or let n8n orchestrate the handoff.
          </p>
        </div>
        <Button onClick={onNew} className="shrink-0 shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-4 w-4" /> New reshare flow
        </Button>
      </div>
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-fit">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all",
                tab === item.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              title={item.hint}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlatformSourcePicker({
  value,
  onChange,
  connectedIds,
}: {
  value: string;
  onChange: (value: string) => void;
  connectedIds: string[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold">Source channel</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Listen for a new post, approved draft, or RSS item.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {RESHARE_PLATFORM_IDS.map((platformId) => {
          const platform = platforms.find((item) => item.id === platformId);
          const selected = value === platformId;
          const connected = connectedIds.includes(platformId);
          return (
            <button
              key={platformId}
              type="button"
              onClick={() => onChange(platformId)}
              className={cn(
                "group flex items-center gap-2 rounded-xl border p-2 text-left transition-all",
                selected ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border/60 bg-card/40 hover:border-primary/30 hover:bg-muted/50",
              )}
            >
              <PlatformIcon platform={platformId} showBackground size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{platform?.name ?? platformId}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500")} />
                  {connected ? "Connected" : "Preview channel"}
                </span>
              </span>
              {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DestinationTile({
  sourcePlatform,
  platformId,
  selected,
  onToggle,
  destination,
  onTransformChange,
}: {
  sourcePlatform: string;
  platformId: string;
  selected: boolean;
  onToggle: () => void;
  destination?: ReshareDestination;
  onTransformChange: (value: ReshareTransform) => void;
}) {
  const capability = capabilityFor(platformId);
  const readiness = destinationReadiness(sourcePlatform, platformId);
  const platform = platforms.find((item) => item.id === platformId);
  return (
    <div className={cn(SOFT_PANEL_CLASS, "relative overflow-hidden p-3 transition-all", selected && "border-primary/50 bg-primary/[0.035] shadow-sm")}>
      <button type="button" className="absolute inset-0 z-0" aria-label={`Toggle ${platform?.name ?? platformId}`} onClick={onToggle} />
      <div className="relative z-10 flex items-start gap-2.5">
        {destinationIcon(platformId, selected)}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-xs font-semibold">{platform?.name ?? platformId}</p>
            <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${platform?.name ?? platformId}`} />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{platformGroupLabel(platformId)}</p>
          <span className={cn("mt-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium", destinationTone(readiness))}>
            {readinessLabel(readiness)}
          </span>
        </div>
      </div>
      <div className="relative z-10 mt-3 border-t border-border/50 pt-2">
        <p className="mb-1 text-[9px] text-muted-foreground">{supportedMediaLabel(platformId)} · max {capability.maxCaption.toLocaleString()} chars</p>
        {selected && (
          <Select value={destination?.transform ?? defaultTransform(sourcePlatform, platformId)} onValueChange={(value) => onTransformChange(value as ReshareTransform)}>
            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSFORMS.map((transform) => <SelectItem key={transform.id} value={transform.id}>{transform.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function RouteMap({ sourcePlatform, destinations }: { sourcePlatform: string; destinations: ReshareDestination[] }) {
  const enabled = destinations.filter((item) => item.enabled);
  return (
    <div className={cn(PANEL_CLASS, "overflow-hidden") }>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-xs font-semibold">Live route map</p>
          <p className="text-[10px] text-muted-foreground">The delivery graph updates as you select destinations.</p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]"><Zap className="h-3 w-3 text-primary" /> {enabled.length} routes</Badge>
      </div>
      <div className="relative min-h-[190px] overflow-x-auto bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.18)_1px,transparent_0)] [background-size:18px_18px] p-5">
        <div className="flex min-w-[580px] items-center justify-center gap-3">
          <div className="flex w-36 flex-col items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-center shadow-lg shadow-primary/10">
            <PlatformIcon platform={sourcePlatform} showBackground size="lg" />
            <div><p className="text-xs font-semibold">{platformName(sourcePlatform)}</p><p className="text-[9px] text-muted-foreground">Source event</p></div>
          </div>
          <div className="flex flex-col items-center gap-1 text-primary">
            <div className="h-px w-20 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
            <span className="rounded-full border border-primary/30 bg-card px-2 py-1 text-[9px] font-semibold">adapt + route</span>
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="grid min-w-[240px] max-w-[360px] grid-cols-2 gap-2">
            {enabled.length === 0 && <div className="col-span-2 rounded-xl border border-dashed border-border/60 p-5 text-center text-xs text-muted-foreground">Select at least one destination.</div>}
            {enabled.map((destination) => (
              <div key={destination.platformId} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 p-2">
                <PlatformIcon platform={destination.platformId} showBackground size="sm" />
                <div className="min-w-0"><p className="truncate text-[10px] font-semibold">{platformShortName(destination.platformId)}</p><p className="truncate text-[9px] text-muted-foreground">{destination.transform}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[9px] text-muted-foreground"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Each destination gets its own limits and delivery status.</div>
      </div>
    </div>
  );
}

function DeliveryOptions({
  mode,
  onModeChange,
  includeMedia,
  includeCaption,
  includeLink,
  requireApproval,
  onToggle,
  schedule,
  onScheduleChange,
}: {
  mode: ReshareMode;
  onModeChange: (mode: ReshareMode) => void;
  includeMedia: boolean;
  includeCaption: boolean;
  includeLink: boolean;
  requireApproval: boolean;
  onToggle: (key: "includeMedia" | "includeCaption" | "includeLink" | "requireApproval", value: boolean) => void;
  schedule: string;
  onScheduleChange: (value: string) => void;
}) {
  return (
    <div className={cn(PANEL_CLASS, "p-4") }>
      <div className="mb-4 flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Delivery policy</p><p className="text-[10px] text-muted-foreground">Make the route feel native on every network.</p></div></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {RESHARE_MODES.map((item) => (
          <button key={item.id} type="button" onClick={() => onModeChange(item.id)} className={cn("rounded-xl border p-3 text-left transition-all", mode === item.id ? "border-primary/60 bg-primary/10" : "border-border/60 hover:border-primary/30")}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{item.label}</span>{mode === item.id && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Source event</Label><Select value={schedule} onValueChange={onScheduleChange}><SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Every new post">Every new post</SelectItem><SelectItem value="Only approved posts">Only approved posts</SelectItem><SelectItem value="New RSS item">New RSS item</SelectItem><SelectItem value="Manual run only">Manual run only</SelectItem></SelectContent></Select></div>
        <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Stagger destinations</Label><Select defaultValue="0"><SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">No delay — publish together</SelectItem><SelectItem value="15">15 minutes apart</SelectItem><SelectItem value="30">30 minutes apart</SelectItem><SelectItem value="60">1 hour apart</SelectItem></SelectContent></Select></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {([
          ["includeMedia", "Carry media", "Keep the original media when the destination accepts it.", includeMedia],
          ["includeCaption", "Carry caption", "Send the caption through the selected adaptation.", includeCaption],
          ["includeLink", "Keep source link", "Append a trackable source URL where supported.", includeLink],
          ["requireApproval", "Approval before send", "Hold adapted drafts in the approval queue.", requireApproval],
        ] as const).map(([key, label, hint, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3"><div className="min-w-0"><p className="text-xs font-medium">{label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p></div><Switch checked={value} onCheckedChange={(next) => onToggle(key, next)} /></div>
        ))}
      </div>
    </div>
  );
}

function N8nWorkflowCard({ flow, webhookUrl, onWebhookUrlChange }: { flow: ReshareFlow; webhookUrl: string; onWebhookUrlChange: (value: string) => void }) {
  const workflow = useMemo(() => createN8nWorkflowJson(flow, webhookUrl), [flow, webhookUrl]);
  const payload = useMemo(() => createN8nWebhookPayload(flow), [flow]);
  const [showJson, setShowJson] = useState(false);
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  return (
    <div className={cn(PANEL_CLASS, "overflow-hidden") }>
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-500/10 text-pink-500"><Webhook className="h-5 w-5" /></div><div><p className="text-sm font-semibold">n8n delivery bridge</p><p className="mt-1 max-w-xl text-xs text-muted-foreground">Use the generated workflow as an importable n8n canvas. The webhook receives one normalized event and fans it out to every selected destination.</p></div></div>
        <Badge className="w-fit gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Template ready</Badge>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          <div><Label className="text-xs">n8n webhook URL</Label><div className="mt-1 flex gap-2"><Input value={webhookUrl} onChange={(event) => onWebhookUrlChange(event.target.value)} className="h-9 text-xs" placeholder="https://n8n.example.com/webhook/reshare" /><Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => copyText(webhookUrl, "Webhook URL copied")} aria-label="Copy webhook URL"><Copy className="h-3.5 w-3.5" /></Button></div><p className="mt-1 text-[10px] text-muted-foreground">Store the secret in n8n credentials or an environment variable — never in a public workflow export.</p></div>
          <div className="grid grid-cols-3 gap-2"><div className={cn(SOFT_PANEL_CLASS, "p-3 text-center")}><p className="text-lg font-semibold">{nodes.length}</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">nodes</p></div><div className={cn(SOFT_PANEL_CLASS, "p-3 text-center")}><p className="text-lg font-semibold">{flow.destinations.filter((item) => item.enabled).length}</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">routes</p></div><div className={cn(SOFT_PANEL_CLASS, "p-3 text-center")}><p className="text-lg font-semibold">JSON</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">portable</p></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => downloadJson(`${flow.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-n8n.json`, workflow)}><Download className="mr-1.5 h-3.5 w-3.5" /> Download n8n JSON</Button><Button size="sm" variant="outline" onClick={() => copyText(JSON.stringify(workflow, null, 2), "n8n workflow JSON copied")}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy JSON</Button><Button size="sm" variant="ghost" onClick={() => setShowJson((value) => !value)}><Code2 className="mr-1.5 h-3.5 w-3.5" /> {showJson ? "Hide preview" : "Preview JSON"}</Button></div>
          {showJson && <pre className="max-h-72 overflow-auto rounded-xl border border-border/60 bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">{JSON.stringify(workflow, null, 2)}</pre>}
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Event contract</p><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyText(JSON.stringify(payload, null, 2), "Payload copied")} aria-label="Copy event payload"><Copy className="h-3 w-3" /></Button></div><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-muted-foreground">{JSON.stringify(payload, null, 2)}</pre></div>
      </div>
      <div className="border-t border-border/60 bg-pink-500/[0.035] px-4 py-3"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" /><p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Suggested n8n chain:</span> Webhook → Normalize source → Split destinations → platform-specific adapt node → HTTP request → delivery log. The exported template gives you the first three nodes and an endpoint per destination.</p></div></div>
    </div>
  );
}

function FlowRow({
  flow,
  active,
  onSelect,
  onToggle,
  onRun,
  onDuplicate,
  onDelete,
}: {
  flow: ReshareFlow;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRun: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const health = flowHealth(flow);
  const healthClass = health.tone === "good" ? "text-emerald-500 bg-emerald-500/10" : health.tone === "warn" ? "text-amber-500 bg-amber-500/10" : "text-rose-500 bg-rose-500/10";
  return (
    <div className={cn("group rounded-xl border p-3 transition-all", active ? "border-primary/50 bg-primary/[0.035]" : "border-border/60 bg-card/40 hover:border-primary/30")}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-3 text-left"><div className="flex items-center -space-x-2">{[flow.sourcePlatform, ...flow.destinations.filter((item) => item.enabled).slice(0, 3).map((item) => item.platformId)].map((platformId, index) => <span key={`${platformId}-${index}`} className="relative rounded-full border-2 border-card"><PlatformIcon platform={platformId} showBackground size="sm" /></span>)}{flow.destinations.filter((item) => item.enabled).length > 3 && <span className="relative grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold">+{flow.destinations.filter((item) => item.enabled).length - 3}</span>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{flow.name}</p><span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", healthClass)}>{health.label}</span></div><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{flow.description}</p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Route className="h-3 w-3" /> {flow.destinations.filter((item) => item.enabled).length} destinations</span><span className="inline-flex items-center gap-1"><Send className="h-3 w-3" /> {formatNumber(flow.metrics.delivered)} delivered</span><span className="inline-flex items-center gap-1"><History className="h-3 w-3" /> {formatRelative(flow.lastRunAt)}</span></div></div></button>
        <div className="flex shrink-0 items-center gap-0.5"><Switch checked={flow.enabled} onCheckedChange={onToggle} aria-label={flow.enabled ? "Pause flow" : "Enable flow"} /><Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRun} aria-label="Run flow"><Play className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-70 group-hover:opacity-100" onClick={onDuplicate} aria-label="Duplicate flow"><Copy className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-70 group-hover:opacity-100" onClick={onDelete} aria-label="Delete flow"><Trash2 className="h-3.5 w-3.5" /></Button></div>
      </div>
      {active && <div className="mt-3 border-t border-border/50 pt-3"><div className="grid grid-cols-4 gap-2"><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Runs</p><p className="mt-1 text-sm font-semibold">{formatNumber(flow.metrics.runs)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Queued</p><p className="mt-1 text-sm font-semibold text-amber-500">{formatNumber(flow.metrics.queued)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Failed</p><p className="mt-1 text-sm font-semibold text-rose-500">{formatNumber(flow.metrics.failed)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Saved</p><p className="mt-1 text-sm font-semibold text-emerald-500">{Math.round(flow.metrics.savedMinutes / 60)}h</p></div></div></div>}
    </div>
  );
}

function FlowList({
  flows,
  activeId,
  onSelect,
  onToggle,
  onRun,
  onDuplicate,
  onDelete,
  onNew,
}: {
  flows: ReshareFlow[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggle: (flow: ReshareFlow) => void;
  onRun: (flow: ReshareFlow) => void;
  onDuplicate: (flow: ReshareFlow) => void;
  onDelete: (flow: ReshareFlow) => void;
  onNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "paused" | "attention">("all");
  const visible = flows.filter((flow) => {
    const matchesQuery = !query || `${flow.name} ${flow.description} ${platformName(flow.sourcePlatform)}`.toLowerCase().includes(query.toLowerCase());
    const health = flowHealth(flow);
    const matchesFilter = filter === "all" || (filter === "live" && flow.enabled) || (filter === "paused" && !flow.enabled) || (filter === "attention" && health.tone !== "good");
    return matchesQuery && matchesFilter;
  });
  return (
    <div className={cn(PANEL_CLASS, "p-4") }>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Your reshare flows</p><p className="mt-1 text-xs text-muted-foreground">A delivery flow is a reusable source-to-destination policy.</p></div><Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-3.5 w-3.5" /> New flow</Button></div>
      <div className="mb-3 flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-8 text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flows or channels…" /></div><div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">{(["all", "live", "paused", "attention"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={cn("rounded-md px-2 py-1.5 text-[10px] capitalize", filter === item ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div></div>
      <div className="space-y-2">{visible.map((flow) => <FlowRow key={flow.id} flow={flow} active={activeId === flow.id} onSelect={() => onSelect(flow.id)} onToggle={() => onToggle(flow)} onRun={() => onRun(flow)} onDuplicate={() => onDuplicate(flow)} onDelete={() => onDelete(flow)} />)}</div>
      {visible.length === 0 && <div className="rounded-xl border border-dashed border-border/60 p-10 text-center"><Filter className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No flows match this view</p><p className="mt-1 text-xs text-muted-foreground">Create a new route or clear the filter.</p></div>}
    </div>
  );
}

function SourcePreview({ sourcePlatform, destinations, mode }: { sourcePlatform: string; destinations: ReshareDestination[]; mode: ReshareMode }) {
  const active = destinations.filter((item) => item.enabled);
  return (
    <div className={cn(PANEL_CLASS, "overflow-hidden") }>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><div><p className="text-xs font-semibold">Delivery preview</p><p className="text-[10px] text-muted-foreground">A quick sanity check before you save the route.</p></div><Badge variant="outline" className="text-[10px]">{mode}</Badge></div>
      <div className="p-4"><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><div className="flex items-center gap-2"><PlatformIcon platform={sourcePlatform} showBackground size="sm" /><div><p className="text-xs font-semibold">Source post detected</p><p className="text-[10px] text-muted-foreground">Caption, media, alt text, and source URL</p></div><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" /></div><div className="mt-3 rounded-lg bg-card/70 p-3 text-xs leading-relaxed text-muted-foreground">New product drop, behind the scenes, and the people building it. <span className="text-primary">#launch #buildinpublic</span></div></div><div className="my-3 flex items-center gap-2 text-[10px] text-muted-foreground"><div className="h-px flex-1 bg-border/60" /><ArrowDown className="h-3 w-3" /><span>adapted per destination</span><ArrowDown className="h-3 w-3" /><div className="h-px flex-1 bg-border/60" /></div><div className="space-y-2">{active.slice(0, 4).map((destination) => <div key={destination.platformId} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 p-2"><PlatformIcon platform={destination.platformId} showBackground size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{platformName(destination.platformId)}</p><p className="text-[10px] text-muted-foreground">{destination.transform} · queued for validation</p></div><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /></div>)}{active.length > 4 && <p className="text-center text-[10px] text-muted-foreground">+ {active.length - 4} more destinations</p>}</div></div>
    </div>
  );
}

function N8nGuide({ flow }: { flow: ReshareFlow }) {
  const steps = [
    ["1", "Import the template", "Download the workflow JSON and import it from n8n’s workflow menu."],
    ["2", "Set credentials", "Map each HTTP Request node to the matching connected channel credential."],
    ["3", "Paste the webhook", "Use the webhook URL from your n8n trigger in this studio or your own event source."],
    ["4", "Send a test event", "Run the test payload, approve the delivery, then activate the workflow in n8n."],
  ];
  return (
    <div className={cn(PANEL_CLASS, "p-4") }><div className="mb-4 flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-500/10 text-pink-500"><Webhook className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Connect this route to n8n</p><p className="mt-1 text-xs text-muted-foreground">The bridge keeps delivery orchestration in your control while SMMSAAS handles source events, capabilities, and audit context.</p></div></div><div className="space-y-2">{steps.map(([number, title, description]) => <div key={number} className="flex gap-3 rounded-xl border border-border/60 p-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pink-500/10 text-[10px] font-semibold text-pink-500">{number}</span><div><p className="text-xs font-semibold">{title}</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p></div></div>)}</div><div className="mt-4 flex items-center gap-2 rounded-xl border border-pink-500/20 bg-pink-500/[0.035] p-3"><DatabaseZap className="h-4 w-4 text-pink-500" /><p className="text-[10px] text-muted-foreground">This route currently has <span className="font-semibold text-foreground">{flow.destinations.filter((item) => item.enabled).length} destination branches</span> ready for export.</p></div></div>
  );
}

export function ReshareStudio() {
  const { accounts } = useAccounts();
  const { items, add, update, remove, duplicate, seed } = useReshareFlows();
  const [tab, setTab] = useState<StudioTab>("builder");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sourcePlatform, setSourcePlatform] = useState("instagram");
  const [flowName, setFlowName] = useState("Launch content everywhere");
  const [description, setDescription] = useState("Adapt every new source post for the connected channels.");
  const [mode, setMode] = useState<ReshareMode>("approval");
  const [schedule, setSchedule] = useState("Every new post");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeCaption, setIncludeCaption] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [destinations, setDestinations] = useState<ReshareDestination[]>(() => normalizeTargetList("instagram", ["tiktok", "youtube", "linkedin", "twitter"]));
  const [webhookUrl, setWebhookUrl] = useState("https://n8n.example.com/webhook/smmsaas-reshare");
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showAllDestinations, setShowAllDestinations] = useState(false);

  const connectedIds = useMemo(() => Array.from(new Set(accounts.map((account) => account.platformId))), [accounts]);
  const enabledDestinations = useMemo(() => destinations.filter((destination) => destination.enabled), [destinations]);
  const activeFlow = useMemo(() => items.find((flow) => flow.id === activeId) ?? null, [items, activeId]);
  const stats = useMemo(() => items.reduce((acc, flow) => ({
    flows: acc.flows + (flow.enabled ? 1 : 0),
    delivered: acc.delivered + flow.metrics.delivered,
    queued: acc.queued + flow.metrics.queued,
    savedMinutes: acc.savedMinutes + flow.metrics.savedMinutes,
  }), { flows: 0, delivered: 0, queued: 0, savedMinutes: 0 }), [items]);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) seed();
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeId && items[0]) setActiveId(items[0].id);
  }, [activeId, items]);

  const resetBuilder = (source = "instagram") => {
    const template = createDefaultReshareFlow(source);
    setActiveId(null);
    setSourcePlatform(source);
    setFlowName(template.name);
    setDescription(template.description);
    setMode(template.mode);
    setSchedule(template.schedule);
    setIncludeMedia(template.includeMedia);
    setIncludeCaption(template.includeCaption);
    setIncludeLink(template.includeLink);
    setRequireApproval(template.requireApproval);
    setDestinations(template.destinations);
    setTab("builder");
  };

  const loadFlow = (flow: ReshareFlow) => {
    setActiveId(flow.id);
    setSourcePlatform(flow.sourcePlatform);
    setFlowName(flow.name);
    setDescription(flow.description);
    setMode(flow.mode);
    setSchedule(flow.schedule);
    setIncludeMedia(flow.includeMedia);
    setIncludeCaption(flow.includeCaption);
    setIncludeLink(flow.includeLink);
    setRequireApproval(flow.requireApproval);
    setDestinations(flow.destinations);
    setTab("builder");
  };

  const onSourceChange = (value: string) => {
    setSourcePlatform(value);
    setDestinations((current) => current.filter((destination) => destination.platformId !== value));
  };

  const toggleDestination = (platformId: string) => {
    setDestinations((current) => {
      const existing = current.find((destination) => destination.platformId === platformId);
      if (existing) return current.map((destination) => destination.platformId === platformId ? { ...destination, enabled: !destination.enabled } : destination);
      return [...current, { platformId, enabled: true, transform: defaultTransform(sourcePlatform, platformId), delayMinutes: 0 }];
    });
  };

  const setTransform = (platformId: string, transform: ReshareTransform) => {
    setDestinations((current) => current.map((destination) => destination.platformId === platformId ? { ...destination, transform } : destination));
  };

  const buildDraft = (): ReshareFlow => {
    const now = new Date().toISOString();
    return {
      ...(activeFlow ?? createDefaultReshareFlow(sourcePlatform)),
      id: activeFlow?.id ?? createFlowId(),
      name: flowName.trim() || "Untitled reshare flow",
      description: description.trim() || "A cross-platform delivery route.",
      sourcePlatform,
      destinations: destinations.filter((destination) => destination.platformId !== sourcePlatform),
      mode,
      schedule,
      includeMedia,
      includeCaption,
      includeLink,
      requireApproval: mode === "approval" ? true : requireApproval,
      n8nWorkflowId: mode === "n8n" ? activeFlow?.n8nWorkflowId ?? createId("n8n") : activeFlow?.n8nWorkflowId,
      updatedAt: now,
    };
  };

  const saveFlow = () => {
    if (enabledDestinations.length === 0) {
      toast.error("Choose at least one destination");
      return;
    }
    setSaving(true);
    const draft = buildDraft();
    window.setTimeout(() => {
      if (activeFlow) update(draft.id, draft);
      else add(draft);
      setActiveId(draft.id);
      setSaving(false);
      toast.success(activeFlow ? "Reshare flow updated" : "Reshare flow created", { description: `${enabledDestinations.length} destinations are ready.` });
    }, 360);
  };

  const runFlow = (flow: ReshareFlow) => {
    setRunningId(flow.id);
    window.setTimeout(() => {
      update(flow.id, {
        lastRunAt: new Date().toISOString(),
        metrics: { runs: flow.metrics.runs + 1, delivered: flow.metrics.delivered + flow.destinations.filter((item) => item.enabled).length, queued: flow.requireApproval ? flow.metrics.queued + 1 : flow.metrics.queued, failed: flow.metrics.failed, savedMinutes: flow.metrics.savedMinutes + flow.destinations.filter((item) => item.enabled).length * 6 },
      });
      setRunningId(null);
      toast.success(`Test delivery sent for ${flow.name}`, { description: "No live post was published — this was a dry run." });
    }, 620);
  };

  const selectAll = () => setDestinations(normalizeTargetList(sourcePlatform, RESHARE_PLATFORM_IDS.filter((id) => id !== sourcePlatform)));
  const clearDestinations = () => setDestinations([]);
  const visiblePlatforms = showAllDestinations ? RESHARE_PLATFORM_IDS : RESHARE_PLATFORM_IDS.slice(0, 8);

  return (
    <div className="space-y-5 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.14] via-card to-pink-500/[0.08] p-5 shadow-[0_18px_60px_-30px_hsl(var(--primary)/0.55)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.25fr_1fr] xl:items-end">
          <div><div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Cross-channel routing online</Badge><span className="text-[10px] text-muted-foreground">{RESHARE_PLATFORM_IDS.length} destinations supported</span></div><h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">One source.<br /><span className="text-gradient">Every audience.</span></h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Build a safe reshare lane that turns one approved idea into platform-native content — with a visual map, delivery controls, and an n8n-ready event contract.</p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => resetBuilder()}><Plus className="mr-1.5 h-4 w-4" /> Build a route</Button><Button variant="outline" onClick={() => setTab("n8n")}><Webhook className="mr-1.5 h-4 w-4" /> Open n8n bridge</Button></div></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2"><MetricCard label="Live flows" value={formatNumber(stats.flows)} change={metricChange(stats.flows)} icon={Route} accent="bg-primary text-primary" detail="enabled routes" /><MetricCard label="Delivered" value={formatNumber(stats.delivered)} change="+18%" icon={Send} accent="bg-emerald-500 text-emerald-500" detail="this workspace" /><MetricCard label="In approval" value={formatNumber(stats.queued)} icon={Clock3} accent="bg-amber-500 text-amber-500" detail="drafts to review" /><MetricCard label="Time returned" value={`${Math.round(stats.savedMinutes / 60)}h`} change="+26%" icon={Sparkles} accent="bg-pink-500 text-pink-500" detail="manual work avoided" /></div>
        </div>
      </div>

      <StudioHeader tab={tab} onTabChange={setTab} onNew={() => resetBuilder()} />

      {tab === "builder" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(350px,0.95fr)]">
          <div className="space-y-5">
            <div className={cn(PANEL_CLASS, "p-4 sm:p-5") }><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">01 · Define the source</p><p className="mt-1 text-xs text-muted-foreground">Choose where the automation listens for new content.</p></div><Badge variant="outline" className="gap-1 text-[10px]"><Globe2 className="h-3 w-3" /> Event-driven</Badge></div><PlatformSourcePicker value={sourcePlatform} onChange={onSourceChange} connectedIds={connectedIds} /><Separator className="my-5" /><div className="grid gap-3 sm:grid-cols-2"><div><Label className="text-xs">Flow name</Label><Input className="mt-1 h-9 text-xs" value={flowName} onChange={(event) => setFlowName(event.target.value)} placeholder="e.g. Launch content everywhere" /></div><div><Label className="text-xs">Description</Label><Input className="mt-1 h-9 text-xs" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this route do?" /></div></div></div>
            <div className={cn(PANEL_CLASS, "p-4 sm:p-5") }><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold">02 · Choose destinations</p><p className="mt-1 text-xs text-muted-foreground">Every target is validated against media, caption, and channel capabilities.</p></div><div className="flex shrink-0 gap-1.5"><Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={selectAll}><Check className="mr-1 h-3 w-3" /> All available</Button><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={clearDestinations}>Clear</Button></div></div><div className="grid gap-2 sm:grid-cols-2">{visiblePlatforms.map((platformId) => <DestinationTile key={platformId} sourcePlatform={sourcePlatform} platformId={platformId} selected={destinations.some((destination) => destination.platformId === platformId && destination.enabled)} destination={destinations.find((destination) => destination.platformId === platformId)} onToggle={() => toggleDestination(platformId)} onTransformChange={(transform) => setTransform(platformId, transform)} />)}</div>{RESHARE_PLATFORM_IDS.length > 8 && <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={() => setShowAllDestinations((value) => !value)}>{showAllDestinations ? "Show fewer destinations" : `Show all ${RESHARE_PLATFORM_IDS.length} platforms`}<ChevronDown className={cn("ml-1 h-3.5 w-3.5 transition-transform", showAllDestinations && "rotate-180")} /></Button>}</div>
            <DeliveryOptions mode={mode} onModeChange={setMode} includeMedia={includeMedia} includeCaption={includeCaption} includeLink={includeLink} requireApproval={requireApproval} onToggle={(key, value) => { if (key === "includeMedia") setIncludeMedia(value); if (key === "includeCaption") setIncludeCaption(value); if (key === "includeLink") setIncludeLink(value); if (key === "requireApproval") setRequireApproval(value); }} schedule={schedule} onScheduleChange={setSchedule} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.045] p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /><div><p className="text-xs font-semibold">Ready check</p><p className="text-[10px] text-muted-foreground">{enabledDestinations.length} destinations · {mode === "n8n" ? "n8n controls delivery" : requireApproval ? "approval protects every send" : "auto-publish after validation"}</p></div></div><Button onClick={saveFlow} disabled={saving}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-1.5 h-4 w-4" />}{activeFlow ? "Update flow" : "Save flow"}</Button></div>
          </div>
          <div className="space-y-5"><RouteMap sourcePlatform={sourcePlatform} destinations={destinations} /><SourcePreview sourcePlatform={sourcePlatform} destinations={destinations} mode={mode} /><div className={cn(SOFT_PANEL_CLASS, "p-4") }><div className="flex items-start gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div><div><p className="text-xs font-semibold">Adaptive copy is on</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Destination adapters protect caption limits, retain your source link where allowed, and flag formats that need a media conversion before send.</p></div></div></div></div>
        </div>
      )}

      {tab === "flows" && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.55fr)]"><FlowList flows={items} activeId={activeId} onSelect={(id) => { const flow = items.find((item) => item.id === id); if (flow) loadFlow(flow); }} onToggle={(flow) => { update(flow.id, { enabled: !flow.enabled }); toast(flow.enabled ? "Flow paused" : "Flow enabled"); }} onRun={runFlow} onDuplicate={(flow) => { const copy = duplicate(flow); setActiveId(copy.id); toast.success("Flow duplicated"); }} onDelete={(flow) => { remove(flow.id); if (activeId === flow.id) setActiveId(null); toast.success("Flow deleted"); }} onNew={() => resetBuilder()} /><div className="space-y-5"><div className={cn(PANEL_CLASS, "p-4") }><p className="text-xs font-semibold">Operational pulse</p><p className="mt-1 text-[11px] text-muted-foreground">Monitor delivery health across every route.</p><div className="mt-4 space-y-3"><div><div className="mb-1 flex items-center justify-between text-[10px]"><span>Successful delivery</span><span className="font-semibold text-emerald-500">98.4%</span></div><Progress value={98.4} className="h-1.5" /></div><div><div className="mb-1 flex items-center justify-between text-[10px]"><span>Approval throughput</span><span className="font-semibold text-primary">86%</span></div><Progress value={86} className="h-1.5" /></div><div><div className="mb-1 flex items-center justify-between text-[10px]"><span>Channel coverage</span><span className="font-semibold text-pink-500">93%</span></div><Progress value={93} className="h-1.5" /></div></div></div><div className={cn(PANEL_CLASS, "p-4") }><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /><p className="text-xs font-semibold">Guardrails active</p></div><ul className="mt-3 space-y-2 text-[10px] text-muted-foreground"><li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Duplicate content is held for review.</li><li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Platform rate limits are respected.</li><li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Failed deliveries never block other branches.</li></ul></div></div></div>}

      {tab === "n8n" && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.65fr)]"><div className="space-y-5"><N8nWorkflowCard flow={activeFlow ?? buildDraft()} webhookUrl={webhookUrl} onWebhookUrlChange={setWebhookUrl} /><div className={cn(PANEL_CLASS, "p-4") }><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">Select an export route</p><p className="mt-1 text-xs text-muted-foreground">The bridge exports the active route with all enabled destinations.</p></div><Select value={activeId ?? "draft"} onValueChange={(value) => { const flow = items.find((item) => item.id === value); if (flow) loadFlow(flow); }}><SelectTrigger className="w-48 text-xs"><SelectValue placeholder="Choose flow" /></SelectTrigger><SelectContent>{items.map((flow) => <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>)}<SelectItem value="draft">Current builder draft</SelectItem></SelectContent></Select></div><div className="grid gap-2 sm:grid-cols-2">{(activeFlow ?? buildDraft()).destinations.filter((item) => item.enabled).map((destination) => <div key={destination.platformId} className="flex items-center gap-2 rounded-xl border border-border/60 p-3"><PlatformIcon platform={destination.platformId} showBackground size="sm" /><div className="min-w-0"><p className="text-xs font-semibold">{platformName(destination.platformId)}</p><p className="text-[10px] text-muted-foreground">{destination.transform} branch</p></div><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" /></div>)}</div></div></div><N8nGuide flow={activeFlow ?? buildDraft()} /></div>}

      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><FileJson className="h-3 w-3" /> Reshare routes are stored with your automation workspace.</span><span>{items.length} saved flow{items.length === 1 ? "" : "s"} · updated live</span></div>
    </div>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
}

export default ReshareStudio;
