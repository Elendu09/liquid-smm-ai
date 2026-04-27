import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";

export default function SchedulerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Post Scheduler</h1>
        <p className="text-muted-foreground mt-1">Schedule and manage your content across all platforms.</p>
      </div>
      <SmartPostScheduler />
    </div>
  );
}
