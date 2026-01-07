import { HashtagResearchTool } from "@/components/automation/HashtagResearchTool";

export default function HashtagResearchPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hashtag Research</h1>
        <p className="text-muted-foreground mt-1">Discover trending hashtags to boost your reach.</p>
      </div>
      <HashtagResearchTool />
    </div>
  );
}
