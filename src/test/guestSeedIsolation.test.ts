import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Integration guard: guest demo seeds must NEVER appear in the module cache
 * for signed-in users. Covers DMs, comments (inbox_messages), and audience
 * segments (createRemoteCollection).
 *
 * Strategy: mock @/integrations/supabase/client with a stub whose
 * `auth.getSession()` returns a real user, then instantiate the modules
 * from scratch (via vi.resetModules + dynamic import) after seeding
 * localStorage with legacy guest data. The initial cache — the snapshot
 * consumers see before any network round-trip — must be empty.
 */

type Handler = (payload: unknown) => void;

function makeSupabaseStub(sessionUserId: string | null) {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: sessionUserId ? { user: { id: sessionUserId } } : null,
        },
      }),
      onAuthStateChange: vi.fn((_cb: (evt: string, session: unknown) => void) => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
    _channel: channel as { on: (evt: string, cfg: unknown, cb: Handler) => unknown },
  };
}

async function loadWithSession(userId: string | null) {
  vi.resetModules();
  const stub = makeSupabaseStub(userId);
  vi.doMock("@/integrations/supabase/client", () => ({ supabase: stub }));
  return { stub };
}

describe("guest seed isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe("inbox (comments + DMs)", () => {
    it("returns empty cache for signed-in users even when guest localStorage exists", async () => {
      // Simulate stale guest data from a prior session
      localStorage.setItem(
        "smmpilot:engage:comment",
        JSON.stringify([{ id: "leak-1", author: "Leaked", message: "should not appear" }]),
      );
      localStorage.setItem(
        "smmpilot:engage:dm",
        JSON.stringify([{ id: "leak-2", author: "Leaked", message: "should not appear" }]),
      );
      // Explicitly NOT a guest
      localStorage.removeItem("smmpilot:guest");

      await loadWithSession("user-123");
      const mod = await import("@/hooks/useInboxMessages");
      // Access private buckets via re-import: the exported hook is a factory.
      // Instead, invoke the hook once through renderHook — but simpler: read
      // the initial snapshot by calling the hook body indirectly. Since
      // the module initializes the cache eagerly at import time, checking
      // through a fresh render is enough.
      const { renderHook } = await import("@testing-library/react");
      const { result: comments } = renderHook(() => mod.useInboxMessages("comment"));
      const { result: dms } = renderHook(() => mod.useInboxMessages("dm"));
      expect(comments.current.items).toEqual([]);
      expect(dms.current.items).toEqual([]);
    });

    it("returns guest seed for guest sessions", async () => {
      localStorage.setItem("smmpilot:guest", "1");
      localStorage.setItem(
        "smmpilot:engage:comment",
        JSON.stringify([{ id: "g-1", author: "Guest", message: "hi" }]),
      );
      await loadWithSession(null);
      const mod = await import("@/hooks/useInboxMessages");
      const { renderHook } = await import("@testing-library/react");
      const { result } = renderHook(() => mod.useInboxMessages("comment"));
      expect(result.current.items.length).toBe(1);
      expect(result.current.items[0].id).toBe("g-1");
    });
  });

  describe("audience segments (createRemoteCollection)", () => {
    it("does not seed demo segments for signed-in users", async () => {
      localStorage.removeItem("smmpilot:guest");
      // Even if a prior localStorage entry exists, it must be ignored.
      localStorage.setItem(
        "collection:audience:segments",
        JSON.stringify([{ id: "old", title: "stale demo" }]),
      );
      await loadWithSession("user-123");
      const mod = await import("@/hooks/useAudienceSegments");
      const { renderHook } = await import("@testing-library/react");
      const { result } = renderHook(() => mod.useAudienceSegments());
      // useAudienceSegments returns items directly or a wrapper — normalize
      const items = Array.isArray(result.current) ? result.current : (result.current as { items?: unknown[] }).items;
      expect(items).toEqual([]);
    });

    it("seeds demo segments for guests when localStorage is empty", async () => {
      localStorage.setItem("smmpilot:guest", "1");
      await loadWithSession(null);
      const mod = await import("@/hooks/useAudienceSegments");
      const { renderHook } = await import("@testing-library/react");
      const { result } = renderHook(() => mod.useAudienceSegments());
      const items = Array.isArray(result.current) ? result.current : (result.current as { items?: unknown[] }).items;
      expect((items ?? []).length).toBeGreaterThan(0);
    });
  });
});
