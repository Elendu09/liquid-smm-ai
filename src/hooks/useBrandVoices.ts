import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createRemoteCollection } from "./_remoteCollection";

export type PlatformKey =
  | "instagram" | "tiktok" | "twitter" | "facebook" | "linkedin";

export interface PlatformOverride {
  tone?: string;
  length?: "short" | "medium" | "long";
  emojis?: "none" | "minimal" | "expressive";
  extraDos?: string[];
  extraDonts?: string[];
  notes?: string;
}

export interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  audience: string;
  emojis: "none" | "minimal" | "expressive";
  length: "short" | "medium" | "long";
  dos: string[];
  donts: string[];
  samples: string[];
  createdAt: string;
  isDefault?: boolean;
  isActive?: boolean;
  platformOverrides?: Partial<Record<PlatformKey, PlatformOverride>>;
}

export const PLATFORM_KEYS: PlatformKey[] = ["instagram","tiktok","twitter","facebook","linkedin"];
export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  instagram: "Instagram", tiktok: "TikTok", twitter: "X", facebook: "Facebook", linkedin: "LinkedIn",
};

export const DEFAULT_VOICES: BrandVoice[] = [
  {
    id: "voice-default", name: "Balanced",
    tone: "friendly, clear, confident",
    audience: "general audience",
    emojis: "minimal", length: "medium",
    dos: ["Lead with the hook", "Use plain language"],
    donts: ["Avoid corporate jargon", "No hard sell"],
    samples: ["Behind the scenes 🎥 Our studio today", "3 tips that doubled our saves"], createdAt: new Date().toISOString(), isDefault: true,
  },
  {
    id: "voice-bold", name: "Bold & Punchy",
    tone: "bold, punchy, energetic",
    audience: "creators & founders",
    emojis: "expressive", length: "short",
    dos: ["Hook in 5 words", "Use strong verbs"],
    donts: ["No long sentences", "No hedging"],
    samples: ["This launch will break the feed 🚀", "Steal this hook →"], createdAt: new Date().toISOString(), isDefault: false,
    platformOverrides: { instagram: { tone: "punchy for Reels", length: "short", emojis: "expressive" }, linkedin: { tone: "professional concise", emojis: "none" } }
  },
  {
    id: "voice-friendly", name: "Friendly Guide",
    tone: "warm, helpful, approachable",
    audience: "small brands & shops",
    emojis: "minimal", length: "medium",
    dos: ["Add a question", "Give one clear CTA"],
    donts: ["No jargon", "No pushy sales"],
    samples: ["Quick Q: which cover do you prefer? 👇", "Save this for your next launch"], createdAt: new Date().toISOString(), isDefault: false,
  },
];

type Row = {
  id: string; name: string; tone: string; audience: string;
  emojis: BrandVoice["emojis"]; length: BrandVoice["length"];
  dos: string[]; donts: string[]; samples: string[];
  is_default: boolean; is_active: boolean;
  platform_overrides: Partial<Record<PlatformKey, PlatformOverride>>;
  created_at: string;
};

const store = createRemoteCollection<BrandVoice, Row>({
  table: "brand_voices",
  localKey: "smmpilot:create:brand-voices",
  seed: DEFAULT_VOICES,
  orderBy: { column: "created_at", ascending: true },
  fromRow: (r) => ({
    id: r.id, name: r.name, tone: r.tone, audience: r.audience,
    emojis: r.emojis, length: r.length,
    dos: r.dos ?? [], donts: r.donts ?? [], samples: r.samples ?? [],
    createdAt: r.created_at, isDefault: r.is_default, isActive: r.is_active,
    platformOverrides: r.platform_overrides ?? undefined,
  }),
  toInsertRow: (v, userId) => ({
    id: v.id, user_id: userId, name: v.name, tone: v.tone, audience: v.audience,
    emojis: v.emojis, length: v.length, dos: v.dos, donts: v.donts, samples: v.samples,
    is_default: !!v.isDefault, is_active: !!v.isActive,
    platform_overrides: v.platformOverrides ?? {},
    created_at: v.createdAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.name = p.name;
    if (p.tone !== undefined) r.tone = p.tone;
    if (p.audience !== undefined) r.audience = p.audience;
    if (p.emojis !== undefined) r.emojis = p.emojis;
    if (p.length !== undefined) r.length = p.length;
    if (p.dos !== undefined) r.dos = p.dos;
    if (p.donts !== undefined) r.donts = p.donts;
    if (p.samples !== undefined) r.samples = p.samples;
    if (p.isDefault !== undefined) r.is_default = p.isDefault;
    if (p.isActive !== undefined) r.is_active = p.isActive;
    if (p.platformOverrides !== undefined) r.platform_overrides = p.platformOverrides ?? {};
    return r;
  },
});

const ACTIVE_LOCAL = "smmpilot:brand-voice-active";

export function useBrandVoices() {
  const items = store.useItems();

  const setItems = useCallback((updater: (prev: BrandVoice[]) => BrandVoice[]) => {
    store.replace(updater(store.read()));
  }, []);

  const setActive = useCallback((id: string) => {
    // Optimistically flip local flag + persist selection.
    try { localStorage.setItem(ACTIVE_LOCAL, id); } catch { /* noop */ }
    const next = store.read().map((v) => ({ ...v, isActive: v.id === id }));
    store.replace(next);
    // Server: clear others, set target.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await supabase.from("brand_voices").update({ is_active: false }).eq("user_id", data.session.user.id);
      await supabase.from("brand_voices").update({ is_active: true }).eq("id", id);
    })();
  }, []);

  const active = useMemo(() => {
    const flagged = items.find((v) => v.isActive);
    if (flagged) return flagged;
    const localId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_LOCAL) : null;
    return items.find((v) => v.id === localId) ?? items.find((v) => v.isDefault) ?? items[0];
  }, [items]);

  return {
    items, setItems,
    add: (v: BrandVoice) => store.add(v),
    update: (id: string, patch: Partial<BrandVoice>) => store.update(id, patch),
    remove: (id: string) => store.remove(id),
    active, activeId: active?.id ?? null, setActive,
  };
}

/** Resolve the effective voice fields for a given platform. */
export function resolveVoiceForPlatform(
  v: BrandVoice | null | undefined,
  platform?: string,
): BrandVoice | null | undefined {
  if (!v || !platform) return v;
  const key = platform.toLowerCase() as PlatformKey;
  const o = v.platformOverrides?.[key];
  if (!o) return v;
  return {
    ...v,
    tone: o.tone?.trim() ? o.tone : v.tone,
    length: o.length ?? v.length,
    emojis: o.emojis ?? v.emojis,
    dos: [...v.dos, ...(o.extraDos ?? [])],
    donts: [...v.donts, ...(o.extraDonts ?? [])],
  };
}

export function serializeVoice(
  v: BrandVoice | null | undefined,
  platform?: string,
): string {
  if (!v) return "";
  const resolved = resolveVoiceForPlatform(v, platform)!;
  const parts = [
    `Tone: ${resolved.tone}`,
    `Audience: ${resolved.audience}`,
    `Emoji use: ${resolved.emojis}`,
    `Length: ${resolved.length}`,
  ];
  if (resolved.dos.length) parts.push(`Do: ${resolved.dos.join("; ")}`);
  if (resolved.donts.length) parts.push(`Don't: ${resolved.donts.join("; ")}`);
  const note = platform
    ? v.platformOverrides?.[platform.toLowerCase() as PlatformKey]?.notes
    : undefined;
  if (note) parts.push(`Platform note (${platform}): ${note}`);
  if (resolved.samples.length)
    parts.push(`Reference samples:\n${resolved.samples.map((s) => `- ${s}`).join("\n")}`);
  return parts.join("\n");
}
