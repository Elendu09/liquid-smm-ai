import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface Brand {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  /** HSL triplet, e.g. "217 91% 60%" */
  color: string;
  logoUrl: string | null;
  timezone: string;
  archived: boolean;
  orderIndex: number;
}

export interface BrandDraft {
  name: string;
  description?: string | null;
  color?: string;
  logoUrl?: string | null;
  timezone?: string;
}

interface BrandContextValue {
  brands: Brand[];
  /** Brands excluding archived ones — what switchers should show. */
  activeBrands: Brand[];
  /** `null` means "All brands" (unscoped view). */
  activeBrand: Brand | null;
  activeBrandId: string | null;
  loading: boolean;
  setActiveBrandId: (id: string | null) => void;
  createBrand: (draft: BrandDraft) => Promise<Brand | null>;
  updateBrand: (id: string, patch: Partial<BrandDraft> & { archived?: boolean }) => Promise<void>;
  removeBrand: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

const GUEST_KEY = "smmpilot:active-brand";

const guestBrands: Brand[] = [
  {
    id: "guest-brand-1",
    name: "SMMSAAS House",
    slug: "smmsaas-house",
    description: "Our own channels — product, growth and community.",
    color: "217 91% 60%",
    logoUrl: null,
    timezone: "UTC",
    archived: false,
    orderIndex: 0,
  },
  {
    id: "guest-brand-2",
    name: "Lumen Studio",
    slug: "lumen-studio",
    description: "Demo client workspace with its own channels and reports.",
    color: "262 83% 58%",
    logoUrl: null,
    timezone: "Europe/Berlin",
    archived: false,
    orderIndex: 1,
  },
];

type Row = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  color: string;
  logo_url: string | null;
  timezone: string;
  archived: boolean;
  order_index: number;
};

const rowToBrand = (r: Row): Brand => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  color: r.color,
  logoUrl: r.logo_url,
  timezone: r.timezone,
  archived: r.archived,
  orderIndex: r.order_index,
});

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || null;

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthUser();
  const [brands, setBrands] = useState<Brand[]>(guestBrands);
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setBrands(guestBrands);
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(GUEST_KEY) : null;
      setActiveBrandIdState(guestBrands.some((b) => b.id === stored) ? stored : null);
      return;
    }
    setLoading(true);
    const [{ data: rows }, { data: pref }] = await Promise.all([
      supabase.from("brands").select("*").order("order_index", { ascending: true }),
      supabase.from("account_preferences").select("active_brand_id").maybeSingle(),
    ]);
    const list = ((rows as Row[] | null) ?? []).map(rowToBrand);
    setBrands(list);
    const preferred = pref?.active_brand_id;
    setActiveBrandIdState(preferred && list.some((b) => b.id === preferred) ? preferred : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`brands:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands", filter: `user_id=eq.${user.id}` },
        () => { load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const setActiveBrandId = useCallback(
    (id: string | null) => {
      setActiveBrandIdState(id);
      if (!user) {
        if (typeof window !== "undefined") {
          if (id) window.localStorage.setItem(GUEST_KEY, id);
          else window.localStorage.removeItem(GUEST_KEY);
        }
        return;
      }
      void supabase
        .from("account_preferences")
        .upsert({ user_id: user.id, active_brand_id: id }, { onConflict: "user_id" });
    },
    [user],
  );

  const createBrand = useCallback<BrandContextValue["createBrand"]>(
    async (draft) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("brands")
        .insert({
          user_id: user.id,
          name: draft.name,
          slug: slugify(draft.name),
          description: draft.description ?? null,
          color: draft.color ?? "217 91% 60%",
          logo_url: draft.logoUrl ?? null,
          timezone: draft.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
          order_index: brands.length,
        })
        .select("*")
        .single();
      if (error || !data) return null;
      const created = rowToBrand(data as Row);
      setBrands((p) => [...p, created]);
      return created;
    },
    [user, brands.length],
  );

  const updateBrand = useCallback<BrandContextValue["updateBrand"]>(
    async (id, patch) => {
      setBrands((p) =>
        p.map((b) =>
          b.id === id
            ? {
                ...b,
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.description !== undefined ? { description: patch.description ?? null } : {}),
                ...(patch.color !== undefined ? { color: patch.color } : {}),
                ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl ?? null } : {}),
                ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
                ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
              }
            : b,
        ),
      );
      if (!user) return;
      type BrandUpdate = {
        name?: string; slug?: string | null; description?: string | null;
        color?: string; logo_url?: string | null; timezone?: string; archived?: boolean;
      };
      const row: BrandUpdate = {};
      if (patch.name !== undefined) { row.name = patch.name; row.slug = slugify(patch.name); }
      if (patch.description !== undefined) row.description = patch.description ?? null;
      if (patch.color !== undefined) row.color = patch.color;
      if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl ?? null;
      if (patch.timezone !== undefined) row.timezone = patch.timezone;
      if (patch.archived !== undefined) row.archived = patch.archived;
      if (Object.keys(row).length) await supabase.from("brands").update(row).eq("id", id);
    },
    [user],
  );

  const removeBrand = useCallback(
    async (id: string) => {
      setBrands((p) => p.filter((b) => b.id !== id));
      if (activeBrandId === id) setActiveBrandId(null);
      if (user) await supabase.from("brands").delete().eq("id", id);
    },
    [user, activeBrandId, setActiveBrandId],
  );

  const activeBrands = useMemo(() => brands.filter((b) => !b.archived), [brands]);
  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? null,
    [brands, activeBrandId],
  );

  const value = useMemo<BrandContextValue>(
    () => ({
      brands,
      activeBrands,
      activeBrand,
      activeBrandId,
      loading,
      setActiveBrandId,
      createBrand,
      updateBrand,
      removeBrand,
      refresh: load,
    }),
    [brands, activeBrands, activeBrand, activeBrandId, loading, setActiveBrandId, createBrand, updateBrand, removeBrand, load],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrands() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrands must be used within a BrandProvider");
  return ctx;
}

export default BrandContext;
