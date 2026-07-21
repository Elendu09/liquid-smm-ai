
-- Phase 8: Team & collaboration — real invite acceptance + member visibility

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS member_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS team_members_member_user_idx ON public.team_members(member_user_id);
CREATE INDEX IF NOT EXISTS team_members_invite_token_idx ON public.team_members(invite_token);

-- Members can see the roster of teams they belong to (row-scoped by owner).
DROP POLICY IF EXISTS "Members can view teammates" ON public.team_members;
CREATE POLICY "Members can view teammates"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR auth.uid() = member_user_id
  OR EXISTS (
    SELECT 1 FROM public.team_members me
    WHERE me.owner_id = public.team_members.owner_id
      AND me.member_user_id = auth.uid()
      AND me.status = 'active'
  )
);

-- Accept an invite: signed-in user redeems a token. Runs as definer to bypass
-- owner-only RLS on the update; validates token + expiry itself.
CREATE OR REPLACE FUNCTION public.accept_team_invite(_token text)
RETURNS TABLE (owner_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.team_members%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT * INTO _row
  FROM public.team_members
  WHERE invite_token = _token
    AND status = 'pending'
    AND (invite_expires_at IS NULL OR invite_expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite invalid or expired';
  END IF;

  UPDATE public.team_members
  SET status = 'active',
      member_user_id = _uid,
      accepted_at = now(),
      last_active_at = now(),
      invite_token = NULL,
      joined_at = COALESCE(joined_at, now())
  WHERE id = _row.id;

  RETURN QUERY SELECT _row.owner_id, _row.role;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_team_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;
