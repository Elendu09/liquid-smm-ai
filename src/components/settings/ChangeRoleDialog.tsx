import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type MemberRole = "admin" | "editor" | "viewer";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName?: string;
  currentRole?: MemberRole;
  onSave: (role: MemberRole) => void;
}

const OPTIONS: {
  value: MemberRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "admin", label: "Admin", description: "Full workspace access including billing and members.", icon: Shield },
  { value: "editor", label: "Editor", description: "Create, edit, and schedule content and automations.", icon: Pencil },
  { value: "viewer", label: "Viewer", description: "Read-only access to dashboards and analytics.", icon: Eye },
];

export function ChangeRoleDialog({
  open,
  onOpenChange,
  memberName,
  currentRole = "editor",
  onSave,
}: ChangeRoleDialogProps) {
  const [role, setRole] = useState<MemberRole>(currentRole);

  useEffect(() => {
    if (open) setRole(currentRole);
  }, [open, currentRole]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change role{memberName ? ` · ${memberName}` : ""}</DialogTitle>
          <DialogDescription>
            Update what this member can access across the workspace.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={role} onValueChange={(v) => setRole(v as MemberRole)} className="space-y-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = role === opt.value;
            return (
              <label
                key={opt.value}
                htmlFor={`role-${opt.value}`}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <RadioGroupItem id={`role-${opt.value}`} value={opt.value} className="mt-1" />
                <Icon className={cn("h-5 w-5 mt-0.5", active ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`role-${opt.value}`} className="font-medium cursor-pointer">
                    {opt.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(role);
              onOpenChange(false);
            }}
            disabled={role === currentRole}
          >
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
