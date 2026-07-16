export interface LinkTemplateItem {
  title: string;
  url: string;
  icon: string;
  highlight?: boolean;
}

export interface LinkBioTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  themeId: string;
  handle: string;
  headline: string;
  links: LinkTemplateItem[];
}

export const linkBioTemplates: LinkBioTemplate[] = [
  {
    id: "creator",
    name: "Creator",
    category: "Personal brand",
    description: "For influencers, streamers, and personal brands promoting their content.",
    themeId: "sunset-gradient",
    handle: "@yourhandle",
    headline: "Creator · Storyteller · Coffee obsessed",
    links: [
      { title: "Latest YouTube video", url: "https://youtube.com/watch", icon: "youtube", highlight: true },
      { title: "Shop my favorites", url: "https://shop.example.com", icon: "shopping" },
      { title: "Join my newsletter", url: "https://newsletter.example.com", icon: "mail" },
      { title: "Book a 1:1", url: "https://calendly.com/example", icon: "calendar" },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    category: "Shop",
    description: "Sell products directly from your bio with featured drops.",
    themeId: "paper-minimal",
    handle: "@yourshop",
    headline: "Handmade goods · Free shipping over $50",
    links: [
      { title: "🔥 New drop — Winter '26", url: "https://shop.example.com/new", icon: "shopping", highlight: true },
      { title: "Best sellers", url: "https://shop.example.com/best", icon: "star" },
      { title: "Track my order", url: "https://shop.example.com/track", icon: "briefcase" },
      { title: "Reviews on Trustpilot", url: "https://trustpilot.com", icon: "link" },
    ],
  },
  {
    id: "musician",
    name: "Musician",
    category: "Music",
    description: "For artists releasing tracks across streaming platforms.",
    themeId: "cyberpunk",
    handle: "@yourband",
    headline: "New single OUT NOW · Tour dates below",
    links: [
      { title: "Stream on Spotify", url: "https://spotify.com", icon: "music", highlight: true },
      { title: "Apple Music", url: "https://music.apple.com", icon: "music" },
      { title: "YouTube Music", url: "https://music.youtube.com", icon: "youtube" },
      { title: "Tour tickets", url: "https://songkick.com", icon: "calendar" },
      { title: "Merch store", url: "https://merch.example.com", icon: "shopping" },
    ],
  },
  {
    id: "podcast",
    name: "Podcast",
    category: "Audio",
    description: "For podcasters directing listeners across platforms.",
    themeId: "midnight-glass",
    handle: "@yourpodcast",
    headline: "Weekly conversations with builders & thinkers",
    links: [
      { title: "Latest episode", url: "https://podcast.example.com/latest", icon: "podcast", highlight: true },
      { title: "Apple Podcasts", url: "https://podcasts.apple.com", icon: "podcast" },
      { title: "Spotify", url: "https://spotify.com", icon: "music" },
      { title: "Guest submissions", url: "https://forms.example.com", icon: "mail" },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    category: "Local",
    description: "Menu, reservations, and delivery for restaurants and cafés.",
    themeId: "terracotta",
    handle: "@yourcafe",
    headline: "Neighborhood kitchen · Open 8–10 daily",
    links: [
      { title: "📖 View menu", url: "https://menu.example.com", icon: "book", highlight: true },
      { title: "Reserve a table", url: "https://opentable.com", icon: "calendar" },
      { title: "Order delivery", url: "https://ubereats.com", icon: "shopping" },
      { title: "Directions", url: "https://maps.google.com", icon: "globe" },
    ],
  },
  {
    id: "coach",
    name: "Coach",
    category: "Services",
    description: "For coaches and consultants driving discovery calls.",
    themeId: "editorial-serif",
    handle: "@yourcoach",
    headline: "Business coach for creative founders",
    links: [
      { title: "Book a free discovery call", url: "https://calendly.com/example", icon: "calendar", highlight: true },
      { title: "Client case studies", url: "https://example.com/case-studies", icon: "briefcase" },
      { title: "Free strategy guide", url: "https://example.com/guide", icon: "book" },
      { title: "Weekly newsletter", url: "https://newsletter.example.com", icon: "mail" },
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    category: "Writing",
    description: "Direct subscribers to your newsletter and archive.",
    themeId: "mono-noir",
    handle: "@yournewsletter",
    headline: "Weekly essays on design & software",
    links: [
      { title: "Subscribe (free)", url: "https://substack.com", icon: "mail", highlight: true },
      { title: "Read the archive", url: "https://substack.com/archive", icon: "book" },
      { title: "Recommended posts", url: "https://example.com/best", icon: "star" },
    ],
  },
  {
    id: "event",
    name: "Event",
    category: "Live",
    description: "Ticketing, schedule, and info for a conference or launch.",
    themeId: "y2k-chrome",
    handle: "@yourevent",
    headline: "Design Summit 2026 · Berlin · June 12–14",
    links: [
      { title: "🎟 Get tickets", url: "https://tickets.example.com", icon: "calendar", highlight: true },
      { title: "Schedule & speakers", url: "https://event.example.com/schedule", icon: "book" },
      { title: "Sponsor us", url: "https://event.example.com/sponsor", icon: "briefcase" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    category: "B2B",
    description: "Convert visitors to leads for a creative or dev agency.",
    themeId: "ocean-deep",
    handle: "@youragency",
    headline: "Brand & product studio · SF · NYC",
    links: [
      { title: "Start a project", url: "https://agency.example.com/start", icon: "briefcase", highlight: true },
      { title: "Our work", url: "https://agency.example.com/work", icon: "camera" },
      { title: "Careers", url: "https://agency.example.com/careers", icon: "star" },
      { title: "Press kit", url: "https://agency.example.com/press", icon: "news" },
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    category: "Personal",
    description: "Showcase work with clean links to case studies.",
    themeId: "paper-minimal",
    handle: "@yourportfolio",
    headline: "Product designer · Available for freelance",
    links: [
      { title: "Latest case study", url: "https://portfolio.example.com/case", icon: "briefcase", highlight: true },
      { title: "Dribbble", url: "https://dribbble.com", icon: "camera" },
      { title: "Read my CV", url: "https://portfolio.example.com/cv", icon: "book" },
      { title: "Say hi", url: "mailto:hi@example.com", icon: "mail" },
    ],
  },
  {
    id: "nonprofit",
    name: "Non-profit",
    category: "Cause",
    description: "Drive donations and volunteer sign-ups.",
    themeId: "forest-cottage",
    handle: "@yourngo",
    headline: "Protecting oceans since 2012",
    links: [
      { title: "❤ Donate", url: "https://donate.example.com", icon: "gift", highlight: true },
      { title: "Volunteer with us", url: "https://example.com/volunteer", icon: "star" },
      { title: "2025 impact report", url: "https://example.com/report", icon: "book" },
      { title: "Follow the mission", url: "https://instagram.com", icon: "instagram" },
    ],
  },
  {
    id: "streamer",
    name: "Streamer",
    category: "Gaming",
    description: "Drop the schedule, stream, and tip links.",
    themeId: "neon-retro",
    handle: "@yourstream",
    headline: "Streaming Tues/Thu/Sat · Warzone + chill",
    links: [
      { title: "▶ Live on Twitch", url: "https://twitch.tv", icon: "play", highlight: true },
      { title: "YouTube VODs", url: "https://youtube.com", icon: "youtube" },
      { title: "Discord community", url: "https://discord.gg", icon: "podcast" },
      { title: "Support the stream", url: "https://ko-fi.com", icon: "gift" },
      { title: "Setup / gear", url: "https://kit.co", icon: "star" },
    ],
  },
];

export const APPLIED_TEMPLATE_KEY = "smmpilot:linkbio:template-applied";
