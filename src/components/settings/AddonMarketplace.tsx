import { Sparkles, BarChart3, Layers, Zap, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AddonDef {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADDONS: AddonDef[] = [
  { id: "x", name: "X (Twitter) add-on", description: "Unlock X publishing, analytics and inbox for every brand.", price: "$8 / mo", icon: Zap },
  { id: "advanced-analytics", name: "Advanced analytics", description: "Unlimited history, campaign dashboards and per-network deep tabs.", price: "$15 / mo", icon: BarChart3 },
  { id: "extra-brands", name: "Extra brands", description: "Add 5 more brand workspaces with their own channels and reports.", price: "$12 / mo", icon: Layers },
  { id: "extra-credits", name: "Extra AI credits", description: "Top up 1,000 creative credits that never expire.", price: "$9 one-off", icon: Sparkles },
];

/**
 * Add-on marketplace (Phase 6). Selection routes into the existing credits /
 * top-up flow — no third-party billing is wired yet.
 */
export function AddonMarketplace({ onSelect }: { onSelect?: (addon: AddonDef) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add-ons</CardTitle>
        <CardDescription>Extend your plan with capacity and premium capabilities</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {ADDONS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="rounded-xl border border-border/60 bg-card/40 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums">{a.price}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => (onSelect ? onSelect(a) : toast(`${a.name} — contact us to activate`))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
