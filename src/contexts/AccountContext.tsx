import { createContext, useContext, useState, ReactNode } from "react";
import { platforms, Platform } from "@/config/platforms";

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
  healthScore: number; // 0-100
  status: "active" | "warning" | "error" | "disconnected";
}

interface AccountContextType {
  accounts: ConnectedAccount[];
  activeAccount: ConnectedAccount | null;
  setActiveAccount: (account: ConnectedAccount | null) => void;
  addAccount: (account: ConnectedAccount) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<ConnectedAccount>) => void;
  getAccountsByPlatform: (platformId: string) => ConnectedAccount[];
  getPlatformForAccount: (accountId: string) => Platform | undefined;
  totalAccounts: number;
  activePlatforms: string[];
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Mock data for demonstration
const mockAccounts: ConnectedAccount[] = [
  {
    id: "1",
    platformId: "instagram",
    username: "smmpilot",
    displayName: "SMMSAAS Official",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot",
    isActive: true,
    followers: 45200,
    following: 892,
    posts: 342,
    engagement: 4.8,
    connectedAt: new Date("2024-01-15"),
    lastSync: new Date(),
    healthScore: 92,
    status: "active",
  },
  {
    id: "2",
    platformId: "tiktok",
    username: "smmpilot_official",
    displayName: "SMMSAAS",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot2",
    isActive: true,
    followers: 128000,
    following: 156,
    posts: 89,
    engagement: 8.2,
    connectedAt: new Date("2024-02-01"),
    lastSync: new Date(),
    healthScore: 88,
    status: "active",
  },
  {
    id: "3",
    platformId: "youtube",
    username: "SMMSAASChannel",
    displayName: "SMMSAAS Tutorials",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot3",
    isActive: true,
    followers: 12400,
    following: 45,
    posts: 156,
    engagement: 5.1,
    connectedAt: new Date("2024-01-20"),
    lastSync: new Date(),
    healthScore: 95,
    status: "active",
  },
  {
    id: "4",
    platformId: "twitter",
    username: "smmpilot",
    displayName: "SMMSAAS",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot4",
    isActive: true,
    followers: 8900,
    following: 234,
    posts: 1205,
    engagement: 2.3,
    connectedAt: new Date("2024-01-10"),
    lastSync: new Date(),
    healthScore: 78,
    status: "warning",
  },
  {
    id: "5",
    platformId: "linkedin",
    username: "smmpilot-official",
    displayName: "SMMSAAS | Social Media Management",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot5",
    isActive: true,
    followers: 3200,
    following: 567,
    posts: 89,
    engagement: 6.7,
    connectedAt: new Date("2024-03-01"),
    lastSync: new Date(),
    healthScore: 85,
    status: "active",
  },
  {
    id: "6",
    platformId: "facebook",
    username: "smmpilotpage",
    displayName: "SMMSAAS",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=smmpilot6",
    isActive: false,
    followers: 15600,
    following: 0,
    posts: 234,
    engagement: 1.8,
    connectedAt: new Date("2024-02-15"),
    lastSync: new Date(Date.now() - 86400000 * 3),
    healthScore: 45,
    status: "error",
  },
];

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(mockAccounts);
  const [activeAccount, setActiveAccount] = useState<ConnectedAccount | null>(
    mockAccounts[0]
  );

  const addAccount = (account: ConnectedAccount) => {
    setAccounts((prev) => [...prev, account]);
  };

  const removeAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    if (activeAccount?.id === accountId) {
      setActiveAccount(accounts[0] || null);
    }
  };

  const updateAccount = (
    accountId: string,
    updates: Partial<ConnectedAccount>
  ) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, ...updates } : a))
    );
  };

  const getAccountsByPlatform = (platformId: string) => {
    return accounts.filter((a) => a.platformId === platformId);
  };

  const getPlatformForAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return undefined;
    return platforms.find((p) => p.id === account.platformId);
  };

  const activePlatforms = [...new Set(accounts.map((a) => a.platformId))];

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        setActiveAccount,
        addAccount,
        removeAccount,
        updateAccount,
        getAccountsByPlatform,
        getPlatformForAccount,
        totalAccounts: accounts.length,
        activePlatforms,
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
