import { useEffect, useSyncExternalStore } from "react";
import { linkBioThemes, THEME_STORAGE_KEY } from "@/pages/dashboard/views/linkbio/themePresets";

export type BioLink = {
  id: string;
  title: string;
  url: string;
  icon?: string;
  highlight?: boolean;
  enabled: boolean;
};

export type BioSocial = { platform: string; url: string };

export type ButtonStyle = "solid" | "outline" | "pill" | "glass" | "brutal";
export type Radius = "sm" | "md" | "xl" | "full";
export type Alignment = "center" | "left";
export type BgType = "theme" | "solid" | "gradient" | "mesh";

export type BioBlockType =
  | "header"
  | "text"
  | "image"
  | "video"
  | "embed"
  | "divider"
  | "countdown"
  | "quote";

export interface BioBlock {
  id: string;
  type: BioBlockType;
  enabled: boolean;
  text?: string; // header/text/quote/countdown label
  src?: string; // image url / video url / embed url
  target?: string; // ISO date for countdown
  align?: "left" | "center";
}

export type EntranceAnimation = "none" | "fade" | "slide" | "scale";
export type HoverAnimation = "none" | "scale" | "lift" | "glow";

export interface BioConfig {
  version: 1;
  handle: string;
  headline: string;
  bio?: string;
  avatarUrl?: string;
  slug: string;
  themeId: string;
  overrides: {
    bgType?: BgType;
    bgSolid?: string;
    bgGradientFrom?: string;
    bgGradientTo?: string;
    accent?: string;
    textColor?: string;
    buttonBg?: string;
    buttonText?: string;
    fontHeading?: "sans" | "serif" | "mono";
    fontBody?: "sans" | "serif" | "mono";
    radius?: Radius;
    buttonStyle?: ButtonStyle;
    alignment?: Alignment;
    avatarSize?: "sm" | "md" | "lg";
    entrance?: EntranceAnimation;
    hover?: HoverAnimation;
    stagger?: number; // ms between items
  };
  links: BioLink[];
  socials: BioSocial[];
  blocks: BioBlock[];
}

export const CONFIG_KEY = "smmpilot:linkbio:config";

const defaultConfig: BioConfig = {
  version: 1,
  handle: "@yourhandle",
  headline: "Creator · Storyteller · Coffee obsessed",
  bio: "One link, endless destinations.",
  slug: "yourhandle",
  themeId: "midnight-glass",
  overrides: {
    bgType: "theme",
    alignment: "center",
    avatarSize: "md",
  },
  links: [
    { id: "l1", title: "Online classes", url: "https://example.com/classes", enabled: true, highlight: true },
    { id: "l2", title: "Tutorials", url: "https://example.com/tutorials", enabled: true },
    { id: "l3", title: "Shop", url: "https://example.com/shop", enabled: true },
  ],
  socials: [
    { platform: "instagram", url: "https://instagram.com" },
    { platform: "facebook", url: "https://facebook.com" },
    { platform: "linkedin", url: "https://linkedin.com" },
  ],
};

function migrate(): BioConfig {
  if (typeof window === "undefined") return defaultConfig;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as BioConfig;
      if (parsed && parsed.version === 1) return { ...defaultConfig, ...parsed, overrides: { ...defaultConfig.overrides, ...parsed.overrides } };
    } catch {}
  }
  // Migrate from legacy keys
  const themeId = localStorage.getItem(THEME_STORAGE_KEY) || defaultConfig.themeId;
  const seedRaw = localStorage.getItem("smmpilot:linkbio:seed-links");
  let seeded = defaultConfig;
  if (seedRaw) {
    try {
      const seed = JSON.parse(seedRaw) as { handle?: string; headline?: string; links?: Array<{ title: string; url: string; highlight?: boolean }> };
      seeded = {
        ...defaultConfig,
        handle: seed.handle ?? defaultConfig.handle,
        headline: seed.headline ?? defaultConfig.headline,
        links: (seed.links ?? []).map((l, i) => ({
          id: `l${i + 1}`,
          title: l.title,
          url: l.url,
          highlight: l.highlight,
          enabled: true,
        })),
      };
    } catch {}
  }
  return { ...seeded, themeId };
}

let state: BioConfig = migrate();
const listeners = new Set<() => void>();
const past: BioConfig[] = [];
const future: BioConfig[] = [];
const HISTORY_MAX = 50;

function emit() {
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function commit(next: BioConfig) {
  past.push(state);
  if (past.length > HISTORY_MAX) past.shift();
  future.length = 0;
  state = next;
  emit();
}

export const bioStore = {
  get: () => state,
  canUndo: () => past.length > 0,
  canRedo: () => future.length > 0,
  undo: () => {
    const prev = past.pop();
    if (!prev) return;
    future.push(state);
    state = prev;
    emit();
  },
  redo: () => {
    const nxt = future.pop();
    if (!nxt) return;
    past.push(state);
    state = nxt;
    emit();
  },
  set: (patch: Partial<BioConfig>) => commit({ ...state, ...patch }),
  update: (fn: (c: BioConfig) => BioConfig) => commit(fn(state)),
  patchOverrides: (patch: Partial<BioConfig["overrides"]>) =>
    commit({ ...state, overrides: { ...state.overrides, ...patch } }),
  addLink: () => {
    const id = `l${Date.now()}`;
    commit({ ...state, links: [...state.links, { id, title: "New link", url: "https://", enabled: true }] });
  },
  updateLink: (id: string, patch: Partial<BioLink>) => {
    commit({ ...state, links: state.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  },
  removeLink: (id: string) => {
    commit({ ...state, links: state.links.filter((l) => l.id !== id) });
  },
  moveLink: (id: string, dir: -1 | 1) => {
    const idx = state.links.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const to = idx + dir;
    if (to < 0 || to >= state.links.length) return;
    const next = [...state.links];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    commit({ ...state, links: next });
  },
  reorderLinks: (fromId: string, toId: string) => {
    const from = state.links.findIndex((l) => l.id === fromId);
    const to = state.links.findIndex((l) => l.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...state.links];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit({ ...state, links: next });
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useBioConfig(): BioConfig {
  return useSyncExternalStore(
    (l) => bioStore.subscribe(l),
    () => bioStore.get(),
    () => bioStore.get(),
  );
}

// Sync theme selection into legacy key for back-compat
export function useSyncLegacyTheme() {
  const cfg = useBioConfig();
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, cfg.themeId);
    }
  }, [cfg.themeId]);
}

export function resolveTheme(cfg: BioConfig) {
  return linkBioThemes.find((t) => t.id === cfg.themeId) ?? linkBioThemes[0];
}
