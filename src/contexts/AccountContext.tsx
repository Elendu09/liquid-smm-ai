import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { platforms, Platform } from "@/config/platforms";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface ConnectedAccount {
  id: string;
  platformId: string;
  username: string;
  displayName: string;
  avatar?: string;
  isActive: boolean;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  connectedAt: Date;
  lastSync?: Date;
  healthScore: number;
  status: "active" | "warning" | "error" | "disconnected";
}

interface AccountContextType {
  accounts: ConnectedAccount[];
  activeAccount: ConnectedAccount | null;
  loading: boolean;
  setActiveAccount: (account: ConnectedAccount | null) => void;
  addAccount: (account: Omit<ConnectedAccount, "id"> & { id?: string }) => Promise<ConnectedAccount | null>;
  removeAccount: (accountId: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<ConnectedAccount>) => Promise<void>;
  refresh: () => Promise<void>;
  getAccountsByPlatform: (platformId: string) => ConnectedAccount[];
  getPlatformForAccount: (accountId: string) => Platform | undefined;
  totalAccounts: number;
  activePlatforms: string[];
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Guest / preview demo data (used when signed-out)
const guestAccounts: ConnectedAccount[] = [
  {
    id: "guest-1", platformId: "instagram", username: "smmpilot",
    displayName: "SMMSAAS Official",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot",
    isActive: true, followers: 45200, following: 892, posts: 342, engagement: 4.8,
    connectedAt: new Date("2024-01-15"), lastSync: new Date(),
    healthScore: 92, status: "active",
  },
  {
    id: "guest-2", platformId: "tiktok", username: "smmpilot_official",
    displayName: "SMMSAAS",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot2",
    isActive: true, followers: 128000, following: 156, posts: 89, engagement: 8.2,
    connectedAt: new Date("2024-02-01"), lastSync: new Date(),
    healthScore: 88, status: "active",
  },
  {
    id: "guest-3", platformId: "youtube", username: "SMMSAASChannel",
    displayName: "SMMSAAS Tutorials",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot3",
    isActive: true, followers: 12400, following: 45, posts: 156, engagement: 5.1,
    connectedAt: new Date("2024-01-20"), lastSync: new Date(),
    healthScore: 95, status: "active",
  },
];

type Row = {
  id: string; platform_id: string; username: string; display_name: string;
  avatar_url: string | null; is_active: boolean;
  followers: number; following: number; posts: number; engagement: number;
  health_score: number; status: ConnectedAccount["status"];
  connected_at: string; last_sync: string | null;
};

const rowToAccount = (r: Row): ConnectedAccount => ({
  id: r.id, platformId: r.platform_id, username: r.username,
  displayName: r.display_name, avatar: r.avatar_url ?? undefined,
  isActive: r.is_active, followers: r.followers, following: r.following,
  posts: r.posts, engagement: Number(r.engagement), healthScore: r.health_score,
  status: r.status, connectedAt: new Date(r.connected_at),
  lastSync: r.last_sync ? new Date(r.last_sync) : undefined,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthUser();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(guestAccounts);
  const [activeAccount, setActiveAccountState] = useState<ConnectedAccount | null>(guestAccounts[0]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setAccounts(guestAccounts);
      setActiveAccountState(guestAccounts[0]);
      return;
    }
    setLoading(true);
    const [{ data: rows }, { data: pref }] = await Promise.all([
      supabase.from("social_accounts").select("*").order("connected_at", { ascending: true }),
      supabase.from("account_preferences").select("active_account_id").maybeSingle(),
    ]);
    const list = (rows as Row[] | null)?.map(rowToAccount) ?? [];
    setAccounts(list);
    const preferred = pref?.active_account_id
      ? list.find((a) => a.id === pref.active_account_id) ?? null
      : list[0] ?? null;
    setActiveAccountState(preferred);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`social_accounts:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_accounts", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const setActiveAccount = useCallback((account: ConnectedAccount | null) => {
    setActiveAccountState(account);
    if (user) {
      supabase.from("account_preferences")
        .upsert({ user_id: user.id, active_account_id: account?.id ?? null }, { onConflict: "user_id" })
        .then(() => {});
    }
  }, [user]);

  const addAccount: AccountContextType["addAccount"] = useCallback(async (account) => {
    if (!user) {
      const local: ConnectedAccount = { ...account, id: account.id ?? `guest-${Date.now()}` };
      setAccounts((p) => [...p, local]);
      return local;
    }
    const { data, error } = await supabase.from("social_accounts").insert({
      user_id: user.id,
      platform_id: account.platformId,
      username: account.username,
      display_name: account.displayName,
      avatar_url: account.avatar ?? null,
      is_active: account.isActive,
      followers: account.followers, following: account.following,
      posts: account.posts, engagement: account.engagement,
      health_score: account.healthScore, status: account.status,
      last_sync: account.lastSync?.toISOString() ?? null,
    }).select("*").single();
    if (error || !data) return null;
    const created = rowToAccount(data as Row);
    setAccounts((p) => [...p, created]);
    return created;
  }, [user]);

  const removeAccount = useCallback(async (accountId: string) => {
    if (user) await supabase.from("social_accounts").delete().eq("id", accountId);
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== accountId);
      if (activeAccount?.id === accountId) setActiveAccount(next[0] ?? null);
      return next;
    });
  }, [user, activeAccount, setActiveAccount]);

  const updateAccount = useCallback(async (accountId: string, updates: Partial<ConnectedAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, ...updates } : a)));
    if (!user) return;
    const patch: Record<string, unknown> = {};
    if (updates.username !== undefined) patch.username = updates.username;
    if (updates.displayName !== undefined) patch.display_name = updates.displayName;
    if (updates.avatar !== undefined) patch.avatar_url = updates.avatar;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;
    if (updates.followers !== undefined) patch.followers = updates.followers;
    if (updates.following !== undefined) patch.following = updates.following;
    if (updates.posts !== undefined) patch.posts = updates.posts;
    if (updates.engagement !== undefined) patch.engagement = updates.engagement;
    if (updates.healthScore !== undefined) patch.health_score = updates.healthScore;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.lastSync !== undefined) patch.last_sync = updates.lastSync?.toISOString() ?? null;
    if (Object.keys(patch).length) await supabase.from("social_accounts").update(patch).eq("id", accountId);
  }, [user]);

  const getAccountsByPlatform = useCallback(
    (platformId: string) => accounts.filter((a) => a.platformId === platformId),
    [accounts]
  );
  const getPlatformForAccount = useCallback((accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return undefined;
    return platforms.find((p) => p.id === account.platformId);
  }, [accounts]);

  const activePlatforms = useMemo(
    () => [...new Set(accounts.map((a) => a.platformId))],
    [accounts]
  );

  return (
    <AccountContext.Provider
      value={{
        accounts, activeAccount, loading,
        setActiveAccount, addAccount, removeAccount, updateAccount,
        refresh: load,
        getAccountsByPlatform, getPlatformForAccount,
        totalAccounts: accounts.length, activePlatforms,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountProvider");
  }
  return context;
}

export default AccountContext;
