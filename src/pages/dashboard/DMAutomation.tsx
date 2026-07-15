import { PlatformGate } from "@/components/shared/PlatformGate";
import { DMAutomation } from "@/components/automation/DMAutomation";

export default function DMAutomationPage() {
  return (
    <PlatformGate toolKey="dm-automation">
      {() => <DMAutomation />}
    </PlatformGate>
  );
}
