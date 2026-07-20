import { useState } from "react";
import { GrowthStory } from "@/components/automation/GrowthStory";
import { KpiHero, type RangeKey } from "@/components/analytics/KpiHero";
import { PlatformBreakdown } from "@/components/analytics/PlatformBreakdown";
import { TopPostsLeaderboard } from "@/components/analytics/TopPostsLeaderboard";
import { PostingHeatmap } from "@/components/analytics/PostingHeatmap";
import { FunnelCard } from "@/components/analytics/FunnelCard";
import { AudienceMix } from "@/components/analytics/AudienceMix";
import { AnomalyFeed } from "@/components/analytics/AnomalyFeed";
import { BestTimeInsightsCard } from "@/components/analytics/BestTimeInsightsCard";
import { HashtagPerformanceCard } from "@/components/analytics/HashtagPerformanceCard";
import { CompetitorBenchmarkCard } from "@/components/audience/CompetitorBenchmarkCard";

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30D");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <KpiHero range={range} onRangeChange={setRange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <PlatformBreakdown range={range} />
          <BestTimeInsightsCard />
          <PostingHeatmap />
          <TopPostsLeaderboard />
        </div>
        <div className="space-y-4">
          <FunnelCard />
          <HashtagPerformanceCard />
          <CompetitorBenchmarkCard />
          <AudienceMix />
          <AnomalyFeed />
        </div>
      </div>

      <div className="pt-4 border-t border-border/40">
        <GrowthStory />
      </div>
    </div>
  );
}
