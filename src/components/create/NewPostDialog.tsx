import { useEffect, useState } from "react";
import { toast } from "sonner";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useAccounts } from "@/contexts/AccountContext";
import {
  NewDraftDialog,
  type NewDraftScheduleExtras,
  type StudioDraft,
} from "@/components/create/NewDraftDialog";

export interface PostTemplate {
  id: string;
  name: string;
  caption: string;
  platformIds: string[];
  createdAt: string;
}

export interface NewPostInitial {
  title?: string;
  caption?: string;
  platformIds?: string[];
}

/**
 * Entry point used by Dashboard, Campaigns and the prompt-templates
 * "Use template" flow. It is intentionally the *same* unified composer
 * as the Create studio's "Create new draft" dialog — one dialog, one
 * look, one behavior — this component just seeds it with initial
 * content and handles persistence for standalone use.
 */
export function NewPostDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: NewPostInitial;
}) {
  const { accounts } = useAccounts();
  const { add: addScheduled } = useScheduledPosts();
  const [draft, setDraft] = useState<StudioDraft | null>(null);

  // Seed a fresh working draft each time the dialog is opened/re-seeded.
  useEffect(() => {
    if (!open) return;
    setDraft({
      id: crypto.randomUUID(),
      title: initial?.title ?? "",
      caption: initial?.caption ?? "",
      status: "draft",
      platform: initial?.platformIds?.[0] ?? accounts[0]?.platformId ?? "instagram",
      createdAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.title, initial?.caption, initial?.platformIds?.join(",")]);

  const patch = (p: Partial<StudioDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));

  const onCreate = () => {
    if (!draft) return;
    pushLocalCollection("create", "drafts", [
      { ...draft, title: draft.title.trim() || "Untitled draft" },
    ]);
    toast.success("Draft saved to Studio");
    onOpenChange(false);
  };

  const onSchedule = (extras: NewDraftScheduleExtras) => {
    if (!draft || !extras.scheduleAt) return;
    addScheduled(
      {
        caption: draft.caption,
        mediaUrl: draft.mediaUrl,
        scheduledAt: new Date(extras.scheduleAt).toISOString(),
        platformIds: extras.platformIds.length ? extras.platformIds : [draft.platform],
        firstComment: extras.firstComment,
        categoryId: extras.categoryId,
      },
      { recurrence: extras.recurrence },
    );
    toast.success(
      extras.recurrence
        ? `Queued ${extras.recurrence.count} recurring posts`
        : "Scheduled — check the Publish queue",
    );
    onOpenChange(false);
  };

  return (
    <NewDraftDialog
      open={open}
      onOpenChange={onOpenChange}
      draft={draft}
      isEdit={false}
      onChange={patch}
      onCreate={onCreate}
      onSchedule={onSchedule}
    />
  );
}
