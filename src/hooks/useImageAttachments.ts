import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface ImageAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

const MAX_FILES = 4;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
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
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, clear };
}
