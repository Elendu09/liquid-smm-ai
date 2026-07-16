import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Copy, RefreshCw, Terminal, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import type { McpActivityEntry } from "@/hooks/useMcpActivity";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: McpActivityEntry | null;
  onRerun: (e: McpActivityEntry) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  error: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
};

export function McpCallDetailsDrawer({ open, onOpenChange, entry, onRerun, onDelete }: Props) {
  if (!entry) return null;
  const payloadStr = JSON.stringify(entry.payload ?? {}, null, 2);

  const copyPayload = () => {
    navigator.clipboard.writeText(payloadStr);
    toast.success("Payload copied");
  };

  const copyAsPrompt = () => {
    const prompt = `Please run the MCP tool "${entry.tool}" with these arguments:\n\n${payloadStr}\n\nContext: ${entry.summary}`;
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied — paste into ChatGPT or Claude");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {entry.tool}
                </Badge>
              </SheetTitle>
              <SheetDescription className="text-left mt-1">
                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={STATUS_STYLES[entry.status]}>
              {entry.status}
            </Badge>
            <Badge variant="secondary">{new Date(entry.timestamp).toLocaleString()}</Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Summary
            </p>
            <p className="text-sm mt-1">{entry.summary}</p>
          </div>

          {entry.resources && entry.resources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Affected resources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.resources.map((r) =>
                  r.href ? (
                    <Link
                      key={`${r.kind}:${r.id}`}
                      to={r.href}
                      className="text-xs px-2 py-1 rounded border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
                    >
                      {r.kind} · {r.label}
                    </Link>
                  ) : (
                    <span
                      key={`${r.kind}:${r.id}`}
                      className="text-xs px-2 py-1 rounded border border-border/60 text-muted-foreground bg-muted/40"
                    >
                      {r.kind} · {r.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Payload
              </p>
              <Button size="sm" variant="ghost" className="h-7" onClick={copyPayload}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
              </Button>
            </div>
            <pre className="text-[11px] leading-relaxed overflow-x-auto p-3 rounded-lg border bg-muted/30 text-muted-foreground">
              {payloadStr}
            </pre>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => {
              onRerun(entry);
              onOpenChange(false);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run
          </Button>
          <Button variant="outline" className="w-full" onClick={copyAsPrompt}>
            <Copy className="h-4 w-4 mr-2" />
            Copy as prompt
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => {
              onDelete(entry.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete entry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
