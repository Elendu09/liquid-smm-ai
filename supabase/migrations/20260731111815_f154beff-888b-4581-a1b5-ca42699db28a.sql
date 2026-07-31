-- 1. Remove self-escalation path on user_roles: no client writes at all.
DROP POLICY IF EXISTS "Owners and admins can manage roles" ON public.user_roles;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2. audit_log: admin role is no longer a trustworthy global escalation surface.
DROP POLICY IF EXISTS "own audit_log" ON public.audit_log;
CREATE POLICY "own audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. team_members: hide pending invite rows (tokens/emails/roles) from teammates.
DROP POLICY IF EXISTS "Members can view teammates" ON public.team_members;
CREATE POLICY "Members can view teammates" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR auth.uid() = member_user_id
    OR (status = 'active' AND public.is_team_member_of(owner_id, auth.uid()))
  );

-- 4. accept_team_invite: bind acceptance to the invited email.
CREATE OR REPLACE FUNCTION public.accept_team_invite(_token text)
 RETURNS TABLE(owner_id uuid, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _row public.team_members%ROWTYPE;
BEGIN
  IF _uid IS NULL OR _email = '' THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT * INTO _row
  FROM public.team_members
  WHERE invite_token = _token
    AND status = 'pending'
    AND invite_expires_at IS NOT NULL
    AND invite_expires_at > now()
    AND lower(email) = _email
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
$function$;

REVOKE EXECUTE ON FUNCTION public.accept_team_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO service_role;