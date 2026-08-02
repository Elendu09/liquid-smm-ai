import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface CreditEvent {
  id: string;
  delta: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreditBalance {
  balance: number;
  monthlyAllowance: number;
  usedThisMonth: number;
  purchased: number;
  renewsAt: string | null;
  updatedAt: string | null;
}

const DEFAULT: CreditBalance = {
  balance: 0,
  monthlyAllowance: 0,
  usedThisMonth: 0,
  purchased: 0,
  renewsAt: null,
  updatedAt: null,
};

/**
 * Live workspace credit balance + ledger for the signed-in user.
 * Guests get a zeroed shape so components can render without branching.
 *
 * Schema: credit_balances(included, purchased, used, cap, renews_at).
 * Remaining balance = included + purchased - used.
 */
export function useCredits() {
  const { user, isGuest } = useAuthUser();
  const [balance, setBalance] = useState<CreditBalance>(DEFAULT);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || isGuest) {
      setBalance(DEFAULT);
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: bal }, { data: evs }] = await Promise.all([
      supabase
        .from("credit_balances")
        .select("included, purchased, used, cap, renews_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("credit_events")
        .select("id, delta, kind, label, meta, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (bal) {
      const included = Number(bal.included ?? 0);
      const purchased = Number(bal.purchased ?? 0);
      const used = Number(bal.used ?? 0);
      setBalance({
        balance: Math.max(0, included + purchased - used),
        monthlyAllowance: Number(bal.cap ?? included) || included,
        usedThisMonth: used,
        purchased,
        renewsAt: bal.renews_at ?? null,
        updatedAt: bal.updated_at ?? null,
      });
    } else {
      setBalance({ ...DEFAULT });
    }

    setEvents(
      (evs ?? []).map((e) => ({
        id: e.id,
        delta: Number(e.delta ?? 0),
        reason: e.label ?? e.kind ?? "",
        metadata: (e.meta as Record<string, unknown>) ?? null,
        created_at: e.created_at,
      })),
    );
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user || isGuest) return;
    const channel = supabase
      .channel(`credits:${user.id}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_balances", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "credit_events", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isGuest, load]);

  const usedPct = useMemo(() => {
    const cap = balance.monthlyAllowance || 1;
    return Math.min(100, Math.round((balance.usedThisMonth / cap) * 100));
  }, [balance]);

  return { balance, events, loading, usedPct, refetch: load };
}
