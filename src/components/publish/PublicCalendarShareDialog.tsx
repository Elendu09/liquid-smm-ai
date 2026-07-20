import { useMemo, useState } from "react";
import { Copy, Link2, Eye, RefreshCw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ShareConfig {
  token: string;
  showDrafts: boolean;
  showAnalytics: boolean;
  createdAt: string;
}

const KEY = "smmpilot:calendar-share";

function read(): ShareConfig | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function write(cfg: ShareConfig | null) {
  if (cfg) localStorage.setItem(KEY, JSON.stringify(cfg));
  else localStorage.removeItem(KEY);
}

/**
 * View-only public share link for the content calendar. Generates a token,
 * scopes what's exposed, and lets the user rotate or revoke access at will.
 */
export function PublicCalendarShareDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [cfg, setCfg] = useState<ShareConfig | null>(() => read());

  const publicUrl = useMemo(() => {
    if (!cfg) return "";
    return `${window.location.origin}/public/calendar/${cfg.token}`;
  }, [cfg]);

  const create = () => {
    const next: ShareConfig = {
      token: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      showDrafts: false,
      showAnalytics: false,
      createdAt: new Date().toISOString(),
    };
    write(next);
    setCfg(next);
    toast.success("Share link created");
  };
  const rotate = () => { create(); toast.success("Link rotated — old URL revoked"); };
  const revoke = () => { write(null); setCfg(null); toast.success("Share link revoked"); };
  const update = (patch: Partial<ShareConfig>) => {
    if (!cfg) return;
    const next = { ...cfg, ...patch };
    write(next); setCfg(next);
  };
  const copy = () => { navigator.clipboard.writeText(publicUrl); toast.success("Copied"); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Share calendar</DialogTitle>
          <DialogDescription>Give clients a read-only view without a seat.</DialogDescription>
        </DialogHeader>

        {!cfg ? (
          <div className="text-center py-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Eye className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">No share link yet. Create one to share your calendar publicly.</p>
            <Button onClick={create}><Link2 className="h-4 w-4 mr-1.5" /> Create share link</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Public URL</Label>
              <div className="flex gap-1.5">
                <Input readOnly value={publicUrl} className="text-xs font-mono" />
                <Button size="icon" variant="outline" onClick={copy} aria-label="Copy"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show drafts</p>
                  <p className="text-[11px] text-muted-foreground">Include unpublished ideas</p>
                </div>
                <Switch checked={cfg.showDrafts} onCheckedChange={(v) => update({ showDrafts: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show analytics</p>
                  <p className="text-[11px] text-muted-foreground">Include post performance metrics</p>
                </div>
                <Switch checked={cfg.showAnalytics} onCheckedChange={(v) => update({ showAnalytics: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={rotate}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Rotate link
              </Button>
              <Button variant="ghost" size="sm" onClick={revoke} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Revoke
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
