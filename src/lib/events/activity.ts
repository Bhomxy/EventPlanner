import { createAdminClient } from "@/lib/supabase/server";

export async function logActivity(
  eventId: string,
  actorId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  actorName?: string | null,
) {
  const supabase = createAdminClient();
  await supabase.from("activity_logs").insert({
    event_id: eventId,
    actor_id: actorId,
    actor_name: actorName ?? null,
    action,
    metadata,
  });
}
