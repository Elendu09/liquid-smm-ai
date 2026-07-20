
-- posts_media
CREATE TABLE IF NOT EXISTS public.posts_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'post-media',
  storage_path TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  sort_order INT NOT NULL DEFAULT 0,
  width INT, height INT, bytes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts_media TO authenticated;
GRANT ALL ON public.posts_media TO service_role;
ALTER TABLE public.posts_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own posts_media" ON public.posts_media FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- oauth_states
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  code_verifier TEXT,
  redirect_to TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_states TO service_role;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- social_account_tokens
CREATE TABLE IF NOT EXISTS public.social_account_tokens (
  account_id UUID PRIMARY KEY REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_account_tokens TO service_role;
ALTER TABLE public.social_account_tokens ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_social_account_tokens_updated
  BEFORE UPDATE ON public.social_account_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- mcp_inbox
CREATE TABLE IF NOT EXISTS public.mcp_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_inbox TO authenticated;
GRANT ALL ON public.mcp_inbox TO service_role;
ALTER TABLE public.mcp_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mcp_inbox" ON public.mcp_inbox FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- mcp_activity
CREATE TABLE IF NOT EXISTS public.mcp_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ok',
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_activity TO authenticated;
GRANT ALL ON public.mcp_activity TO service_role;
ALTER TABLE public.mcp_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mcp_activity" ON public.mcp_activity FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- run_history
CREATE TABLE IF NOT EXISTS public.run_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, ref_id UUID,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT, data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.run_history TO authenticated;
GRANT ALL ON public.run_history TO service_role;
ALTER TABLE public.run_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own run_history" ON public.run_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- onboarding_tour_state
CREATE TABLE IF NOT EXISTS public.onboarding_tour_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  step_index INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_tour_state TO authenticated;
GRANT ALL ON public.onboarding_tour_state TO service_role;
ALTER TABLE public.onboarding_tour_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tour state" ON public.onboarding_tour_state FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tour_state_updated BEFORE UPDATE ON public.onboarding_tour_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- home_summary_cache
CREATE TABLE IF NOT EXISTS public.home_summary_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_summary_cache TO authenticated;
GRANT ALL ON public.home_summary_cache TO service_role;
ALTER TABLE public.home_summary_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own home summary" ON public.home_summary_cache FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- linkbio_pages
CREATE TABLE IF NOT EXISTS public.linkbio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  handle TEXT, headline TEXT, bio TEXT, avatar_url TEXT,
  theme_id TEXT, overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  socials JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkbio_pages TO authenticated;
GRANT SELECT ON public.linkbio_pages TO anon;
GRANT ALL ON public.linkbio_pages TO service_role;
ALTER TABLE public.linkbio_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own linkbio pages" ON public.linkbio_pages FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public read published bio" ON public.linkbio_pages FOR SELECT
  TO anon, authenticated USING (published = true);
CREATE TRIGGER trg_linkbio_pages_updated BEFORE UPDATE ON public.linkbio_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- linkbio_themes
CREATE TABLE IF NOT EXISTS public.linkbio_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkbio_themes TO authenticated;
GRANT ALL ON public.linkbio_themes TO service_role;
ALTER TABLE public.linkbio_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own linkbio themes" ON public.linkbio_themes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_linkbio_themes_updated BEFORE UPDATE ON public.linkbio_themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- linkbio_templates
CREATE TABLE IF NOT EXISTS public.linkbio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkbio_templates TO authenticated;
GRANT ALL ON public.linkbio_templates TO service_role;
ALTER TABLE public.linkbio_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own linkbio templates" ON public.linkbio_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- post_drafts
CREATE TABLE IF NOT EXISTS public.post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, content JSONB NOT NULL DEFAULT '{}'::jsonb,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_drafts TO authenticated;
GRANT ALL ON public.post_drafts TO service_role;
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own post_drafts" ON public.post_drafts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_post_drafts_updated BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- automation_rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own automation_rules" ON public.automation_rules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_automation_rules_updated BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- automation_runs
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'success', message TEXT,
  actions_taken INT NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own automation_runs" ON public.automation_runs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- inbox_messages
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  external_id TEXT, kind TEXT NOT NULL, author TEXT, body TEXT,
  status TEXT NOT NULL DEFAULT 'new', sentiment TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_messages TO authenticated;
GRANT ALL ON public.inbox_messages TO service_role;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inbox_messages" ON public.inbox_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_inbox_messages_updated BEFORE UPDATE ON public.inbox_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- post_metrics
CREATE TABLE IF NOT EXISTS public.post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impressions INT DEFAULT 0, reach INT DEFAULT 0,
  likes INT DEFAULT 0, comments INT DEFAULT 0,
  shares INT DEFAULT 0, saves INT DEFAULT 0,
  clicks INT DEFAULT 0, video_views INT DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_metrics TO authenticated;
GRANT ALL ON public.post_metrics TO service_role;
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own post_metrics" ON public.post_metrics FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- account_metrics_daily
CREATE TABLE IF NOT EXISTS public.account_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  followers INT DEFAULT 0, following INT DEFAULT 0, posts INT DEFAULT 0,
  engagement NUMERIC DEFAULT 0, reach INT DEFAULT 0, impressions INT DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (account_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_metrics_daily TO authenticated;
GRANT ALL ON public.account_metrics_daily TO service_role;
ALTER TABLE public.account_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own account_metrics_daily" ON public.account_metrics_daily FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, handle TEXT NOT NULL, display_name TEXT,
  notes TEXT, data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, handle)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitors TO authenticated;
GRANT ALL ON public.competitors TO service_role;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own competitors" ON public.competitors FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_competitors_updated BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- follower_snapshots
CREATE TABLE IF NOT EXISTS public.follower_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  followers INT NOT NULL, delta INT DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follower_snapshots TO authenticated;
GRANT ALL ON public.follower_snapshots TO service_role;
ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own follower_snapshots" ON public.follower_snapshots FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  storage_path TEXT, caption TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stories" ON public.stories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_stories_updated BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID, action TEXT NOT NULL, target TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own audit_log" ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert own audit_log" ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage per-user prefix policies
DO $$
DECLARE bkt TEXT;
BEGIN
  FOREACH bkt IN ARRAY ARRAY['avatars','post-media','assets','linkbio','brand-logos','report-exports']
  LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (auth.uid())::text = split_part(name, '/', 1));
    $f$, bkt || '_select_own', bkt);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (auth.uid())::text = split_part(name, '/', 1));
    $f$, bkt || '_insert_own', bkt);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (auth.uid())::text = split_part(name, '/', 1))
      WITH CHECK (bucket_id = %L AND (auth.uid())::text = split_part(name, '/', 1));
    $f$, bkt || '_update_own', bkt, bkt);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (auth.uid())::text = split_part(name, '/', 1));
    $f$, bkt || '_delete_own', bkt);
  END LOOP;
END $$;

CREATE POLICY "linkbio_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'linkbio');

-- Realtime: add tables only if not already members
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['scheduled_posts','social_accounts','inbox_messages','automation_runs','mcp_inbox']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
