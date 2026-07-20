import { Link, useParams, Navigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getIntegration } from "@/config/integrations";
import { McpSetupSteps } from "@/components/settings/McpSetupSteps";

export default function IntegrationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const integration = slug ? getIntegration(slug) : undefined;

  if (!integration) return <Navigate to="/dashboard/settings/integrations" replace />;

  const Icon = integration.icon;

  return (
    <div className="max-w-3xl space-y-8">
      <Link
        to="/dashboard/settings/integrations"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Integrations
      </Link>

      <header className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${integration.accent}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{integration.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{integration.tagline}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6">
        <McpSetupSteps integration={integration} />
      </div>
    </div>
  );
}
