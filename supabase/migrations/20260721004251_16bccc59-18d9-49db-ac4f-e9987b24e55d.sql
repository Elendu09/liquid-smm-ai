
REVOKE EXECUTE ON FUNCTION public.refresh_platform_rollup(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_platform_rollup(UUID, INTEGER) TO service_role;
