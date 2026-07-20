import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="Enter the email tied to your workspace and we'll send you a secure reset link."
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full border border-border/50 flex items-center justify-center bg-primary/5">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-['Instrument_Serif'] text-2xl">Check your inbox</h3>
            <p className="text-sm text-muted-foreground">
              We sent a reset link to <span className="text-foreground">{email}</span>. It expires in 60 minutes.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full h-11 rounded-none">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-none border-border/60 bg-transparent"
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-none group" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? "Sending..." : "Send reset link"}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />}
          </Button>

          <div className="pt-4 border-t border-border/40 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-foreground hover:underline underline-offset-4 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
