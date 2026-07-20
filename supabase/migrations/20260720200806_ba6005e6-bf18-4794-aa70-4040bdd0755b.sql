
ALTER TABLE public.rss_feeds
  ADD COLUMN IF NOT EXISTS exclude_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_rewrite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_item_count integer NOT NULL DEFAULT 0;
