import { PlatformGate } from "@/components/shared/PlatformGate";
import { HashtagResearchTool } from "@/components/automation/HashtagResearchTool";

export default function HashtagResearchPage() {
  return (
    <PlatformGate toolKey="hashtag-research">
      {(ctx) => (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Hashtag Research</h1>
            <p className="text-muted-foreground mt-1">
              Discover trending hashtags to boost your reach on {ctx.platforms[0]?.name}.
            </p>
          </div>
          <HashtagResearchTool defaultPlatformId={ctx.platforms[0]?.id} />
        </>
      )}
    </PlatformGate>
  );
}
