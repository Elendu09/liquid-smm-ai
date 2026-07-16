import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";

/**
 * Confirm-and-pause every currently queued post. Sending/completed posts are untouched.
 * Toggles between Pause All and Resume All based on how many are already paused.
 */
export function PauseAllDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { posts, pauseAll, resumeAll } = useScheduledPosts();
  const queued = posts.filter((p) => p.status === "queued").length;
  const paused = posts.filter((p) => p.status === "paused").length;
  const mode: "pause" | "resume" = queued >= paused ? "pause" : "resume";

  const confirm = () => {
    if (mode === "pause") {
      pauseAll();
      toast.success(`Paused ${queued} queued post${queued === 1 ? "" : "s"}`);
    } else {
      resumeAll();
      toast.success(`Resumed ${paused} paused post${paused === 1 ? "" : "s"}`);
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "pause" ? "Pause all queued posts?" : "Resume all paused posts?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "pause"
              ? `${queued} post${queued === 1 ? "" : "s"} will stop sending until you resume.`
              : `${paused} paused post${paused === 1 ? "" : "s"} will return to the send queue at their original times.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>
            {mode === "pause" ? "Pause all" : "Resume all"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
