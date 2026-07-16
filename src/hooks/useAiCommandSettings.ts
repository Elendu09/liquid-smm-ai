import { useEffect, useState } from "react";

/**
 * User-tunable settings for the AI Command Bar.
 * Persisted to localStorage so preferences survive reloads.
 */

export type EnterBehavior = "send" | "newline";

const KEY = "smmpilot:aicmd:settings:v1";

export interface AiCommandSettings {
  /** Enter=send (Shift+Enter=newline) OR Enter=newline (Cmd/Ctrl+Enter=send). */
  enterBehavior: EnterBehavior;
  /** Show live ghost-text autocomplete for slash command labels. */
  ghostAutocomplete: boolean;
}

const DEFAULTS: AiCommandSettings = {
  enterBehavior: "send",
  ghostAutocomplete: true,
};

function read(): AiCommandSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

const EVENT = "smmpilot:aicmd:settings-changed";

export function useAiCommandSettings() {
  const [settings, setSettingsState] = useState<AiCommandSettings>(read);

  useEffect(() => {
    const handler = () => setSettingsState(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = (patch: Partial<AiCommandSettings>) => {
    const next = { ...read(), ...patch };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setSettingsState(next);
    window.dispatchEvent(new Event(EVENT));
  };

  return { settings, update };
}
