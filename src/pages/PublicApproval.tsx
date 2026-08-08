import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, MessageSquareWarning, ShieldCheck, Clock3, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useExternalApprovals } from "@/hooks/useExternalApprovals";
import { useNotifications } from "@/hooks/useNotifications";
import { useRunHistory } from "@/hooks/useRunHistory";
import { platforms } from "@/config/platforms";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";

/**
 * PublicApproval
 *
 * Fix 4.3 — clients never create an account. A workspace generates a
 * magic-link approval token; the client opens this page, reviews a frozen
 * snapshot of the post, and approves / rejects / requests changes. Every
 * action is logged in `external_approval_events` for the audit trail and
 * surfaces back in the workspace as a notification + run-history row.
 */
export default function PublicApproval() {
  const { token } = useParams<{ token: string }>();
  const { byToken, recordAction } = useExternalApprovals();
  const { push } = useNotifications();
  const { logRun } = useRunHistory();
  const [note, setNote] = useState("");
  const [resolved, setResolved] = useState<null | "approved" | "rejected" | "changes_requested">(null);

  const approval = useMemo(() => (token ? byToken(token) : null), [token, byToken]);

  useEffect(() => {
    if (!approval || !token) return;
    // Log a "viewed" event the first time this token is opened in this session.
    const seen = sessionStorage.getItem(`ea:viewed:${token}`);
    if (!seen) {
      recordAction(approval.id, "viewed", approval.recipientEmail);
      sessionStorage.setItem(`ea:viewed:${token}`, "1");
    }
  }, [approval, token, recordAction]);

  if (!approval) {
    return (
      <Page>
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">This approval link isn't valid</h1>
              <p className="text-xs text-muted-foreground">It may have been deleted, revoked, or never existed.</p>
            </div>
          </div>
        </Card>
        <Footer />
      </Page>
    );
  }

  const expired = new Date(approval.expiresAt).getTime() < Date.now();

  const decide = (action: "approved" | "rejected" | "changes_requested") => {
    recordAction(approval.id, action, approval.recipientEmail, note.trim() || undefined);
    setResolved(action);
    logRun({
      toolKey: "approval",
      action: `external.${action}`,
      status: action === "approved" ? "success" : action === "rejected" ? "failed" : "pending",
      input: { draftId: approval.draftId, recipientEmail: approval.recipientEmail },
      output: { note },
      durationMs: 0,
    });
    void push({
      type: "system",
      severity: action === "approved" ? "success" : action === "rejected" ? "warning" : "info",
      title:
        action === "approved" ? "Client approved your draft" :
        action === "rejected" ? "Client rejected your draft" :
        "Client requested changes",
      message: `${approval.recipientName ?? approval.recipientEmail} on ${platforms.find((p) => p.id === approval.postSnapshot.platforms[0])?.name ?? "your draft"}${note ? `: "${note.slice(0, 80)}"` : ""}`,
      actionUrl: "/dashboard/publish/queue",
      groupKey: `ea:${approval.id}:${action}`,
    });
  };

  return (
    <Page>
      <Card>
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">Review &amp; approve</h1>
            <p className="text-xs text-muted-foreground">
              Hi {approval.recipientName ?? "there"} — here's a draft from the team waiting for your sign-off.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            {expired ? "Link expired" : `Expires ${new Date(approval.expiresAt).toLocaleString()}`}
          </div>
        </header>

        {expired || approval.status === "rejected" || approval.status === "approved" || approval.status === "changes_requested" || resolved ? (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-center">
            {resolved || approval.status === "approved" ? (
              <>
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold">You approved this draft</p>
                <p className="mt-1 text-xs text-muted-foreground">The team has been notified.</p>
              </>
            ) : approval.status === "rejected" ? (
              <>
                <XCircle className="mx-auto h-7 w-7 text-rose-500" />
                <p className="mt-2 text-sm font-semibold">You rejected this draft</p>
                <p className="mt-1 text-xs text-muted-foreground">The team will follow up with you.</p>
              </>
            ) : approval.status === "changes_requested" ? (
              <>
                <MessageSquareWarning className="mx-auto h-7 w-7 text-amber-500" />
                <p className="mt-2 text-sm font-semibold">You requested changes</p>
                <p className="mt-1 text-xs text-muted-foreground">The team is reviewing your notes.</p>
              </>
            ) : (
              <>
                <Clock3 className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">This link has expired</p>
                <p className="mt-1 text-xs text-muted-foreground">Reply to the original email and we'll send a fresh one.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {approval.postSnapshot.platforms.map((p) => {
                  const platform = platforms.find((x) => x.id === p);
                  return (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {platform?.name ?? p}
                    </span>
                  );
                })}
                {approval.postSnapshot.scheduledAt && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    <Clock3 className="h-2.5 w-2.5" /> {new Date(approval.postSnapshot.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>
              {approval.postSnapshot.mediaUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                  <img src={approval.postSnapshot.mediaUrl} alt="" className="w-full object-cover" />
                </div>
              )}
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
{approval.postSnapshot.caption}
              </pre>
            </section>

            <section className="mt-4">
              <label htmlFor="note" className="text-xs font-semibold">Add a note (optional)</label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything we should change before this goes live?"
                rows={3}
                className="mt-1.5 text-xs"
              />
            </section>

            <section className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button
                onClick={() => decide("approved")}
                className="bg-emerald-500/90 hover:bg-emerald-500 text-white"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
              </Button>
              <Button variant="outline" onClick={() => decide("changes_requested")}>
                <MessageSquareWarning className="mr-1.5 h-4 w-4" /> Request changes
              </Button>
              <Button variant="ghost" className="text-rose-500 hover:text-rose-600" onClick={() => decide("rejected")}>
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            </section>
          </>
        )}

        <div className="mt-6 border-t border-border/60 pt-4 text-[10px] text-muted-foreground">
          <p className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Powered by SMMSAAS · You don't need an account — this is a one-time, signed link.
          </p>
        </div>
      </Card>
      <Footer />
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-primary/[0.04]">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 self-start rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3 w-3" /> smmsaas
        </Link>
        {children}
      </div>
      <ScrollToTopButton />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-xl sm:p-6">
      {children}
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-[10px] text-muted-foreground">
      © {new Date().getFullYear()} SMMSAAS · Public approval page
    </p>
  );
}
