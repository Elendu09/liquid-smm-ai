import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAccounts, ConnectedAccount } from "@/contexts/AccountContext";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { platforms } from "@/config/platforms";

interface AccountSwitcherProps {
  collapsed?: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  disconnected: "bg-gray-400",
};

export function AccountSwitcher({ collapsed = false }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const navigate = useNavigate();
  const { accounts, activeAccount, setActiveAccount, activePlatforms } =
    useAccounts();

  const groupedAccounts = activePlatforms.reduce((acc, platformId) => {
    const platformAccounts = accounts.filter((a) => a.platformId === platformId);
    if (platformAccounts.length > 0) {
      acc[platformId] = platformAccounts;
    }
    return acc;
  }, {} as Record<string, ConnectedAccount[]>);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative w-10 h-10 rounded-lg"
          >
            {activeAccount ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activeAccount.avatar} />
                  <AvatarFallback>
                    {activeAccount.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                    statusColors[activeAccount.status]
                  )}
                />
              </>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" side="right">
          <AccountSwitcherContent
            groupedAccounts={groupedAccounts}
            activeAccount={activeAccount}
            setActiveAccount={setActiveAccount}
            setOpen={setOpen}
            formatFollowers={formatFollowers}
            onConnect={() => setConnectOpen(true)}
            onManage={() => navigate("/dashboard/account-health")}
          />
        </PopoverContent>
        <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2 px-3"
        >
          {activeAccount ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activeAccount.avatar} />
                  <AvatarFallback>
                    {activeAccount.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    statusColors[activeAccount.status]
                  )}
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {activeAccount.displayName}
                </span>
                <div className="flex items-center gap-1">
                  <PlatformIcon
                    platform={activeAccount.platformId}
                    size="xs"
                    className="opacity-70"
                  />
                  <span className="text-xs text-muted-foreground">
                    @{activeAccount.username}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Select account</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <AccountSwitcherContent
          groupedAccounts={groupedAccounts}
          activeAccount={activeAccount}
          setActiveAccount={setActiveAccount}
          setOpen={setOpen}
          formatFollowers={formatFollowers}
          onConnect={() => setConnectOpen(true)}
          onManage={() => navigate("/dashboard/account-health")}
        />
      </PopoverContent>
      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </Popover>
  );
}

function AccountSwitcherContent({
  groupedAccounts,
  activeAccount,
  setActiveAccount,
  setOpen,
  formatFollowers,
  onConnect,
  onManage,
}: {
  groupedAccounts: Record<string, ConnectedAccount[]>;
  activeAccount: ConnectedAccount | null;
  setActiveAccount: (account: ConnectedAccount) => void;
  setOpen: (open: boolean) => void;
  formatFollowers: (count: number) => string;
  onConnect: () => void;
  onManage: () => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search accounts..." />
      <CommandList>
        <CommandEmpty>No accounts found.</CommandEmpty>
        {Object.entries(groupedAccounts).map(([platformId, platformAccounts]) => {
          const platform = platforms.find((p) => p.id === platformId);
          return (
            <CommandGroup
              key={platformId}
              heading={
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={platformId} size="xs" />
                  <span>{platform?.name || platformId}</span>
                </div>
              }
            >
              {platformAccounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={`${account.username}-${account.platformId}`}
                  onSelect={() => {
                    setActiveAccount(account);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={account.avatar} />
                        <AvatarFallback>
                          {account.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-popover",
                          statusColors[account.status]
                        )}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {account.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFollowers(account.followers)} followers
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        account.healthScore >= 80
                          ? "bg-green-500/10 text-green-600"
                          : account.healthScore >= 50
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-red-500/10 text-red-600"
                      )}
                    >
                      {account.healthScore}%
                    </Badge>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      activeAccount?.id === account.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onConnect();
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect New Account
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onManage();
            }}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Accounts
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export default AccountSwitcher;
