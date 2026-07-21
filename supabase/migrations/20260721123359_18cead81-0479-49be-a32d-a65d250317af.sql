-- ============ report_runs ============
CREATE TABLE public.report_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT,
  name TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  period_label TEXT,
  format TEXT NOT NULL DEFAULT 'pdf',
  size_bytes BIGINT DEFAULT 0,
  storage_path TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  data JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  share_token TEXT UNIQUE,
  whitelabel BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX report_runs_user_created_idx ON public.report_runs (user_id, created_at DESC);
CREATE INDEX report_runs_template_idx ON public.report_runs (user_id, template_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_runs TO authenticated;
GRANT ALL ON public.report_runs TO service_role;

ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own report runs"
  ON public.report_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER report_runs_updated_at
  BEFORE UPDATE ON public.report_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ report_schedules ============
CREATE TABLE public.report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT,
  name TEXT NOT NULL,
  cadence TEXT NOT NULL DEFAULT 'weekly-mon',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  format TEXT NOT NULL DEFAULT 'pdf',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  share_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX report_schedules_user_idx ON public.report_schedules (user_id, active);
CREATE INDEX report_schedules_next_run_idx ON public.report_schedules (next_run_at) WHERE active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_schedules TO authenticated;
GRANT ALL ON public.report_schedules TO service_role;

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own report schedules"
  ON public.report_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_schedules;