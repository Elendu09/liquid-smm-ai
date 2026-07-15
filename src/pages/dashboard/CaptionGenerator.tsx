import { PlatformGate } from "@/components/shared/PlatformGate";
import { AICaptionGenerator } from "@/components/automation/AICaptionGenerator";

export default function CaptionGeneratorPage() {
  return (
    <PlatformGate toolKey="caption-generator">
      {(ctx) => (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">AI Caption Generator</h1>
            <p className="text-muted-foreground mt-1">
              Generate engaging captions optimized for {ctx.platforms[0]?.name} in seconds.
            </p>
          </div>
          <AICaptionGenerator defaultPlatformId={ctx.platforms[0]?.id} />
        </>
      )}
    </PlatformGate>
  );
}
