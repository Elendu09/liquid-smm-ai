import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listPlatformsTool from "./tools/list-platforms";
import listScheduledPostsTool from "./tools/list-scheduled-posts";
import queueCrossPlatformPostTool from "./tools/queue-cross-platform-post";
import listCaptionsTool from "./tools/list-captions";
import createCaptionDraftTool from "./tools/create-caption-draft";
import getUserProfileTool from "./tools/get-user-profile";
import getAutomationSettingsTool from "./tools/get-automation-settings";
import listCompetitorsTool from "./tools/list-competitors";
import addCompetitorTool from "./tools/add-competitor";
import listRssFeedsTool from "./tools/list-rss-feeds";
import listNotificationsTool from "./tools/list-notifications";
import getReferralStatusTool from "./tools/get-referral-status";
import getCreditsTool from "./tools/get-credits";

// Build the direct Supabase issuer from the project ref (never from SUPABASE_URL,
// which may be the .lovable.cloud proxy). VITE_SUPABASE_PROJECT_ID is inlined
// by Vite at build time so this stays import-safe (no runtime env read).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smm-app-mcp",
  title: "SMM App MCP",
  version: "0.4.0",
  instructions:
    "Tools for the SMM app. Start with `get_user_profile` and `get_automation_settings` to tailor actions to the user. Use `whoami` for identity, `list_platforms` for supported networks, `list_scheduled_posts` / `queue_cross_platform_post` for the publish queue, `list_captions` / `create_caption_draft` for the caption library, `list_competitors` / `add_competitor` for competitive tracking, `list_rss_feeds` for RSS automation, `list_notifications` for alerts, `get_credits` for the AI credit balance and `get_referral_status` for the referral program. Write tools require user approval inside the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    getUserProfileTool,
    getAutomationSettingsTool,
    listPlatformsTool,
    listScheduledPostsTool,
    queueCrossPlatformPostTool,
    listCaptionsTool,
    createCaptionDraftTool,
    listCompetitorsTool,
    addCompetitorTool,
    listRssFeedsTool,
    listNotificationsTool,
    getReferralStatusTool,
    getCreditsTool,
  ],
});
