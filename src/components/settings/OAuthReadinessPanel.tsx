import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, KeyRound, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProviderStatus {
  platform: string;
  displayName: string;
  enabled: boolean;
  scopes: string[];
  requiredSecrets: string[];
}

const DOCS: Record<string, string> = {
  twitter: "https://developer.x.com/en/portal/dashboard",
  linkedin: "https://www.linkedin.com/developers/apps",
  facebook: "https://developers.facebook.com/apps",
  instagram: "https://developers.facebook.com/apps",
  tiktok: "https://developers.tiktok.com/apps",
  youtube: "https://console.cloud.google.com/apis/credentials",
  pinterest: "https://developers.pinterest.com/apps",
  reddit: "https://www.reddit.com/prefs/apps",
};

export function OAuthReadinessPanel() {
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${base}/functions/v1/oauth-status`);
      const data = await res.json();
      setProviders(data.providers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const readyCount = providers?.filter((p) => p.enabled).length ?? 0;
  const total = providers?.length ?? 0;
  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-callback`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            OAuth provider readiness
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {readyCount}/{total} providers configured. Add credentials in project secrets to enable real publishing.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/40 border border-border/60 text-xs">
          <KeyRound className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Callback URL for every provider console:</p>
            <code className="block mt-1 text-[11px] text-muted-foreground break-all font-mono">
              {callbackUrl}
            </code>
          </div>
        </div>

        {error && (
          <div className="text-xs text-destructive p-2 rounded bg-destructive/5 border border-destructive/30">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {providers?.map((p) => (
            <div
              key={p.platform}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                p.enabled
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-secondary/30 border-border/60",
              )}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-background border border-border/60 flex-shrink-0">
                <PlatformIcon platform={p.platform} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{p.displayName}</span>
                  {p.enabled ? (
                    <Badge className="h-4 px-1.5 text-[9px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] gap-1">
                      <XCircle className="h-2.5 w-2.5" /> Missing keys
                    </Badge>
                  )}
                </div>
                {!p.enabled && p.requiredSecrets.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.requiredSecrets.map((s) => (
                      <code
                        key={s}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                      >
                        {s}
                      </code>
                    ))}
                  </div>
                )}
                {DOCS[p.platform] && (
                  <a
                    href={DOCS[p.platform]}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    Developer console <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
          {!providers && loading && (
            <div className="col-span-full text-center text-xs text-muted-foreground py-6">
              Loading provider status…
            </div>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground pt-1">
          Once credentials are saved in project secrets, the corresponding provider flips to <span className="text-emerald-600 font-medium">Ready</span> and the Connect dialog will start the real OAuth handshake automatically.
        </div>
      </CardContent>
    </Card>
  );
}

export default OAuthReadinessPanel;
