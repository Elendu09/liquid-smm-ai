import { useState } from "react";
import { Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/dashboard/shell/StatusBoard";
import { GenerateCaptionsDialog } from "@/components/create/GenerateCaptionsDialog";
import { TranslateCaptionDialog } from "@/components/create/TranslateCaptionDialog";
import { ComposeVariantsDialog } from "@/components/create/ComposeVariantsDialog";

const seed = [
  { id: "c1", title: "Product launch hook", subtitle: "Big news 🚀 Something new drops Friday…", status: "idea", createdAt: new Date().toISOString() },
  { id: "c2", title: "Behind the scenes", subtitle: "A day in the studio 🎥", status: "polished", createdAt: new Date().toISOString() },
  { id: "c3", title: "Weekly tip", subtitle: "3 things I wish I knew before starting…", status: "used", createdAt: new Date().toISOString() },
];

export default function CaptionsCreateView() {
  const [gen, setGen] = useState(false);
  const [tr, setTr] = useState(false);
  const [ab, setAb] = useState(false);
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-2 flex flex-wrap gap-2 items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => setTr(true)}>
          Translate
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAb(true)}>
          <FlaskConical className="h-4 w-4 mr-1.5" /> A/B variants
        </Button>
        <Button size="sm" onClick={() => setGen(true)}>
          <Sparkles className="h-4 w-4 mr-1.5" /> Generate with AI
        </Button>
      </div>
      <StatusBoard
        storageKey="create:captions"
        hubKey="create-captions"
        icon={Sparkles}
        searchPlaceholder="Search captions…"
        addPlaceholder="New caption idea…"
        seed={seed}
        columns={[
          { id: "idea", label: "Ideas" },
          { id: "polished", label: "Polished" },
          { id: "used", label: "Used" },
        ]}
      />
      <GenerateCaptionsDialog open={gen} onOpenChange={setGen} />
      <TranslateCaptionDialog open={tr} onOpenChange={setTr} />
      <ComposeVariantsDialog open={ab} onOpenChange={setAb} />
    </>
  );
}
