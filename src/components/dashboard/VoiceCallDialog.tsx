import { useEffect } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Sparkles } from "lucide-react";
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
  "requesting-mic": "Requesting microphone…",
  listening: "Listening…",
  processing: "Thinking…",
  speaking: "Speaking…",
  error: "Error",
};

export function VoiceCallDialog({ open, onOpenChange, onTranscript }: Props) {
  const call = useVoiceCall({ onTranscript });

  useEffect(() => {
    if (open) void call.start();
    else call.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const end = () => {
    call.stop();
    onOpenChange(false);
  };

  const scale = 1 + Math.min(0.4, call.amplitude * 1.4);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : end())}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/60 bg-gradient-to-b from-background to-background/95 sm:rounded-3xl">
        <DialogTitle className="sr-only">Voice call with AI</DialogTitle>
        <div className="relative flex flex-col items-center px-6 pt-8 pb-6">
          <div className="relative h-40 w-40 flex items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-brand-purple/30 to-brand-cyan/40 blur-2xl transition-transform"
              style={{ transform: `scale(${scale})` }}
            />
            <div
              className="relative h-28 w-28 rounded-full bg-gradient-to-br from-primary to-brand-purple flex items-center justify-center shadow-[0_10px_40px_-8px_hsl(var(--primary)/0.6)] ring-1 ring-inset ring-white/20 transition-transform"
              style={{ transform: `scale(${1 + Math.min(0.15, call.amplitude * 0.6)})` }}
            >
              <Sparkles className="h-9 w-9 text-primary-foreground" strokeWidth={1.75} />
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm font-semibold tracking-tight">
              {STATUS_LABEL[call.status] ?? call.status}
            </p>
            {call.error && (
              <p className="mt-1 text-xs text-destructive">
                {call.error}{" "}
                {call.error === "Microphone blocked" && (
                  <button className="underline underline-offset-2" onClick={() => call.start()}>
                    Retry
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="mt-5 w-full max-h-40 overflow-y-auto space-y-2 text-sm">
            {call.transcript && (
              <div className="rounded-xl bg-muted/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">You</p>
                <p className="text-foreground/90 leading-snug">{call.transcript}</p>
              </div>
            )}
            {call.assistantText && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">Assistant</p>
                <p className="text-foreground/90 leading-snug whitespace-pre-line">{call.assistantText}</p>
              </div>
            )}
            {!call.transcript && !call.assistantText && (
              <p className="text-center text-xs text-muted-foreground py-6">
                Just talk — the assistant listens and acts.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              type="button" size="icon" variant="secondary"
              onClick={call.toggleMute}
              aria-label={call.muted ? "Unmute microphone" : "Mute microphone"}
              className={cn("h-12 w-12 rounded-full", call.muted && "bg-destructive/15 text-destructive hover:bg-destructive/20")}
            >
              {call.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              type="button" size="icon" onClick={end}
              aria-label="End call"
              className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_8px_24px_-6px_hsl(var(--destructive)/0.5)]"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              type="button" size="icon" variant="secondary"
              onClick={call.toggleSpeaker}
              aria-label={call.speakerOn ? "Mute speaker" : "Unmute speaker"}
              className={cn("h-12 w-12 rounded-full", !call.speakerOn && "bg-muted text-muted-foreground")}
            >
              {call.speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
