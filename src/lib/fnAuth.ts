import { supabase } from "@/integrations/supabase/client";

/**
 * Bearer token for edge functions that call `requireUser`.
 * Falls back to the publishable key (only useful for public functions).
 */
export async function fnBearer(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}
