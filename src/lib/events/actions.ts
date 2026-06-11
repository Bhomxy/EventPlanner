"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateEventPlan } from "@/lib/ai/generate-plan";
import { createAdminClient } from "@/lib/supabase/server";
import { canAccessEvent, canEdit, canManageTeam, getEventRole } from "@/lib/events/access";
import { logActivity } from "@/lib/events/activity";
import {
  persistGeneratedPlan,
  applyTemplateToEvent,
  type EventFormData,
} from "@/lib/events/plan-persistence";
import {
  getEventForUser,
  getEventMembers,
  getTemplates,
  requireUserId,
} from "@/lib/events/queries";
import {
  CHECKLIST_CATEGORIES,
  BUDGET_CATEGORIES,
  EVENT_STATUSES,
  EVENT_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TIMELINE_ITEM_TYPES,
  type BudgetCategory,
  type ChecklistCategory,
  type EventStatus,
  type EventType,
  type MemberRole,
  type TaskPriority,
  type TaskStatus,
  type TimelineItemType,
} from "@/lib/types";

function parseEventForm(formData: FormData): EventFormData {
  const overview = String(formData.get("overview") ?? "").trim();
  let name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "other") as EventType;
  const date = String(formData.get("date") ?? "").trim() || undefined;
  const location = String(formData.get("location") ?? "").trim() || undefined;
  const goal = String(formData.get("goal") ?? "").trim() || undefined;
  let notes = String(formData.get("notes") ?? "").trim() || undefined;
  const budget_range = String(formData.get("budget_range") ?? "").trim() || undefined;
  const audienceRaw = String(formData.get("audience_size") ?? "").trim();
  const audience_size = audienceRaw ? Number(audienceRaw) : undefined;

  if (overview) {
    notes = notes ? `${overview}\n\n${notes}` : overview;
    if (!name) {
      name = overview.split(/[.!?\n]/)[0]?.trim().slice(0, 80) || "My event";
    }
  }

  if (!name) throw new Error("Describe your event or add a name");
  if (!EVENT_TYPES.includes(type)) throw new Error("Invalid event type");

  return { name, type, date, location, audience_size, goal, notes, budget_range };
}

function revalidateEvent(eventId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/tasks`);
  revalidatePath(`/events/${eventId}/timeline`);
  revalidatePath(`/events/${eventId}/budget`);
  revalidatePath(`/events/${eventId}/team`);
  revalidatePath(`/events/${eventId}/export`);
}

async function ensureEditAccess(eventId: string) {
  const userId = await requireUserId();
  const event = await getEventForUser(eventId, userId);
  if (!event) throw new Error("Event not found");
  const role = await getEventRole(userId, event);
  if (!canEdit(role)) throw new Error("Insufficient permissions");
  return { userId, event, role };
}

export async function createEvent(formData: FormData) {
  const userId = await requireUserId();
  const user = await currentUser();
  const input = parseEventForm(formData);
  const templateId = String(formData.get("template_id") ?? "").trim();
  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      date: input.date ?? null,
      location: input.location ?? null,
      audience_size: input.audience_size ?? null,
      goal: input.goal ?? null,
      notes: input.notes ?? null,
      budget_range: input.budget_range ?? null,
      status: "planning",
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("event_members").insert({
    event_id: event.id,
    user_id: userId,
    email: user?.emailAddresses[0]?.emailAddress ?? `${userId}@local`,
    name: user?.fullName ?? null,
    role: "owner",
  });

  try {
    if (templateId) {
      const { data: template } = await supabase
        .from("templates")
        .select("payload")
        .eq("id", templateId)
        .single();
      if (template?.payload) {
        await applyTemplateToEvent(
          event.id,
          template.payload as import("@/lib/ai/schemas/event-plan").EventPlan,
          input.date ?? null,
          userId,
        );
      }
    } else {
      const plan = await generateEventPlan({
        name: input.name,
        type: input.type,
        date: input.date,
        location: input.location,
        audienceSize: input.audience_size,
        goal: input.goal,
        notes: input.notes,
        budgetRange: input.budget_range,
      });
      await persistGeneratedPlan(event.id, plan, input, userId);
    }
  } catch (planError) {
    await supabase.from("events").delete().eq("id", event.id);
    throw planError;
  }

  revalidatePath("/dashboard");
  redirect(`/events/${event.id}`);
}

export async function createEventFromTemplate(templateId: string) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!template) throw new Error("Template not found");

  const formData = new FormData();
  formData.set("name", `${template.name} Event`);
  formData.set("type", template.event_type);
  formData.set("template_id", templateId);
  formData.set("generate_plan", "false");
  await createEvent(formData);
}

export async function updateEvent(eventId: string, formData: FormData) {
  await ensureEditAccess(eventId);
  const input = parseEventForm(formData);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("events")
    .update({
      name: input.name,
      type: input.type,
      date: input.date ?? null,
      location: input.location ?? null,
      audience_size: input.audience_size ?? null,
      goal: input.goal ?? null,
      notes: input.notes ?? null,
      budget_range: input.budget_range ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) throw error;
  revalidateEvent(eventId);
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const { userId, event } = await ensureEditAccess(eventId);
  if (event.user_id !== userId) throw new Error("Only the owner can delete");

  const supabase = createAdminClient();
  await supabase.from("events").delete().eq("id", eventId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function enableEventSharing(eventId: string) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase
    .from("events")
    .update({ share_token: token, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
  revalidateEvent(eventId);
  return token;
}

export async function disableEventSharing(eventId: string) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ share_token: null, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
  revalidateEvent(eventId);
}

export async function updateEventCurrency(eventId: string, currency: string) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ currency, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
  revalidateEvent(eventId);
}

export async function archiveEvent(eventId: string) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  await supabase
    .from("events")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", eventId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function duplicateEvent(eventId: string) {
  const { userId, event } = await ensureEditAccess(eventId);
  const supabase = createAdminClient();

  const { data: copy, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      name: `${event.name} (Copy)`,
      type: event.type,
      date: event.date,
      location: event.location,
      audience_size: event.audience_size,
      goal: event.goal,
      notes: event.notes,
      budget_range: event.budget_range,
      currency: event.currency ?? "USD",
      plan_summary: event.plan_summary,
      status: "planning",
    })
    .select("*")
    .single();

  if (error) throw error;

  const [tasks, timeline, budget] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", eventId),
    supabase.from("timeline_items").select("*").eq("event_id", eventId),
    supabase.from("budget_items").select("*").eq("event_id", eventId),
  ]);

  if (tasks.data?.length) {
    await supabase.from("tasks").insert(
      tasks.data.map(({ id: _id, event_id: _e, created_at: _c, updated_at: _u, ...t }) => ({
        ...t,
        event_id: copy.id,
        status: "todo",
      })),
    );
  }

  if (timeline.data?.length) {
    await supabase.from("timeline_items").insert(
      timeline.data.map(({ id: _id, event_id: _e, created_at: _c, ...t }) => ({
        ...t,
        event_id: copy.id,
      })),
    );
  }

  if (budget.data?.length) {
    await supabase.from("budget_items").insert(
      budget.data.map(({ id: _id, event_id: _e, created_at: _c, ...t }) => ({
        ...t,
        event_id: copy.id,
        actual: 0,
      })),
    );
  }

  revalidatePath("/dashboard");
  redirect(`/events/${copy.id}`);
}

export async function regeneratePlan(eventId: string) {
  const { userId, event } = await ensureEditAccess(eventId);
  const plan = await generateEventPlan({
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location,
    audienceSize: event.audience_size,
    goal: event.goal,
    notes: event.notes,
    budgetRange: event.budget_range,
  });
  await persistGeneratedPlan(
    eventId,
    plan,
    {
      name: event.name,
      type: event.type,
      date: event.date ?? undefined,
      location: event.location ?? undefined,
      audience_size: event.audience_size ?? undefined,
      goal: event.goal ?? undefined,
      notes: event.notes ?? undefined,
      budget_range: event.budget_range ?? undefined,
    },
    userId,
  );
  revalidateEvent(eventId);
}

export async function updatePlanSummary(eventId: string, summary: string) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  await supabase
    .from("events")
    .update({ plan_summary: summary, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  revalidateEvent(eventId);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const userId = await requireUserId();
  if (!TASK_STATUSES.includes(status)) throw new Error("Invalid status");
  const supabase = createAdminClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*, events(id)")
    .eq("id", taskId)
    .single();
  if (!task || !(await canAccessEvent(userId, task.event_id))) {
    throw new Error("Unauthorized");
  }

  await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  await logActivity(task.event_id, userId, "task_updated", {
    taskId,
    status,
    title: task.title,
  });

  revalidateEvent(task.event_id);
}

export async function updateTaskDetails(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    category?: ChecklistCategory;
    due_date?: string | null;
    assignee_id?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
  },
) {
  const userId = await requireUserId();
  const supabase = createAdminClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("event_id, title")
    .eq("id", taskId)
    .single();
  if (!task || !(await canAccessEvent(userId, task.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(task.event_id);

  const updates: {
    updated_at: string;
    title?: string;
    description?: string | null;
    category?: ChecklistCategory;
    due_date?: string | null;
    assignee_id?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.category !== undefined) updates.category = data.category;
  if (data.due_date !== undefined) updates.due_date = data.due_date;
  if (data.assignee_id !== undefined) updates.assignee_id = data.assignee_id;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.status !== undefined) updates.status = data.status;
  if (data.contact_name !== undefined) updates.contact_name = data.contact_name?.trim() || null;
  if (data.contact_email !== undefined) updates.contact_email = data.contact_email?.trim() || null;
  if (data.contact_phone !== undefined) updates.contact_phone = data.contact_phone?.trim() || null;

  await supabase.from("tasks").update(updates).eq("id", taskId);
  revalidateEvent(task.event_id);
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  await updateTaskStatus(taskId, completed ? "completed" : "todo");
}

export async function createTask(
  eventId: string,
  data: {
    title: string;
    category?: ChecklistCategory;
    priority?: TaskPriority;
    due_date?: string;
    parent_id?: string;
    assignee_id?: string;
    status?: TaskStatus;
  },
) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("tasks").insert({
    event_id: eventId,
    title: data.title.trim(),
    category: data.category ?? "other",
    priority: data.priority ?? "medium",
    due_date: data.due_date ?? null,
    parent_id: data.parent_id ?? null,
    assignee_id: data.assignee_id ?? null,
    status: data.status ?? "todo",
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  revalidateEvent(eventId);
}

export async function deleteTask(taskId: string) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("event_id")
    .eq("id", taskId)
    .single();
  if (!task || !(await canAccessEvent(userId, task.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(task.event_id);
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidateEvent(task.event_id);
}

export async function updateBudgetItem(
  itemId: string,
  data: {
    estimated?: number;
    actual?: number;
    label?: string;
    notes?: string;
    category?: BudgetCategory;
  },
) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("budget_items")
    .select("event_id")
    .eq("id", itemId)
    .single();
  if (!item || !(await canAccessEvent(userId, item.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(item.event_id);
  await supabase.from("budget_items").update(data).eq("id", itemId);
  revalidateEvent(item.event_id);
}

export async function deleteBudgetItem(itemId: string) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("budget_items")
    .select("event_id")
    .eq("id", itemId)
    .single();
  if (!item || !(await canAccessEvent(userId, item.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(item.event_id);
  await supabase.from("budget_items").delete().eq("id", itemId);
  revalidateEvent(item.event_id);
}

export async function updateTimelineItem(
  itemId: string,
  data: {
    title?: string;
    description?: string | null;
    item_type?: TimelineItemType;
    start_time?: string;
    end_time?: string;
    sort_order?: number;
  },
) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("timeline_items")
    .select("event_id")
    .eq("id", itemId)
    .single();
  if (!item || !(await canAccessEvent(userId, item.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(item.event_id);
  await supabase.from("timeline_items").update(data).eq("id", itemId);
  revalidateEvent(item.event_id);
}

export async function reorderTimelineItems(
  eventId: string,
  orderedIds: string[],
) {
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("timeline_items").update({ sort_order: index }).eq("id", id),
    ),
  );
  revalidateEvent(eventId);
}

export async function syncPendingInvites() {
  const userId = await requireUserId();
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) return { matched: 0 };

  const supabase = createAdminClient();
  const { data: pending } = await supabase
    .from("event_members")
    .select("id, event_id")
    .eq("email", email)
    .is("user_id", null);

  if (!pending?.length) return { matched: 0 };

  await supabase
    .from("event_members")
    .update({
      user_id: userId,
      name: user?.fullName ?? null,
    })
    .eq("email", email)
    .is("user_id", null);

  for (const row of pending) {
    await logActivity(row.event_id, userId, "invite_accepted", { email });
    revalidatePath(`/events/${row.event_id}`);
  }
  revalidatePath("/dashboard");

  return { matched: pending.length };
}

export async function regenerateCategoryChecklists(
  eventId: string,
  category: ChecklistCategory,
) {
  const { userId, event } = await ensureEditAccess(eventId);
  if (!CHECKLIST_CATEGORIES.includes(category)) throw new Error("Invalid category");
  const plan = await generateEventPlan({
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location,
    audienceSize: event.audience_size,
    goal: event.goal,
    notes: event.notes,
    budgetRange: event.budget_range,
  });

  const { replaceCategoryTasks } = await import("@/lib/events/plan-persistence");
  await replaceCategoryTasks(
    eventId,
    category,
    plan,
    {
      name: event.name,
      type: event.type,
      date: event.date ?? undefined,
      location: event.location ?? undefined,
      audience_size: event.audience_size ?? undefined,
      goal: event.goal ?? undefined,
      notes: event.notes ?? undefined,
      budget_range: event.budget_range ?? undefined,
    },
    userId,
  );
  revalidateEvent(eventId);
}

export async function getEventExportData(eventId: string) {
  const userId = await requireUserId();
  const event = await getEventForUser(eventId, userId);
  if (!event) throw new Error("Event not found");

  const supabase = createAdminClient();
  const [tasks, budgetItems] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("budget_items").select("*").eq("event_id", eventId),
  ]);

  const rootTasks = (tasks.data ?? []).filter((t) => !t.parent_id);
  const completed = rootTasks.filter((t) => t.status === "completed");
  const expenses = (budgetItems.data ?? []).filter((b) => b.item_type === "expense");
  const income = (budgetItems.data ?? []).filter((b) => b.item_type === "income");

  return {
    event,
    completedTasks: completed,
    openTasks: rootTasks.filter((t) => t.status !== "completed"),
    totalSpent: expenses.reduce((s, b) => s + Number(b.actual), 0),
    totalIncome: income.reduce((s, b) => s + Number(b.actual), 0),
    budgetItems: budgetItems.data ?? [],
  };
}

export async function createBudgetItem(
  eventId: string,
  data: {
    label: string;
    category: BudgetCategory;
    item_type: "expense" | "income";
    estimated: number;
  },
) {
  await ensureEditAccess(eventId);
  if (!BUDGET_CATEGORIES.includes(data.category)) throw new Error("Invalid category");
  const supabase = createAdminClient();
  await supabase.from("budget_items").insert({
    event_id: eventId,
    label: data.label,
    category: data.category,
    item_type: data.item_type,
    estimated: data.estimated,
    actual: 0,
  });
  revalidateEvent(eventId);
}

export async function createTimelineItem(
  eventId: string,
  data: {
    title: string;
    item_type: TimelineItemType;
    start_time: string;
    end_time: string;
    description?: string;
  },
) {
  await ensureEditAccess(eventId);
  if (!TIMELINE_ITEM_TYPES.includes(data.item_type)) throw new Error("Invalid type");
  const supabase = createAdminClient();
  const { data: last } = await supabase
    .from("timeline_items")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("timeline_items").insert({
    event_id: eventId,
    title: data.title,
    description: data.description ?? null,
    item_type: data.item_type,
    start_time: data.start_time,
    end_time: data.end_time,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  revalidateEvent(eventId);
}

export async function deleteTimelineItem(itemId: string) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("timeline_items")
    .select("event_id")
    .eq("id", itemId)
    .single();
  if (!item || !(await canAccessEvent(userId, item.event_id))) {
    throw new Error("Unauthorized");
  }
  await ensureEditAccess(item.event_id);
  await supabase.from("timeline_items").delete().eq("id", itemId);
  revalidateEvent(item.event_id);
}

export async function inviteTeamMember(
  eventId: string,
  email: string,
  role: MemberRole,
) {
  const { userId, event, role: myRole } = await ensureEditAccess(eventId);
  if (!canManageTeam(myRole)) throw new Error("Insufficient permissions");

  const supabase = createAdminClient();
  await supabase.from("event_members").upsert(
    {
      event_id: eventId,
      email: email.trim().toLowerCase(),
      role,
      user_id: null,
    },
    { onConflict: "event_id,email" },
  );

  await logActivity(eventId, userId, "member_invited", { email, role });
  revalidateEvent(eventId);
}

export async function addTaskComment(taskId: string, body: string) {
  const userId = await requireUserId();
  const user = await currentUser();
  const supabase = createAdminClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("event_id, title")
    .eq("id", taskId)
    .single();
  if (!task || !(await canAccessEvent(userId, task.event_id))) {
    throw new Error("Unauthorized");
  }

  await supabase.from("comments").insert({
    event_id: task.event_id,
    task_id: taskId,
    author_id: userId,
    author_name: user?.fullName ?? null,
    body: body.trim(),
  });

  await logActivity(task.event_id, userId, "comment_added", {
    taskId,
    taskTitle: task.title,
  });

  revalidateEvent(task.event_id);
}

export async function getTaskCommentsAction(taskId: string) {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("event_id")
    .eq("id", taskId)
    .single();
  if (!task || !(await canAccessEvent(userId, task.event_id))) {
    throw new Error("Unauthorized");
  }
  const { getTaskComments } = await import("@/lib/events/queries");
  return getTaskComments(taskId);
}

export async function getTemplatesAction() {
  return getTemplates();
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  await ensureEditAccess(eventId);
  if (!EVENT_STATUSES.includes(status)) throw new Error("Invalid status");
  const supabase = createAdminClient();
  await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  revalidateEvent(eventId);
}

export async function saveEventAsTemplate(eventId: string, templateName: string) {
  const userId = await requireUserId();
  await ensureEditAccess(eventId);
  const supabase = createAdminClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!event) throw new Error("Event not found");

  const [tasks, timeline, budget] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", eventId),
    supabase.from("timeline_items").select("*").eq("event_id", eventId),
    supabase.from("budget_items").select("*").eq("event_id", eventId),
  ]);

  const { buildPlanPayloadFromEvent } = await import("@/lib/events/build-plan-payload");
  const payload = buildPlanPayloadFromEvent(
    (tasks.data ?? []) as import("@/lib/types").Task[],
    (timeline.data ?? []) as import("@/lib/types").TimelineItem[],
    (budget.data ?? []) as import("@/lib/types").BudgetItem[],
    event.plan_summary,
  );

  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      name: templateName.trim(),
      event_type: event.type,
      description: `Saved from ${event.name}`,
      payload,
      user_id: userId,
      source_event_id: eventId,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/templates");
  return template.id as string;
}

export async function copyChecklistFromEvent(
  targetEventId: string,
  sourceEventId: string,
  mode: "merge" | "replace" = "merge",
) {
  const userId = await requireUserId();
  await ensureEditAccess(targetEventId);
  if (!(await canAccessEvent(userId, sourceEventId))) {
    throw new Error("Cannot access source event");
  }

  const supabase = createAdminClient();
  const { data: sourceTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", sourceEventId)
    .is("parent_id", null)
    .order("sort_order");

  if (!sourceTasks?.length) throw new Error("Source event has no tasks");

  if (mode === "replace") {
    await supabase.from("tasks").delete().eq("event_id", targetEventId);
  }

  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("event_id", targetEventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sortOrder = (last?.sort_order ?? -1) + 1;
  const rows = sourceTasks.map((t) => ({
    event_id: targetEventId,
    title: t.title,
    description: t.description,
    category: t.category,
    status: "todo" as const,
    priority: t.priority,
    due_date: null,
    sort_order: sortOrder++,
  }));

  await supabase.from("tasks").insert(rows);
  revalidateEvent(targetEventId);
}

export async function getUserPreferencesAction() {
  const userId = await requireUserId();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as import("@/lib/types").UserPreferences;

  const { data: created } = await supabase
    .from("user_preferences")
    .insert({ user_id: userId })
    .select("*")
    .single();

  return created as import("@/lib/types").UserPreferences;
}

export async function updateUserPreferences(data: {
  email_reminders?: boolean;
  reminder_days?: number;
  onboarding_completed?: boolean;
}) {
  const userId = await requireUserId();
  const supabase = createAdminClient();

  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function getEventsForCopyPicker(excludeEventId: string) {
  const userId = await requireUserId();
  const { getEventsForUser } = await import("@/lib/events/queries");
  const events = await getEventsForUser(userId);
  return events
    .filter((e) => e.id !== excludeEventId)
    .map((e) => ({ id: e.id, name: e.name, type: e.type }));
}

export async function getRetrospectiveData(eventId: string) {
  const userId = await requireUserId();
  const event = await getEventForUser(eventId, userId);
  if (!event) throw new Error("Event not found");

  const supabase = createAdminClient();
  const [tasks, timeline, budget, stats] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", eventId),
    supabase.from("timeline_items").select("*").eq("event_id", eventId),
    supabase.from("budget_items").select("*").eq("event_id", eventId),
    import("@/lib/events/queries").then((m) => m.getDashboardStats(eventId, event)),
  ]);

  const { buildRetrospective } = await import("@/lib/events/retrospective");
  return {
    event,
    stats,
    retrospective: buildRetrospective(
      event,
      (tasks.data ?? []) as import("@/lib/types").Task[],
      (timeline.data ?? []) as import("@/lib/types").TimelineItem[],
      (budget.data ?? []) as import("@/lib/types").BudgetItem[],
    ),
  };
}
