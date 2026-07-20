import { useState } from "react";
import { Copy, Check, Loader2, Terminal, ShieldCheck, ExternalLink, Rocket, Activity, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Integration } from "@/config/integrations";
import { getMcpServerUrl, MCP_TOOLS } from "@/config/integrations";
import { Link } from "react-router-dom";
import { useIntegrationSettings, timeAgo } from "@/hooks/useIntegrationSettings";
import { useMcpActivity } from "@/hooks/useMcpActivity";

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
      className={`group inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground/90 hover:bg-muted/70 transition max-w-full min-w-0 ${className ?? ""}`}
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
  const { settings, update, toggleTool, markUsed } = useIntegrationSettings(integration.slug);
  const { entries } = useMcpActivity();
  const [testing, setTesting] = useState(false);
  const s = settings!;

  const recent = entries.slice(0, 5);

  async function testConnection() {
    setTesting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`${serverUrl}/.mcp/list-tools`, {
        headers: token
          ? { Authorization: `Bearer ${token}`, Accept: "application/json, text/event-stream" }
          : { Accept: "application/json, text/event-stream" },
      });
      if (!res.ok) {
        markUsed(integration.slug, "error", { error: `HTTP ${res.status}` });
        toast.error(`Connection failed · HTTP ${res.status}`);
      } else {
        const json = await res.json().catch(() => null);
        const tools = json?.tools ?? json?.result?.tools ?? [];
        const count = Array.isArray(tools) ? tools.length : undefined;
        markUsed(integration.slug, "ok", { toolCount: count });
        toast.success(`MCP server reachable · ${count ?? "?"} tools`);
      }
    } catch (e: any) {
      markUsed(integration.slug, "error", { error: e?.message ?? "Network error" });
      toast.error(e?.message ?? "Network error");
    } finally {
      setTesting(false);
    }
  }

  const lastUsed = timeAgo(s.lastUsedAt);

  return (
    <div className="space-y-6">
      {/* Status + enable */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${s.lastStatus === "ok" ? "bg-emerald-500" : s.lastStatus === "error" ? "bg-destructive" : "bg-muted-foreground/40"}`} />
          <div>
            <p className="text-sm font-medium">
              {s.lastStatus === "ok" ? "Connected" : s.lastStatus === "error" ? "Connection error" : "Not verified yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastUsed ? `Last checked ${lastUsed}` : "Run a test to verify this integration"}
              {s.lastError && ` · ${s.lastError}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Power className="w-3.5 h-3.5" />
            <span>{s.enabled ? "Enabled" : "Disabled"}</span>
            <Switch
              checked={s.enabled}
              onCheckedChange={(v) => update(integration.slug, { enabled: v })}
            />
          </label>
        </div>
      </section>

      {/* Deep-link install */}
      {integration.deepLink && (
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">One-click install</p>
              <p className="text-xs text-muted-foreground">Open {integration.name} with the SkyRank MCP server prefilled.</p>
            </div>
          </div>
          <Button asChild size="sm" className="h-9">
            <a href={integration.deepLink(serverUrl)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Add to {integration.name}
            </a>
          </Button>
        </section>
      )}

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
                  <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground">Server Name</span>
                      <CopyChip value={integration.serverName} className="w-full sm:w-auto justify-between" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground">Transport</span>
                      <Badge variant="secondary" className="uppercase text-[10px] w-fit">{integration.transport}</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground">Server URL</span>
                      <CopyChip value={serverUrl} className="w-full sm:max-w-[280px] justify-between" />
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

      {/* Tool scopes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Tool scopes</h3>
          <span className="text-[11px] text-muted-foreground">
            {MCP_TOOLS.length - (s.disabledTools?.length ?? 0)} of {MCP_TOOLS.length} enabled
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose which tools this integration is allowed to call on your behalf. Write tools are highlighted.
        </p>
        <div className="rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/60">
          {MCP_TOOLS.map((t) => {
            const enabled = !s.disabledTools?.includes(t.name);
            return (
              <div key={t.name} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{t.label}</span>
                    {t.write && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40">
                        write
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={() => toggleTool(integration.slug, t.name)} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Activity */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Recent MCP activity
        </h3>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-xs text-muted-foreground">
            No MCP calls recorded yet. Once agents connect, their tool calls will appear here.
          </div>
        ) : (
          <ul className="rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/60">
            {recent.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-3">
                <div
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    e.status === "success" ? "bg-emerald-500" : e.status === "error" ? "bg-destructive" : "bg-amber-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{e.tool}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(e.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{e.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
