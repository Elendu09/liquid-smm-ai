/**
 * Native features registry.
 *
 * Fix 2.2 — "missing native features" pain. Each platform has a small
 * set of first-class publishing features (product tags, collaborative
 * posts, location, trending audio, cover-frame) that other tools bury
 * or don't support at all. This registry is the single source of
 * truth for which features each platform supports and how the UI
 * should expose them in the composer.
 */

export type PlatformId =
  | "x" | "twitter" | "threads" | "bluesky"
  | "instagram" | "facebook"
  | "linkedin" | "tiktok" | "youtube" | "pinterest";

export type NativeFeatureKey =
  | "productTag"
  | "collabPost"
  | "location"
  | "trendingAudio"
  | "coverFrame"
  | "firstComment"
  | "altText"
  | "poll"
  | "linkCard";

export interface NativeFeature {
  key: NativeFeatureKey;
  label: string;
  description: string;
  /** Platforms that natively support it. */
  platforms: PlatformId[];
  /** Platforms that get a "missing" badge. */
}

export const NATIVE_FEATURES: NativeFeature[] = [
  {
    key: "productTag",
    label: "Product tag",
    description: "Tag a product from your catalog so shoppers can tap to buy.",
    platforms: ["instagram", "facebook", "tiktok"],
  },
  {
    key: "collabPost",
    label: "Collaborative post",
    description: "Co-author with another account. Both audiences see the post.",
    platforms: ["instagram", "tiktok"],
  },
  {
    key: "location",
    label: "Location pin",
    description: "Attach a place tag so the post shows up in local discovery.",
    platforms: ["instagram", "facebook", "tiktok", "linkedin"],
  },
  {
    key: "trendingAudio",
    label: "Trending audio",
    description: "Pick a sound from the platform's trending tab.",
    platforms: ["tiktok", "instagram", "youtube"],
  },
  {
    key: "coverFrame",
    label: "Custom cover frame",
    description: "Pick the frame Reels or Shorts show on your grid.",
    platforms: ["instagram", "tiktok", "youtube"],
  },
  {
    key: "firstComment",
    label: "First comment",
    description: "Auto-post a follow-up comment the moment the post goes live.",
    platforms: ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "threads"],
  },
  {
    key: "altText",
    label: "Alt text",
    description: "Accessibility text for screen readers. Required by some networks.",
    platforms: ["instagram", "facebook", "linkedin", "x", "threads", "pinterest"],
  },
  {
    key: "poll",
    label: "Poll",
    description: "Run a 2–4 option poll directly in the post.",
    platforms: ["x", "linkedin", "threads"],
  },
  {
    key: "linkCard",
    label: "Link card",
    description: "Attach a URL with a rich preview card.",
    platforms: ["linkedin", "facebook", "x", "threads", "pinterest"],
  },
];

export function featuresFor(platform: string): NativeFeature[] {
  return NATIVE_FEATURES.filter((f) => f.platforms.includes(platform as PlatformId));
}

export function featureLabel(key: NativeFeatureKey): string {
  return NATIVE_FEATURES.find((f) => f.key === key)?.label ?? key;
}

/** Returns the intersection of supported features across a list of platforms. */
export function commonFeatures(platforms: string[]): NativeFeature[] {
  if (platforms.length === 0) return NATIVE_FEATURES;
  return NATIVE_FEATURES.filter((f) => platforms.every((p) => f.platforms.includes(p as PlatformId)));
}
