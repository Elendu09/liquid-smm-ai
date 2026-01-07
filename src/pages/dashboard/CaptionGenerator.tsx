import { AICaptionGenerator } from "@/components/automation/AICaptionGenerator";

export default function CaptionGeneratorPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Caption Generator</h1>
        <p className="text-muted-foreground mt-1">Generate engaging captions with AI in seconds.</p>
      </div>
      <AICaptionGenerator />
    </div>
  );
}
