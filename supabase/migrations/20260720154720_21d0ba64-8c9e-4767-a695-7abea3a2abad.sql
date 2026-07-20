-- AI Command History
CREATE TABLE public.ai_command_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_command_history TO authenticated;
GRANT ALL ON public.ai_command_history TO service_role;
ALTER TABLE public.ai_command_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai_command_history" ON public.ai_command_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_command_history_user_created_idx ON public.ai_command_history(user_id, created_at DESC);
CREATE TRIGGER trg_ai_command_history_updated
  BEFORE UPDATE ON public.ai_command_history
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AI Command Settings (one row per user)
CREATE TABLE public.ai_command_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enter_behavior TEXT NOT NULL DEFAULT 'send',
  ghost_autocomplete BOOLEAN NOT NULL DEFAULT true,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_command_settings TO authenticated;
GRANT ALL ON public.ai_command_settings TO service_role;
ALTER TABLE public.ai_command_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai_command_settings" ON public.ai_command_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ai_command_settings_updated
  BEFORE UPDATE ON public.ai_command_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Platform Presets
CREATE TABLE public.platform_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  tool_key TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_presets TO authenticated;
GRANT ALL ON public.platform_presets TO service_role;
ALTER TABLE public.platform_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own platform_presets" ON public.platform_presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX platform_presets_user_tool_platform_idx
  ON public.platform_presets(user_id, tool_key, platform);
CREATE TRIGGER trg_platform_presets_updated
  BEFORE UPDATE ON public.platform_presets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();