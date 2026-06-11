import type { EventPlan } from "@/lib/ai/schemas/event-plan";
import type { ChecklistCategory, EventType } from "@/lib/types";
import { CATEGORY_ORDER } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/events/activity";
import { formatPlanSummary, type GeneratedPlan } from "@/lib/ai/generate-plan";

export type EventFormData = {
  name: string;
  type: EventType;
  date?: string;
  location?: string;
  audience_size?: number;
  goal?: string;
  notes?: string;
  budget_range?: string;
};

export async function persistGeneratedPlan(
  eventId: string,
  plan: GeneratedPlan,
  input: EventFormData,
  actorId: string,
) {
  const supabase = createAdminClient();
  const eventDate = input.date ? new Date(`${input.date}T09:00:00`) : new Date();

  await supabase.from("tasks").delete().eq("event_id", eventId);
  await supabase.from("timeline_items").delete().eq("event_id", eventId);
  await supabase.from("budget_items").delete().eq("event_id", eventId);

  await supabase
    .from("events")
    .update({
      plan_summary: formatPlanSummary(plan),
      plan_source: plan.source,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  let sortOrder = 0;
  const sortedGroups = [...plan.checklistGroups].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
  const taskRows = sortedGroups.flatMap((group) =>
    group.items.map((item) => {
      const dueDate =
        item.dueInDays != null && input.date
          ? new Date(eventDate.getTime() - item.dueInDays * 86400000)
              .toISOString()
              .slice(0, 10)
          : null;

      return {
        event_id: eventId,
        category: group.category,
        title: item.title,
        description: item.description,
        status: "todo" as const,
        priority: item.priority ?? "medium",
        due_date: dueDate,
        sort_order: sortOrder++,
      };
    }),
  );

  for (const item of plan.marketingChecklist) {
    taskRows.push({
      event_id: eventId,
      category: "marketing" as const,
      title: item,
      description: null,
      status: "todo" as const,
      priority: "medium" as const,
      due_date: null,
      sort_order: sortOrder++,
    });
  }

  for (const item of plan.sponsorshipChecklist) {
    taskRows.push({
      event_id: eventId,
      category: "sponsors" as const,
      title: item,
      description: null,
      status: "todo" as const,
      priority: "medium" as const,
      due_date: null,
      sort_order: sortOrder++,
    });
  }

  if (taskRows.length) {
    await supabase.from("tasks").insert(taskRows);
  }

  const timelineRows = plan.timeline.map((item, index) => {
    const start = new Date(
      eventDate.getTime() + item.startOffsetHours * 3600000,
    );
    const end = new Date(start.getTime() + item.durationMinutes * 60000);
    return {
      event_id: eventId,
      title: item.title,
      description: item.description,
      item_type: item.itemType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      sort_order: index,
    };
  });

  if (timelineRows.length) {
    await supabase.from("timeline_items").insert(timelineRows);
  }

  const budgetRows = plan.budget.map((item) => ({
    event_id: eventId,
    category: item.category,
    label: item.label,
    estimated: item.estimated,
    actual: 0,
    item_type: item.itemType,
    notes: item.notes,
  }));

  if (budgetRows.length) {
    await supabase.from("budget_items").insert(budgetRows);
  }

  await logActivity(eventId, actorId, "plan_generated", {
    source: plan.source,
    taskCount: taskRows.length,
    teamRoles: plan.teamStructure.length,
  });
}

export async function applyTemplateToEvent(
  eventId: string,
  payload: import("@/lib/ai/schemas/event-plan").EventPlan,
  eventDate: string | null,
  actorId: string,
) {
  await persistGeneratedPlan(
    eventId,
    { ...payload, source: "template" },
    { date: eventDate ?? undefined } as EventFormData,
    actorId,
  );
}

export async function replaceCategoryTasks(
  eventId: string,
  category: ChecklistCategory,
  plan: GeneratedPlan,
  input: EventFormData,
  actorId: string,
) {
  const supabase = createAdminClient();
  const eventDate = input.date ? new Date(`${input.date}T09:00:00`) : new Date();

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("event_id", eventId)
    .eq("category", category);

  const ids = (existing ?? []).map((t) => t.id);
  if (ids.length) {
    await supabase.from("tasks").delete().in("parent_id", ids);
    await supabase.from("tasks").delete().in("id", ids);
  }

  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sortOrder = (last?.sort_order ?? -1) + 1;
  const group = plan.checklistGroups.find((g) => g.category === category);
  const taskRows: {
    event_id: string;
    category: ChecklistCategory;
    title: string;
    description: string | null;
    status: "todo";
    priority: "low" | "medium" | "high";
    due_date: string | null;
    sort_order: number;
  }[] = [];

  if (group) {
    for (const item of group.items) {
      const dueDate =
        item.dueInDays != null && input.date
          ? new Date(eventDate.getTime() - item.dueInDays * 86400000)
              .toISOString()
              .slice(0, 10)
          : null;
      taskRows.push({
        event_id: eventId,
        category,
        title: item.title,
        description: item.description,
        status: "todo",
        priority: item.priority ?? "medium",
        due_date: dueDate,
        sort_order: sortOrder++,
      });
    }
  }

  if (category === "marketing") {
    for (const title of plan.marketingChecklist) {
      taskRows.push({
        event_id: eventId,
        category: "marketing",
        title,
        description: null,
        status: "todo",
        priority: "medium",
        due_date: null,
        sort_order: sortOrder++,
      });
    }
  }

  if (category === "sponsors") {
    for (const title of plan.sponsorshipChecklist) {
      taskRows.push({
        event_id: eventId,
        category: "sponsors",
        title,
        description: null,
        status: "todo",
        priority: "medium",
        due_date: null,
        sort_order: sortOrder++,
      });
    }
  }

  if (taskRows.length) {
    await supabase.from("tasks").insert(taskRows);
  }

  await logActivity(eventId, actorId, "category_regenerated", {
    category,
    taskCount: taskRows.length,
    source: plan.source,
  });
}
