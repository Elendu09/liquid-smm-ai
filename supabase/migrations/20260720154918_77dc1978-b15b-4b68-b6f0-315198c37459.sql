-- White label
CREATE TABLE public.white_label_config (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  accent_hsl TEXT NOT NULL DEFAULT '',
  hide_badge BOOLEAN NOT NULL DEFAULT false,
  custom_login_tagline TEXT NOT NULL DEFAULT '',
  support_email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.white_label_config TO authenticated;
GRANT ALL ON public.white_label_config TO service_role;
ALTER TABLE public.white_label_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own white_label_config" ON public.white_label_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_white_label_config_updated
  BEFORE UPDATE ON public.white_label_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Integration settings
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  disabled_tools TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  tool_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT ALL ON public.integration_settings TO service_role;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own integration_settings" ON public.integration_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_integration_settings_updated
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Asset versions
CREATE TABLE public.asset_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  url TEXT,
  type TEXT NOT NULL DEFAULT 'image',
  note TEXT,
  author TEXT,
  reason TEXT NOT NULL DEFAULT 'upload',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_versions TO authenticated;
GRANT ALL ON public.asset_versions TO service_role;
ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own asset_versions" ON public.asset_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX asset_versions_user_asset_idx ON public.asset_versions(user_id, asset_id, version);