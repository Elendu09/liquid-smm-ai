import { BenchmarkLeaderboard } from "@/components/analytics/BenchmarkLeaderboard";
import { NetworkExportCard } from "@/components/analytics/NetworkExportCard";
import { CompetitorBenchmarkCard } from "@/components/audience/CompetitorBenchmarkCard";

export default function BenchmarksView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <BenchmarkLeaderboard />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NetworkExportCard />
        </div>
        <CompetitorBenchmarkCard />
      </div>
    </div>
  );
}
