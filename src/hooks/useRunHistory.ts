import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

export type RunStatus = "success" | "failed" | "pending";

export interface RunRecord {
  id: string;
  toolKey: string;
  action: string;
  platform?: string;
  accountId?: string;
  accountHandle?: string;
  status: RunStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  durationMs?: number;
  createdAt: string;
}

const KEY = "smmpilot:run-history";
const MAX = 500;
const EVT = "smmpilot:run-history-change";
const emit = () => window.dispatchEvent(new Event(EVT));

function readLocal(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch { return []; }
}
function writeLocal(rows: RunRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX))); emit(); } catch { /* ignore */ }
}

function rowToRecord(row: any): RunRecord {
  const data = row.data ?? {};
  return {
    id: row.id,
    toolKey: data.toolKey ?? row.kind ?? "unknown",
    action: data.action ?? row.kind ?? "run",
    platform: data.platform,
    accountId: data.accountId,
    accountHandle: data.accountHandle,
    status: (row.status as RunStatus) ?? "success",
    input: data.input,
    output: data.output,
    error: row.message ?? data.error,
    durationMs: data.durationMs,
    createdAt: row.created_at,
  };
}

export function logRun(input: Omit<RunRecord, "id" | "createdAt"> & { createdAt?: string }): RunRecord {
  const record: RunRecord = {
    id: crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };
  const rows = [record, ...readLocal()];
  writeLocal(rows);
  if (!isGuestSession()) {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      await supabase.from("run_history").insert({
        user_id: uid,
        kind: record.toolKey,
        ref_id: null,
        status: record.status,
        message: record.error ?? null,
        data: {
          toolKey: record.toolKey,
          action: record.action,
          platform: record.platform,
          accountId: record.accountId,
          accountHandle: record.accountHandle,
          input: record.input,
          output: record.output,
          durationMs: record.durationMs,
          error: record.error,
        } as any,
      });
    })();
  }
  return record;
}

export async function withRunLog<T>(
  meta: Omit<RunRecord, "id" | "createdAt" | "status" | "durationMs" | "output" | "error">,
  fn: () => Promise<T> | T,
): Promise<T> {
  const start = performance.now();
  try {
    const output = await fn();
    logRun({ ...meta, status: "success", output, durationMs: Math.round(performance.now() - start) });
    return output;
  } catch (err) {
    logRun({
      ...meta,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start),
    });
    throw err;
  }
}

export function useRunHistory() {
  const [rows, setRows] = useState<RunRecord[]>(readLocal);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setRows(readLocal());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) return;
      const { data } = await supabase
        .from("run_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX);
      if (!cancelled && data) {
        const remote = data.map(rowToRecord);
        writeLocal(remote);
        setRows(remote);
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Realtime subscription — stream new runs into the feed instantly for logged-in users.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`run-history:${userId}:${crypto.randomUUID()}`);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "run_history", filter: `user_id=eq.${userId}` },
        (payload) => {
          setRows((prev) => {
            let next = prev;
            if (payload.eventType === "INSERT") {
              const rec = rowToRecord(payload.new);
              if (!prev.find((r) => r.id === rec.id)) next = [rec, ...prev].slice(0, MAX);
            } else if (payload.eventType === "UPDATE") {
              const rec = rowToRecord(payload.new);
              next = prev.map((r) => (r.id === rec.id ? rec : r));
            } else if (payload.eventType === "DELETE") {
              const id = (payload.old as { id: string }).id;
              next = prev.filter((r) => r.id !== id);
            }
            writeLocal(next);
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const clear = useCallback(async () => {
    writeLocal([]);
    if (isGuestSession()) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("run_history").delete().eq("user_id", data.user.id);
  }, []);
  const remove = useCallback(async (id: string) => {
    writeLocal(readLocal().filter((r) => r.id !== id));
    if (isGuestSession()) return;
    await supabase.from("run_history").delete().eq("id", id);
  }, []);

  return { rows, logRun, clear, remove };
}
