import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, ExternalLink, Link as LinkIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import {
  downscaleForLibrary,
  readAsDataUrl,
  type LibraryAsset,
} from "@/hooks/useImageAttachments";
import { LibraryImagePicker } from "@/components/library/LibraryImagePicker";

const YEAR = 60 * 60 * 24 * 365;

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
  className?: string;
  label?: string;
}

/** Save any uploaded media into the user's Library → Assets for reuse. */
function saveToLibrary(file: File, url: string) {
  try {
    const asset: LibraryAsset = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      subtitle: "Uploaded media",
      status: "active",
      type: file.type.startsWith("image/") ? "image" : "video",
      url,
      tags: ["imported"],
      createdAt: new Date().toISOString(),
    };
    pushLocalCollection<LibraryAsset>("library", "assets", [asset]);
  } catch {
    /* library persistence is best-effort */
  }
}

/** Image/media picker with drag & drop upload to the private post-media bucket.
 *  Every upload is also saved to Library → Assets, and a "Use from library"
 *  picker lets you reuse anything you imported before. */
export function MediaField({ value, onChange, className, label = "Media" }: Props) {
  const { config } = useWhiteLabel();
  const watermarkEnabled = !!(config as any).watermarkEnabled;
  const watermarkPos = (config as any).watermarkPosition ?? "bottom-right";
  const watermarkOpacity = (config as any).watermarkOpacity ?? 0.7;
  const watermarkSize = (config as any).watermarkSize ?? 18;
  const watermarkLogo = (config as any).watermarkLogoUrl || (config as any).logoUrl;
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Only images or videos are supported");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is larger than 15 MB");
      return;
    }
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        // Demo / signed-out: persist the image locally (downscaled) so the
        // preview survives reloads AND it lands in the user's library.
        const dataUrl = await readAsDataUrl(file);
        const libUrl = await downscaleForLibrary(dataUrl, file.type);
        onChange(libUrl);
        saveToLibrary(file, libUrl);
        toast.success("Added to media & library");
        return;
      }
      const path = `${uid}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: signed, error: sErr } = await supabase.storage
        .from("post-media")
        .createSignedUrl(path, YEAR);
      if (sErr) throw sErr;
      onChange(signed.signedUrl);
      saveToLibrary(file, signed.signedUrl);
      toast.success("Media uploaded & saved to library");
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs uppercase tracking-wide">{label}</Label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/30">
          {/\.(mp4|webm|mov)(\?|$)/i.test(value) ? (
            <video src={value} className="h-40 w-full object-cover" controls />
          ) : (
            <img src={value} alt="Post media preview" className="h-40 w-full object-cover" loading="lazy" />
          )}
          {watermarkEnabled && (
            <div
              className="absolute bg-white/90 backdrop-blur rounded-md border border-black/10 shadow-sm flex items-center gap-1 px-1.5 py-1 pointer-events-none"
              style={{
                opacity: watermarkOpacity,
                width: `${watermarkSize}%`,
                ...(watermarkPos==="top-left" ? { top: 8, left: 8 } : {}),
                ...(watermarkPos==="top-right" ? { top: 8, right: 8 } : {}),
                ...(watermarkPos==="top-center" ? { top: 8, left: "50%", transform: "translateX(-50%)" } : {}),
                ...(watermarkPos==="bottom-left" ? { bottom: 8, left: 8 } : {}),
                ...(watermarkPos==="bottom-right" ? { bottom: 8, right: 8 } : {}),
                ...(watermarkPos==="center" ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } : {}),
              } as any}
            >
              {watermarkLogo ? (
                <img src={watermarkLogo} alt="" className="h-3 w-3 object-contain" />
              ) : (
                <div className="h-3 w-3 rounded bg-primary" />
              )}
              <span className="text-[7px] font-bold truncate">{(config as any).brandName || "BRAND"}</span>
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/70 backdrop-blur"
              onClick={() => window.open(value, "_blank", "noopener")}
              aria-label="Open media in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/70 text-destructive backdrop-blur"
              onClick={() => onChange(undefined)}
              aria-label="Remove media"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "grid h-32 cursor-pointer place-items-center rounded-xl border-2 border-dashed text-center transition-colors",
            drag ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/40",
          )}
        >
          {busy ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </span>
          ) : (
            <div className="px-4">
              <ImagePlus className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm font-medium">Drop an image or click to upload</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">PNG, JPG, GIF or MP4 · up to 15 MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*,video/mp4,video/webm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="…or paste a media URL"
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
          onClick={() => setLibraryOpen(true)}
          title="Use an image from your library"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Library
        </Button>
      </div>

      <LibraryImagePicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(url) => onChange(url)}
      />
    </div>
  );
}
