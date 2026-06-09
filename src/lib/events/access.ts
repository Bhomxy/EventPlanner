import { createAdminClient } from "@/lib/supabase/server";
import type { Event, MemberRole } from "@/lib/types";

export async function canAccessEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("user_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return false;
  if (event.user_id === userId) return true;

  const { data: member } = await supabase
    .from("event_members")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!member;
}

export async function getEventRole(
  userId: string,
  event: Event,
): Promise<MemberRole> {
  if (event.user_id === userId) return "owner";

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .maybeSingle();

  return (member?.role as MemberRole) ?? "viewer";
}

export function canEdit(role: MemberRole): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageTeam(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}
