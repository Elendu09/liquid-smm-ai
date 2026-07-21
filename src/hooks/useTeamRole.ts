import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

/**
 * Resolves the caller's effective role in the current workspace they're viewing.
 * - Workspace owner: always "owner".
 * - Signed-in as a member: whatever role the owner assigned in team_members.
 * - Guest / no team row: "viewer".
 */
export function useTeamRole(ownerId?: string | null): TeamRole {
  const { user } = useAuthUser();
  const [role, setRole] = useState<TeamRole>("viewer");

  useEffect(() => {
    if (!user) {
      setRole("viewer");
      return;
    }
    const target = ownerId ?? user.id;
    if (target === user.id) {
      setRole("owner");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("owner_id", target)
        .eq("member_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setRole(((data as { role?: string } | null)?.role as TeamRole) ?? "viewer");
    })();
  }, [user, ownerId]);

  return role;
}

const CAN_WRITE: Record<TeamRole, boolean> = { owner: true, admin: true, editor: true, viewer: false };
const CAN_ADMIN: Record<TeamRole, boolean> = { owner: true, admin: true, editor: false, viewer: false };

export function canWrite(role: TeamRole) { return CAN_WRITE[role]; }
export function canAdmin(role: TeamRole) { return CAN_ADMIN[role]; }
