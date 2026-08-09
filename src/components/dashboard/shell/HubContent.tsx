import { ReactNode, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Shimmer } from "@/components/ui/shimmer";

/**
 * Content shimmer used *below* the hub header + tabs, so switching a
 * sub-tab never unmounts the header (which used to look like a reload).
 */
export function HubContentShimmer() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Wraps the routed sub-view of a hub in a scoped loading boundary. */
export function HubContent({ children }: { children?: ReactNode }) {
  return (
    <Suspense fallback={<HubContentShimmer />}>{children ?? <Outlet />}</Suspense>
  );
}
