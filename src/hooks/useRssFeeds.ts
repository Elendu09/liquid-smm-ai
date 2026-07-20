import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { guardWrite } from "@/hooks/useGuest";

export interface RssFeed {
  id: string;
  url: string;
  title: string | null;
  target_platforms: string[];
  target_account_ids: string[];
  auto_publish: boolean;
  poll_interval_minutes: number;
  filter_keywords: string[];
  exclude_keywords: string[];
  ai_rewrite: boolean;
  last_item_count: number;
  caption_template: string | null;
  last_fetched_at: string | null;
  last_status: string | null;
  last_error: string | null;
  active: boolean;
  created_at: string;
}

export interface RssItem {
  id: string;
  feed_id: string;
  guid: string;
  title: string | null;
  link: string | null;
  summary: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  imported: boolean;
  scheduled_post_id: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export function useRssFeeds() {
  const { user } = useAuthUser();
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFeeds([]);
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [f, i] = await Promise.all([
      client.from("rss_feeds").select("*").order("created_at", { ascending: false }),
      client.from("rss_items").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (f.error) toast.error(f.error.message);
    setFeeds(
      (f.data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        target_platforms: (r.target_platforms as string[]) ?? [],
        target_account_ids: (r.target_account_ids as string[]) ?? [],
        filter_keywords: (r.filter_keywords as string[]) ?? [],
        exclude_keywords: (r.exclude_keywords as string[]) ?? [],
        ai_rewrite: (r.ai_rewrite as boolean) ?? false,
        last_item_count: (r.last_item_count as number) ?? 0,
      })) as RssFeed[],
    );
    setItems((i.data ?? []) as RssItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`rss:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rss_feeds", filter: `owner_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rss_items", filter: `owner_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const addFeed = useCallback(
    async (input: Partial<RssFeed> & { url: string }) => {
      if (!guardWrite("add RSS feeds")) return;
      if (!user) return toast.error("Sign in to add feeds");
      const { error } = await client.from("rss_feeds").insert({
        owner_id: user.id,
        url: input.url,
        title: input.title ?? null,
        target_platforms: input.target_platforms ?? [],
        target_account_ids: input.target_account_ids ?? [],
        auto_publish: input.auto_publish ?? false,
        poll_interval_minutes: input.poll_interval_minutes ?? 60,
        filter_keywords: input.filter_keywords ?? [],
        exclude_keywords: input.exclude_keywords ?? [],
        ai_rewrite: input.ai_rewrite ?? false,
        caption_template: input.caption_template ?? "{title}\n\n{link}",
        active: true,
      });
      if (error) return toast.error(error.message);
      toast.success("RSS feed added");
    },
    [user],
  );

  const addFeedsBulk = useCallback(
    async (
      urls: string[],
      defaults: {
        auto_publish?: boolean;
        ai_rewrite?: boolean;
        target_platforms?: string[];
        filter_keywords?: string[];
        exclude_keywords?: string[];
        poll_interval_minutes?: number;
        caption_template?: string;
      },
    ) => {
      if (!guardWrite("bulk import RSS feeds")) return { inserted: 0, skipped: 0 };
      if (!user) {
        toast.error("Sign in to add feeds");
        return { inserted: 0, skipped: 0 };
      }
      const clean = Array.from(
        new Set(
          urls
            .map((u) => u.trim())
            .filter((u) => /^https?:\/\//i.test(u)),
        ),
      );
      if (clean.length === 0) {
        toast.error("Paste at least one valid feed URL");
        return { inserted: 0, skipped: 0 };
      }
      const existing = new Set(feeds.map((f) => f.url));
      const fresh = clean.filter((u) => !existing.has(u));
      const skipped = clean.length - fresh.length;
      if (fresh.length === 0) {
        toast.info("All feeds are already in your library");
        return { inserted: 0, skipped };
      }
      const rows = fresh.map((url) => ({
        owner_id: user.id,
        url,
        title: null,
        target_platforms: defaults.target_platforms ?? [],
        target_account_ids: [],
        auto_publish: defaults.auto_publish ?? false,
        poll_interval_minutes: defaults.poll_interval_minutes ?? 60,
        filter_keywords: defaults.filter_keywords ?? [],
        exclude_keywords: defaults.exclude_keywords ?? [],
        ai_rewrite: defaults.ai_rewrite ?? false,
        caption_template: defaults.caption_template ?? "{title}\n\n{link}",
        active: true,
      }));
      const { error } = await client.from("rss_feeds").insert(rows);
      if (error) {
        toast.error(error.message);
        return { inserted: 0, skipped };
      }
      toast.success(
        `Added ${fresh.length} feed${fresh.length === 1 ? "" : "s"}${skipped ? ` · skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}`,
      );
      await load();
      return { inserted: fresh.length, skipped };
    },
    [user, feeds, load],
  );

  const updateFeed = useCallback(async (id: string, patch: Partial<RssFeed>) => {
    if (!guardWrite("update RSS feed")) return;
    const { error } = await client.from("rss_feeds").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const removeFeed = useCallback(async (id: string) => {
    if (!guardWrite("delete RSS feed")) return;
    const { error } = await client.from("rss_feeds").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const fetchNow = useCallback(async (feedId?: string) => {
    if (!guardWrite("fetch RSS")) return;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("rss-fetch", {
        body: feedId ? { feed_id: feedId } : {},
      });
      if (error) throw error;
      const results = (data as { results?: { imported?: number; error?: string }[] })?.results ?? [];
      const total = results.reduce((n, r) => n + (r.imported ?? 0), 0);
      const errs = results.filter((r) => r.error).length;
      if (errs) toast.warning(`Fetched with ${errs} error(s)`);
      else toast.success(total ? `Imported ${total} new item(s)` : "Feeds up-to-date");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setFetching(false);
    }
  }, [load]);

  const importItem = useCallback(
    async (item: RssItem, opts?: { platforms?: string[]; scheduledAt?: string | null }) => {
      if (!guardWrite("import RSS item")) return;
      if (!user) return toast.error("Sign in first");
      const feed = feeds.find((f) => f.id === item.feed_id);
      const platforms = opts?.platforms ?? feed?.target_platforms ?? [];
      const caption =
        (feed?.caption_template ?? "{title}\n\n{link}")
          .split("{title}").join(item.title ?? "")
          .split("{link}").join(item.link ?? "")
          .split("{summary}").join(item.summary ?? "");
      const { data: post, error } = await client
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          caption,
          media_url: item.image_url ?? null,
          status: opts?.scheduledAt ? "scheduled" : "draft",
          platform_ids: platforms,
          scheduled_at: opts?.scheduledAt ?? null,
        })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      await client
        .from("rss_items")
        .update({ imported: true, scheduled_post_id: post?.id ?? null })
        .eq("id", item.id);
      toast.success(opts?.scheduledAt ? "Scheduled from RSS" : "Draft created");
      await load();
    },
    [user, feeds, load],
  );

  const dismissItem = useCallback(async (id: string) => {
    if (!guardWrite("dismiss item")) return;
    const { error } = await client.from("rss_items").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  return {
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
    refetch: load,
  };
}
