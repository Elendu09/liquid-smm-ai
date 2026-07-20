import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EnterBehavior = "send" | "newline";

const KEY = "smmpilot:aicmd:settings:v1";
const EVENT = "smmpilot:aicmd:settings-changed";

export interface AiCommandSettings {
  enterBehavior: EnterBehavior;
  ghostAutocomplete: boolean;
}

const DEFAULTS: AiCommandSettings = {
  enterBehavior: "send",
  ghostAutocomplete: true,
};

function readLocal(): AiCommandSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}
function writeLocal(next: AiCommandSettings) {
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

let userId: string | null = null;
let hydrated = false;

async function hydrateFromRemote(setState: (s: AiCommandSettings) => void) {
  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  if (!userId) { hydrated = true; return; }
  const { data: row } = await supabase
    .from("ai_command_settings")
    .select("enter_behavior, ghost_autocomplete")
    .eq("user_id", userId)
    .maybeSingle();
  hydrated = true;
  if (row) {
    const next: AiCommandSettings = {
      enterBehavior: (row.enter_behavior as EnterBehavior) ?? DEFAULTS.enterBehavior,
      ghostAutocomplete: row.ghost_autocomplete ?? DEFAULTS.ghostAutocomplete,
    };
    writeLocal(next);
    setState(next);
  }
}

export function useAiCommandSettings() {
  const [settings, setSettingsState] = useState<AiCommandSettings>(readLocal);

  useEffect(() => {
    if (!hydrated) void hydrateFromRemote(setSettingsState);
    const handler = () => setSettingsState(readLocal());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      userId = session?.user?.id ?? null;
      hydrated = false;
      void hydrateFromRemote(setSettingsState);
    });
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
      sub.subscription.unsubscribe();
    };
  }, []);

  const update = (patch: Partial<AiCommandSettings>) => {
    const next = { ...readLocal(), ...patch };
    writeLocal(next);
    setSettingsState(next);
    if (userId) {
      void supabase.from("ai_command_settings").upsert(
        {
          user_id: userId,
          enter_behavior: next.enterBehavior,
          ghost_autocomplete: next.ghostAutocomplete,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
  };

  return { settings, update };
}
