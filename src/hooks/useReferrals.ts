import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface ReferralEarning {
  id: string;
  referredUserId: string;
  plan: string;
  creditsAwarded: number;
  rewardedAt: string;
}

export interface ReferralState {
  /** The user's public share code (used as /referral/<code>). */
  code: string | null;
  /** Full shareable link. */
  link: string | null;
  /** People who used this code and the credits they earned for the referrer. */
  referrals: ReferralEarning[];
  /** Lifetime referral credits earned. */
  totalEarned: number;
  /** Number of referred signups that have upgraded to a paid plan. */
  paidReferrals: number;
  loading: boolean;
  ensureCode: () => Promise<string | null>;
  claimReferral: (code: string) => Promise<{ ok: boolean; reason?: string }>;
  rewardReferral: (plan: string) => Promise<{ rewarded: boolean; reason?: string }>;
}

/**
 * Fire-and-forget reward trigger — called when the user's plan changes to a
 * paid tier (plans are client-side in this app). The referral-reward edge
 * function is idempotent (deduped by referrals.referred_user_id), so this is
 * safe to call more than once.
 */
export async function rewardReferralForPlan(plan: string): Promise<{ rewarded: boolean; reason?: string }> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return { rewarded: false, reason: "anon" };
    const res = await supabase.functions.invoke("referral-reward", { body: { plan } });
    if (res.error) return { rewarded: false, reason: res.error.message };
    return res.data ?? { rewarded: false };
  } catch (e) {
    return { rewarded: false, reason: (e as Error).message };
  }
}

function makeCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  for (const b of arr) s += chars[b % chars.length];
  return s;
}

/**
 * Referral program state: the user's share code + link, the ledger of people
 * who used it, and the client helpers that talk to the referral edge functions.
 */
export function useReferrals(): ReferralState {
  const { user, isGuest } = useAuthUser();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralEarning[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || isGuest) {
      setCode(null);
      setReferrals([]);
      setTotalEarned(0);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: profile }, { data: ledger }, { data: events }] = await Promise.all([
      supabase.from("profiles").select("referral_code, referred_by").eq("id", user.id).maybeSingle(),
      supabase
        .from("referrals")
        .select("id, referred_user_id, plan, credits_awarded, rewarded_at")
        .eq("referrer_id", user.id)
        .order("rewarded_at", { ascending: false }),
      supabase
        .from("credit_events")
        .select("delta")
        .eq("user_id", user.id)
        .eq("kind", "referral"),
    ]);

    if (profile?.referral_code) {
      setCode(profile.referral_code);
    }
    setReferrals(
      (ledger ?? []).map((r) => ({
        id: r.id,
        referredUserId: r.referred_user_id,
        plan: r.plan,
        creditsAwarded: Number(r.credits_awarded ?? 0),
        rewardedAt: r.rewarded_at,
      })),
    );
    setTotalEarned(
      (events ?? []).reduce((sum, e) => sum + Number(e.delta ?? 0), 0),
    );
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { void load(); }, [load]);

  // If the profile has no code yet, mint one (RLS allows self-update).
  const ensureCode = useCallback(async () => {
    if (!user || isGuest) return null;
    if (code) return code;
    const candidate = makeCode();
    const { error } = await supabase
      .from("profiles")
      .update({ referral_code: candidate, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      // Likely a rare uniqueness collision — reload to pick up any existing code.
      await load();
      return code;
    }
    setCode(candidate);
    return candidate;
  }, [user, isGuest, code, load]);

  const claimReferral = useCallback(
    async (c: string) => {
      if (!user || isGuest) return { ok: false, reason: "auth_required" };
      const { data, error } = await supabase.functions.invoke("claim-referral", {
        body: { code: c },
      });
      if (error) return { ok: false, reason: error.message };
      await load();
      return data ?? { ok: false, reason: "unknown" };
    },
    [user, isGuest, load],
  );

  const rewardReferral = useCallback(
    async (plan: string) => {
      if (!user || isGuest) return { rewarded: false, reason: "auth_required" };
      const { data, error } = await supabase.functions.invoke("referral-reward", {
        body: { plan },
      });
      if (error) return { rewarded: false, reason: error.message };
      return data ?? { rewarded: false, reason: "unknown" };
    },
    [user, isGuest],
  );

  const link = useMemo(
    () => (code ? `${window.location.origin}/referral/${code}` : null),
    [code],
  );

  return {
    code,
    link,
    referrals,
    totalEarned,
    paidReferrals: referrals.length,
    loading,
    ensureCode,
    claimReferral,
    rewardReferral,
  };
}
