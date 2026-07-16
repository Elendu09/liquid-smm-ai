import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface CommentFilters {
  platform: string;
  sentiment: string;
  status: string;
}

export const DEFAULT_FILTERS: CommentFilters = { platform: "all", sentiment: "all", status: "all" };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CommentFilters;
  onApply: (f: CommentFilters) => void;
  platforms: string[];
}

export function FilterDialog({ open, onOpenChange, initial, onApply, platforms }: Props) {
  const [f, setF] = useState<CommentFilters>(initial);

  useEffect(() => { if (open) setF(initial); }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Filter comments</DialogTitle>
          <DialogDescription>Narrow the queue by platform, sentiment, or status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Platform</Label>
            <Select value={f.platform} onValueChange={(v) => setF((p) => ({ ...p, platform: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sentiment</Label>
            <Select value={f.sentiment} onValueChange={(v) => setF((p) => ({ ...p, sentiment: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending reply</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onApply(DEFAULT_FILTERS); onOpenChange(false); }}>Reset</Button>
          <Button onClick={() => { onApply(f); onOpenChange(false); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
