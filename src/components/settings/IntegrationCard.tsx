import { Link } from "react-router-dom";
import { ArrowUpRight, Circle } from "lucide-react";
import type { Integration } from "@/config/integrations";
import { useIntegrationSettings, timeAgo } from "@/hooks/useIntegrationSettings";

interface Props {
  integration: Integration;
  connected?: boolean;
}

export function IntegrationCard({ integration, connected }: Props) {
  const Icon = integration.icon;
  const { get } = useIntegrationSettings();
  const s = get(integration.slug);
  const used = timeAgo(s.lastUsedAt);
  const showConnected = connected || s.lastStatus === "ok";

  return (
    <Link
      to={`/dashboard/settings/integrations/${integration.slug}`}
      className="group relative flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 hover:border-primary/40 hover:bg-card transition-all hover:-translate-y-0.5"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${integration.accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground truncate">{integration.name}</h3>
          {showConnected && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              Connected
            </span>
          )}
          {!s.enabled && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
              Disabled
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">
          {integration.tagline}
        </p>
        {used && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
            <Circle
              className={`w-2 h-2 fill-current ${s.lastStatus === "ok" ? "text-emerald-500" : "text-destructive"}`}
              strokeWidth={0}
            />
            Last used {used}
            {typeof s.toolCount === "number" && ` · ${s.toolCount} tools`}
          </div>
        )}
      </div>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}

export default IntegrationCard;
