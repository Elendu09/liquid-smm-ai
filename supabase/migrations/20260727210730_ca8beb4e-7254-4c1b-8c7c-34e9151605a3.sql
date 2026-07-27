
CREATE TABLE public.credit_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  included integer NOT NULL DEFAULT 500,
  used integer NOT NULL DEFAULT 0,
  purchased integer NOT NULL DEFAULT 0,
  cap integer NOT NULL DEFAULT 500,
  renews_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own balance"
  ON public.credit_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER credit_balances_updated_at
  BEFORE UPDATE ON public.credit_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  delta integer NOT NULL,
  label text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX credit_events_user_created_idx ON public.credit_events(user_id, created_at DESC);

GRANT SELECT ON public.credit_events TO authenticated;
GRANT ALL ON public.credit_events TO service_role;

ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own events"
  ON public.credit_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Extend the new-user hook to seed a credit balance row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.credit_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill balances for existing users.
INSERT INTO public.credit_balances (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_events;
