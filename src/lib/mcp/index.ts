import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listPlatformsTool from "./tools/list-platforms";
import listScheduledPostsTool from "./tools/list-scheduled-posts";
import queueCrossPlatformPostTool from "./tools/queue-cross-platform-post";
import listCaptionsTool from "./tools/list-captions";
import createCaptionDraftTool from "./tools/create-caption-draft";

// Build the direct Supabase issuer from the project ref (never from SUPABASE_URL,
// which may be the .lovable.cloud proxy). VITE_SUPABASE_PROJECT_ID is inlined
// by Vite at build time so this stays import-safe (no runtime env read).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smm-app-mcp",
  title: "SMM App MCP",
  version: "0.2.0",
  instructions:
    "Tools for the SMM app. Use `whoami` to check the signed-in user, `list_platforms` to see supported networks, `list_scheduled_posts` / `queue_cross_platform_post` to work with the publish queue, and `list_captions` / `create_caption_draft` to work with the caption library.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    listPlatformsTool,
    listScheduledPostsTool,
    queueCrossPlatformPostTool,
    listCaptionsTool,
    createCaptionDraftTool,
  ],
});
