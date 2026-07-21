import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle2 } from "lucide-react";

/**
 * Public invite acceptance page. Handles both flows:
 *  1. Signed-in user → immediately calls `accept_team_invite` RPC.
 *  2. Signed-out user → routes to /login?next=/invite/:token, returns here.
 */
export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "auth" | "accepting" | "done" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("auth");
        return;
      }
      void accept();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setStatus("accepting");
    const { error } = await supabase.rpc("accept_team_invite", { _token: token });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("done");
    toast.success("Invite accepted — welcome to the team");
    setTimeout(() => navigate("/dashboard/team"), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">Team invitation</CardTitle>
          <CardDescription>
            You've been invited to collaborate on an SMMSAAS workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">Checking your invite…</p>
          )}
          {status === "auth" && (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to accept this invite.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate(`/login?next=/invite/${token}`)}>Sign in</Button>
                <Button variant="outline" onClick={() => navigate(`/signup?next=/invite/${token}`)}>
                  Create an account
                </Button>
              </div>
            </>
          )}
          {status === "accepting" && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Accepting invite…
            </p>
          )}
          {status === "done" && (
            <p className="text-sm text-primary flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Accepted — redirecting…
            </p>
          )}
          {status === "error" && (
            <>
              <p className="text-sm text-destructive">{message || "Invite invalid or expired."}</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
