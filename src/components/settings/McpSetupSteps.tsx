import { useState } from "react";
import { Copy, Check, Loader2, Terminal, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Integration } from "@/config/integrations";
import { getMcpServerUrl } from "@/config/integrations";
import { Link } from "react-router-dom";

interface Props {
  integration: Integration;
}

function CopyChip({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`group inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground/90 hover:bg-muted/70 transition ${className ?? ""}`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export function McpSetupSteps({ integration }: Props) {
  const serverUrl = getMcpServerUrl();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`${serverUrl}/.mcp/list-tools`, {
        headers: token
          ? { Authorization: `Bearer ${token}`, Accept: "application/json, text/event-stream" }
          : { Accept: "application/json, text/event-stream" },
      });
      if (!res.ok) {
        setTestResult({ ok: false, error: `HTTP ${res.status}` });
      } else {
        const json = await res.json().catch(() => null);
        const tools = json?.tools ?? json?.result?.tools ?? [];
        setTestResult({ ok: true, count: Array.isArray(tools) ? tools.length : undefined });
        toast.success("MCP server reachable");
      }
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message ?? "Network error" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Setup</h3>
        <ol className="space-y-4">
          {integration.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center border border-primary/25">
                {i + 1}
              </div>
              <div className="flex-1 space-y-2 pt-0.5">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>

                {i === 1 && (
                  <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Server Name</span>
                      <CopyChip value={integration.serverName} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Transport</span>
                      <Badge variant="secondary" className="uppercase text-[10px]">{integration.transport}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Server URL</span>
                      <CopyChip value={serverUrl} className="max-w-[280px]" />
                    </div>
                  </div>
                )}

                {i === 2 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link to="/dashboard/settings/connected">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Manage access
                      </Link>
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8" onClick={testConnection} disabled={testing}>
                      {testing ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Test connection
                    </Button>
                    {testResult && (
                      <span className={`text-xs font-medium ${testResult.ok ? "text-emerald-500" : "text-destructive"}`}>
                        {testResult.ok
                          ? `Live · ${testResult.count ?? "?"} tools`
                          : `Failed · ${testResult.error}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {integration.cli && integration.cli.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" /> CLI install
          </h3>
          <div className="space-y-2">
            {integration.cli.map((c) => (
              <div key={c.label} className="rounded-xl border border-border/60 bg-card/60 p-3">
                <div className="text-xs text-muted-foreground mb-1.5">{c.label}</div>
                <CopyChip value={c.command.replace("{SERVER_URL}", serverUrl)} className="w-full justify-between" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Try it out</h3>
        <p className="text-sm text-muted-foreground">Copy any of these example prompts to get started:</p>
        <div className="space-y-2">
          {integration.prompts.map((p) => (
            <CopyChip key={p} value={p} className="w-full justify-between !font-sans" />
          ))}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed border-t border-border/50 pt-4">
        Disclaimer: This integration uses large language models (LLMs) to generate responses.
        Responses may occasionally be inaccurate or incomplete. Always verify important details before taking action.
      </p>
    </div>
  );
}

export default McpSetupSteps;
