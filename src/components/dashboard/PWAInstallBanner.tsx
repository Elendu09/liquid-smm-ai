import { Download, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

/**
 * Slim banner that surfaces the browser's PWA install prompt plus a
 * one-tap push notification permission for approvals & mentions.
 */
export function PWAInstallBanner() {
  const { canInstall, install, dismiss, pushPermission, enablePush } = usePWAInstall();

  const showInstall = canInstall;
  const showPush = pushPermission === "default";
  if (!showInstall && !showPush) return null;

  return (
    <div className="relative rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden">
      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        {showInstall ? <Download className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-primary/80 font-semibold mb-0.5">
          {showInstall ? "Install app" : "Enable push"}
        </p>
        <h4 className="text-sm font-semibold leading-tight">
          {showInstall ? "Get one-tap access on your device" : "Never miss an approval or mention"}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {showInstall
            ? "Install as an app for full-screen speed and offline drafts."
            : "Turn on browser push to get notified in real time."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showInstall ? (
          <Button size="sm" onClick={async () => {
            const r = await install();
            if (r === "accepted") toast.success("App installed");
          }}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Install
          </Button>
        ) : (
          <Button size="sm" onClick={async () => {
            const r = await enablePush();
            if (r === "denied") toast.error("Push blocked — enable in browser settings");
          }}>
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable push
          </Button>
        )}
        <button
          onClick={dismiss}
          className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
