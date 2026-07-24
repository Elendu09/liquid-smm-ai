REVOKE EXECUTE ON FUNCTION public.accept_team_invite(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO service_role;