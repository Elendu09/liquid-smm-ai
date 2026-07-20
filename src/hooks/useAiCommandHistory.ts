import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export interface AiCommandToolCall {
  id: string;
  name: string;
  args: unknown;
  result: unknown;
  approved?: boolean;
  rejected?: boolean;
}

export interface AiCommandEntry {
  id: string;
  createdAt: string;
  prompt: string;
  text: string;
  toolCalls: AiCommandToolCall[];
  status: "success" | "error";
  error?: string;
}

interface Row {
  id: string;
  user_id: string;
  prompt: string;
  text: string;
  tool_calls: unknown;
  status: string;
  error: string | null;
  created_at: string;
}

const LIMIT = 40;

const collection = createRemoteCollection<AiCommandEntry, Row>({
  table: "ai_command_history",
  localKey: "smmpilot:ai-command-history",
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    createdAt: r.created_at,
    prompt: r.prompt,
    text: r.text ?? "",
    toolCalls: Array.isArray(r.tool_calls) ? (r.tool_calls as AiCommandToolCall[]) : [],
    status: (r.status as AiCommandEntry["status"]) ?? "success",
    error: r.error ?? undefined,
  }),
  toInsertRow: (item, user_id) => ({
    id: item.id,
    user_id,
    prompt: item.prompt,
    text: item.text,
    tool_calls: item.toolCalls,
    status: item.status,
    error: item.error ?? null,
    created_at: item.createdAt,
  }),
  toUpdateRow: (patch) => {
    const row: Record<string, unknown> = {};
    if (patch.prompt !== undefined) row.prompt = patch.prompt;
    if (patch.text !== undefined) row.text = patch.text;
    if (patch.toolCalls !== undefined) row.tool_calls = patch.toolCalls;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.error !== undefined) row.error = patch.error ?? null;
    return row;
  },
});

export function logAiCommand(entry: Omit<AiCommandEntry, "id" | "createdAt">) {
  const full: AiCommandEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  void collection.add(full);
  // trim local cache client-side; server keeps history
  const rest = collection.read().slice(LIMIT);
  rest.forEach((r) => void collection.remove(r.id));
  return full;
}

export function updateAiCommand(id: string, patch: Partial<AiCommandEntry>) {
  void collection.update(id, patch);
}

export function updateToolCall(entryId: string, callId: string, patch: Partial<AiCommandToolCall>) {
  const entry = collection.read().find((e) => e.id === entryId);
  if (!entry) return;
  const toolCalls = entry.toolCalls.map((c) => (c.id === callId ? { ...c, ...patch } : c));
  void collection.update(entryId, { toolCalls });
}

export function clearAiCommandHistory() {
  const all = collection.read();
  all.forEach((r) => void collection.remove(r.id));
}

export function useAiCommandHistory() {
  const items = collection.useItems();
  const log = useCallback(logAiCommand, []);
  const update = useCallback(updateAiCommand, []);
  const updateTool = useCallback(updateToolCall, []);
  const clear = useCallback(clearAiCommandHistory, []);
  return { items, log, update, updateTool, clear };
}
