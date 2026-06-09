import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFallbackPlan } from "@/lib/ai/fallback-plan";
import type { EventType } from "@/lib/types";

const TEMPLATE_DEFS: { name: string; type: EventType; description: string }[] = [
  { name: "Community Meetup", type: "meetup", description: "Monthly developer meetup blueprint" },
  { name: "Hackathon", type: "hackathon", description: "48-hour hackathon operations plan" },
  { name: "Workshop", type: "workshop", description: "Hands-on technical workshop" },
  { name: "Conference", type: "conference", description: "Multi-track community conference" },
  { name: "Bootcamp", type: "bootcamp", description: "Multi-day intensive bootcamp" },
  { name: "Demo Day", type: "other", description: "Startup demo day with pitches and judges" },
];

export async function seedTemplatesIfEmpty(supabase: SupabaseClient) {
  const { count } = await supabase
    .from("templates")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return;

  const rows = TEMPLATE_DEFS.map((def) => {
    const payload = generateFallbackPlan({
      name: def.name,
      type: def.type,
      audienceSize: def.type === "conference" ? 500 : 150,
      location: "Your city",
      goal: def.description,
    });

    return {
      name: def.name,
      event_type: def.type,
      description: def.description,
      payload,
    };
  });

  await supabase.from("templates").insert(rows);
}
