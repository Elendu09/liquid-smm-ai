// Platform Configuration System - All 14 Social Media Platforms

export interface PlatformLimit {
  captionLength: number;
  hashtagsMax: number;
  mentionsMax?: number;
  videoLengthSeconds?: {
    stories?: number;
    reels?: number;
    posts?: number;
    live?: number;
    shorts?: number;
    spotlight?: number;
  };
  imageAspectRatios?: string[];
}

export interface PlatformFeature {
  id: string;
  label: string;
  enabled: boolean;
}

export interface Platform {
  id: string;
  name: string;
  shortName: string;
  color: string;
  gradient: string;
  bgGradient: string;
  features: string[];
  limits: PlatformLimit;
  analytics: string[];
  contentTypes: string[];
  scheduling: {
    minIntervalMinutes: number;
    optimalTimesEnabled: boolean;
  };
}

export const platforms: Platform[] = [
  {
    id: "instagram",
    name: "Instagram",
    shortName: "IG",
    color: "hsl(330 80% 55%)",
    gradient: "from-pink-500 via-red-500 to-yellow-500",
    bgGradient: "bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500",
    features: ["posts", "stories", "reels", "igtv", "live", "guides"],
    limits: {
      captionLength: 2200,
      hashtagsMax: 30,
      mentionsMax: 20,
      videoLengthSeconds: { stories: 60, reels: 90, posts: 60 },
      imageAspectRatios: ["1:1", "4:5", "1.91:1"],
    },
    analytics: ["reach", "impressions", "engagement", "saves", "shares", "profile_visits"],
    contentTypes: ["image", "video", "carousel", "story", "reel"],
    scheduling: { minIntervalMinutes: 30, optimalTimesEnabled: true },
  },
  {
    id: "tiktok",
    name: "TikTok",
    shortName: "TT",
    color: "hsl(180 80% 50%)",
    gradient: "from-cyan-400 via-pink-500 to-red-500",
    bgGradient: "bg-gradient-to-br from-cyan-400 via-pink-500 to-red-500",
    features: ["videos", "stories", "live", "duets", "stitches"],
    limits: {
      captionLength: 2200,
      hashtagsMax: 100,
      videoLengthSeconds: { posts: 600, stories: 60, live: 14400 },
    },
    analytics: ["views", "likes", "comments", "shares", "watch_time", "profile_views"],
    contentTypes: ["video", "story", "live"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: true },
  },
  {
    id: "youtube",
    name: "YouTube",
    shortName: "YT",
    color: "hsl(0 84% 50%)",
    gradient: "from-red-600 to-red-700",
    bgGradient: "bg-gradient-to-br from-red-600 to-red-700",
    features: ["videos", "shorts", "community", "live", "premieres"],
    limits: {
      captionLength: 5000,
      hashtagsMax: 15,
      videoLengthSeconds: { shorts: 60, posts: 43200 },
    },
    analytics: ["views", "watch_time", "subscribers", "ctr", "revenue"],
    contentTypes: ["video", "short", "community_post", "live"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: true },
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    shortName: "X",
    color: "hsl(0 0% 0%)",
    gradient: "from-gray-900 to-black",
    bgGradient: "bg-gradient-to-br from-gray-900 to-black",
    features: ["tweets", "threads", "spaces", "fleets", "communities"],
    limits: {
      captionLength: 280,
      hashtagsMax: 30,
      videoLengthSeconds: { posts: 140 },
    },
    analytics: ["impressions", "engagement", "retweets", "replies", "clicks"],
    contentTypes: ["text", "image", "video", "poll", "thread"],
    scheduling: { minIntervalMinutes: 15, optimalTimesEnabled: true },
  },
  {
    id: "facebook",
    name: "Facebook",
    shortName: "FB",
    color: "hsl(220 44% 41%)",
    gradient: "from-blue-600 to-blue-700",
    bgGradient: "bg-gradient-to-br from-blue-600 to-blue-700",
    features: ["posts", "stories", "reels", "groups", "live", "events"],
    limits: {
      captionLength: 63206,
      hashtagsMax: 30,
      videoLengthSeconds: { stories: 20, reels: 60, live: 28800 },
    },
    analytics: ["reach", "engagement", "reactions", "shares", "page_views"],
    contentTypes: ["text", "image", "video", "story", "reel", "event"],
    scheduling: { minIntervalMinutes: 30, optimalTimesEnabled: true },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    shortName: "LI",
    color: "hsl(210 85% 40%)",
    gradient: "from-blue-700 to-blue-800",
    bgGradient: "bg-gradient-to-br from-blue-700 to-blue-800",
    features: ["posts", "articles", "newsletters", "live", "events", "company_pages"],
    limits: {
      captionLength: 3000,
      hashtagsMax: 5,
      videoLengthSeconds: { posts: 600, live: 14400 },
    },
    analytics: ["impressions", "engagement", "clicks", "followers", "company_views"],
    contentTypes: ["text", "image", "video", "article", "document", "poll"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: true },
  },
  {
    id: "threads",
    name: "Threads",
    shortName: "TH",
    color: "hsl(0 0% 0%)",
    gradient: "from-gray-800 to-black",
    bgGradient: "bg-gradient-to-br from-gray-800 to-black",
    features: ["posts", "reposts", "quotes"],
    limits: {
      captionLength: 500,
      hashtagsMax: 10,
    },
    analytics: ["views", "likes", "replies", "reposts"],
    contentTypes: ["text", "image", "video"],
    scheduling: { minIntervalMinutes: 30, optimalTimesEnabled: true },
  },
  {
    id: "pinterest",
    name: "Pinterest",
    shortName: "PI",
    color: "hsl(0 84% 40%)",
    gradient: "from-red-600 to-red-700",
    bgGradient: "bg-gradient-to-br from-red-600 to-red-700",
    features: ["pins", "idea_pins", "boards", "shopping"],
    limits: {
      captionLength: 500,
      hashtagsMax: 20,
      imageAspectRatios: ["2:3", "1:1"],
    },
    analytics: ["impressions", "saves", "clicks", "closeups", "outbound_clicks"],
    contentTypes: ["pin", "idea_pin", "video_pin"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: true },
  },
  {
    id: "snapchat",
    name: "Snapchat",
    shortName: "SC",
    color: "hsl(55 100% 50%)",
    gradient: "from-yellow-400 to-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-400 to-yellow-500",
    features: ["stories", "spotlight", "lenses", "discover"],
    limits: {
      captionLength: 80,
      hashtagsMax: 0,
      videoLengthSeconds: { stories: 60, spotlight: 60 },
    },
    analytics: ["views", "screenshots", "replies", "shares"],
    contentTypes: ["snap", "story", "spotlight"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: false },
  },
  {
    id: "reddit",
    name: "Reddit",
    shortName: "RD",
    color: "hsl(16 100% 50%)",
    gradient: "from-orange-500 to-orange-600",
    bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
    features: ["posts", "comments", "communities", "live"],
    limits: {
      captionLength: 40000,
      hashtagsMax: 0,
    },
    analytics: ["upvotes", "comments", "awards", "shares", "crosspost"],
    contentTypes: ["text", "link", "image", "video", "poll"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: true },
  },
  {
    id: "telegram",
    name: "Telegram",
    shortName: "TG",
    color: "hsl(200 100% 50%)",
    gradient: "from-sky-400 to-blue-500",
    bgGradient: "bg-gradient-to-br from-sky-400 to-blue-500",
    features: ["channels", "groups", "bots", "broadcasts"],
    limits: {
      captionLength: 4096,
      hashtagsMax: 30,
    },
    analytics: ["views", "forwards", "reactions", "growth"],
    contentTypes: ["text", "image", "video", "document", "poll"],
    scheduling: { minIntervalMinutes: 15, optimalTimesEnabled: true },
  },
  {
    id: "discord",
    name: "Discord",
    shortName: "DC",
    color: "hsl(235 86% 65%)",
    gradient: "from-indigo-500 to-purple-600",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    features: ["servers", "channels", "announcements", "events", "stages"],
    limits: {
      captionLength: 2000,
      hashtagsMax: 0,
    },
    analytics: ["members", "messages", "active_users", "engagement"],
    contentTypes: ["text", "image", "video", "embed"],
    scheduling: { minIntervalMinutes: 30, optimalTimesEnabled: false },
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    shortName: "WA",
    color: "hsl(142 70% 45%)",
    gradient: "from-green-500 to-green-600",
    bgGradient: "bg-gradient-to-br from-green-500 to-green-600",
    features: ["status", "broadcasts", "catalogs", "quick_replies"],
    limits: {
      captionLength: 700,
      hashtagsMax: 0,
      videoLengthSeconds: { stories: 30 },
    },
    analytics: ["delivered", "read", "replies", "clicks"],
    contentTypes: ["text", "image", "video", "document", "catalog"],
    scheduling: { minIntervalMinutes: 60, optimalTimesEnabled: false },
  },
  {
    id: "bluesky",
    name: "Bluesky",
    shortName: "BS",
    color: "hsl(200 100% 60%)",
    gradient: "from-sky-400 to-blue-500",
    bgGradient: "bg-gradient-to-br from-sky-400 to-blue-500",
    features: ["posts", "reposts", "quotes", "lists"],
    limits: {
      captionLength: 300,
      hashtagsMax: 10,
    },
    analytics: ["likes", "reposts", "replies", "impressions"],
    contentTypes: ["text", "image", "video", "link"],
    scheduling: { minIntervalMinutes: 15, optimalTimesEnabled: true },
  },
];

export const getPlatformById = (id: string): Platform | undefined => {
  return platforms.find((p) => p.id === id);
};

export const getPlatformColor = (id: string): string => {
  const platform = getPlatformById(id);
  return platform?.color || "hsl(var(--muted))";
};

export const getPlatformGradient = (id: string): string => {
  const platform = getPlatformById(id);
  return platform?.gradient || "from-gray-500 to-gray-600";
};

export const getActivePlatforms = (platformIds: string[]): Platform[] => {
  return platforms.filter((p) => platformIds.includes(p.id));
};

// Platform groupings for UI organization
export const platformGroups = {
  visual: ["instagram", "tiktok", "youtube", "pinterest", "snapchat"],
  social: ["facebook", "twitter", "linkedin", "threads", "bluesky", "reddit"],
  messaging: ["telegram", "discord", "whatsapp"],
};

export const allPlatformIds = platforms.map((p) => p.id);

// Primary platforms for focused features (5 main platforms)
export const primaryPlatformIds = ["facebook", "instagram", "twitter", "whatsapp", "youtube"];

export const getPrimaryPlatforms = (): Platform[] => {
  return platforms.filter((p) => primaryPlatformIds.includes(p.id));
};

// Tone presets per platform
export const platformTonePresets: Record<string, { default: string; options: string[] }> = {
  instagram: { default: "inspirational", options: ["inspirational", "casual", "trendy", "educational", "storytelling"] },
  tiktok: { default: "trendy", options: ["trendy", "casual", "humorous", "educational", "viral"] },
  youtube: { default: "educational", options: ["educational", "entertaining", "professional", "casual", "storytelling"] },
  twitter: { default: "witty", options: ["witty", "concise", "professional", "casual", "controversial"] },
  facebook: { default: "friendly", options: ["friendly", "professional", "casual", "storytelling", "promotional"] },
  linkedin: { default: "professional", options: ["professional", "thought-leadership", "educational", "inspirational", "casual"] },
  whatsapp: { default: "personal", options: ["personal", "friendly", "professional", "casual", "urgent"] },
  threads: { default: "conversational", options: ["conversational", "casual", "witty", "educational"] },
  pinterest: { default: "inspirational", options: ["inspirational", "educational", "lifestyle", "promotional"] },
  snapchat: { default: "casual", options: ["casual", "fun", "trendy", "personal"] },
  reddit: { default: "informative", options: ["informative", "casual", "humorous", "controversial", "helpful"] },
  telegram: { default: "informative", options: ["informative", "professional", "casual", "promotional"] },
  discord: { default: "casual", options: ["casual", "friendly", "humorous", "informative"] },
  bluesky: { default: "conversational", options: ["conversational", "witty", "casual", "professional"] },
};

// Trending hashtags per platform (mock data)
export const trendingHashtags: Record<string, string[]> = {
  instagram: ["#reels", "#viral", "#instagood", "#photooftheday", "#trending", "#fyp", "#explore", "#lifestyle"],
  tiktok: ["#fyp", "#foryou", "#viral", "#trending", "#xyzbca", "#tiktokviral", "#fypシ", "#trend"],
  youtube: ["#shorts", "#viral", "#trending", "#subscribe", "#youtubeshorts", "#video", "#tutorial"],
  twitter: ["#trending", "#viral", "#breaking", "#news", "#tech", "#innovation", "#thoughts"],
  facebook: ["#viral", "#trending", "#lifestyle", "#community", "#share", "#family", "#friends"],
  linkedin: ["#leadership", "#innovation", "#careers", "#networking", "#business", "#growth", "#success"],
  whatsapp: [],
  threads: ["#threads", "#trending", "#viral", "#thoughts", "#community"],
  pinterest: ["#pinterest", "#diy", "#home", "#fashion", "#recipes", "#ideas", "#inspiration"],
  snapchat: [],
  reddit: [],
  telegram: [],
  discord: [],
  bluesky: ["#bluesky", "#decentralized", "#tech", "#thoughts"],
};
