import { PlatformGate } from "@/components/shared/PlatformGate";
import { FollowerAnalyzer } from "@/components/automation/FollowerAnalyzer";

export default function FollowerAnalyzerPage() {
  return (
    <PlatformGate toolKey="follower-analyzer">
      {() => <FollowerAnalyzer />}
    </PlatformGate>
  );
}
