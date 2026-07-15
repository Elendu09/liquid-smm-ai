import { PlatformGate } from "@/components/shared/PlatformGate";
import { AutoEngagementBot } from "@/components/automation/AutoEngagementBot";

export default function EngagementBotPage() {
  return (
    <PlatformGate toolKey="engagement-bot">
      {() => (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Engagement Bot</h1>
            <p className="text-muted-foreground mt-1">Automate your engagement to grow your audience.</p>
          </div>
          <AutoEngagementBot />
        </>
      )}
    </PlatformGate>
  );
}
