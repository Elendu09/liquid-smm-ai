import { platforms, Platform } from "./platforms";

export interface ToolRequirement {
  /** Required platform features (e.g. "stories", "posts"). ANY match qualifies. */
  features?: string[];
  /** Whitelist of platform IDs. If set, only these platforms qualify. */
  platforms?: string[];
  /** Requires hashtag support (limits.hashtagsMax > 0). */
  requiresHashtags?: boolean;
  /** Allow multi-select of platforms. */
  multi: boolean;
  /** Human label for the gate title. */
  label: string;
}

export const toolPlatformRequirements: Record<string, ToolRequirement> = {
  "story-automation":   { features: ["stories"], multi: false, label: "Story Automation" },
  "scheduler":          { multi: true, label: "Post Scheduler" },
  "dm-automation":      { platforms: ["instagram", "facebook", "twitter", "whatsapp", "telegram", "discord"], multi: true, label: "DM Automation" },
  "caption-generator":  { multi: false, label: "Caption Generator" },
  "hashtag-research":   { requiresHashtags: true, multi: false, label: "Hashtag Research" },
  "engagement-bot":     { features: ["posts"], multi: true, label: "Engagement Bot" },
  "comment-manager":    { features: ["posts"], multi: true, label: "Comment Manager" },
  "follower-analyzer":  { multi: false, label: "Follower Analyzer" },
  "competitor-tracker": { multi: true, label: "Competitor Tracker" },
};

export function isPlatformCompatible(platform: Platform, req: ToolRequirement): boolean {
  if (req.platforms && !req.platforms.includes(platform.id)) return false;
  if (req.features && !req.features.some((f) => platform.features.includes(f))) return false;
  if (req.requiresHashtags && (platform.limits.hashtagsMax ?? 0) <= 0) return false;
  return true;
}

export function getCompatiblePlatforms(req: ToolRequirement): Platform[] {
  return platforms.filter((p) => isPlatformCompatible(p, req));
}
