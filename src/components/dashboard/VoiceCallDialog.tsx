import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, MicOff, PhoneOff, Volume2, VolumeX, Send, Loader2, AlertCircle, Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceCall } from "@/hooks/useVoiceCall";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onTranscript: (text: string) => Promise<string | void> | string | void;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Ready",
  "requesting-mic": "Requesting microphone",
  listening: "Listening",
  processing: "Thinking",
  speaking: "Speaking",
  error: "Something went wrong",
};

const STATUS_HINT: Record<string, string> = {
  idle: "Tap the mic to begin",
  "requesting-mic": "Allow microphone access to continue",
  listening: "Just talk — I'll listen and act",
  processing: "Working on your request…",
  speaking: "Tap the orb to interrupt",
  error: "Retry or type your request below",
};

export function VoiceCallDialog({ open, onOpenChange, onTranscript }: Props) {
  const call = useVoiceCall({ onTranscript });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) void call.start();
    else call.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [call.messages.length, call.status]);

  const end = () => { call.stop(); onOpenChange(false); };

  const activeGlow = call.status === "speaking" || call.status === "processing";
  const orbScale = 1 + Math.min(0.18, call.amplitude * 0.9);
  const glowScale = 1 + Math.min(0.55, call.amplitude * 1.8);

  const submit = async () => {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    await call.sendText(t);
  };

  const statusPulse = useMemo(() => {
    switch (call.status) {
      case "listening": return "bg-emerald-500";
      case "processing": return "bg-amber-500";
      case "speaking": return "bg-primary";
      case "error": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  }, [call.status]);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : end())}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-border/60 bg-gradient-to-b from-background via-background to-background/95 sm:rounded-3xl shadow-2xl"
        // hide the built-in close so we can render our own
      >
        <DialogTitle className="sr-only">Voice call with AI assistant</DialogTitle>

        {/* Header — the DialogContent close button (rounded circle) sits top-right */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-2 pr-14 border-b border-border/40">
          <span className={cn("h-2 w-2 rounded-full animate-pulse", statusPulse)} />
          <div>
            <p className="text-sm font-semibold tracking-tight leading-tight">
              {STATUS_LABEL[call.status] ?? call.status}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {STATUS_HINT[call.status] ?? ""}
            </p>
          </div>
        </div>

        {/* Orb + waveform */}
        <div className="relative flex flex-col items-center px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={call.status === "speaking" ? call.stopSpeaking : undefined}
            className="relative h-32 w-32 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label={call.status === "speaking" ? "Interrupt assistant" : "AI voice orb"}
          >
            {/* soft outer glow — primary only */}
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full blur-3xl transition-all duration-300 bg-primary/25",
                activeGlow && "bg-primary/40",
              )}
              style={{ transform: `scale(${glowScale})` }}
            />
            {/* ring pulse */}
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full border border-primary/30",
                call.status === "listening" && "animate-ping",
              )}
            />
            {/* glassmorphic core */}
            <div
              className="relative h-24 w-24 rounded-full flex items-center justify-center border border-primary/30 bg-primary/15 backdrop-blur-xl shadow-[inset_0_1px_0_hsl(var(--primary-foreground)/0.15),0_12px_40px_-12px_hsl(var(--primary)/0.55)] transition-transform duration-100"
              style={{ transform: `scale(${orbScale})` }}
            >
              {/* inner highlight */}
              <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-b from-primary-foreground/20 via-transparent to-transparent pointer-events-none" />
              {call.status === "processing" ? (
                <Loader2 className="relative h-8 w-8 text-primary animate-spin" />
              ) : call.status === "error" ? (
                <AlertCircle className="relative h-8 w-8 text-destructive" />
              ) : (
                <Sparkles className="relative h-8 w-8 text-primary" strokeWidth={1.75} />
              )}
            </div>
          </button>

          {/* live waveform bars */}
          <div className="mt-5 flex items-end justify-center gap-[3px] h-8 w-full max-w-[240px]">
            {call.bars.map((v, i) => {
              const h = Math.max(4, Math.min(32, 4 + v * 46));
              const active = call.status === "listening" && !call.muted;
              return (
                <span
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-[height,background] duration-75",
                    active ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>

          {call.error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{call.error}</span>
              <button
                className="underline underline-offset-2 hover:text-destructive/80"
                onClick={() => call.start()}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Conversation transcript */}
        <div
          ref={scrollRef}
          className="px-4 pb-3 max-h-[260px] min-h-[80px] overflow-y-auto space-y-2"
        >
          {call.messages.length === 0 && !call.error ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Just talk — the assistant listens and acts. You can also type below.
            </p>
          ) : (
            call.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 text-foreground rounded-bl-md border border-border/40",
                  )}
                >
                  {m.role === "assistant" && (
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Assistant
                    </p>
                  )}
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))
          )}
          {call.status === "processing" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted/60 border border-border/40 px-3.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Composer + controls */}
        <div className="border-t border-border/40 bg-muted/20 px-3 py-3 space-y-2">
          <form
            onSubmit={(e) => { e.preventDefault(); void submit(); }}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 pl-3 pr-1.5 py-1.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition"
          >
            <button
              type="button"
              onClick={call.toggleMute}
              aria-label={call.muted ? "Unmute microphone" : "Mute microphone"}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center transition",
                call.muted
                  ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {call.muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type to ask…"
              aria-label="Type a message to the assistant"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={call.toggleSpeaker}
              aria-label={call.speakerOn ? "Mute speaker" : "Unmute speaker"}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center transition",
                call.speakerOn
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {call.speakerOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={end}
              aria-label="End call"
              className="h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <PhoneOff className="h-3.5 w-3.5" />
            </Button>
          </form>

          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-mono">Esc</kbd> end
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-mono">↵</kbd> send text
            </span>
            <span>·</span>
            <span>Tap orb to interrupt</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
