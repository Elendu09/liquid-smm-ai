import { useState } from "react";
import { ShieldCheck, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApprovalPolicies } from "@/hooks/useApprovalPolicies";
import { ApprovalPolicyDialog } from "@/components/engage/ApprovalPolicyDialog";

export function ApprovalsPanel() {
  const { items, remove } = useApprovalPolicies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(typeof items)[number] | null>(null);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Approval workflows</CardTitle>
            <CardDescription>Chain stages, require roles, collect external magic-link approvals, and auto-expire.</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New policy</Button>
        </CardHeader>
      </Card>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-medium">No approval policies yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to require manager or client sign-off before publishing.</p>
            <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>Create policy</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((p) => (
            <Card key={p.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate flex items-center gap-2">
                      {p.name}
                      {!p.enabled && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                      {p.stages.some(s => s.requiredRole === "external") && <Badge variant="outline" className="text-[10px]">External</Badge>}
                    </CardTitle>
                    {p.description && <CardDescription className="mt-1 line-clamp-2">{p.description}</CardDescription>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}>Delete</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {p.stages.map((s, i) => (
                    <span key={s.id || i} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{i+1}</span>
                      {s.label || s.requiredRole}
                    </span>
                  ))}
                </div>
                {(p.channel && p.channel !== "any") && <p className="text-[11px] text-muted-foreground mt-2">Channel: {p.channel}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ApprovalPolicyDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} />
      <p className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" /> External approvals use magic links at <code className="rounded bg-muted px-1">/p/approve/:token</code> — no account required.</p>
    </div>
  );
}
