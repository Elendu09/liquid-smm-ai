
-- Lock down SECURITY DEFINER functions so only intended callers can execute them.
-- These functions run with elevated privileges; they should not be directly callable
-- by anon/authenticated clients unless the function is explicitly designed for it.

-- Trigger function — should never be called directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Called only by the analytics-rollup edge function (service role).
REVOKE ALL ON FUNCTION public.refresh_platform_rollup(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_platform_rollup(uuid, integer) TO service_role;

-- Analytics RPCs are called from edge functions with the service role.
REVOKE ALL ON FUNCTION public.analytics_overview_totals(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_overview_totals(uuid, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.analytics_overview_top_posts(uuid, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_overview_top_posts(uuid, timestamptz, integer) TO service_role;

-- has_role is used inside RLS policies (which evaluate with the definer's privileges);
-- clients never need direct EXECUTE.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- accept_team_invite must remain callable by signed-in users accepting an invite.
REVOKE ALL ON FUNCTION public.accept_team_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated, service_role;

-- set_updated_at is a trigger function only.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
