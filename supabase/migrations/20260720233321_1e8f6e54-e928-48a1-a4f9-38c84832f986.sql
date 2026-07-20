
CREATE TABLE public.hub_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  status TEXT NOT NULL,
  meta TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX hub_items_user_hub_idx ON public.hub_items(user_id, hub_key, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_items TO authenticated;
GRANT ALL ON public.hub_items TO service_role;

ALTER TABLE public.hub_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hub items"
  ON public.hub_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER hub_items_set_updated_at
  BEFORE UPDATE ON public.hub_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_items;
