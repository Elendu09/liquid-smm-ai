import { Link } from "react-router-dom";
import {
  Cable,
  KeyRound,
  Plug,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp`;

const TOOLS = [
  { name: "whoami", desc: "Identity of the connected user" },
  { name: "get_user_profile", desc: "Signed-in user profile & claims" },
  { name: "get_automation_settings", desc: "Bot posture, guardrails, platforms" },
  { name: "list_platforms", desc: "Supported social networks" },
  { name: "list_scheduled_posts", desc: "Queued cross-platform posts" },
  { name: "queue_cross_platform_post", desc: "Draft a scheduled post plan" },
  { name: "list_captions", desc: "Caption library" },
  { name: "create_caption_draft", desc: "Add a caption draft" },
  { name: "list_competitors", desc: "Tracked competitors across platforms" },
  { name: "add_competitor", desc: "Start tracking a competitor" },
  { name: "list_rss_feeds", desc: "RSS automation feeds & status" },
  { name: "list_notifications", desc: "Recent alerts & milestones" },
  { name: "get_credits", desc: "AI credit balance & ledger" },
  { name: "get_referral_status", desc: "Referral code, link & earnings" },
];

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "smm-app-mcp": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

export default function Mcp() {
  const [copied, setCopied] = useState(false);
  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_CONFIG);
      setCopied(true);
      toast.success("MCP config copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy config");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary">
              <Cable className="h-3 w-3 mr-1" /> Model Context Protocol
            </Badge>
          </div>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl mt-4 leading-[1.05] max-w-3xl">
            Drive your entire social workspace <span className="italic text-primary">from an AI agent.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            The SMMSAAS MCP server lets Claude, Cursor, or any MCP client read and control your
            publishing queue, caption library, competitor tracking, RSS automation, notifications,
            credits and referrals — over OAuth, scoped to your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={copyConfig} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy connect config"}
            </Button>
            <Link to="/dashboard/integrations">
              <Button variant="outline" className="gap-2">
                Dashboard MCP <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-14">
        {/* Connect */}
        <section>
          <h2 className="font-['Instrument_Serif'] text-3xl mb-6">Connect in 30 seconds</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Endpoint</span>
              </div>
              <code className="block rounded-lg bg-muted/60 border border-border/50 px-3 py-2 text-xs break-all font-mono">
                {MCP_URL}
              </code>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Add it to Claude Code, Claude Desktop, Cursor, or any MCP client. On first use you'll
                authorize with your SMMSAAS account (Supabase OAuth) — every request is scoped to that user.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { icon: Plug, t: "Zero-scope by default", d: "Only your own data, via row-level security." },
                  { icon: KeyRound, t: "OAuth, not API keys", d: "No tokens to manage or leak." },
                  { icon: ShieldCheck, t: "Write tools need approval", d: "Destructive actions are confirmed inside the app." },
                ].map((f) => (
                  <div key={f.t} className="flex items-start gap-2.5 text-xs">
                    <f.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{f.t}.</span>{" "}
                      <span className="text-muted-foreground">{f.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-mono">claude_desktop_config.json</span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={copyConfig}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto text-muted-foreground">{CLAUDE_CONFIG}</pre>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section>
          <h2 className="font-['Instrument_Serif'] text-3xl mb-2">Everything you can drive</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xl">
            {TOOLS.length} tools covering publishing, captions, competitors, RSS, notifications, credits and referrals.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <code className="text-xs font-semibold text-foreground">{t.name}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
