// Default feature set per platform used when connecting a new account.
// Mirrors the capabilities the tools gate on via toolPlatformMap.

export const platformDefaultFeatures: Record<string, string[]> = {
  instagram: ["posts", "stories", "reels", "dm", "comments"],
  facebook:  ["posts", "stories", "reels", "dm", "comments"],
  tiktok:    ["posts", "reels", "comments"],
  twitter:   ["posts", "dm"],
  linkedin:  ["posts", "articles", "comments"],
  youtube:   ["posts", "comments"],
  whatsapp:  ["dm", "stories"],
  telegram:  ["posts", "dm"],
  discord:   ["posts", "dm"],
  pinterest: ["posts"],
  snapchat:  ["stories"],
  threads:   ["posts"],
  reddit:    ["posts", "comments"],
  bluesky:   ["posts"],
};

export function getDefaultFeatures(platformId: string): string[] {
  return platformDefaultFeatures[platformId] ?? ["posts"];
}
