import { PlatformGate } from "@/components/shared/PlatformGate";
import { CommentManager } from "@/components/automation/CommentManager";

export default function CommentManagerPage() {
  return (
    <PlatformGate toolKey="comment-manager">
      {() => (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Comment Manager</h1>
            <p className="text-muted-foreground mt-1">Manage comments with AI-powered replies.</p>
          </div>
          <CommentManager />
        </>
      )}
    </PlatformGate>
  );
}
