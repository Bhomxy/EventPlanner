import type { EventPlan } from "@/lib/ai/schemas/event-plan";
import type { BudgetItem, Task, TimelineItem } from "@/lib/types";

export function buildPlanPayloadFromEvent(
  tasks: Task[],
  timeline: TimelineItem[],
  budget: BudgetItem[],
  planSummary: string | null,
): EventPlan {
  const rootTasks = tasks.filter((t) => !t.parent_id);
  const categories = [...new Set(rootTasks.map((t) => t.category))];

  const checklistGroups = categories.map((category) => ({
    category,
    items: rootTasks
      .filter((t) => t.category === category)
      .map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueInDays: null as number | null,
      })),
  }));

  const marketingChecklist = rootTasks
    .filter((t) => t.category === "marketing")
    .map((t) => t.title);
  const sponsorshipChecklist = rootTasks
    .filter((t) => t.category === "sponsors")
    .map((t) => t.title);

  return {
    planSummary:
      planSummary?.replace(/^Note: Built-in template used[\s\S]*?\n\n/, "") ??
      "Saved from a previous event plan.",
    checklistGroups: checklistGroups.filter((g) => g.items.length),
    timeline: timeline.map((t) => {
      const start = new Date(t.start_time);
      const end = new Date(t.end_time);
      return {
        title: t.title,
        description: t.description,
        itemType: t.item_type,
        startOffsetHours: 0,
        durationMinutes: Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000)),
      };
    }),
    budget: budget.map((b) => ({
      category: b.category,
      label: b.label,
      estimated: Number(b.estimated),
      itemType: b.item_type,
      notes: b.notes,
    })),
    teamStructure: [
      { role: "Operations lead", count: 1, responsibilities: "Owns run-of-show" },
      { role: "Volunteer", count: 4, responsibilities: "Registration and logistics" },
    ],
    marketingChecklist: marketingChecklist.length ? marketingChecklist : ["Announce event", "Open registration"],
    sponsorshipChecklist: sponsorshipChecklist.length
      ? sponsorshipChecklist
      : ["Identify sponsors", "Send sponsor deck"],
    risks: [
      {
        title: "Timeline slip",
        message: "Review overdue tasks weekly as the event approaches.",
        severity: "medium" as const,
      },
    ],
  };
}
