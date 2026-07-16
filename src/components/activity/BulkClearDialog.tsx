import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalCount: number;
  onConfirm: (scope: "all" | "success" | "failed" | "old") => void;
}

export function BulkClearDialog({ open, onOpenChange, totalCount, onConfirm }: Props) {
  const [scope, setScope] = useState<"all" | "success" | "failed" | "old">("all");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" /> Clear activity
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choose which entries to remove. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as typeof scope)}
          className="space-y-2 py-2"
        >
          {[
            { v: "all", label: `Everything (${totalCount})` },
            { v: "success", label: "Successful runs only" },
            { v: "failed", label: "Failed runs only" },
            { v: "old", label: "Older than 7 days" },
          ].map((o) => (
            <label
              key={o.v}
              htmlFor={`scope-${o.v}`}
              className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
            >
              <RadioGroupItem id={`scope-${o.v}`} value={o.v} />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onConfirm(scope)}
          >
            Clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
