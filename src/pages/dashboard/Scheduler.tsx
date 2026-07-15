import { PlatformGate } from "@/components/shared/PlatformGate";
import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";

export default function SchedulerPage() {
  return (
    <PlatformGate toolKey="scheduler">
      {(ctx) => (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Post Scheduler</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage your content across your selected platforms.
            </p>
          </div>
          <SmartPostScheduler selectedPlatforms={ctx.platforms} />
        </>
      )}
    </PlatformGate>
  );
}
