import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, Check, X, History, ArrowUpRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAiCommandHistory, type AiCommandAction } from "@/hooks/useAiCommandHistory";
import { useOnboarding } from "@/hooks/useOnboarding";
import { enqueueInbox } from "@/hooks/useMcpInbox";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PlanResponse {
  message: string;
  actions: Array<{
    tool: string;
    description: string;
    targetRoute?: string;
    payload?: Record<string, unknown>;
    kind?: "caption-draft" | "scheduled-post" | "navigate";
  }>;
}

const SUGGESTIONS = [
  "Draft 5 captions about my niche for next week",
  "Schedule 3 posts across my platforms for Monday morning",
  "Show me my worst-performing posts this month",
  "Reply to all positive comments today",
];

export function AiCommandBar() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const { items, add, update, clear } = useAiCommandHistory();
  const { state } = useOnboarding();
  const navigate = useNavigate();

  const submit = async (text?: string) => {
    const finalPrompt = (text ?? prompt).trim();
    if (!finalPrompt || loading) return;
    setLoading(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-command", {
        body: { prompt: finalPrompt, profile: state.profile },
      });
      if (error) throw error;
      const result = data as PlanResponse;
      setPlan(result);
      const entry = add({
        prompt: finalPrompt,
        message: result.message,
        status: "pending",
        actions: result.actions.map((a) => ({
          tool: a.tool,
          description: a.description,
          targetRoute: a.targetRoute,
          status: "planned" as const,
        })),
      });
      setCurrentId(entry.id);
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI command failed");
    } finally {
      setLoading(false);
    }
  };

  const approve = () => {
    if (!plan || !currentId) return;
    const applied: AiCommandAction[] = plan.actions.map((a) => {
      let resourceId: string | undefined;
      if (a.kind === "caption-draft" || a.kind === "scheduled-post") {
        const item = enqueueInbox({
          kind: a.kind,
          source: "ai-command",
          needsApproval: state.profile.autonomy !== "auto",
          payload: a.payload ?? {},
        });
        resourceId = item.id;
      }
      return {
        tool: a.tool,
        description: a.description,
        targetRoute: a.targetRoute,
        resourceId,
        status: "applied" as const,
      };
    });
    update(currentId, { status: "applied", actions: applied });
    toast.success("Actions queued — review them in the affected page.");
    const firstRoute = applied.find((a) => a.targetRoute)?.targetRoute;
    setPlan(null);
    setCurrentId(null);
    if (firstRoute) navigate(firstRoute);
  };

  const reject = () => {
    if (currentId) update(currentId, { status: "rejected" });
    setPlan(null);
    setCurrentId(null);
    toast("Plan discarded");
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">AI Command</h2>
            <p className="text-[11px] text-muted-foreground">
              Tell your assistant what to do — it'll plan the steps and apply them across the app.
            </p>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Command history">
              <History className="h-4 w-4" />
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                  {items.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Recent commands</span>
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
                    Clear
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No commands yet. Try asking the assistant to do something.
                </p>
              ) : (
                items.map((it) => (
                  <div key={it.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{it.prompt}</p>
                      <Badge
                        variant={it.status === "applied" ? "default" : "outline"}
                        className="text-[10px] shrink-0"
                      >
                        {it.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true })}
                    </p>
                    {it.actions.length > 0 && (
                      <ul className="space-y-1">
                        {it.actions.map((a, i) => (
                          <li key={i} className="text-xs flex items-center gap-1.5">
                            <span className="text-muted-foreground">·</span>
                            <span className="flex-1">{a.description}</span>
                            {a.targetRoute && (
                              <Link
                                to={a.targetRoute + (a.resourceId ? `?highlight=${a.resourceId}` : "")}
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                Open <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="e.g. Draft 3 captions about my new product launch and schedule them for next Monday morning."
          rows={2}
          className="pr-24 resize-none"
          disabled={loading}
        />
        <Button
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={() => submit()}
          disabled={loading || !prompt.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Run</>}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Wand2 className="h-3 w-3 text-primary" />
            {s}
          </button>
        ))}
      </div>

      {plan && (
        <div className={cn(
          "rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3 animate-in fade-in slide-in-from-top-2",
        )}>
          <p className="text-sm">{plan.message}</p>
          {plan.actions.length > 0 && (
            <ul className="space-y-1.5">
              {plan.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p>{a.description}</p>
                    <p className="text-[11px] text-muted-foreground">{a.tool}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={approve} className="flex-1">
              <Check className="h-4 w-4 mr-1" /> Approve & apply
            </Button>
            <Button size="sm" variant="outline" onClick={reject}>
              <X className="h-4 w-4 mr-1" /> Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
