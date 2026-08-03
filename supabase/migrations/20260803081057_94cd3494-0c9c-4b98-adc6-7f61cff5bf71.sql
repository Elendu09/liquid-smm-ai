-- 1. Campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'awareness',
  brief text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  color text NOT NULL DEFAULT '#6366f1',
  start_date date,
  end_date date,
  platform_ids text[] NOT NULL DEFAULT '{}',
  audience text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  goal_posts integer NOT NULL DEFAULT 0,
  goal_reach bigint NOT NULL DEFAULT 0,
  goal_engagement bigint NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX campaigns_user_idx ON public.campaigns(user_id, archived, status);

-- 2. Link scheduled posts to campaigns
ALTER TABLE public.scheduled_posts
  ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX scheduled_posts_campaign_idx ON public.scheduled_posts(campaign_id);

-- 3. AI rolling memory
CREATE TABLE public.ai_memory (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  turns integer NOT NULL DEFAULT 0,
  facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory TO authenticated;
GRANT ALL ON public.ai_memory TO service_role;

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ai memory"
  ON public.ai_memory FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ai_memory_set_updated_at
  BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Server-side credit spending (transparent ledger)
CREATE OR REPLACE FUNCTION public.spend_credits(
  _user_id uuid,
  _amount integer,
  _feature text,
  _meta jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(ok boolean, remaining integer, spent integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bal public.credit_balances%ROWTYPE;
  _remaining integer;
  _amt integer := GREATEST(0, COALESCE(_amount, 0));
BEGIN
  SELECT * INTO _bal FROM public.credit_balances WHERE user_id = _user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  _remaining := GREATEST(0, _bal.included + _bal.purchased - _bal.used);

  IF _amt = 0 THEN
    RETURN QUERY SELECT true, _remaining, 0;
    RETURN;
  END IF;

  IF _remaining < _amt THEN
    RETURN QUERY SELECT false, _remaining, 0;
    RETURN;
  END IF;

  UPDATE public.credit_balances
     SET used = used + _amt,
         updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.credit_events (user_id, kind, delta, label, meta)
  VALUES (_user_id, 'usage', -_amt, _feature, COALESCE(_meta, '{}'::jsonb));

  RETURN QUERY SELECT true, _remaining - _amt, _amt;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text, jsonb) TO service_role;

-- Read-only balance check callable by the signed-in user (their own row only)
CREATE OR REPLACE FUNCTION public.credit_remaining(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, included + purchased - used)
  FROM public.credit_balances
  WHERE user_id = _user_id AND (auth.uid() = _user_id OR auth.uid() IS NULL);
$$;

REVOKE ALL ON FUNCTION public.credit_remaining(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_remaining(uuid) TO authenticated, service_role;