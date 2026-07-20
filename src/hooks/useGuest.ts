import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const KEY = "smmpilot:guest";
const EVT = "smmpilot:guest-changed";

export function enableGuest() {
  localStorage.setItem(KEY, "1");
  window.dispatchEvent(new Event(EVT));
}

export function disableGuest() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function isGuestSession() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Global write-guard for the demo/guest session. Returns true when the caller
 * is allowed to proceed. When in guest mode, shows a toast and returns false.
 */
export function guardWrite(action = "save changes"): boolean {
  if (!isGuestSession()) return true;
  toast.info("Demo mode", {
    description: `Sign in to ${action}. Guest sessions are read-only.`,
    action: {
      label: "Sign up",
      onClick: () => {
        window.location.href = "/signup";
      },
    },
  });
  return false;
}

export function useGuest() {
  const [guest, setGuest] = useState<boolean>(() => isGuestSession());

  useEffect(() => {
    const sync = () => setGuest(isGuestSession());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const guard = useCallback((action?: string) => guardWrite(action), []);

  return { isGuest: guest, guardWrite: guard, enableGuest, disableGuest };
}
