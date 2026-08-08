import { InboxConsole } from "@/components/engage/InboxConsole";

/**
 * Unified inbox — a single three-column console (platform rail → conversation
 * list → thread). The separate Board view remains available for comments/DMs
 * on their own routes; this page is always the console.
 */
export function UnifiedInboxView() {
  return <InboxConsole />;
}
