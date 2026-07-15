import { useEffect, useMemo, useState } from "react";
import { usePresets, type PlatformPreset } from "./usePresets";
import { useContentTemplates, type ContentTemplate } from "./useContentTemplates";

const KEY = (toolKey: string, platform: string) => `smmpilot:preset:${toolKey}:${platform}`;

/**
 * Returns the active preset for a given (toolKey, platform) pair.
 * Selection order: explicitly picked (sessionStorage) → user default → first available.
 * Also exposes matching content templates and helpers to record which preset was applied.
 */
export function useActivePreset(toolKey?: string, platform?: string) {
  const { rows: presets, defaultPreset } = usePresets(toolKey, platform);
  const { rows: templates } = useContentTemplates(toolKey, platform);

  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!toolKey || !platform) return;
    try {
      const raw = sessionStorage.getItem(KEY(toolKey, platform));
      setPickedId(raw);
    } catch {
      setPickedId(null);
    }
    const sync = () => {
      try {
        setPickedId(sessionStorage.getItem(KEY(toolKey, platform)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("smmpilot:preset-change", sync);
    return () => window.removeEventListener("smmpilot:preset-change", sync);
  }, [toolKey, platform]);

  const preset: PlatformPreset | undefined = useMemo(() => {
    if (pickedId) {
      const found = presets.find((p) => p.id === pickedId);
      if (found) return found;
    }
    return defaultPreset ?? presets[0];
  }, [pickedId, presets, defaultPreset]);

  const template: ContentTemplate | undefined = templates[0];

  const tone = (preset?.config?.tone as string) ?? "professional";
  const cta = (preset?.config?.cta as string) ?? "";
  const emojiLevel = (preset?.config?.emojiLevel as string) ?? "medium";
  const hashtagCount = (preset?.config?.hashtagCount as number) ?? 8;

  const setActivePreset = (id: string) => {
    if (!toolKey || !platform) return;
    try {
      sessionStorage.setItem(KEY(toolKey, platform), id);
      window.dispatchEvent(new Event("smmpilot:preset-change"));
    } catch {
      /* ignore */
    }
  };

  return {
    preset,
    presets,
    template,
    templates,
    tone,
    cta,
    emojiLevel,
    hashtagCount,
    presetName: preset?.name,
    setActivePreset,
  };
}
