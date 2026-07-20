import { useState } from "react";
import { Rss, Plus, RefreshCw, Trash2, ExternalLink, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { PLATFORMS } from "@/config/platforms";
import { toast } from "sonner";

export default function RssFeedsPage() {
  const { feeds, items, loading, fetching, addFeed, updateFeed, removeFeed, fetchNow } = useRssFeeds();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [template, setTemplate] = useState("📢 {title}\n\n{link}");

  const submit = async () => {
    if (!url.trim()) {
      toast.error("Feed URL is required");
      return;
    }
    await addFeed({
      url: url.trim(),
      auto_publish: autoPublish,
      target_platforms: platforms,
      filter_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      caption_template: template,
    });
    setUrl("");
    setAutoPublish(false);
    setPlatforms([]);
    setKeywords("");
    setOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="hidden sm:flex h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center shadow-lg shadow-orange-500/25">
              <Rss className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary">
                Automation
              </Badge>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">RSS Feeds</h1>
              <p className="text-muted-foreground mt-1 text-sm max-w-xl">
                Auto-import content from blogs, news sites, and podcasts. Turn new items into drafts or auto-publish them across your channels.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchNow()} disabled={fetching || feeds.length === 0}>
              <RefreshCw className={`mr-2 h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              Fetch all
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add feed
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your feeds</CardTitle>
            <CardDescription>{feeds.length} connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && feeds.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No feeds yet. Add a public RSS/Atom URL to get started.
              </div>
            )}
            {feeds.map((f) => (
              <div key={f.id} className="rounded-lg border p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{f.title || f.url}</span>
                      {f.auto_publish ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          <Radio className="h-3 w-3 mr-1" /> Auto-publish
                        </Badge>
                      ) : (
                        <Badge variant="outline">Drafts</Badge>
                      )}
                      {f.last_status === "ok" && (
                        <Badge variant="outline" className="border-green-500/40 text-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> OK
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
                    <div className="text-xs text-muted-foreground mt-1">
                      {f.last_fetched_at
                        ? `Last fetch: ${new Date(f.last_fetched_at).toLocaleString()}`
                        : "Never fetched"}
                      {f.last_error && <span className="text-destructive"> · {f.last_error}</span>}
                    </div>
                    {f.target_platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.target_platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={f.active}
                      onCheckedChange={(v) => updateFeed(f.id, { active: v })}
                      aria-label="Active"
                    />
                    <Button size="icon" variant="ghost" onClick={() => fetchNow(f.id)} disabled={fetching}>
                      <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeFeed(f.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent items</CardTitle>
            <CardDescription>Latest 20 imported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.slice(0, 20).map((it) => (
              <div key={it.id} className="text-sm border-l-2 border-primary/40 pl-3">
                <div className="font-medium line-clamp-2">{it.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {it.imported ? "Draft created" : "Logged"} ·{" "}
                  {new Date(it.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing yet. Fetch a feed to see items here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add RSS feed</DialogTitle>
            <DialogDescription>
              Paste any public RSS or Atom URL. We poll it hourly and turn new items into posts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed URL</Label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.slice(0, 10).map((p) => {
                  const active = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setPlatforms((prev) =>
                          active ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Keyword filter (optional, comma-separated)</Label>
              <Input
                placeholder="ai, product, launch"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Auto-publish new items</div>
                <div className="text-xs text-muted-foreground">
                  Off = drafts only. On = scheduled to queue.
                </div>
              </div>
              <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Add feed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
