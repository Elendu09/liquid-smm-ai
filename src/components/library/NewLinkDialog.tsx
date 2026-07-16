import { useState } from "react";
import { toast } from "sonner";
import { LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushLocalCollection } from "@/hooks/useLocalCollection";

export function NewLinkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const save = () => {
    if (!title.trim() || !url.trim()) {
      toast.error("Title and URL required");
      return;
    }
    pushLocalCollection("library", "link-bio", [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        subtitle: url.trim(),
        status: "draft",
        url: url.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    toast.success("Link added");
    onOpenChange(false);
    setTitle("");
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" strokeWidth={1.75} /> New link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New drop pre-order" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
