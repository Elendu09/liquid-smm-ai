import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { guardWrite } from "@/hooks/useGuest";

export type MemberRole = "admin" | "editor" | "viewer";
export type MemberStatus = "active" | "pending" | "inactive";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: MemberRole;
  status: MemberStatus;
  lastActiveAt?: string | null;
  joinedAt: string;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  note?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): TeamMember {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatar_url,
    role: r.role,
    status: r.status,
    lastActiveAt: r.last_active_at,
    joinedAt: r.joined_at,
    inviteToken: r.invite_token,
    inviteExpiresAt: r.invite_expires_at,
    note: r.note,
  };
}

export function useTeamMembers() {
  const { user, isGuest } = useAuthUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setMembers((data ?? []).map(fromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`team_members:${user.id}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: `owner_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const invite = useCallback(
    async (input: { email: string; role: MemberRole; expiresInDays: number; note?: string }) => {
      if (!guardWrite("invite team members")) return;
      if (!user) return toast.error("Sign in to invite members");
      if (members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
        toast.error("That email is already invited");
        return;
      }
      const token = crypto.randomUUID();
      const { error } = await supabase.from("team_members").insert({
        owner_id: user.id,
        name: input.email.split("@")[0],
        email: input.email,
        role: input.role,
        status: "pending",
        invite_token: token,
        invite_expires_at: new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString(),
        note: input.note ?? null,
      });
      if (error) return toast.error(error.message);
      // Fire-and-forget email delivery; falls back to copyable link in the UI.
      const inviter_name =
        (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ??
        (user.user_metadata as { name?: string } | null)?.name ??
        user.email ??
        "Your teammate";
      const { data: sendData, error: sendError } = await supabase.functions.invoke("send-team-invite", {
        body: {
          email: input.email,
          token,
          role: input.role,
          inviter_name,
          app_url: window.location.origin,
        },
      });
      const invite_url = (sendData as { invite_url?: string } | null)?.invite_url
        ?? `${window.location.origin}/invite/${token}`;
      if (sendError) {
        toast.success(`Invite created for ${input.email}`, {
          description: "Copy the link from the member row to share it.",
        });
      } else if ((sendData as { delivered?: boolean } | null)?.delivered) {
        toast.success(`Invite emailed to ${input.email}`);
      } else {
        toast.success(`Invite created for ${input.email}`, {
          description: "Email delivery isn't configured — copy the link from the member row.",
        });
      }
      return invite_url;
    },
    [user, members],
  );

  const update = useCallback(
    async (id: string, patch: Partial<TeamMember>) => {
      if (!guardWrite("update members")) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = {};
      if (patch.role !== undefined) row.role = patch.role;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.lastActiveAt !== undefined) row.last_active_at = patch.lastActiveAt;
      if (patch.inviteToken !== undefined) row.invite_token = patch.inviteToken;
      if (patch.inviteExpiresAt !== undefined) row.invite_expires_at = patch.inviteExpiresAt;
      if (patch.note !== undefined) row.note = patch.note;
      if (patch.name !== undefined) row.name = patch.name;
      const { error } = await supabase.from("team_members").update(row).eq("id", id);
      if (error) toast.error(error.message);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    if (!guardWrite("remove team members")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  return { members, loading, invite, update, remove, isGuest, refetch: load };
}
