import { useState } from "react";
import { CompanyLayout } from "./CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, LifeBuoy, Briefcase, ShieldCheck } from "lucide-react";

const channels = [
  { icon: LifeBuoy, title: "Product support", body: "Bugs, connected channels, publishing issues.", email: "support@smmsaas.com" },
  { icon: Briefcase, title: "Sales & partnerships", body: "Agency plans, volume pricing, integrations.", email: "sales@smmsaas.com" },
  { icon: ShieldCheck, title: "Privacy & legal", body: "Data requests, DPAs, security questions.", email: "legal@smmsaas.com" },
  { icon: Mail, title: "Everything else", body: "Press, feedback, or just saying hello.", email: "hello@smmsaas.com" },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(topic || `Message from ${name || "the website"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:hello@smmsaas.com?subject=${subject}&body=${body}`;
    toast.success("Opening your email client…");
  };

  return (
    <CompanyLayout
      eyebrow="Contact"
      title="Talk to the team"
      subtitle="Questions about the product, your plan, or a workflow you'd like us to support? Pick a channel or send a note."
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-16 items-start">
        <form onSubmit={submit} className="space-y-5 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Subject</Label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What is this about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={7} placeholder="Tell us what you need…" required />
          </div>
          <Button type="submit" className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
            Send message
          </Button>
          <p className="text-xs text-muted-foreground">
            We reply to most messages within one business day.
          </p>
        </form>

        <aside className="space-y-4">
          {channels.map((c) => (
            <div key={c.email} className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <c.icon className="w-4 h-4 text-primary" />
                <h3 className="font-['Instrument_Serif'] text-lg">{c.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              <a href={`mailto:${c.email}`} className="text-sm text-primary hover:underline">
                {c.email}
              </a>
            </div>
          ))}
        </aside>
      </div>
    </CompanyLayout>
  );
}
