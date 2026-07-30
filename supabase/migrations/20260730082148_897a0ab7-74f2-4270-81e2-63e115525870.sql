CREATE TABLE public.autolists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '217 91% 60%',
  platform_ids text[] NOT NULL DEFAULT '{}',
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  timezone text NOT NULL DEFAULT 'UTC',
  active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autolists TO authenticated;
GRANT ALL ON public.autolists TO service_role;

ALTER TABLE public.autolists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own autolists"
ON public.autolists FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view owner autolists"
ON public.autolists FOR SELECT TO authenticated
USING (public.is_team_member_of(user_id, auth.uid()));

CREATE INDEX idx_autolists_user ON public.autolists(user_id, order_index);
CREATE INDEX idx_autolists_brand ON public.autolists(brand_id);

CREATE TRIGGER set_autolists_updated_at
BEFORE UPDATE ON public.autolists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS autolist_id uuid REFERENCES public.autolists(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_autolist ON public.scheduled_posts(autolist_id);