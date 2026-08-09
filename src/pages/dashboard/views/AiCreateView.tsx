import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/dashboard/shell/StatusBoard";
import { AiBriefDialog } from "@/components/create/AiBriefDialog";

const seed = [
  { id: "a1", title: "Reel voiceover · fitness", status: "generated", createdAt: new Date().toISOString() },
  { id: "a2", title: "Carousel hook · SaaS", status: "queued", createdAt: new Date().toISOString() },
];

export default function AiCreateView() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-2 flex gap-2 items-center justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Wand2 className="h-4 w-4 mr-1.5" /> New brief
        </Button>
      </div>
      <StatusBoard
        storageKey="create:ai"
        hubKey="create-ai"
        icon={Wand2}
        searchPlaceholder="Search generations…"
        addPlaceholder="New prompt…"
        seed={seed}
        columns={[
          { id: "queued", label: "Queued" },
          { id: "generated", label: "Generated" },
          { id: "used", label: "Used" },
        ]}
      />
      <AiBriefDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
