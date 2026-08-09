/**
 * Media validator.
 *
 * Fix 2.1 — aspect ratio rejections. Every platform has its own
 * accepted aspect ratios, duration caps, and file-size budgets. This
 * module inspects an image or video and returns a per-platform list
 * of issues ("too long for Reels", "aspect ratio not supported",
 * "oversize for free Twitter video"). The UI surfaces these as
 * chips + a fix suggestion in the composer / scheduler.
 *
 * The validator operates on metadata passed in by the uploader (so we
 * can run it before the file ever hits the network). It also runs
 * after upload to catch mismatches.
 */

export type MediaKind = "image" | "video";

export interface MediaMeta {
  kind: MediaKind;
  /** Source URL of the media, when known. */
  url?: string;
  /** Width in pixels. */
  width?: number;
  /** Height in pixels. */
  height?: number;
  /** Duration in seconds (videos only). */
  durationSec?: number;
  /** File size in bytes. */
  bytes?: number;
  /** MIME type, e.g. "video/mp4". */
  mime?: string;
}

export type PlatformId =
  | "x" | "twitter"
  | "threads" | "bluesky"
  | "instagram" | "facebook"
  | "linkedin" | "tiktok" | "youtube" | "pinterest";

export type IssueSeverity = "ok" | "info" | "warning" | "error";

export interface MediaIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  detail: string;
  fix?: string;
  platform: PlatformId | "any";
}

interface RatioSpec {
  /** Whitelist of accepted aspect ratios as width/height numbers. */
  ratios: { w: number; h: number; label: string }[];
  /** Maximum duration in seconds. undefined = no cap. */
  maxDurationSec?: number;
  /** Maximum file size in MB. */
  maxMb: number;
  /** Accepted MIME types. */
  mimes?: string[];
  /** Human-friendly label. */
  label: string;
}

const RATIOS = (rows: Array<[number, number]>) => rows.map(([w, h]) => ({
  w, h, label: simplifyRatio(w, h),
}));

function simplifyRatio(w: number, h: number): string {
  const gcd = (a: number, b: number) => b === 0 ? a : gcd(b, a % b);
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

const SPECS: Record<PlatformId, RatioSpec> = {
  x: {
    label: "X / Twitter",
    ratios: RATIOS([[16, 9], [4, 5], [1, 1]]),
    maxDurationSec: 140,
    maxMb: 512,
    mimes: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
  twitter: {
    label: "X / Twitter",
    ratios: RATIOS([[16, 9], [4, 5], [1, 1]]),
    maxDurationSec: 140,
    maxMb: 512,
    mimes: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
  threads: {
    label: "Threads",
    ratios: RATIOS([[1, 1], [4, 5]]),
    maxDurationSec: 300,
    maxMb: 1000,
  },
  bluesky: {
    label: "Bluesky",
    ratios: RATIOS([[1, 1]]),
    maxMb: 1,
  },
  instagram: {
    label: "Instagram",
    ratios: RATIOS([[1, 1], [4, 5], [1.91, 1], [9, 16]]),
    maxDurationSec: 90, // Reels
    maxMb: 100,
  },
  facebook: {
    label: "Facebook",
    ratios: RATIOS([[1, 1], [4, 5], [16, 9], [9, 16]]),
    maxDurationSec: 14400,
    maxMb: 4000,
  },
  linkedin: {
    label: "LinkedIn",
    ratios: RATIOS([[1, 1], [4, 5], [1.91, 1]]),
    maxDurationSec: 600,
    maxMb: 200,
  },
  tiktok: {
    label: "TikTok",
    ratios: RATIOS([[9, 16]]),
    maxDurationSec: 600,
    maxMb: 287,
  },
  youtube: {
    label: "YouTube",
    ratios: RATIOS([[16, 9], [9, 16]]),
    maxDurationSec: 60, // Shorts
    maxMb: 256000,
  },
  pinterest: {
    label: "Pinterest",
    ratios: RATIOS([[2, 3], [1, 1]]),
    maxMb: 32,
  },
};

const TOLERANCE = 0.03;

function ratioMatches(a: number, b: number, target: number): boolean {
  return Math.abs(a / b - target) <= TOLERANCE;
}

function checkOne(meta: MediaMeta, platform: PlatformId, spec: RatioSpec): MediaIssue[] {
  const issues: MediaIssue[] = [];
  const id = (s: string) => `${platform}:${s}`;

  // MIME
  if (meta.mime && spec.mimes && !spec.mimes.includes(meta.mime)) {
    issues.push({
      id: id("mime"),
      severity: "warning",
      platform,
      title: `${spec.label} prefers ${spec.mimes.map((m) => m.split("/")[1].toUpperCase()).join(", ")}`,
      detail: `You're uploading ${meta.mime}. ${spec.label} accepts other types but they may transcode.`,
      fix: `Re-export as ${spec.mimes[0].split("/")[1].toUpperCase()} for the cleanest render.`,
    });
  }

  // Aspect ratio
  if (meta.width && meta.height) {
    const actual = meta.width / meta.height;
    const ok = spec.ratios.some((r) => ratioMatches(actual, 1, r.w / r.h));
    const labels = spec.ratios.map((r) => r.label).join(" / ");
    if (!ok) {
      issues.push({
        id: id("ratio"),
        severity: "error",
        platform,
        title: `Aspect ratio not supported by ${spec.label}`,
        detail: `This media is ${meta.width}×${meta.height} (${actual.toFixed(2)}:1). ${spec.label} wants ${labels}.`,
        fix: `Crop or pad to ${labels}, or use Auto-adapt to do it for you.`,
      });
    } else {
      issues.push({
        id: id("ratio-ok"),
        severity: "ok",
        platform,
        title: `Aspect ratio fits ${spec.label}`,
        detail: `${actual.toFixed(2)}:1 is in the accepted list (${labels}).`,
      });
    }
  } else {
    issues.push({
      id: id("ratio-pending"),
      severity: "info",
      platform,
      title: `Aspect ratio unknown`,
      detail: "We couldn't read the dimensions. We'll re-check after upload.",
    });
  }

  // Duration (videos)
  if (meta.kind === "video" && spec.maxDurationSec && meta.durationSec && meta.durationSec > spec.maxDurationSec) {
    const m = Math.floor(spec.maxDurationSec / 60);
    issues.push({
      id: id("duration"),
      severity: "error",
      platform,
      title: `Too long for ${spec.label}`,
      detail: `This video is ${Math.round(meta.durationSec)} s. ${spec.label} caps video at ${m} min.`,
      fix: `Trim the video or move it to a destination with a longer cap.`,
    });
  }

  // File size
  if (meta.bytes && spec.maxMb) {
    const mb = meta.bytes / 1024 / 1024;
    if (mb > spec.maxMb) {
      issues.push({
        id: id("size"),
        severity: "warning",
        platform,
        title: `File is over ${spec.maxMb} MB`,
        detail: `${spec.label} caps uploads at ${spec.maxMb} MB. This file is ${mb.toFixed(1)} MB.`,
        fix: "Re-export at a lower bitrate, or move the post to a destination that supports bigger files.",
      });
    }
  }

  return issues;
}

export interface ValidationResult {
  byPlatform: Record<PlatformId, MediaIssue[]>;
  blockers: number;
  warnings: number;
  /** True if at least one platform is a perfect match. */
  anyOk: boolean;
}

export function validateMedia(meta: MediaMeta, platforms: string[]): ValidationResult {
  const byPlatform = {} as Record<PlatformId, MediaIssue[]>;
  let blockers = 0;
  let warnings = 0;
  let anyOk = false;
  for (const p of platforms) {
    const id = p as PlatformId;
    const spec = SPECS[id];
    if (!spec) continue;
    const issues = checkOne(meta, id, spec);
    byPlatform[id] = issues;
    for (const it of issues) {
      if (it.severity === "error") blockers++;
      if (it.severity === "warning") warnings++;
      if (it.severity === "ok") anyOk = true;
    }
  }
  return { byPlatform, blockers, warnings, anyOk };
}

/** Adapt a media to a target aspect ratio. Returns a centred crop box
 *  (in pixels) the caller can use with CSS object-position or a canvas crop. */
export function autoAdaptCrop(
  meta: MediaMeta,
  target: { w: number; h: number },
): { x: number; y: number; width: number; height: number } | null {
  if (!meta.width || !meta.height) return null;
  const targetRatio = target.w / target.h;
  const sourceRatio = meta.width / meta.height;
  if (Math.abs(targetRatio - sourceRatio) <= TOLERANCE) {
    return { x: 0, y: 0, width: meta.width, height: meta.height };
  }
  if (targetRatio > sourceRatio) {
    // Need to crop the sides.
    const newWidth = Math.round(meta.height * targetRatio);
    const x = Math.round((meta.width - newWidth) / 2);
    return { x, y: 0, width: newWidth, height: meta.height };
  }
  // Need to crop the top/bottom.
  const newHeight = Math.round(meta.width / targetRatio);
  const y = Math.round((meta.height - newHeight) / 2);
  return { x: 0, y, width: meta.width, height: newHeight };
}

export function specFor(platform: string): RatioSpec | null {
  return SPECS[platform as PlatformId] ?? null;
}
