import { AutoEngagementBot } from "@/components/automation/AutoEngagementBot";

export default function EngagementBotPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Engagement Bot</h1>
        <p className="text-muted-foreground mt-1">Automate your engagement to grow your audience.</p>
      </div>
      <AutoEngagementBot />
    </div>
  );
}
