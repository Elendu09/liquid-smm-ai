import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Sparkles,
  Workflow,
  Zap,
  Puzzle,
  Terminal,
  Command,
  BrainCircuit,
  Feather,
  Compass,
  Cpu,
  Layers,
  MessageSquare,
} from "lucide-react";

export type IntegrationCategory = "ai-agents" | "automation" | "productivity";

export interface IntegrationStep {
  title: string;
  body: string;
  code?: string;
}

export interface Integration {
  slug: string;
  name: string;
  tagline: string;
  category: IntegrationCategory;
  icon: LucideIcon;
  accent: string; // tailwind bg tint token
  connectorId?: string; // optional MCP connector id
  serverName: string; // e.g. "SkyRank MCP Server"
  transport: "http" | "sse";
  cli?: { label: string; command: string }[];
  steps: IntegrationStep[];
  prompts: string[];
  docsUrl?: string;
  /** Optional deep-link that opens the target client and prefills the MCP server. */
  deepLink?: (serverUrl: string) => string;
}

/** Catalog of the tools this app's MCP server exposes. Kept in sync with src/lib/mcp/index.ts */
export const MCP_TOOLS: { name: string; label: string; description: string; write?: boolean }[] = [
  { name: "whoami", label: "Who am I", description: "Return the signed-in caller's identity." },
  { name: "get_user_profile", label: "Get user profile", description: "Read the user's profile and preferences." },
  { name: "get_automation_settings", label: "Automation settings", description: "Read automation and posting settings." },
  { name: "list_platforms", label: "List platforms", description: "List supported social platforms and channel status." },
  { name: "list_scheduled_posts", label: "List scheduled posts", description: "Read the user's scheduled post queue." },
  { name: "queue_cross_platform_post", label: "Queue cross-platform post", description: "Schedule a new post across selected channels.", write: true },
  { name: "list_captions", label: "List captions", description: "Browse saved caption library entries." },
  { name: "create_caption_draft", label: "Create caption draft", description: "Save a new caption draft to the library.", write: true },
];

const SERVER_NAME = "SkyRank MCP Server";

const baseSteps = (openLabel: string): IntegrationStep[] => [
  {
    title: `Open Connectors in ${openLabel}`,
    body: `In ${openLabel}, open Settings → Connectors and choose to add a Custom MCP server.`,
  },
  {
    title: `Add the ${SERVER_NAME}`,
    body: "Fill in the form with these details, then save:",
  },
  {
    title: "Sign in and approve access",
    body: `The first time you use SkyRank in ${openLabel}, you'll be asked to sign in and approve access to your workspace.`,
  },
];

export const INTEGRATIONS: Integration[] = [
  {
    slug: "chatgpt",
    name: "ChatGPT",
    tagline: "Manage your content from ChatGPT and Codex",
    category: "ai-agents",
    icon: Sparkles,
    accent: "bg-emerald-500/10 text-emerald-500",
    serverName: SERVER_NAME,
    transport: "http",
    cli: [{ label: "Codex CLI", command: "codex mcp add skyrank --url {SERVER_URL}" }],
    steps: baseSteps("ChatGPT"),
    deepLink: (u) => `https://chatgpt.com/?mcp=${encodeURIComponent(u)}`,
    prompts: [
      "Show me all my scheduled SkyRank posts for this week",
      "Draft a post in SkyRank that says 'We just launched our redesigned dashboard' for my X channel",
      "List my SkyRank channels and show me which ones have posts scheduled for tomorrow",
    ],
  },
  {
    slug: "claude",
    name: "Claude",
    tagline: "Manage your content from Claude and Claude Code",
    category: "ai-agents",
    icon: BrainCircuit,
    accent: "bg-orange-500/10 text-orange-500",
    serverName: SERVER_NAME,
    transport: "http",
    cli: [{ label: "Claude Code", command: "claude mcp add skyrank --url {SERVER_URL}" }],
    deepLink: (u) => `claude://mcp/install?name=skyrank&url=${encodeURIComponent(u)}`,
    steps: baseSteps("Claude"),
    prompts: [
      "List every connected SkyRank channel with its health status",
      "Queue a LinkedIn post about our new feature drop for tomorrow morning",
      "Summarize this week's top performing posts across all channels",
    ],
  },
  {
    slug: "manus",
    name: "Manus",
    tagline: "Manage your content from Manus",
    category: "ai-agents",
    icon: Feather,
    accent: "bg-amber-500/10 text-amber-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Manus"),
    prompts: [
      "List all my connected SkyRank channels",
      "Add a post to my SkyRank queue that says 'Excited to share our latest update!' for next Monday",
      "Show me my SkyRank posts scheduled for this week, grouped by channel",
    ],
  },
  {
    slug: "cursor",
    name: "Cursor",
    tagline: "Build and automate from your editor",
    category: "ai-agents",
    icon: Command,
    accent: "bg-sky-500/10 text-sky-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Cursor"),
    deepLink: (u) => `cursor://anysphere.cursor-deeplink/mcp/install?name=skyrank&url=${encodeURIComponent(u)}`,
    prompts: [
      "Pull my last 5 SkyRank captions into this file",
      "Schedule a launch post at 9am tomorrow across Instagram and LinkedIn",
    ],
  },
  {
    slug: "antigravity",
    name: "Antigravity",
    tagline: "Manage your content from Google's agent-first IDE",
    category: "ai-agents",
    icon: Cpu,
    accent: "bg-indigo-500/10 text-indigo-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Antigravity"),
    prompts: [
      "Show my scheduled queue for the week",
      "Draft a Threads post promoting our latest release",
    ],
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    tagline: "Manage your content from Perplexity Web and Desktop",
    category: "ai-agents",
    icon: Compass,
    accent: "bg-teal-500/10 text-teal-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Perplexity"),
    prompts: [
      "Research a topic and draft a SkyRank post about it",
      "Turn today's top news story into a SkyRank caption",
    ],
  },
  {
    slug: "raycast",
    name: "Raycast",
    tagline: "Quick actions from your menu bar",
    category: "ai-agents",
    icon: Zap,
    accent: "bg-red-500/10 text-red-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Raycast"),
    prompts: [
      "Post this to Instagram now",
      "What's queued for today?",
    ],
  },
  {
    slug: "zapier",
    name: "Zapier",
    tagline: "Automate workflows with Zapier",
    category: "automation",
    icon: Zap,
    accent: "bg-orange-500/10 text-orange-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Zapier"),
    prompts: [
      "Trigger a SkyRank post whenever a new row is added to a Google Sheet",
      "Send SkyRank engagement stats to Slack every morning",
    ],
  },
  {
    slug: "n8n",
    name: "n8n",
    tagline: "Workflow automation with n8n",
    category: "automation",
    icon: Workflow,
    accent: "bg-pink-500/10 text-pink-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("n8n"),
    prompts: [
      "Cross-post RSS entries to SkyRank",
      "Notify Discord when a scheduled post publishes",
    ],
  },
  {
    slug: "mcp",
    name: "Custom MCP",
    tagline: "Connect any MCP-compatible tool",
    category: "automation",
    icon: Puzzle,
    accent: "bg-primary/10 text-primary",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("your MCP client"),
    prompts: [
      "Use the tools exposed by the SkyRank MCP server",
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    tagline: "Manage your content from Notion custom agents",
    category: "productivity",
    icon: Layers,
    accent: "bg-neutral-500/10 text-foreground",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("Notion"),
    prompts: [
      "Turn this Notion page into a SkyRank post",
      "Sync my content calendar with SkyRank",
    ],
  },
  {
    slug: "chatgpt-tabs",
    name: "ChatGPT Tabs",
    tagline: "Trigger SkyRank from ChatGPT's browser tabs",
    category: "productivity",
    icon: MessageSquare,
    accent: "bg-emerald-500/10 text-emerald-500",
    serverName: SERVER_NAME,
    transport: "http",
    steps: baseSteps("ChatGPT Tabs"),
    prompts: [
      "Draft a post from the article in this tab",
    ],
  },
];

export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  "ai-agents": "AI agents",
  automation: "Automation",
  productivity: "Productivity",
};

export function getIntegration(slug: string) {
  return INTEGRATIONS.find((i) => i.slug === slug);
}

export function getMcpServerUrl() {
  const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${ref}.supabase.co/functions/v1/mcp`;
}
