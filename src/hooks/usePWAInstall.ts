import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "smmpilot:pwa-install-dismissed";
const PUSH_KEY = "smmpilot:push-enabled";

/**
 * Wraps the `beforeinstallprompt` event so we can show a branded install
 * banner, plus a helper to request the Notification permission used for
 * approval + mention pushes.
 */
export function usePWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  };

  const dismiss = () => {
    setDismissed(true);
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
  };

  const enablePush = async () => {
    if (typeof Notification === "undefined") return "unsupported" as const;
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      try { window.localStorage.setItem(PUSH_KEY, "1"); } catch { /* noop */ }
      new Notification("Notifications enabled", {
        body: "You'll get pings for approvals & mentions.",
        icon: "/placeholder.svg",
      });
    }
    return perm;
  };

  return {
    canInstall: !!deferred && !installed && !dismissed,
    installed,
    install,
    dismiss,
    pushPermission,
    enablePush,
  };
}
