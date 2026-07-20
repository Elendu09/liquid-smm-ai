
-- Brand voices
CREATE TABLE public.brand_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  emojis TEXT NOT NULL DEFAULT 'minimal' CHECK (emojis IN ('none','minimal','expressive')),
  length TEXT NOT NULL DEFAULT 'medium' CHECK (length IN ('short','medium','long')),
  dos TEXT[] NOT NULL DEFAULT '{}',
  donts TEXT[] NOT NULL DEFAULT '{}',
  samples TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  platform_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_voices TO authenticated;
GRANT ALL ON public.brand_voices TO service_role;
ALTER TABLE public.brand_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand voices" ON public.brand_voices FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_brand_voices_user ON public.brand_voices(user_id);
CREATE TRIGGER trg_brand_voices_updated_at BEFORE UPDATE ON public.brand_voices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Content categories
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  emoji TEXT NOT NULL DEFAULT '📌',
  weekly_budget INTEGER NOT NULL DEFAULT 1,
  cadence TEXT NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('daily','weekly','monthly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_categories TO authenticated;
GRANT ALL ON public.content_categories TO service_role;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content categories" ON public.content_categories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_content_categories_user ON public.content_categories(user_id);
CREATE TRIGGER trg_content_categories_updated_at BEFORE UPDATE ON public.content_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recycling rules
CREATE TABLE public.recycling_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  platform_ids TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[],
  cadence TEXT NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('weekly','biweekly','monthly')),
  hour INTEGER NOT NULL DEFAULT 9 CHECK (hour BETWEEN 0 AND 23),
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recycling_rules TO authenticated;
GRANT ALL ON public.recycling_rules TO service_role;
ALTER TABLE public.recycling_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recycling rules" ON public.recycling_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_recycling_rules_user ON public.recycling_rules(user_id);
CREATE TRIGGER trg_recycling_rules_updated_at BEFORE UPDATE ON public.recycling_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Content templates
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT '',
  tool_key TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_templates TO authenticated;
GRANT ALL ON public.content_templates TO service_role;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content templates" ON public.content_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_content_templates_user ON public.content_templates(user_id);
CREATE TRIGGER trg_content_templates_updated_at BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
