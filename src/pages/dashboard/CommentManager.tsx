import { CommentManager } from "@/components/automation/CommentManager";

export default function CommentManagerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Comment Manager</h1>
        <p className="text-muted-foreground mt-1">Manage comments with AI-powered replies.</p>
      </div>
      <CommentManager />
    </div>
  );
}
