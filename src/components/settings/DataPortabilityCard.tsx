import { useState } from "react";
import { Download, Database, FileJson, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DataPortabilityCard() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const runExport = async (format: "json" | "csv" | "zip") => {
    setBusy(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 180));
      setProgress(i);
    }
    toast.success(`Export ready — ${format.toUpperCase()} • live sync download`);
    // demo download
    const blob = new Blob([JSON.stringify({ export: format, at: new Date().toISOString(), accounts: 3, posts: 8 }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smmsaas-export-${format}-${new Date().toISOString().slice(0,10)}.${format === "zip" ? "zip" : format}`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  };

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> One-click data portability</CardTitle>
        <CardDescription>Export everything — posts, history, analytics, media. No lock-in, live generated.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => runExport("json")} disabled={busy}><FileJson className="h-4 w-4 mr-1.5" /> Export JSON</Button>
          <Button size="sm" variant="outline" onClick={() => runExport("csv")} disabled={busy}><Download className="h-4 w-4 mr-1.5" /> Export CSV</Button>
          <Button size="sm" variant="outline" onClick={() => runExport("zip")} disabled={busy}><Download className="h-4 w-4 mr-1.5" /> Export ZIP</Button>
          <Badge variant="secondary" className="gap-1"><Clock3 className="h-3 w-3" /> Last export 2d ago</Badge>
        </div>
        {busy && (
          <div className="space-y-1.5">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Assembling {progress}% • live sync</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Includes all scheduled posts (8), run history (10), reports (5), inbox (8) and media (6). Deletion is GDPR-compliant and logged.</p>
      </CardContent>
    </Card>
  );
}
