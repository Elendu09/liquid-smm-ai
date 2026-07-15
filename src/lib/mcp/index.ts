import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listPlatformsTool from "./tools/list-platforms";

// Build the direct Supabase issuer from the project ref (never from SUPABASE_URL,
// which may be the .lovable.cloud proxy). VITE_SUPABASE_PROJECT_ID is inlined
// by Vite at build time so this stays import-safe (no runtime env read).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smm-app-mcp",
  title: "SMM App MCP",
  version: "0.1.0",
  instructions:
    "Tools for the SMM app. Use `whoami` to check the signed-in user, and `list_platforms` to see which social networks the app supports.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listPlatformsTool],
});
