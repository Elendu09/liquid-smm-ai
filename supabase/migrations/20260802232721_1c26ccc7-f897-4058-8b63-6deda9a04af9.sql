ALTER TABLE public.credit_balances
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Trial grant: 100 credits for 14 days on signup, then a 25/month free tier.
ALTER TABLE public.credit_balances ALTER COLUMN included SET DEFAULT 100;
ALTER TABLE public.credit_balances ALTER COLUMN cap SET DEFAULT 100;

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
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_balances (user_id, included, cap, trial_ends_at)
  VALUES (NEW.id, 100, 100, now() + interval '14 days')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_events (user_id, kind, delta, label, meta)
  VALUES (NEW.id, 'grant', 100, 'Free trial credits', jsonb_build_object('trial_days', 14));

  RETURN NEW;
END;
$function$;