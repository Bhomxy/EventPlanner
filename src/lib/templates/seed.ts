import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFallbackPlan } from "@/lib/ai/fallback-plan";
import type { EventType } from "@/lib/types";

const TEMPLATE_DEFS: { name: string; type: EventType; description: string }[] = [
  { name: "Networking evening", type: "meetup", description: "Social or professional gathering with talks and mingling" },
  { name: "Multi-day competition", type: "hackathon", description: "Team-based event with build time and presentations" },
  { name: "Workshop or class", type: "workshop", description: "Hands-on session with materials and facilitators" },
  { name: "Conference", type: "conference", description: "Multi-session event with speakers and registration" },
  { name: "Retreat or bootcamp", type: "bootcamp", description: "Multi-day program with lodging and meals" },
  { name: "Wedding reception", type: "other", description: "Ceremony and reception with catering and vendors" },
  { name: "Fundraiser gala", type: "other", description: "Ticketed charity or cause event with program and donors" },
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
