import { useMemo } from "react";

/**
 * Gate synthetic/demo content behind guest sessions.
 * - Guests: returns `demo` fallback
 * - Signed-in users: returns real `rows`, or [] when nothing exists yet
 *   (components then render an <EmptyState /> instead of mock data)
 */
export function useRealOrEmpty<T>(
  rows: T[] | undefined | null,
  opts: { isGuest: boolean; demo: T[] },
): T[] {
  return useMemo(() => {
    const real = rows ?? [];
    if (opts.isGuest) return real.length > 0 ? real : opts.demo;
    return real;
  }, [rows, opts.isGuest, opts.demo]);
}
