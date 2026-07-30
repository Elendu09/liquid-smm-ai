import { useMemo } from "react";
import { useAccounts, type ConnectedAccount } from "@/contexts/AccountContext";
import { useBrands } from "@/contexts/BrandContext";

/**
 * Channels narrowed to the brand workspace selected in the header switcher.
 * When "All brands" is active this is simply every connected channel.
 */
export function useScopedAccounts(): {
  accounts: ConnectedAccount[];
  allAccounts: ConnectedAccount[];
  scoped: boolean;
  brandName: string | null;
} {
  const { accounts } = useAccounts();
  const { activeBrand } = useBrands();

  const scopedAccounts = useMemo(
    () => (activeBrand ? accounts.filter((a) => a.brandId === activeBrand.id) : accounts),
    [accounts, activeBrand],
  );

  return {
    accounts: scopedAccounts,
    allAccounts: accounts,
    scoped: Boolean(activeBrand),
    brandName: activeBrand?.name ?? null,
  };
}
