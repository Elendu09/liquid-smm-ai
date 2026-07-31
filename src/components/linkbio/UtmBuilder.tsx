import { useMemo, useState } from "react";
import { Copy, Link2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { safeHref } from "@/lib/safeUrl";

const PRESETS: { label: string; source: string; medium: string }[] = [
  { label: "Instagram bio", source: "instagram", medium: "bio" },
  { label: "TikTok bio", source: "tiktok", medium: "bio" },
  { label: "X post", source: "twitter", medium: "social" },
  { label: "LinkedIn post", source: "linkedin", medium: "social" },
  { label: "Newsletter", source: "newsletter", medium: "email" },
];

/**
 * SmartLinks UTM builder — composes campaign-tagged destination URLs for any
 * link-in-bio button so click attribution shows up in downstream analytics.
 */
export function UtmBuilder({ defaultUrl = "" }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("bio");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const tagged = useMemo(() => {
    const base = safeHref(url.trim());
    if (!base) return "";
    try {
      const u = new URL(base);
      const set = (k: string, v: string) => v.trim() && u.searchParams.set(k, v.trim());
      set("utm_source", source);
      set("utm_medium", medium);
      set("utm_campaign", campaign);
      set("utm_content", content);
      set("utm_term", term);
      return u.toString();
    } catch {
      return "";
    }
  }, [url, source, medium, campaign, content, term]);

  const copy = async () => {
    if (!tagged) return;
    await navigator.clipboard.writeText(tagged);
    setCopied(true);
    toast.success("Tagged link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-primary" />
          UTM builder
        </CardTitle>
        <CardDescription>Tag SmartLinks so every click is attributed in your analytics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Destination URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/offer" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setSource(p.source); setMedium(p.medium); }}
              className="px-2.5 py-1 rounded-full border border-border/60 bg-muted/50 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Source", source, setSource, "instagram"],
            ["Medium", medium, setMedium, "bio"],
            ["Campaign", campaign, setCampaign, "spring-launch"],
            ["Content", content, setContent, "button-1"],
            ["Term", term, setTerm, "optional keyword"],
          ].map(([label, val, setter, ph]) => (
            <div key={label as string} className="space-y-1.5">
              <Label className="text-xs">{label as string}</Label>
              <Input
                value={val as string}
                placeholder={ph as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Tagged link</p>
          <p className="text-xs break-all text-foreground/90">{tagged || "Enter a valid https:// URL to preview"}</p>
        </div>

        <Button size="sm" className="h-8" disabled={!tagged} onClick={() => void copy()}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          Copy tagged link
        </Button>
      </CardContent>
    </Card>
  );
}
