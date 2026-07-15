import { PlatformGate } from "@/components/shared/PlatformGate";
import { StoryAutomation } from "@/components/automation/StoryAutomation";

export default function StoryAutomationPage() {
  return (
    <PlatformGate toolKey="story-automation">
      {(ctx) => <StoryAutomation selectedPlatforms={ctx.platforms} />}
    </PlatformGate>
  );
}
