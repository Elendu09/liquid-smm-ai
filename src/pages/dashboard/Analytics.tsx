import { GrowthAnalytics } from "@/components/automation/GrowthAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Growth Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your performance and ROI across platforms.</p>
      </div>
      <GrowthAnalytics />
    </div>
  );
}
