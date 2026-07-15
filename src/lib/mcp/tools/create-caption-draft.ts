import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "create_caption_draft",
  title: "Create caption draft",
  description:
    "Create a new caption draft for the signed-in user. Returns the validated draft record which the user's app applies to the Studio and caption library on next open.",
  inputSchema: {
    title: z.string().min(1).max(120).describe("Short title for the draft."),
    body: z.string().min(1).max(4000).describe("Caption body text."),
    hashtags: z.array(z.string()).optional().describe("Hashtags without leading #."),
    platformIds: z.array(z.string()).optional().describe("Target platform ids."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: false,
    needsApproval: true,
  },
  handler: (input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const draft = {
      id: crypto.randomUUID(),
      title: input.title,
      body: input.body,
      hashtags: input.hashtags ?? [],
      platformIds: input.platformIds ?? [],
      tags: [],
      status: "pending-approval" as const,
      createdAt: new Date().toISOString(),
      source: "mcp:create_caption_draft",
      userId: ctx.getUserId(),
    };
    return {
      content: [
        {
          type: "text",
          text: `Proposed caption draft "${input.title}". The user must approve it inside the app before it appears in their library.`,
        },
      ],
      structuredContent: { draft, needsApproval: true },
    };
  },
});
