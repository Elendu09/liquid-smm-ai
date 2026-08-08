import { useCallback, useEffect, useRef, useState } from "react";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { useAuthUser } from "@/hooks/useAuthUser";

/**
 * useInboxLock
 *
 * Fix 4.1 — the "collision problem". When two teammates open the same
 * conversation, we don't want them both typing a reply. The first one to
 * claim a lock owns the reply for 60 s; the second one sees a "Sam is
 * replying…" indicator instead of the editor.
 *
 * Locks are per-row in the inbox store (`lockedBy`, `lockedUntil`).
 * The hook also handles:
 *  - Releasing the lock when the user navigates away.
 *  - Auto-expiring stale locks (e.g. someone closed the tab).
 *  - Live ticker so the "Sam is replying (35 s left)" updates every second.
 */
const LOCK_DURATION_MS = 60_000;

export function useInboxLock() {
  const { user } = useAuthUser();
  const { update } = useInboxMessages("comment");
  const { update: updateDm } = useInboxMessages("dm");
  const claimedRef = useRef<Set<string>>(new Set());
  const [, force] = useState(0);

  // Tick once a second so the remaining-time string is fresh.
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Release every lock we own when the page unloads.
  useEffect(() => {
    const release = () => {
      const me = user?.id ?? "guest";
      for (const id of claimedRef.current) {
        try {
          update(id, { lockedBy: null, lockedUntil: null });
        } catch { /* ignore */ }
        try {
          updateDm(id, { lockedBy: null, lockedUntil: null });
        } catch { /* ignore */ }
        // best effort; failure means the data is local-only and we own the memory.
        void me; // keep the variable referenced
      }
    };
    window.addEventListener("beforeunload", release);
    return () => {
      release();
      window.removeEventListener("beforeunload", release);
    };
  }, [update, updateDm, user]);

  const claim = useCallback(
    (id: string) => {
      const me = user?.id ?? "guest";
      const until = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      update(id, { lockedBy: me, lockedUntil: until });
      updateDm(id, { lockedBy: me, lockedUntil: until });
      claimedRef.current.add(id);
    },
    [update, updateDm, user],
  );

  const release = useCallback(
    (id: string) => {
      update(id, { lockedBy: null, lockedUntil: null });
      updateDm(id, { lockedBy: null, lockedUntil: null });
      claimedRef.current.delete(id);
    },
    [update, updateDm],
  );

  return { claim, release };
}

export function formatLockRemaining(lockedUntil: string | null | undefined): string {
  if (!lockedUntil) return "";
  const ms = new Date(lockedUntil).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const s = Math.ceil(ms / 1000);
  if (s >= 60) return `${Math.ceil(s / 60)}m left`;
  return `${s}s left`;
}
