import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Plus, Link as LinkIcon, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, ChevronDown } from "lucide-react";
import {
  type CustomReport,
  type RangeKey,
  RANGE_DAYS,
  REPORT_TEMPLATES,
} from "@/hooks/useCustomReports";
import { cn } from "@/lib/utils";

const RANGES: RangeKey[] = ["7d", "14d", "30d", "90d"];

export function ReportHeader({
  reports,
  activeId,
  onSelect,
  onCreate,
  onCreateFromTemplate,
  onDuplicate,
  onDelete,
  onRename,
  onRangeChange,
  onCopyLink,
  onExportPng,
}: {
  reports: CustomReport[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onRangeChange: (r: RangeKey) => void;
  onCopyLink: () => void;
  onExportPng: () => void;
}) {
  const active = reports.find((r) => r.id === activeId) ?? null;
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);

  const doCopyLink = () => {
    onCopyLink();
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs truncate max-w-[160px]">{active?.name ?? "Choose report"}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Saved reports
          </DropdownMenuLabel>
          {reports.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground">No reports yet.</div>
          )}
          {reports.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => onSelect(r.id)}
              className="flex items-center justify-between gap-2"
            >
              <span className={cn("truncate text-xs", r.id === activeId && "text-primary font-medium")}>
                {r.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{r.cards.length} cards</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="flex items-center gap-1 p-1">
            <Input
              placeholder="Name new report"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onCreate(newName.trim());
                  setNewName("");
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={!newName.trim()}
              onClick={() => { onCreate(newName.trim()); setNewName(""); }}
              aria-label="Create report"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {active && (
        <Input
          value={active.name}
          onChange={(e) => onRename(e.target.value)}
          className="h-8 text-xs max-w-[220px] bg-transparent border-dashed"
          placeholder="Rename report"
        />
      )}

      <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-card/40 p-0.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={cn(
              "text-[11px] px-2 py-1 rounded transition-colors",
              active?.range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {RANGE_DAYS[r]}d
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={doCopyLink} disabled={!active}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
          <span className="text-xs">{copied ? "Copied" : "Share"}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onExportPng} disabled={!active}>
          <Download className="h-3.5 w-3.5" />
          <span className="text-xs">PNG</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onDuplicate} disabled={!active}>
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs">Duplicate</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={onDelete}
          disabled={!active || reports.length <= 1}
          aria-label="Delete report"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
