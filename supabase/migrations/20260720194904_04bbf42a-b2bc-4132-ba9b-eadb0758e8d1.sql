
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  target_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  poll_interval_minutes INTEGER NOT NULL DEFAULT 60,
  filter_keywords TEXT[] NOT NULL DEFAULT '{}',
  caption_template TEXT,
  last_fetched_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rss_feeds TO authenticated;
GRANT ALL ON public.rss_feeds TO service_role;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages rss_feeds" ON public.rss_feeds
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER rss_feeds_set_updated_at BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rss_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT,
  link TEXT,
  summary TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  imported BOOLEAN NOT NULL DEFAULT false,
  scheduled_post_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feed_id, guid)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rss_items TO authenticated;
GRANT ALL ON public.rss_items TO service_role;
ALTER TABLE public.rss_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages rss_items" ON public.rss_items
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX rss_items_feed_created_idx ON public.rss_items(feed_id, created_at DESC);
