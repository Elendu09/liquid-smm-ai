import { useCallback, useMemo, useState } from "react";
import {
  Rss,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Radio,
  Search,
  Sparkles,
  Filter,
  Zap,
  Pencil,
  Eye,
  Send,
  X,
  Clock,
  Newspaper,
  Compass,
  BookOpen,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRssFeeds, type RssFeed, type RssItem } from "@/hooks/useRssFeeds";
import { platforms as PLATFORMS } from "@/config/platforms";
import { useGuest } from "@/hooks/useGuest";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cleanRssText } from "@/lib/rssUtils";
import { aiCreate } from "@/hooks/useAiCreate";
import { useCredits } from "@/hooks/useCredits";
import { formatCost, aiCost } from "@/config/aiCosts";

const DEMO_FEEDS = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    tone: "from-emerald-500/20 to-emerald-500/5",
    color: "text-emerald-500",
    items: 42,
    platforms: ["twitter", "linkedin"],
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    tone: "from-purple-500/20 to-purple-500/5",
    color: "text-purple-500",
    items: 28,
    platforms: ["twitter", "facebook"],
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com/feed",
    tone: "from-orange-500/20 to-orange-500/5",
    color: "text-orange-500",
    items: 17,
    platforms: ["linkedin", "twitter"],
  },
];

const DEMO_ITEMS = [
  { title: "OpenAI announces new agentic Assistants API", source: "TechCrunch", time: "18m ago" },
  { title: "The rise of AI-first content workflows for social teams", source: "The Verge", time: "1h ago" },
  { title: "Top 5 launches this week on Product Hunt", source: "Product Hunt", time: "3h ago" },
];

const DISCOVER_PRESETS: {
  category: string;
  feeds: { name: string; url: string; description: string }[];
}[] = [
  {
    category: "Tech & Startups",
    feeds: [
      { name: "TechCrunch", url: "https://techcrunch.com/feed/", description: "Startups, funding, product launches" },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", description: "Consumer tech & culture" },
      { name: "Hacker News (Front)", url: "https://hnrss.org/frontpage", description: "Top HN stories, hourly" },
      { name: "Wired", url: "https://www.wired.com/feed/rss", description: "Deep tech features" },
    ],
  },
  {
    category: "Marketing & Social",
    feeds: [
      { name: "Social Media Today", url: "https://www.socialmediatoday.com/rss.xml", description: "Platform news & tactics" },
      { name: "HubSpot Marketing", url: "https://blog.hubspot.com/marketing/rss.xml", description: "Inbound growth insights" },
      { name: "Buffer Blog", url: "https://buffer.com/resources/rss/", description: "Social media strategy" },
    ],
  },
  {
    category: "Business & Finance",
    feeds: [
      { name: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss", description: "Global markets & finance" },
      { name: "Harvard Business Review", url: "https://hbr.org/the-latest/feed", description: "Leadership & strategy" },
    ],
  },
  {
    category: "Design & Creativity",
    feeds: [
      { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", description: "Web design & UX" },
      { name: "Dribbble", url: "https://dribbble.com/shots/popular.rss", description: "Popular design shots" },
    ],
  },
];

const INTERVAL_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "3 hours", value: 180 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "Daily", value: 1440 },
];

type ItemFilter = "all" | "drafts" | "logged";

export default function RssFeedsPage() {
  const {
    feeds,
    items,
    loading,
    fetching,
    progress,
    syncingFeedId,
    addFeed,
    addFeedsBulk,
    updateFeed,
    removeFeed,
    fetchNow,
    importItem,
    dismissItem,
  } = useRssFeeds();
  const { isGuest } = useGuest();
  const { balance } = useCredits();
  const remainingCredits = balance?.balance ?? 0;
  const lowCredits = remainingCredits < aiCost("create.rewrite");


  const [tab, setTab] = useState<"feeds" | "items" | "discover">("feeds");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<RssFeed | null>(null);
  const [previewItem, setPreviewItem] = useState<RssItem | null>(null);
  const [rewriteItem, setRewriteItem] = useState<RssItem | null>(null);
  const [rewritten, setRewritten] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [search, setSearch] = useState("");
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");

  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [aiRewrite, setAiRewrite] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [excludes, setExcludes] = useState("");
  const [interval, setInterval] = useState(60);
  const [template, setTemplate] = useState("📢 {title}\n\n{link}");

  // Bulk-import form state
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkAuto, setBulkAuto] = useState(false);
  const [bulkAi, setBulkAi] = useState(false);
  const [bulkPlatforms, setBulkPlatforms] = useState<string[]>([]);
  const [bulkInclude, setBulkInclude] = useState("");
  const [bulkExclude, setBulkExclude] = useState("");
  const [bulkInterval, setBulkInterval] = useState(60);
  const [bulkTemplate, setBulkTemplate] = useState("📢 {title}\n\n{link}");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);


  const resetForm = () => {
    setUrl("");
    setTitle("");
    setAutoPublish(false);
    setAiRewrite(false);
    setSelectedPlatforms([]);
    setKeywords("");
    setExcludes("");
    setInterval(60);
    setTemplate("📢 {title}\n\n{link}");
    setEditing(null);
  };

  const openAdd = (preset?: { name: string; url: string }) => {
    resetForm();
    if (preset) {
      setUrl(preset.url);
      setTitle(preset.name);
    }
    setOpen(true);
  };

  const openEdit = (f: RssFeed) => {
    setEditing(f);
    setUrl(f.url);
    setTitle(f.title ?? "");
    setAutoPublish(f.auto_publish);
    setAiRewrite(f.ai_rewrite);
    setSelectedPlatforms(f.target_platforms);
    setKeywords(f.filter_keywords.join(", "));
    setExcludes(f.exclude_keywords.join(", "));
    setInterval(f.poll_interval_minutes);
    setTemplate(f.caption_template ?? "📢 {title}\n\n{link}");
    setOpen(true);
  };

  const submit = async () => {
    if (!url.trim()) return toast.error("Feed URL is required");
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      return toast.error("Invalid feed URL — enter a full http(s) address");
    }
    const payload = {
      url: url.trim(),
      title: title.trim() || null,
      auto_publish: autoPublish,
      ai_rewrite: aiRewrite,
      target_platforms: selectedPlatforms,
      filter_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      exclude_keywords: excludes.split(",").map((k) => k.trim()).filter(Boolean),
      poll_interval_minutes: interval,
      caption_template: template,
    };
    if (editing) {
      await updateFeed(editing.id, payload);
      toast.success("Feed updated");
    } else {
      await addFeed(payload);
    }
    resetForm();
    setOpen(false);
  };

  const stats = useMemo(() => {
    const importedCount = items.filter((i) => i.imported).length;
    const errFeeds = feeds.filter((f) => f.last_status === "error").length;
    return {
      feeds: feeds.length,
      active: feeds.filter((f) => f.active).length,
      items: items.length,
      imported: importedCount,
      errors: errFeeds,
    };
  }, [feeds, items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((it) => {
        if (itemFilter === "drafts") return it.imported;
        if (itemFilter === "logged") return !it.imported;
        return true;
      })
      .filter((it) =>
        q ? (it.title ?? "").toLowerCase().includes(q) || (it.summary ?? "").toLowerCase().includes(q) : true,
      );
  }, [items, itemFilter, search]);

  /** Shared rewriter used by the preview dialog and by feed-level auto-rewrite. */
  const autoRewrite = useCallback(async (text: string, platform?: string) => {
    const res = await aiCreate.rewrite({ text: cleanRssText(text, 900), platform, tone: "engaging" });
    return res?.rewritten ?? null;
  }, []);

  const runRewrite = async (item: RssItem) => {
    if (lowCredits) {
      toast.error("Not enough credits for an AI rewrite.");
      return;
    }
    const feed = feeds.find((f) => f.id === item.feed_id);
    setRewriteItem(item);
    setRewritten("");
    setRewriting(true);
    try {
      const out = await autoRewrite(
        `${item.title ?? ""}\n\n${item.summary ?? ""}`,
        feed?.target_platforms?.[0],
      );
      if (out) setRewritten(out);
    } finally {
      setRewriting(false);
    }
  };

  const saveRewritten = async (queue = false) => {
    if (!previewItem || !rewritten.trim()) return;
    await importItem(previewItem, { caption: rewritten.trim(), queue, skipAutoRewrite: true });
    setPreviewItem(null);
    setRewritten("");
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-orange-500/[0.05] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="hidden sm:flex h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center shadow-lg shadow-orange-500/25">
              <Rss className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-orange-500/40 text-orange-500">
                  Automation
                </Badge>
                <Badge variant="secondary" className="text-[10px]">Bulk import</Badge>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-['Instrument_Serif']">
                RSS Feeds
              </h1>
              <p className="text-muted-foreground mt-1 text-sm max-w-xl">
                Automatically pull the latest articles, blogs, and podcasts. Turn every new item into a draft or auto-schedule it across channels — with optional AI rewrite.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => fetchNow()} disabled={fetching || feeds.length === 0}>
              <RefreshCw className={`mr-2 h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              Fetch all
            </Button>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk import
            </Button>
            <Button onClick={() => openAdd()} className="shadow-lg shadow-orange-500/20">
              <Plus className="mr-2 h-4 w-4" />
              Add feed
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time sync progress */}
      {fetching && progress !== null && (
        <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" /> Syncing feeds…
            </span>
            <span className="text-xs font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[
          { label: "Feeds", value: stats.feeds, icon: Rss, tone: "from-orange-500/15 to-orange-500/5 text-orange-500" },
          { label: "Active", value: stats.active, icon: Radio, tone: "from-green-500/15 to-green-500/5 text-green-500" },
          { label: "Items", value: stats.items, icon: Newspaper, tone: "from-blue-500/15 to-blue-500/5 text-blue-500" },
          { label: "Imported", value: stats.imported, icon: Zap, tone: "from-primary/15 to-primary/5 text-primary" },
          { label: "Errors", value: stats.errors, icon: AlertCircle, tone: "from-destructive/15 to-destructive/5 text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="overflow-hidden border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center ring-1 ring-border/40`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-none">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="feeds"><Rss className="h-4 w-4 mr-2" />My feeds</TabsTrigger>
          <TabsTrigger value="items"><Newspaper className="h-4 w-4 mr-2" />Items</TabsTrigger>
          <TabsTrigger value="discover"><Compass className="h-4 w-4 mr-2" />Discover</TabsTrigger>
        </TabsList>

        {/* Feeds tab */}
        <TabsContent value="feeds" className="space-y-3 mt-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && isGuest && feeds.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge className="bg-orange-500/15 text-orange-500 border-0 uppercase text-[10px] tracking-widest">Demo preview</Badge>
                  <p className="text-sm text-muted-foreground truncate">
                    Sample feeds shown for demo. <span className="font-medium text-foreground">Sign up</span> to connect real RSS sources.
                  </p>
                </div>
                <Button size="sm" onClick={() => (window.location.href = "/signup")}>Sign up</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {DEMO_FEEDS.map((f) => (
                  <Card key={f.name} className={`overflow-hidden bg-gradient-to-br ${f.tone} border-border/60`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`h-9 w-9 rounded-xl bg-background/70 flex items-center justify-center ring-1 ring-border/60 ${f.color}`}>
                          <Rss className="h-4 w-4" />
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-0"><Radio className="h-3 w-3 mr-1" />Auto</Badge>
                      </div>
                      <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{f.url}</div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Newspaper className="h-3 w-3" /> {f.items} items · Every 1h
                        </div>
                        <div className="flex gap-1">
                          {f.platforms.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Recently auto-published (demo)
                  </CardTitle>
                  <CardDescription className="text-xs">Preview of how new RSS items become drafts across your channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DEMO_ITEMS.map((it) => (
                    <div key={it.title} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-background/40">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">📢 {it.title}</div>
                        <div className="text-[11px] text-muted-foreground">{it.source} · {it.time}</div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-0 shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Queued
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
          {!loading && !isGuest && feeds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/5 flex items-center justify-center">
                  <Rss className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No feeds yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    Pipe any RSS or Atom URL — blogs, YouTube channels, podcasts, subreddits — and we'll import new items automatically.
                  </p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => openAdd()}><Plus className="h-4 w-4 mr-2" />Add feed</Button>
                  <Button variant="outline" onClick={() => setTab("discover")}>
                    <Compass className="h-4 w-4 mr-2" />Explore
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {feeds.map((f) => {
            const isSyncing = syncingFeedId === f.id;
            const isError = f.last_status === "error";
            const isOk = f.last_status === "ok";
            return (
              <Card key={f.id} className={`overflow-hidden hover:border-primary/40 transition-colors ${isError ? "border-destructive/30" : ""}`}>
                <div className={`h-1 w-full ${isError ? "bg-gradient-to-r from-destructive to-destructive/40" : isOk ? "bg-gradient-to-r from-emerald-500 to-emerald-500/40" : "bg-gradient-to-r from-primary to-primary/30"}`} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ring-1 ${isError ? "bg-destructive/10 text-destructive ring-destructive/20" : isOk ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" : "bg-primary/10 text-primary ring-primary/20"}`}>
                      {isSyncing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Rss className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{f.title || f.url}</span>
                        {f.auto_publish ? (
                          <Badge className="bg-green-500/10 text-green-600 border-0"><Radio className="h-3 w-3 mr-1" /> Auto</Badge>
                        ) : (
                          <Badge variant="outline">Drafts</Badge>
                        )}
                        {f.ai_rewrite && (
                          <Badge className="bg-primary/10 text-primary border-0"><Sparkles className="h-3 w-3 mr-1" /> AI</Badge>
                        )}
                        {isError ? (
                          <Badge variant="outline" className="border-destructive/40 text-destructive"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>
                        ) : isOk ? (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Healthy</Badge>
                        ) : (
                          <Badge variant="outline">New</Badge>
                        )}
                      </div>
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground truncate inline-flex items-center gap-1 mt-1">
                        {f.url} <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {f.last_fetched_at ? `Fetched ${formatDistanceToNow(new Date(f.last_fetched_at))} ago` : "Not fetched"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Radio className="h-3 w-3" /> {INTERVAL_OPTIONS.find((o) => o.value === f.poll_interval_minutes)?.label ?? `${f.poll_interval_minutes}m`}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Newspaper className="h-3 w-3" /> {f.last_item_count} items
                        </span>
                        {f.last_error && <span className="text-destructive truncate max-w-[180px]">{f.last_error}</span>}
                      </div>
                      {(f.target_platforms.length > 0 || f.filter_keywords.length > 0 || f.exclude_keywords.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.target_platforms.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>
                          ))}
                          {f.filter_keywords.map((k) => (
                            <Badge key={"i-" + k} variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">+{k}</Badge>
                          ))}
                          {f.exclude_keywords.map((k) => (
                            <Badge key={"x-" + k} variant="outline" className="text-[10px] border-destructive/40 text-destructive">−{k}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <Switch checked={f.active} onCheckedChange={(v) => updateFeed(f.id, { active: v })} aria-label="Active" />
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => fetchNow(f.id)} disabled={fetching} title="Fetch now">
                          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(f)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFeed(f.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Items tab */}
        <TabsContent value="items" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={itemFilter} onValueChange={(v) => setItemFilter(v as ItemFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="drafts">Imported as drafts</SelectItem>
                <SelectItem value="logged">Logged (not imported)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((it) => (
              <Card key={it.id} className="overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="aspect-video overflow-hidden bg-muted relative">
                  {it.thumbnail_url || it.image_url ? (
                    <img
                      src={it.thumbnail_url ?? it.image_url ?? ""}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget;
                        // Fall back to raw image if the cached thumbnail 404s
                        if (it.image_url && el.src !== it.image_url) {
                          el.src = it.image_url;
                        } else {
                          el.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-primary/10">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[10px] uppercase tracking-wider">No image</span>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold line-clamp-2 text-sm">{it.title}</h4>
                    {it.imported ? (
                      <Badge className="bg-green-500/10 text-green-600 border-0 shrink-0">Draft</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">Logged</Badge>
                    )}
                  </div>
                  {it.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{cleanRssText(it.summary)}</p>
                  )}
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {it.published_at
                      ? formatDistanceToNow(new Date(it.published_at)) + " ago"
                      : new Date(it.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreviewItem(it)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    {!it.imported && (
                      <Button size="sm" className="flex-1" onClick={() => void importItem(it, { rewrite: autoRewrite })}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Draft
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => dismissItem(it.id)} title="Dismiss">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredItems.length === 0 && (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No items match. Try fetching your feeds or clearing filters.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Discover tab */}
        <TabsContent value="discover" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                How RSS automation works
              </CardTitle>
              <CardDescription>
                Learn the workflow, then pick a starter feed below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { n: 1, title: "Paste an RSS URL", body: "Any blog, YouTube channel, podcast, or subreddit exposes a feed URL." },
                  { n: 2, title: "Filter & rewrite", body: "Include or exclude keywords, and let AI rewrite headlines into engaging posts." },
                  { n: 3, title: "Draft or auto-publish", body: "New items land as drafts, or get scheduled across every connected channel." },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl border p-4 bg-gradient-to-br from-card to-muted/20">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-2">
                      {s.n}
                    </div>
                    <div className="font-semibold text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.body}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {DISCOVER_PRESETS.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {cat.category}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {cat.feeds.map((f) => (
                  <Card key={f.url} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openAdd(f)}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit feed" : "Add RSS feed"}</DialogTitle>
            <DialogDescription>
              Paste any public RSS or Atom URL. We poll it on your schedule and turn new items into posts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed URL *</Label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Display name (optional)</Label>
              <Input
                placeholder="My favorite blog"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Poll interval</Label>
                <Select value={String(interval)} onValueChange={(v) => setInterval(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={autoPublish ? "auto" : "draft"} onValueChange={(v) => setAutoPublish(v === "auto")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as drafts</SelectItem>
                    <SelectItem value="auto">Auto-publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.slice(0, 10).map((p) => {
                  const active = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlatforms((prev) =>
                          active ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-green-600">Include keywords (comma-separated)</Label>
                <Input
                  placeholder="ai, product, launch"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Only items containing at least one term are imported.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-destructive">Exclude keywords</Label>
                <Input
                  placeholder="crypto, nsfw, giveaway"
                  value={excludes}
                  onChange={(e) => setExcludes(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Items containing any of these are skipped.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Caption template</Label>
              <Textarea
                rows={3}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="{title}, {link}, {summary}"
              />
              <p className="text-[11px] text-muted-foreground">
                Placeholders: <code>{"{title}"}</code>, <code>{"{link}"}</code>, <code>{"{summary}"}</code>
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium">AI rewrite</div>
                  <div className="text-xs text-muted-foreground">
                    Rewrite each headline into an engaging social hook before publishing.
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatCost("create.rewrite")} per imported item{lowCredits ? " · not enough credits" : ""}
                  </div>
                </div>
              </div>
              <Switch checked={aiRewrite} onCheckedChange={setAiRewrite} disabled={lowCredits && !aiRewrite} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add feed"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-500" />
              Bulk import RSS feeds
            </DialogTitle>
            <DialogDescription>
              Paste one URL per line (or comma-separated). These defaults apply to every new feed — you can fine-tune any of them later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed URLs *</Label>
              <Textarea
                rows={7}
                placeholder={"https://techcrunch.com/feed/\nhttps://www.theverge.com/rss/index.xml\nhttps://hnrss.org/frontpage"}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {bulkUrls
                  .split(/[\n,]/)
                  .map((u) => u.trim())
                  .filter((u) => /^https?:\/\//i.test(u)).length}{" "}
                valid URL(s) detected · duplicates are auto-skipped.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Poll interval</Label>
                <Select value={String(bulkInterval)} onValueChange={(v) => setBulkInterval(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={bulkAuto ? "auto" : "draft"} onValueChange={(v) => setBulkAuto(v === "auto")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as drafts</SelectItem>
                    <SelectItem value="auto">Auto-publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.slice(0, 10).map((p) => {
                  const active = bulkPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setBulkPlatforms((prev) =>
                          active ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-green-600">Include keywords</Label>
                <Input
                  placeholder="ai, launch, product"
                  value={bulkInclude}
                  onChange={(e) => setBulkInclude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-destructive">Exclude keywords</Label>
                <Input
                  placeholder="crypto, nsfw"
                  value={bulkExclude}
                  onChange={(e) => setBulkExclude(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Caption template</Label>
              <Textarea
                rows={2}
                value={bulkTemplate}
                onChange={(e) => setBulkTemplate(e.target.value)}
                placeholder="{title}, {link}, {summary}"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium">AI rewrite</div>
                  <div className="text-xs text-muted-foreground">
                    Rewrite every headline into an engaging social hook.
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatCost("create.rewrite")} per imported item{lowCredits ? " · not enough credits" : ""}
                  </div>
                </div>
              </div>
              <Switch checked={bulkAi} onCheckedChange={setBulkAi} disabled={lowCredits && !bulkAi} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button
              disabled={bulkSubmitting}
              onClick={async () => {
                setBulkSubmitting(true);
                const urls = bulkUrls.split(/[\n,]/);
                const res = await addFeedsBulk(urls, {
                  auto_publish: bulkAuto,
                  ai_rewrite: bulkAi,
                  target_platforms: bulkPlatforms,
                  filter_keywords: bulkInclude.split(",").map((k) => k.trim()).filter(Boolean),
                  exclude_keywords: bulkExclude.split(",").map((k) => k.trim()).filter(Boolean),
                  poll_interval_minutes: bulkInterval,
                  caption_template: bulkTemplate,
                });
                setBulkSubmitting(false);
                if (res && res.inserted > 0) {
                  setBulkOpen(false);
                  setBulkUrls("");
                  // Kick off a fetch so items with thumbnails populate immediately
                  fetchNow();
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {bulkSubmitting ? "Importing…" : "Import feeds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item preview */}
      <Dialog open={!!previewItem} onOpenChange={(v) => { if (!v) { setPreviewItem(null); setRewritten(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{previewItem?.title}</DialogTitle>
            {previewItem?.published_at && (
              <DialogDescription>
                Published {formatDistanceToNow(new Date(previewItem.published_at))} ago
              </DialogDescription>
            )}
          </DialogHeader>
          {(previewItem?.thumbnail_url || previewItem?.image_url) && (
            <img
              src={previewItem.thumbnail_url ?? previewItem.image_url ?? ""}
              alt=""
              className="w-full rounded-lg aspect-video object-cover bg-muted"
            />
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-line">{cleanRssText(previewItem?.summary ?? "", 2000)}</p>
          {previewItem?.link && (
            <a
              href={previewItem.link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Open original <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* In-place AI rewrite */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
                <Sparkles className={`h-3.5 w-3.5 ${rewriting ? "animate-pulse" : ""}`} />
                AI rewrite · {formatCost("create.rewrite")}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={rewriting || lowCredits}
                onClick={() => previewItem && void runRewrite(previewItem)}
              >
                {rewriting ? "Rewriting…" : rewritten ? "Regenerate" : "Rewrite with AI"}
              </Button>
            </div>
            {lowCredits && (
              <p className="text-[11px] text-destructive">
                Not enough credits — top up in Settings → Billing.
              </p>
            )}
            {rewritten && (
              <>
                <Textarea
                  rows={5}
                  value={rewritten}
                  onChange={(e) => setRewritten(e.target.value)}
                  className="text-sm bg-background/70"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void saveRewritten(false)}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Use this text
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void saveRewritten(true)}>
                    <Clock className="h-3.5 w-3.5 mr-1" /> Add to queue
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setRewritten(""); setRewriteItem(null); }}>
                    Revert
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewItem(null)}>Close</Button>
            {previewItem && !previewItem.imported && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { void importItem(previewItem, { queue: true, rewrite: autoRewrite }); setPreviewItem(null); }}
                >
                  <Clock className="h-4 w-4 mr-2" /> Add to queue
                </Button>
                <Button onClick={() => { void importItem(previewItem, { rewrite: autoRewrite }); setPreviewItem(null); }}>
                  <Send className="h-4 w-4 mr-2" /> Save as draft
                </Button>
              </>
            )}
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
