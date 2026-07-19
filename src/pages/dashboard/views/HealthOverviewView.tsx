import { HealthScoreGrid } from "@/components/analytics/HealthScoreGrid";
import { AnomalyFeed } from "@/components/analytics/AnomalyFeed";
import { IncidentsTimeline } from "@/components/analytics/IncidentsTimeline";

export default function HealthOverviewView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <HealthScoreGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnomalyFeed />
        <IncidentsTimeline />
      </div>
    </div>
  );
}
