import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StoryItemFull, StorySlide } from "@/components/publish/NewStoryDialog";

/**
 * Story persistence — mirrors `useScheduledPosts` shape.
 *   • Authenticated users read/write `public.stories` with realtime sync.
 *   • Guests fall back to localStorage under the same key that `useLocalCollection`
 *     previously used ("smmpilot:publish:stories") so existing demo data is preserved.
 * The rich shape (title + slides) lives in the `data` jsonb column.
 */

const STORAGE_KEY = "smmpilot:publish:stories";

type Mode = "local" | "remote";
let mode: Mode = "local";
let remoteUserId: string | null = null;
let cache: StoryItemFull[] = readLocal();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function setCache(next: StoryItemFull[]) { cache = next; emit(); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function readLocal(): StoryItemFull[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoryItemFull[]) : [];
  } catch { return []; }
}
function writeLocal(next: StoryItemFull[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (mode === "local" && e.key === STORAGE_KEY) setCache(readLocal());
  });
}

type Row = {
  id: string;
  caption: string | null;
  scheduled_at: string | null;
  status: string;
  data: { title?: string; slides?: StorySlide[] } | null;
  created_at: string;
};

const rowToStory = (r: Row): StoryItemFull => ({
  id: r.id,
  title: r.data?.title ?? r.caption ?? "Untitled story",
  slides: (r.data?.slides ?? []) as StorySlide[],
  scheduledAt: r.scheduled_at ?? undefined,
  status: (r.status as StoryItemFull["status"]) ?? "idea",
  createdAt: r.created_at,
});

function storyToRow(s: Partial<StoryItemFull>) {
  const row: Record<string, unknown> = {};
  if (s.title !== undefined) row.caption = s.title;
  if (s.scheduledAt !== undefined) row.scheduled_at = s.scheduledAt ?? null;
  if (s.status !== undefined) row.status = s.status;
  if (s.title !== undefined || s.slides !== undefined) {
    row.data = { title: s.title, slides: s.slides ?? [] };
  }
  return row;
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let hydrationPromise: Promise<void> | null = null;

async function refetch() {
  const { data } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });
  setCache(((data as unknown as Row[] | null) ?? []).map(rowToStory));
}

async function hydrateRemote(userId: string) {
  await refetch();
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`stories:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "stories", filter: `user_id=eq.${userId}` },
      () => { void refetch(); },
    )
    .subscribe();
}

async function ensureAuthMode() {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) {
      mode = "remote"; remoteUserId = uid;
      await hydrateRemote(uid);
    } else {
      mode = "local"; remoteUserId = null;
      setCache(readLocal());
    }
  })();
  return hydrationPromise;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid && uid !== remoteUserId) {
      mode = "remote"; remoteUserId = uid; hydrationPromise = null;
      void hydrateRemote(uid);
    } else if (!uid && mode !== "local") {
      mode = "local"; remoteUserId = null;
      if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
      hydrationPromise = null;
      setCache(readLocal());
    }
  });
}

export function useStories() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);

  useEffect(() => { void ensureAuthMode(); }, []);

  const add = (story: StoryItemFull) => {
    if (mode === "remote" && remoteUserId) {
      setCache([story, ...cache]);
      void supabase.from("stories").insert({
        id: story.id,
        user_id: remoteUserId,
        caption: story.title,
        scheduled_at: story.scheduledAt ?? null,
        status: story.status,
        data: { title: story.title, slides: story.slides ?? [] },
      } as never).then(({ error }) => {
        if (error) setCache(cache.filter((s) => s.id !== story.id));
      });
    } else {
      writeLocal([story, ...cache]);
    }
    return story;
  };

  const update = (id: string, patch: Partial<StoryItemFull>) => {
    const next = cache.map((s) => (s.id === id ? { ...s, ...patch } : s));
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("stories").update(storyToRow({ ...cache.find((s) => s.id === id), ...patch }) as never).eq("id", id);
    } else {
      writeLocal(next);
    }
  };

  const remove = (id: string) => {
    const next = cache.filter((s) => s.id !== id);
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("stories").delete().eq("id", id);
    } else {
      writeLocal(next);
    }
  };

  const setItems = (next: StoryItemFull[]) => {
    if (mode === "remote" && remoteUserId) {
      // No-op remotely; used only to seed demo data locally.
      setCache(next);
    } else {
      writeLocal(next);
    }
  };

  return { items, add, update, remove, setItems };
}
