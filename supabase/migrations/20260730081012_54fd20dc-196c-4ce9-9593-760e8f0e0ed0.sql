CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text,
  description text,
  color text NOT NULL DEFAULT '217 91% 60%',
  logo_url text,
  timezone text NOT NULL DEFAULT 'UTC',
  archived boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own brands"
  ON public.brands FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view owner brands"
  ON public.brands FOR SELECT TO authenticated
  USING (public.is_team_member_of(user_id, auth.uid()));

CREATE INDEX brands_user_idx ON public.brands (user_id, order_index);

CREATE TRIGGER brands_set_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_accounts
  ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX social_accounts_brand_idx ON public.social_accounts (brand_id);

ALTER TABLE public.account_preferences
  ADD COLUMN active_brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;