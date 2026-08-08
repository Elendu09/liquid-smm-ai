import { useCallback, useEffect, useState } from "react";

/**
 * useCookieConsent
 *
 * Tiny GDPR-style consent store. The banner is the *only* place this
 * hook reads from localStorage; everything else treats the consent
 * record as a black box.
 *
 * Consent record shape:
 *   { essential: true, analytics: boolean, marketing: boolean,
 *     decidedAt: ISO timestamp, version: 1 }
 *
 * `essential` is always true and not user-controlled. The
 * `version` field lets us re-prompt if we ever change the categories.
 */

export type ConsentDecision = "accepted" | "rejected" | "custom";

export interface ConsentRecord {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: number;
  /** "accepted" = all on, "rejected" = only essential, "custom" = mixed */
  decision: ConsentDecision;
}

const STORAGE_KEY = "smmpilot:cookie-consent";
const CONSENT_VERSION = 1;

function readStored(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.marketing !== "boolean") return null;
    return parsed;
  } catch { return null; }
}

function writeStored(record: ConsentRecord) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* ignore */ }
}

export function useCookieConsent() {
  // We start as null and resolve in a useEffect so SSR and the first
  // client render agree. This avoids hydration warnings.
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setRecord(stored);
    // Show the banner the first time the user lands. If they've already
    // chosen (any version), we don't re-prompt.
    if (!stored) {
      // Small delay so the banner doesn't appear before the page settles.
      const t = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const accept = useCallback(() => {
    const next: ConsentRecord = {
      essential: true,
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      decision: "accepted",
    };
    writeStored(next);
    setRecord(next);
    setOpen(false);
  }, []);

  const reject = useCallback(() => {
    const next: ConsentRecord = {
      essential: true,
      analytics: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      decision: "rejected",
    };
    writeStored(next);
    setRecord(next);
    setOpen(false);
  }, []);

  const save = useCallback((analytics: boolean, marketing: boolean) => {
    const next: ConsentRecord = {
      essential: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      decision: "custom",
    };
    writeStored(next);
    setRecord(next);
    setOpen(false);
  }, []);

  const reopen = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  return { record, open, accept, reject, save, reopen, close };
}
