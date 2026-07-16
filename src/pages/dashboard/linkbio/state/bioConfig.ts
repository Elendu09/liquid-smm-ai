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

export type ButtonStyle = "solid" | "outline" | "pill" | "glass" | "brutal" | "shadow";
export type Radius = "sm" | "md" | "xl" | "full";
export type Alignment = "center" | "left" | "justified";
export type BgType = "theme" | "solid" | "gradient" | "mesh" | "image";
export type ShadowDepth = "none" | "soft" | "medium" | "hard";
export type FontPairId =
  | "inter-inter"
  | "playfair-inter"
  | "space-dm"
  | "syne-jakarta"
  | "instrument-work"
  | "cormorant-karla"
  | "jetbrains-work"
  | "bebas-barlow";
export type FontScale = "s" | "m" | "l" | "xl";
export type SectionSpacing = "tight" | "cozy" | "roomy" | "airy";
export type AvatarShape = "circle" | "squircle" | "square";
export type MaxWidth = "narrow" | "regular" | "wide";

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
  text?: string;
  src?: string;
  target?: string;
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
    // Background
    bgType?: BgType;
    bgSolid?: string;
    bgGradientFrom?: string;
    bgGradientTo?: string;
    bgMeshStops?: [string, string, string, string];
    bgImage?: string;
    bgBlur?: number;
    bgNoise?: boolean;
    // Colors
    accent?: string;
    textColor?: string;
    buttonBg?: string;
    buttonText?: string;
    // Typography
    fontHeading?: "sans" | "serif" | "mono";
    fontBody?: "sans" | "serif" | "mono";
    fontPair?: FontPairId;
    fontScale?: FontScale;
    // Buttons
    radius?: Radius;
    radiusPx?: number;
    buttonStyle?: ButtonStyle;
    shadowDepth?: ShadowDepth;
    // Layout
    alignment?: Alignment;
    avatarSize?: "sm" | "md" | "lg";
    avatarSizePx?: number;
    avatarShape?: AvatarShape;
    avatarBorder?: number;
    sectionSpacing?: SectionSpacing;
    maxWidth?: MaxWidth;
    // Visibility
    showSocials?: boolean;
    showProfile?: boolean;
    footerText?: string;
    // Motion
    entrance?: EntranceAnimation;
    hover?: HoverAnimation;
    stagger?: number;
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
    entrance: "fade",
    hover: "scale",
    stagger: 60,
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
  blocks: [],
};

function migrate(): BioConfig {
  if (typeof window === "undefined") return defaultConfig;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as BioConfig;
      if (parsed && parsed.version === 1) return { ...defaultConfig, ...parsed, overrides: { ...defaultConfig.overrides, ...parsed.overrides }, blocks: parsed.blocks ?? [] };
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
  resetOverrides: () =>
    commit({ ...state, overrides: { ...defaultConfig.overrides } }),
  applyDesignPreset: (patch: { themeId?: string; overrides: Partial<BioConfig["overrides"]> }) =>
    commit({
      ...state,
      themeId: patch.themeId ?? state.themeId,
      overrides: { ...defaultConfig.overrides, ...patch.overrides },
    }),
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
  addBlock: (type: BioBlockType) => {
    const id = `b${Date.now()}`;
    const defaults: Record<BioBlockType, Partial<BioBlock>> = {
      header: { text: "New Section" },
      text: { text: "Add a short description here." },
      image: { src: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600" },
      video: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      embed: { src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC" },
      divider: {},
      countdown: { text: "Launch in", target: new Date(Date.now() + 7 * 864e5).toISOString() },
      quote: { text: "Design is intelligence made visible." },
    };
    const block: BioBlock = { id, type, enabled: true, align: "center", ...defaults[type] };
    commit({ ...state, blocks: [...(state.blocks ?? []), block] });
  },
  updateBlock: (id: string, patch: Partial<BioBlock>) => {
    commit({ ...state, blocks: (state.blocks ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  },
  removeBlock: (id: string) => {
    commit({ ...state, blocks: (state.blocks ?? []).filter((b) => b.id !== id) });
  },
  moveBlock: (id: string, dir: -1 | 1) => {
    const list = state.blocks ?? [];
    const idx = list.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    commit({ ...state, blocks: next });
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
