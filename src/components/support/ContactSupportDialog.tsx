import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategory?: string;
}

const CATEGORIES = ["Bug", "Feedback", "Billing", "Feature request", "Other"];
const KEY = "smmpilot:support-tickets";

export function ContactSupportDialog({ open, onOpenChange, defaultCategory = "Feedback" }: Props) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please add a subject and message.");
      return;
    }
    setSubmitting(true);
    try {
      const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
      existing.unshift({
        id: crypto.randomUUID(),
        subject,
        category,
        email,
        message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 50)));
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Message sent", {
        description: "Our team typically replies within 24 hours.",
      });
      setSubject("");
      setMessage("");
      setEmail("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>
            Send us a message and we'll get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cs-subject">Subject</Label>
            <Input
              id="cs-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your question"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cs-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cs-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-email">Email (optional)</Label>
              <Input
                id="cs-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-message">Message</Label>
            <Textarea
              id="cs-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Tell us what's going on…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
