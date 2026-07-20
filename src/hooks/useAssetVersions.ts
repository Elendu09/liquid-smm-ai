import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function readLocal(id: string): AssetVersion[] {
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as AssetVersion[]) : [];
  } catch { return []; }
}
function writeLocal(id: string, list: AssetVersion[]) {
  const trimmed = list.slice(-MAX_VERSIONS);
  localStorage.setItem(key(id), JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id } }));
}

function rowToVersion(r: Record<string, unknown>): AssetVersion {
  return {
    version: r.version as number,
    title: (r.title as string) ?? "",
    subtitle: (r.subtitle as string) ?? undefined,
    tags: (r.tags as string[]) ?? [],
    url: (r.url as string) ?? undefined,
    type: (r.type as AssetVersion["type"]) ?? "image",
    note: (r.note as string) ?? undefined,
    author: (r.author as string) ?? undefined,
    createdAt: r.created_at as string,
    reason: (r.reason as AssetVersion["reason"]) ?? "upload",
  };
}

async function fetchRemote(assetId: string): Promise<AssetVersion[] | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("asset_versions")
    .select("*")
    .eq("user_id", uid)
    .eq("asset_id", assetId)
    .order("version", { ascending: true });
  return (data ?? []).map(rowToVersion);
}

async function pushRemote(assetId: string, snap: AssetVersion) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from("asset_versions").insert({
    user_id: uid,
    asset_id: assetId,
    version: snap.version,
    title: snap.title,
    subtitle: snap.subtitle ?? null,
    tags: snap.tags,
    url: snap.url ?? null,
    type: snap.type,
    note: snap.note ?? null,
    author: snap.author ?? null,
    reason: snap.reason,
    created_at: snap.createdAt,
  });
}

export function useAssetVersions(assetId: string | null | undefined) {
  const [versions, setVersions] = useState<AssetVersion[]>(() =>
    assetId ? readLocal(assetId) : [],
  );

  useEffect(() => {
    if (!assetId) { setVersions([]); return; }
    setVersions(readLocal(assetId));
    void (async () => {
      const remote = await fetchRemote(assetId);
      if (remote && remote.length) {
        setVersions(remote);
        writeLocal(assetId, remote);
      }
    })();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string } | undefined;
      if (detail?.id === assetId) setVersions(readLocal(assetId));
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [assetId]);

  const snapshot = useCallback(
    (snap: Omit<AssetVersion, "version" | "createdAt"> & { createdAt?: string }) => {
      if (!assetId) return;
      const list = readLocal(assetId);
      const next: AssetVersion = {
        ...snap,
        createdAt: snap.createdAt ?? new Date().toISOString(),
        version: (list[list.length - 1]?.version ?? 0) + 1,
      };
      writeLocal(assetId, [...list, next]);
      void pushRemote(assetId, next);
    },
    [assetId],
  );

  const clear = useCallback(() => {
    if (!assetId) return;
    localStorage.removeItem(key(assetId));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id: assetId } }));
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) await supabase.from("asset_versions").delete().eq("user_id", uid).eq("asset_id", assetId);
    })();
  }, [assetId]);

  return { versions, snapshot, clear };
}

export function getVersionCount(assetId: string): number {
  return readLocal(assetId).length;
}

export const assetVersionsApi = {
  read: readLocal,
  push: (
    assetId: string,
    snap: Omit<AssetVersion, "version" | "createdAt"> & { createdAt?: string },
  ) => {
    const list = readLocal(assetId);
    const next: AssetVersion = {
      ...snap,
      createdAt: snap.createdAt ?? new Date().toISOString(),
      version: (list[list.length - 1]?.version ?? 0) + 1,
    };
    writeLocal(assetId, [...list, next]);
    void pushRemote(assetId, next);
  },
};
