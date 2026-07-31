import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight, Loader2, Check, CheckCircle2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { cn } from "@/lib/utils";

function safeNext(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  const reqs = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
  ];
  const metCount = reqs.filter((r) => r.met).length;

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error(result.error.message ?? "Google sign-up failed");
      return;
    }
    if (result.redirected) return;
    navigate(next, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setLoading(true);
    const emailRedirectTo = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo, data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Prefill onboarding Step 1 with the signup name so the wizard opens pre-filled.
    try {
      const KEY = "smmpilot:onboarding";
      const existing = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
      const nextState = {
        completed: !!existing.completed,
        seen: !!existing.seen,
        profile: { ...(existing.profile ?? {}), name: name.trim() || existing?.profile?.name || "" },
      };
      window.localStorage.setItem(KEY, JSON.stringify(nextState));
    } catch { /* ignore */ }
    if (data.session) {
      navigate(next, { replace: true });
    } else {
      setSignedUpEmail(email);
      toast.success("Sign up complete — confirm your email to continue.");
    }
  };

  const resend = async () => {
    if (!signedUpEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: signedUpEmail,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent again.");
  };

  if (signedUpEmail) {
    return (
      <AuthLayout
        eyebrow="Almost there"
        title="Sign up complete"
        subtitle="One last step before your workspace unlocks."
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 border border-emerald-500/30 bg-emerald-500/5 px-6 py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </span>
            <div className="space-y-1.5">
              <p className="text-base font-medium text-foreground">Sign up complete</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Complete the email activation to log in to your workspace. We sent a
                confirmation link to{" "}
                <span className="text-foreground font-medium">{signedUpEmail}</span>.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-sm">
            {[
              "Account created",
              "Workspace reserved",
              "Awaiting email activation",
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-2.5">
                {i < 2 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <MailCheck className="h-4 w-4 text-primary" />
                )}
                <span className={i < 2 ? "text-foreground" : "text-muted-foreground"}>{step}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-none"
              onClick={resend}
              disabled={resending}
            >
              {resending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Resend confirmation email
            </Button>
            <Button
              type="button"
              className="w-full h-11 rounded-none group"
              onClick={() => navigate(`/login?next=${encodeURIComponent(next)}`)}
            >
              Go to sign in
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setSignedUpEmail(null)}
              className="text-foreground underline underline-offset-4"
            >
              Use a different email
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your workspace"
      subtitle="One studio for every social channel — captions, scheduling, analytics and AI copilots."
    >
      <div className="space-y-5">
        <Button
          variant="outline"
          className="w-full h-11 rounded-none border-border/60 hover:bg-muted/40"
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            </svg>
          )}
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-[0.2em]">
            <span className="bg-background px-3 text-muted-foreground">or with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-none border-border/60 bg-transparent"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              Work email
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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
              Password
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

            {password && (
              <div className="pt-1 space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-0.5 flex-1 transition-colors",
                        i < metCount ? "bg-primary" : "bg-border/60",
                      )}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {reqs.map((r) => (
                    <div key={r.label} className="flex items-center gap-1.5 text-[11px]">
                      <Check className={cn("w-3 h-3", r.met ? "text-primary" : "text-muted-foreground/40")} />
                      <span className={r.met ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-snug text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" className="text-foreground underline underline-offset-4">Terms</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-foreground underline underline-offset-4">Privacy Policy</Link>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-none group"
            disabled={!agreeTerms || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />}
          </Button>
        </form>

        <div className="pt-4 border-t border-border/40 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-foreground hover:underline underline-offset-4 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
