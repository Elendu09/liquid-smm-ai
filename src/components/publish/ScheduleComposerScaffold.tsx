import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookMarked, CalendarClock, Eye, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/contexts/AccountContext";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { CreateDialogShell } from "@/components/create/CreateDialogShell";
import { TemplatePanel } from "@/components/create/TemplatePanel";
import type { PostTemplate } from "@/components/create/NewPostDialog";
import { cn } from "@/lib/utils";

/**
 * The five everyday channels the unified schedule dialogs show by default.
 * Any additionally CONNECTED channel is appended on top of these — same
 * behaviour as the Create-new-draft composer.
 */
export const DEFAULT_SCHEDULE_PLATFORMS = [
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "facebook",
];

/** Default 5 + any connected channels the user added beyond them. */
export function schedulePlatformChoices(connectedIds: string[]): string[] {
  const extras = connectedIds.filter((id) => !DEFAULT_SCHEDULE_PLATFORMS.includes(id));
  return extras.length ? [...DEFAULT_SCHEDULE_PLATFORMS, ...extras] : DEFAULT_SCHEDULE_PLATFORMS;
}

export interface ScheduleComposerScaffoldProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Called when the user inserts a template — parent applies caption/platforms */
  onInsertTemplate: (t: PostTemplate) => void;
  /** Left column: the scheduling form fields */
  children: ReactNode;
  /** Optional first column on desktop: media upload / assets */
  mediaPane?: ReactNode;
  /** Right column when in preview mode (NetworkPreview + info cards) */
  preview: ReactNode;
  /** Sticky footer actions */
  footer: ReactNode;
}

/**
 * Shared scaffold for the "Schedule post" and "Edit scheduled post" dialogs —
 * same chrome as the unified Create dialog: title on top with an X-only close,
 * a Templates button that swaps the side column into the template browser
 * (6 cards + Show more), and an eye toggle that slides between edit and the
 * preview/panel on tablet & mobile. Both schedule dialogs render through this
 * so they stay pixel-identical.
 */
export function ScheduleComposerScaffold({
  open,
  onOpenChange,
  title,
  description,
  onInsertTemplate,
  children,
  mediaPane,
  preview,
  footer,
}: ScheduleComposerScaffoldProps) {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const { items: templates, remove: removeTemplate } =
    useLocalCollection<PostTemplate>("publish", "templates");

  const [panel, setPanel] = useState<"preview" | "templates">("preview");
  const [mobilePanel, setMobilePanel] = useState(false);

  // Always reopen into edit/preview mode.
  useEffect(() => {
    if (open) {
      setPanel("preview");
      setMobilePanel(false);
    }
  }, [open]);

  const toggleTemplates = () => {
    const next = panel === "templates" ? "preview" : "templates";
    setPanel(next);
    if (next === "templates") setMobilePanel(true);
  };

  const handleInsert = (t: PostTemplate) => {
    onInsertTemplate(t);
    setPanel("preview");
    setMobilePanel(true); // jump straight to the updated preview
  };

  return (
    <CreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={CalendarClock}
      title={title}
      description={description}
      headerActions={
        <>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={panel === "templates"}
            className={cn(
              panel === "templates" &&
                "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
            )}
            onClick={toggleTemplates}
          >
            <BookMarked className="h-3.5 w-3.5 mr-1.5" />
            Templates{" "}
            {templates.length > 0 && (
              <span className="ml-1 text-muted-foreground">({templates.length})</span>
            )}
          </Button>
          {/* Eye toggle — tablet/mobile only: slide edit ⇄ preview/panel */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full md:hidden",
              mobilePanel &&
                "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
            )}
            onClick={() => setMobilePanel((m) => !m)}
            aria-pressed={mobilePanel}
            aria-label={mobilePanel ? "Back to edit" : "Show preview"}
            title={mobilePanel ? "Back to edit" : "Show preview"}
          >
            {mobilePanel ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </>
      }
      footer={footer}
    >
      <div
        className={cn(
          "grid min-h-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]",
          mediaPane && "xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,340px)]",
        )}
      >
        {/* Media column — desktop only; folds into the form column below xl */}
        {mediaPane && (
          <div className={cn("hidden min-w-0 space-y-3 xl:block", mobilePanel && "xl:hidden")}>
            {mediaPane}
          </div>
        )}

        {/* Form column — hides on mobile when slid to preview/panel */}
        <div className={cn("min-w-0 space-y-4", mobilePanel && "hidden md:block")}>
          {mediaPane && <div className="space-y-3 xl:hidden">{mediaPane}</div>}
          {children}
        </div>

        {/* Side column — preview or templates browser */}
        <div className={cn(!mobilePanel && "hidden md:block")}>
          {panel === "templates" ? (
            <TemplatePanel
              templates={templates}
              onInsert={handleInsert}
              onRemove={removeTemplate}
              hasConnectedAccount={accounts.length > 0}
              onConnectChannel={() => {
                onOpenChange(false);
                navigate("/dashboard/settings/integrations");
              }}
            />
          ) : (
            preview
          )}
        </div>
      </div>
    </CreateDialogShell>
  );
}

export default ScheduleComposerScaffold;
