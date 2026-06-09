import type { EventPlan } from "@/lib/ai/schemas/event-plan";
import type { EventType } from "@/lib/types";

type FallbackPlanInput = {
  name: string;
  type: EventType;
  date?: string | null;
  location?: string | null;
  audienceSize?: number | null;
  goal?: string | null;
  notes?: string | null;
  budgetRange?: string | null;
};

function item(
  title: string,
  description: string | null = null,
  priority: "low" | "medium" | "high" = "medium",
  dueInDays: number | null = null,
) {
  return { title, description, priority, dueInDays };
}

function group(
  category: EventPlan["checklistGroups"][0]["category"],
  items: ReturnType<typeof item>[],
) {
  return { category, items };
}

export function generateFallbackPlan(input: FallbackPlanInput): EventPlan {
  const size = input.audienceSize ?? 100;
  const location = input.location ?? "your city";
  const goal = input.goal ?? "bring the tech community together";
  const typeLabel = input.type === "other" ? "event" : input.type;
  const budget = input.budgetRange ?? `$${Math.max(500, size * 5)}`;

  const planSummary = [
    `Operational plan for "${input.name}" — a ${typeLabel} for ~${size} people in ${location}.`,
    `Goal: ${goal}. Estimated budget range: ${budget}.`,
    `Recommended team: ${size >= 300 ? "15–25" : size >= 100 ? "8–12" : "4–6"} volunteers plus 1 operations lead.`,
    `Work venue and volunteer tasks first, then marketing and sponsors 4–6 weeks out, logistics in the final week.`,
    input.notes ? `Notes: ${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const checklistGroups = [
    group("venue", [
      item(`Confirm venue in ${location} for ${size}+ people`, null, "high", 30),
      item("Verify AV, WiFi, and emergency exits", null, "high", 21),
      item("Sign venue contract and pay deposit", null, "medium", 28),
    ]),
    group("volunteers", [
      item("Recruit volunteer leads for registration and logistics", null, "high", 21),
      item("Create shift schedule and briefing doc", null, "medium", 7),
      item("Prepare volunteer badges or role cards", null, "low", 3),
    ]),
    group("marketing", [
      item("Publish event page with agenda and registration link", null, "high", 21),
      item("Announce on social channels and community groups", null, "medium", 14),
      item("Send reminder emails 7 days and 1 day before", null, "medium", 7),
    ]),
    group("sponsors", [
      item("Define sponsorship tiers and benefits", null, "medium", 28),
      item("Send outreach to 10 target sponsors", null, "medium", 21),
      item("Collect logos and confirm deliverables", null, "medium", 7),
    ]),
    group("logistics", [
      item("Test registration and check-in flow", null, "medium", 5),
      item("Order swag and print signage", null, "medium", 10),
      item("Prepare day-of run sheet and backup plans", null, "high", 2),
    ]),
    group("speakers", [
      item("Confirm speaker lineup and session titles", null, "high", 21),
      item("Collect bios and slide templates", null, "medium", 10),
    ]),
  ];

  const timeline = [
    {
      title: "Doors open & registration",
      description: "Volunteers at registration desk",
      itemType: "checkpoint" as const,
      startOffsetHours: 0,
      durationMinutes: 60,
    },
    {
      title: "Welcome & opening remarks",
      description: null,
      itemType: "session" as const,
      startOffsetHours: 1,
      durationMinutes: 30,
    },
    {
      title: "Main sessions / program block",
      description: null,
      itemType: "session" as const,
      startOffsetHours: 1.5,
      durationMinutes: 120,
    },
    {
      title: "Volunteer shift change",
      description: null,
      itemType: "volunteer_shift" as const,
      startOffsetHours: 3,
      durationMinutes: 30,
    },
    {
      title: "Closing & networking",
      description: null,
      itemType: "session" as const,
      startOffsetHours: 4,
      durationMinutes: 60,
    },
  ];

  const budgetItems = [
    { category: "venue" as const, label: "Venue rental", estimated: size * 3, itemType: "expense" as const, notes: null },
    { category: "catering" as const, label: "Food & beverages", estimated: size * 8, itemType: "expense" as const, notes: null },
    { category: "marketing" as const, label: "Promotional materials", estimated: 500, itemType: "expense" as const, notes: null },
    { category: "swag" as const, label: "Attendee swag", estimated: size * 4, itemType: "expense" as const, notes: null },
    { category: "equipment" as const, label: "AV and equipment", estimated: 800, itemType: "expense" as const, notes: null },
    { category: "other" as const, label: "Sponsorship income", estimated: size * 10, itemType: "income" as const, notes: null },
  ];

  return {
    planSummary,
    checklistGroups,
    timeline,
    budget: budgetItems,
    teamStructure: [
      { role: "Operations Lead", count: 1, responsibilities: "Owns run sheet and vendor coordination" },
      { role: "Registration Volunteers", count: Math.max(2, Math.floor(size / 100)), responsibilities: "Check-in and attendee support" },
      { role: "Stage / AV Support", count: 2, responsibilities: "Sessions, mics, and speaker transitions" },
    ],
    marketingChecklist: [
      "Create shareable event hashtag",
      "Post speaker spotlight threads",
      "Share photos and recap within 48 hours after event",
    ],
    sponsorshipChecklist: [
      "Send thank-you notes to confirmed sponsors",
      "Deliver promised logo placements on slides and banners",
    ],
    risks: [
      {
        title: "Venue not secured",
        message: "No confirmed venue task completed yet — prioritize booking immediately.",
        severity: "high",
      },
      {
        title: "Volunteer coverage",
        message: `Target at least ${Math.max(4, Math.floor(size / 50))} volunteers for smooth operations.`,
        severity: "medium",
      },
    ],
  };
}

export function isOpenAiQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return (
    message.includes("exceeded your current quota") ||
    message.includes("insufficient_quota") ||
    message.includes("billing") ||
    message.includes("rate limit")
  );
}
