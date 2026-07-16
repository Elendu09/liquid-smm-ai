import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Clock, RefreshCw, Trash2, Copy, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StatusItem } from "@/components/dashboard/shell";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  run: StatusItem | null;
  onRerun: (run: StatusItem) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
};

export function RunDetailsDrawer({ open, onOpenChange, run, onRerun, onDelete }: Props) {
  if (!run) return null;
  const created = new Date(run.createdAt);

  const copyId = () => {
    navigator.clipboard.writeText(run.id);
    toast.success("Run ID copied");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left truncate">{run.title}</SheetTitle>
              <SheetDescription className="text-left">
                {run.subtitle ?? "Automation run"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={STATUS_STYLES[run.status ?? "pending"]}>
              {run.status ?? "pending"}
            </Badge>
            <Badge variant="outline">{formatDistanceToNow(created, { addSuffix: true })}</Badge>
            {run.meta && <Badge variant="secondary">{run.meta}</Badge>}
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Started
              </p>
              <p className="mt-1">{created.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Run ID
              </p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                  {run.id}
                </code>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyId}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {run.subtitle && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Context
                </p>
                <p className="mt-1 text-muted-foreground">{run.subtitle}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Payload</p>
            <pre className="overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify(
  {
    id: run.id,
    title: run.title,
    subtitle: run.subtitle,
    status: run.status,
    meta: run.meta,
    createdAt: run.createdAt,
  },
  null,
  2,
)}
            </pre>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => {
              onRerun(run);
              onOpenChange(false);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(run.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
