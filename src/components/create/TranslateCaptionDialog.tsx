import { useState } from "react";
import { toast } from "sonner";
import { Languages, Loader2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiCreate } from "@/hooks/useAiCreate";

const LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian",
  "Japanese", "Korean", "Chinese", "Arabic", "Hindi",
  "Dutch", "Polish", "Turkish", "Russian",
];

export function TranslateCaptionDialog({
  open,
  onOpenChange,
  initialText = "",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialText?: string;
}) {
  const [text, setText] = useState(initialText);
  const [lang, setLang] = useState("Spanish");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const res = await aiCreate.translate({ text, targetLanguage: lang });
    setBusy(false);
    if (res) setOutput(res.translated);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" strokeWidth={1.75} /> Translate caption
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Source</label>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste caption…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Target language</label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={busy || !text.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Languages className="h-4 w-4 mr-2" />}
            Translate
          </Button>
          {output && (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Result</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={copy}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{output}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
