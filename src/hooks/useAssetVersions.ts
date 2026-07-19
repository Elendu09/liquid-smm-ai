import { useCallback, useEffect, useState } from "react";

export interface AssetVersion {
  version: number;
  title: string;
  subtitle?: string;
  tags: string[];
  url?: string;
  type: "image" | "video" | "doc";
  note?: string;
  author?: string;
  createdAt: string;
  reason: "upload" | "rename" | "tags" | "replace" | "restore";
}

const MAX_VERSIONS = 20;
const key = (id: string) => `asset-versions:${id}`;
const CHANGE_EVENT = "asset-versions:change";

function read(id: string): AssetVersion[] {
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as AssetVersion[]) : [];
  } catch {
    return [];
  }
}

function write(id: string, list: AssetVersion[]) {
  const trimmed = list.slice(-MAX_VERSIONS);
  localStorage.setItem(key(id), JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id } }));
}

export function useAssetVersions(assetId: string | null | undefined) {
  const [versions, setVersions] = useState<AssetVersion[]>(() =>
    assetId ? read(assetId) : [],
  );

  useEffect(() => {
    if (!assetId) {
      setVersions([]);
      return;
    }
    setVersions(read(assetId));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string } | undefined;
      if (detail?.id === assetId) setVersions(read(assetId));
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [assetId]);

  const snapshot = useCallback(
    (
      snap: Omit<AssetVersion, "version" | "createdAt"> & { createdAt?: string },
    ) => {
      if (!assetId) return;
      const list = read(assetId);
      const next: AssetVersion = {
        ...snap,
        createdAt: snap.createdAt ?? new Date().toISOString(),
        version: (list[list.length - 1]?.version ?? 0) + 1,
      };
      write(assetId, [...list, next]);
    },
    [assetId],
  );

  const clear = useCallback(() => {
    if (!assetId) return;
    localStorage.removeItem(key(assetId));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id: assetId } }));
  }, [assetId]);

  return { versions, snapshot, clear };
}

/** Read version count without subscribing (used for badges). */
export function getVersionCount(assetId: string): number {
  return read(assetId).length;
}

/** Static helpers for callers that only need to write. */
export const assetVersionsApi = {
  read,
  push: (
    assetId: string,
    snap: Omit<AssetVersion, "version" | "createdAt"> & { createdAt?: string },
  ) => {
    const list = read(assetId);
    const next: AssetVersion = {
      ...snap,
      createdAt: snap.createdAt ?? new Date().toISOString(),
      version: (list[list.length - 1]?.version ?? 0) + 1,
    };
    write(assetId, [...list, next]);
  },
};
