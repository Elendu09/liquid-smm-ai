import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase places the recovery token in the URL hash and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check current session in case the event fired before mount.
    supabase.auth.getSession().then(({ data }) => {
      const hash = window.location.hash || "";
      if (data.session || hash.includes("type=recovery")) setReady(true);
      else if (!hash) setInvalid(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      eyebrow="Secure your account"
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before. You'll be signed in automatically."
    >
      {invalid ? (
        <div className="space-y-5 text-center">
          <h3 className="font-['Instrument_Serif'] text-2xl">Link expired</h3>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has already been used. Request a new one to continue.
          </p>
          <Button asChild className="w-full h-11 rounded-none">
            <Link to="/forgot-password">Request new link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-none border-border/60 bg-transparent pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirm password
            </Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-none border-border/60 bg-transparent"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>We never store your password in plain text. Reset links expire after a single use.</span>
          </div>

          <Button type="submit" className="w-full h-11 rounded-none group" disabled={loading || !ready}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? "Updating..." : "Update password"}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
