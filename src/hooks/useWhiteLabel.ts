import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhiteLabelConfig {
  brandName: string;
  logoUrl: string;
  accentHsl: string;
  hideBadge: boolean;
  customLoginTagline: string;
  supportEmail: string;
}

const STORAGE_KEY = "smmpilot:white-label";

const DEFAULTS: WhiteLabelConfig = {
  brandName: "",
  logoUrl: "",
  accentHsl: "",
  hideBadge: false,
  customLoginTagline: "",
  supportEmail: "",
};

function readLocal(): WhiteLabelConfig {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as WhiteLabelConfig) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
function writeLocal(next: WhiteLabelConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

let cache: WhiteLabelConfig = readLocal();
let userId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
function setCache(next: WhiteLabelConfig) {
  cache = next;
  writeLocal(next);
  listeners.forEach((l) => l());
  applyToRoot();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function applyToRoot() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (cache.accentHsl.trim()) {
    root.style.setProperty("--primary", cache.accentHsl);
    root.style.setProperty("--ring", cache.accentHsl);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
  }
  if (cache.brandName.trim()) document.title = cache.brandName;
}

async function hydrateFromRemote() {
  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  hydrated = true;
  if (!userId) return;
  const { data: row } = await supabase
    .from("white_label_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (row) {
    setCache({
      brandName: row.brand_name ?? "",
      logoUrl: row.logo_url ?? "",
      accentHsl: row.accent_hsl ?? "",
      hideBadge: row.hide_badge ?? false,
      customLoginTagline: row.custom_login_tagline ?? "",
      supportEmail: row.support_email ?? "",
    });
  }
}

if (typeof window !== "undefined") {
  applyToRoot();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) setCache(readLocal());
  });
  supabase.auth.onAuthStateChange(() => {
    hydrated = false;
    void hydrateFromRemote();
  });
}

export function useWhiteLabel() {
  const config = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => { if (!hydrated) void hydrateFromRemote(); }, []);

  const save = (patch: Partial<WhiteLabelConfig>) => {
    const next = { ...cache, ...patch };
    setCache(next);
    if (userId) {
      void supabase.from("white_label_config").upsert(
        {
          user_id: userId,
          brand_name: next.brandName,
          logo_url: next.logoUrl,
          accent_hsl: next.accentHsl,
          hide_badge: next.hideBadge,
          custom_login_tagline: next.customLoginTagline,
          support_email: next.supportEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  };
  const reset = () => {
    setCache(DEFAULTS);
    if (userId) void supabase.from("white_label_config").delete().eq("user_id", userId);
  };
  return { config, save, reset };
}
