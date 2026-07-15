import { PlatformGate } from "@/components/shared/PlatformGate";
import CompetitorTracker from "@/components/automation/CompetitorTracker";

export default function CompetitorTrackerPage() {
  return (
    <PlatformGate toolKey="competitor-tracker">
      {() => <CompetitorTracker />}
    </PlatformGate>
  );
}
