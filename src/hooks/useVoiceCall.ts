import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceCallStatus =
  | "idle"
  | "requesting-mic"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface VoiceTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
}

interface Options {
  onTranscript: (text: string) => Promise<string | void> | string | void;
  windowMs?: number;
  silenceGapMs?: number;
}

// Encode Float32 PCM at srcRate into a 16-bit mono WAV Blob resampled to 16 kHz.
function encodeWav(chunks: Float32Array[], srcRate: number): Blob {
  const targetRate = 16000;
  let total = 0;
  for (const c of chunks) total += c.length;
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  const ratio = srcRate / targetRate;
  const outLen = Math.floor(merged.length / ratio);
  const down = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(i0 + 1, merged.length - 1);
    const t = src - i0;
    down[i] = merged[i0] * (1 - t) + merged[i1] * t;
  }
  const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, down[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, pcm.byteLength, true);
  new Int16Array(buffer, 44).set(pcm);
  return new Blob([buffer], { type: "audio/wav" });
}

let TURN_ID = 0;
const nextId = () => `t${Date.now().toString(36)}${(TURN_ID++).toString(36)}`;

export function useVoiceCall(opts: Options) {
  const { onTranscript, windowMs = 4500, silenceGapMs = 900 } = opts;
  const [status, setStatus] = useState<VoiceCallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [amplitude, setAmplitude] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(24).fill(0));
  const [messages, setMessages] = useState<VoiceTurn[]>([]);
  const [partial, setPartial] = useState<string>("");

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const windowStartRef = useRef<number>(0);
  const lastVoiceRef = useRef<number>(0);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const speakerRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { speakerRef.current = speakerOn; if (audioRef.current) audioRef.current.muted = !speakerOn; }, [speakerOn]);

  const pushTurn = useCallback((role: "user" | "assistant", text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role, text, at: Date.now() }]);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* noop */ }
      audioRef.current.src = "";
    }
    if (activeRef.current) setStatus("listening");
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || !speakerRef.current) {
      if (activeRef.current) setStatus("listening");
      return;
    }
    try {
      setStatus("speaking");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-speak`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const audioBlob = await res.blob();
      const objectUrl = URL.createObjectURL(audioBlob);
      const el = audioRef.current ?? new Audio();
      audioRef.current = el;
      el.src = objectUrl;
      el.muted = !speakerRef.current;
      await el.play().catch(() => {});
      await new Promise<void>((resolve) => {
        const done = () => { el.removeEventListener("ended", done); el.removeEventListener("error", done); resolve(); };
        el.addEventListener("ended", done);
        el.addEventListener("error", done);
      });
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (activeRef.current) setStatus("listening");
    }
  }, []);

  const runTurn = useCallback(async (userText: string) => {
    pushTurn("user", userText);
    setPartial("");
    setStatus("processing");
    try {
      const reply = await onTranscript(userText);
      if (reply && typeof reply === "string") {
        pushTurn("assistant", reply);
        await speak(reply);
      } else if (activeRef.current) {
        setStatus("listening");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      if (activeRef.current) setStatus("listening");
    }
  }, [onTranscript, pushTurn, speak]);

  const sendText = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || busyRef.current) return;
    busyRef.current = true;
    try { await runTurn(t); } finally { busyRef.current = false; }
  }, [runTurn]);

  const flushWindow = useCallback(async () => {
    if (busyRef.current) return;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    windowStartRef.current = performance.now();
    lastVoiceRef.current = 0;
    if (!chunks.length || !ctxRef.current) return;
    const blob = encodeWav(chunks, ctxRef.current.sampleRate);
    if (blob.size < 4096) return;
    busyRef.current = true;
    try {
      setStatus("processing");
      const form = new FormData();
      form.append("file", blob, "chunk.wav");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Transcribe ${res.status}: ${txt.slice(0, 120)}`);
      }
      const data = await res.json().catch(() => ({}));
      const text = String((data.text ?? "") as string).trim();
      if (!text) {
        if (activeRef.current) setStatus("listening");
        return;
      }
      await runTurn(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      if (activeRef.current) setStatus("listening");
    } finally {
      busyRef.current = false;
    }
  }, [runTurn]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { processorRef.current?.disconnect(); } catch { /* noop */ }
    try { analyserRef.current?.disconnect(); } catch { /* noop */ }
    processorRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    chunksRef.current = [];
    setAmplitude(0);
    setBars(Array(24).fill(0));
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setMessages([]);
    setPartial("");
    setStatus("requesting-mic");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      windowStartRef.current = performance.now();
      lastVoiceRef.current = 0;
      activeRef.current = true;

      processor.onaudioprocess = (e) => {
        if (!activeRef.current || mutedRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input.length);
        copy.set(input);
        chunksRef.current.push(copy);
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        const now = performance.now();
        if (rms > 0.02) lastVoiceRef.current = now;
        const elapsed = now - windowStartRef.current;
        const silence = lastVoiceRef.current ? now - lastVoiceRef.current : 0;
        if (elapsed > windowMs || (lastVoiceRef.current && silence > silenceGapMs && elapsed > 1500)) {
          void flushWindow();
        }
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(ctx.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 24;
      const tick = () => {
        if (!activeRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let s = 0;
        for (let i = 0; i < data.length; i++) s += data[i];
        setAmplitude(s / data.length / 255);
        // sample bars from the low-mid frequency range
        const bucket = Math.floor(data.length / barCount);
        const nextBars = new Array(barCount);
        for (let i = 0; i < barCount; i++) {
          let acc = 0;
          for (let j = 0; j < bucket; j++) acc += data[i * bucket + j];
          nextBars[i] = (acc / bucket) / 255;
        }
        setBars(nextBars);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setStatus("listening");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const denied = msg.includes("Permission") || msg.toLowerCase().includes("denied") || msg.includes("NotAllowed");
      setError(denied ? "Microphone blocked" : msg);
      setStatus("error");
    }
  }, [flushWindow, windowMs, silenceGapMs]);

  useEffect(() => () => stop(), [stop]);

  const toggleMute = useCallback(() => setMuted((v) => !v), []);
  const toggleSpeaker = useCallback(() => setSpeakerOn((v) => !v), []);
  const clear = useCallback(() => { setMessages([]); setPartial(""); }, []);

  return {
    status, error, muted, speakerOn, amplitude, bars,
    messages, partial,
    start, stop, toggleMute, toggleSpeaker, sendText, stopSpeaking, clear,
  };
}
