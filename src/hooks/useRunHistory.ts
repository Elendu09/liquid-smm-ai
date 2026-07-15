import { useCallback, useEffect, useState } from "react";

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
  createdAt: string; // ISO
}

const KEY = "smmpilot:run-history";
const MAX = 500;

const emit = () => window.dispatchEvent(new Event("smmpilot:run-history-change"));

function read(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch {
    return [];
  }
}

function write(rows: RunRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
    emit();
  } catch {
    /* ignore */
  }
}

export function logRun(input: Omit<RunRecord, "id" | "createdAt"> & { createdAt?: string }): RunRecord {
  const record: RunRecord = {
    id: crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };
  const rows = [record, ...read()];
  write(rows);
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
  const [rows, setRows] = useState<RunRecord[]>(read);

  useEffect(() => {
    const sync = () => setRows(read());
    window.addEventListener("smmpilot:run-history-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("smmpilot:run-history-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const clear = useCallback(() => write([]), []);
  const remove = useCallback((id: string) => write(read().filter((r) => r.id !== id)), []);

  return { rows, logRun, clear, remove };
}
