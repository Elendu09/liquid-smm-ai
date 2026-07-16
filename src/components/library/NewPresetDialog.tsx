import { useState } from "react";
import { toast } from "sonner";
import { Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pushLocalCollection } from "@/hooks/useLocalCollection";

const KINDS = ["reel", "carousel", "story", "single", "video"];

export function NewPresetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("reel");
  const [platform, setPlatform] = useState("instagram");
  const [description, setDescription] = useState("");

  const save = () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    pushLocalCollection("library", "presets", [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        subtitle: `${kind} · ${platform}${description ? " · " + description.slice(0, 40) : ""}`,
        status: "mine",
        kind,
        platform,
        description,
        createdAt: new Date().toISOString(),
      },
    ]);
    toast.success("Preset saved");
    onOpenChange(false);
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" strokeWidth={1.75} /> New preset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Preset name" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["instagram", "tiktok", "twitter", "linkedin", "youtube"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description or template body…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
