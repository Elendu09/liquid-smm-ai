import { useMemo, useState } from "react";
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
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
    addFeed,
    updateFeed,
    removeFeed,
    fetchNow,
    importItem,
    dismissItem,
  } = useRssFeeds();

  const [tab, setTab] = useState<"feeds" | "items" | "discover">("feeds");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RssFeed | null>(null);
  const [previewItem, setPreviewItem] = useState<RssItem | null>(null);
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
            <Button onClick={() => openAdd()} className="shadow-lg shadow-orange-500/20">
              <Plus className="mr-2 h-4 w-4" />
              Add feed
            </Button>
          </div>
        </div>
      </div>

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
          {!loading && feeds.length === 0 && (
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
          {feeds.map((f) => (
            <Card key={f.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{f.title || f.url}</span>
                      {f.auto_publish ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                          <Radio className="h-3 w-3 mr-1" /> Auto
                        </Badge>
                      ) : (
                        <Badge variant="outline">Drafts</Badge>
                      )}
                      {f.ai_rewrite && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          <Sparkles className="h-3 w-3 mr-1" /> AI Rewrite
                        </Badge>
                      )}
                      {f.last_status === "ok" && (
                        <Badge variant="outline" className="border-green-500/40 text-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
                        </Badge>
                      )}
                      {f.last_status === "error" && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          <AlertCircle className="h-3 w-3 mr-1" /> Error
                        </Badge>
                      )}
                    </div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground truncate inline-flex items-center gap-1 mt-1"
                    >
                      {f.url} <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {f.last_fetched_at
                          ? `Fetched ${formatDistanceToNow(new Date(f.last_fetched_at))} ago`
                          : "Not fetched"}
                      </span>
                      <span>· Every {INTERVAL_OPTIONS.find((o) => o.value === f.poll_interval_minutes)?.label ?? `${f.poll_interval_minutes}m`}</span>
                      <span>· {f.last_item_count} items in feed</span>
                      {f.last_error && <span className="text-destructive">· {f.last_error}</span>}
                    </div>
                    {(f.target_platforms.length > 0 || f.filter_keywords.length > 0 || f.exclude_keywords.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.target_platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>
                        ))}
                        {f.filter_keywords.map((k) => (
                          <Badge key={"i-" + k} variant="outline" className="text-[10px] border-green-500/40 text-green-600">
                            +{k}
                          </Badge>
                        ))}
                        {f.exclude_keywords.map((k) => (
                          <Badge key={"x-" + k} variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                            −{k}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={f.active}
                      onCheckedChange={(v) => updateFeed(f.id, { active: v })}
                      aria-label="Active"
                    />
                    <Button size="icon" variant="ghost" onClick={() => fetchNow(f.id)} disabled={fetching} title="Fetch now">
                      <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(f)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFeed(f.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                {it.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={it.image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
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
                    <p className="text-xs text-muted-foreground line-clamp-2">{it.summary}</p>
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
                      <Button size="sm" className="flex-1" onClick={() => importItem(it)}>
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
                </div>
              </div>
              <Switch checked={aiRewrite} onCheckedChange={setAiRewrite} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add feed"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item preview */}
      <Dialog open={!!previewItem} onOpenChange={(v) => !v && setPreviewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{previewItem?.title}</DialogTitle>
            {previewItem?.published_at && (
              <DialogDescription>
                Published {formatDistanceToNow(new Date(previewItem.published_at))} ago
              </DialogDescription>
            )}
          </DialogHeader>
          {previewItem?.image_url && (
            <img src={previewItem.image_url} alt="" className="w-full rounded-lg" />
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-line">{previewItem?.summary}</p>
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewItem(null)}>Close</Button>
            {previewItem && !previewItem.imported && (
              <Button onClick={() => { importItem(previewItem); setPreviewItem(null); }}>
                <Send className="h-4 w-4 mr-2" /> Save as draft
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
