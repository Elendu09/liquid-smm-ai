import { useCallback, useState } from "react";
import { toast } from "sonner";
import { pushLocalCollection } from "@/hooks/useLocalCollection";

export interface ImageAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

/** Shape used by the Library → Assets board. */
export interface LibraryAsset {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  type: "image" | "video" | "doc";
  url: string;
  tags: string[];
  createdAt: string;
}

const MAX_FILES = 4;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Library copies are downscaled so localStorage stays comfortably small. */
const LIBRARY_MAX_EDGE = 1280;
const LIBRARY_MAX_BYTES = 1.5 * 1024 * 1024;

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale an image data URL so library copies don't blow the localStorage
 * quota. Animated GIFs are kept untouched.
 */
export function downscaleForLibrary(dataUrl: string, mime: string): Promise<string> {
  return new Promise((resolve) => {
    if (mime === "image/gif" || dataUrl.length < 200_000) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, LIBRARY_MAX_EDGE / Math.max(img.width, img.height));
        if (scale >= 1) {
          resolve(dataUrl);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function useImageAttachments() {
  const [items, setItems] = useState<ImageAttachment[]>([]);

  const add = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f && f.size > 0);
    if (!arr.length) return;
    const results: ImageAttachment[] = [];
    for (const f of arr) {
      if (!ACCEPTED.has(f.type)) {
        toast.error(`${f.name}: unsupported type`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: over 8 MB`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(f);
        results.push({ id: crypto.randomUUID(), name: f.name, mime: f.type, size: f.size, dataUrl });
      } catch {
        toast.error(`${f.name}: failed to read`);
      }
    }
    if (!results.length) return;
    setItems((prev) => {
      const next = [...prev, ...results];
      if (next.length > MAX_FILES) {
        toast.error(`Max ${MAX_FILES} images — extra dropped`);
        return next.slice(0, MAX_FILES);
      }
      return next;
    });

    // Every imported image is also saved to the user's Library → Assets so it
    // can be reused from any "Use from library" picker later.
    const saved: LibraryAsset[] = [];
    for (const r of results) {
      if (r.size > LIBRARY_MAX_BYTES && r.mime !== "image/gif") continue;
      const url = await downscaleForLibrary(r.dataUrl, r.mime);
      if (!url) continue;
      saved.push({
        id: r.id,
        title: r.name.replace(/\.[^.]+$/, ""),
        subtitle: "Imported image",
        status: "active",
        type: "image",
        url,
        tags: ["imported"],
        createdAt: new Date().toISOString(),
      });
    }
    if (saved.length) {
      pushLocalCollection<LibraryAsset>("library", "assets", saved);
    }
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, clear };
}
