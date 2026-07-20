import { useEffect, useSyncExternalStore } from "react";

export interface WhiteLabelConfig {
  brandName: string;
  logoUrl: string;
  accentHsl: string; // e.g. "217 91% 60%"
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

function read(): WhiteLabelConfig {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as WhiteLabelConfig) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let cache: WhiteLabelConfig = read();
const listeners = new Set<() => void>();

function emit() {
  cache = read();
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
  if (cache.brandName.trim()) {
    document.title = cache.brandName;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) emit();
  });
  applyToRoot();
}

export function useWhiteLabel() {
  const config = useSyncExternalStore(subscribe, () => cache, () => cache);
  const save = (patch: Partial<WhiteLabelConfig>) => {
    const next = { ...cache, ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  };
  const reset = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    emit();
  };
  return { config, save, reset };
}
