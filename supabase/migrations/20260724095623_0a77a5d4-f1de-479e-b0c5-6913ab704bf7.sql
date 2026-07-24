CREATE OR REPLACE FUNCTION public.is_team_member_of(_owner_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE owner_id = _owner_id
      AND member_user_id = _user_id
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_team_member_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member_of(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can view teammates" ON public.team_members;
CREATE POLICY "Members can view teammates"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR auth.uid() = member_user_id
  OR public.is_team_member_of(owner_id, auth.uid())
);