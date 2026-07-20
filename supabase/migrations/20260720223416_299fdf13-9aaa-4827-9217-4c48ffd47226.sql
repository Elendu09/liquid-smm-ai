
CREATE TABLE IF NOT EXISTS public.account_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day DATE NOT NULL,
  followers BIGINT,
  following BIGINT,
  posts BIGINT,
  engagement NUMERIC,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, day)
);

GRANT SELECT ON public.account_metrics_daily TO authenticated;
GRANT ALL ON public.account_metrics_daily TO service_role;

ALTER TABLE public.account_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_metrics_select"
  ON public.account_metrics_daily
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS account_metrics_daily_account_day_idx
  ON public.account_metrics_daily(account_id, day DESC);
