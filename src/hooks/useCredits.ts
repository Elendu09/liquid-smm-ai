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
  updatedAt: string | null;
}

const DEFAULT: CreditBalance = {
  balance: 0,
  monthlyAllowance: 500,
  usedThisMonth: 0,
  updatedAt: null,
};

/**
 * Live workspace credit balance + ledger for the signed-in user.
 * Guests get a zeroed shape so components can render without branching.
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("credit_balances" as any)
        .select("balance, monthly_allowance, used_this_month, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("credit_events" as any)
        .select("id, delta, reason, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (bal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = bal as any;
      setBalance({
        balance: Number(b.balance ?? 0),
        monthlyAllowance: Number(b.monthly_allowance ?? 500),
        usedThisMonth: Number(b.used_this_month ?? 0),
        updatedAt: b.updated_at ?? null,
      });
    } else {
      setBalance({ ...DEFAULT });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvents(((evs as any[]) ?? []) as CreditEvent[]);
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
