import { createAdminClient } from "@/lib/supabase/server";
import type {
  ActivityLog,
  BudgetItem,
  ChecklistCategory,
  DashboardStats,
  Event,
  EventMember,
  EventWithProgress,
  RiskAlert,
  Task,
  Template,
  TimelineItem,
  Comment,
} from "@/lib/types";
import { CATEGORY_ORDER } from "@/lib/format";
import { canAccessEvent } from "@/lib/events/access";

export async function requireUserId() {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getEventForUser(
  eventId: string,
  userId: string,
): Promise<Event | null> {
  if (!(await canAccessEvent(userId, eventId))) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as Event | null;
}

export async function getEventsForUser(userId: string): Promise<EventWithProgress[]> {
  const supabase = createAdminClient();

  const { data: owned } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "archived");

  const { data: memberships } = await supabase
    .from("event_members")
    .select("event_id")
    .eq("user_id", userId);

  const memberEventIds = (memberships ?? [])
    .map((m) => m.event_id)
    .filter((id) => !(owned ?? []).some((e) => e.id === id));

  let memberEvents: Event[] = [];
  if (memberEventIds.length) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("id", memberEventIds)
      .neq("status", "archived");
    memberEvents = (data ?? []) as Event[];
  }

  const events = [...((owned ?? []) as Event[]), ...memberEvents].sort((a, b) => {
    const da = a.date ?? a.created_at;
    const db = b.date ?? b.created_at;
    return da.localeCompare(db);
  });

  if (!events.length) return [];

  const eventIds = events.map((e) => e.id);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("event_id, status, title, category, due_date, parent_id")
    .in("event_id", eventIds)
    .is("parent_id", null);

  const today = new Date().toISOString().slice(0, 10);

  return events.map((event) => {
    const eventTasks = (tasks ?? []).filter((t) => t.event_id === event.id);
    const total_items = eventTasks.length;
    const completed_items = eventTasks.filter((t) => t.status === "completed").length;
    const openTasks = eventTasks.filter((t) => t.status !== "completed");
    const overdue_count = openTasks.filter(
      (t) => t.due_date && t.due_date < today,
    ).length;

    const nextTask = [...openTasks].sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category as ChecklistCategory) -
        CATEGORY_ORDER.indexOf(b.category as ChecklistCategory),
    )[0];

    let attention_label: string | null = null;
    if (overdue_count > 0) {
      attention_label = `${overdue_count} overdue`;
    } else if (openTasks.some((t) => t.category === "venue")) {
      attention_label = "Venue not done";
    }

    return {
      ...event,
      total_items,
      completed_items,
      next_step: nextTask ? nextTask.title : null,
      overdue_count,
      attention_label,
    };
  });
}

export async function getTasks(eventId: string): Promise<Task[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTimelineItems(eventId: string): Promise<TimelineItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("timeline_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TimelineItem[];
}

export async function getBudgetItems(eventId: string): Promise<BudgetItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BudgetItem[];
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function getTemplateById(templateId: string): Promise<Template | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  return data as Template | null;
}

export async function getEventMembers(eventId: string): Promise<EventMember[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventMember[];
}

export async function getActivityLogs(
  eventId: string,
  limit = 20,
): Promise<ActivityLog[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}

export async function getTemplates(): Promise<Template[]> {
  const supabase = createAdminClient();
  const { seedTemplatesIfEmpty } = await import("@/lib/templates/seed");
  await seedTemplatesIfEmpty(supabase);

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Template[];
}

function computeRisks(
  tasks: Task[],
  budgetItems: BudgetItem[],
  event: Event,
): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );
  if (overdue.length) {
    risks.push({
      id: "overdue",
      severity: "high",
      title: "Overdue tasks",
      message: `${overdue.length} task(s) are past their due date.`,
    });
  }

  const venueTasks = tasks.filter(
    (t) => t.category === "venue" && t.status !== "completed",
  );
  if (venueTasks.length) {
    risks.push({
      id: "venue",
      severity: "high",
      title: "Venue not fully secured",
      message: `${venueTasks.length} venue task(s) still open.`,
    });
  }

  const expenses = budgetItems.filter((b) => b.item_type === "expense");
  const income = budgetItems.filter((b) => b.item_type === "income");
  const estExp = expenses.reduce((s, b) => s + Number(b.estimated), 0);
  const actExp = expenses.reduce((s, b) => s + Number(b.actual), 0);
  if (actExp > estExp * 1.1 && estExp > 0) {
    risks.push({
      id: "budget",
      severity: "medium",
      title: "Budget overrun",
      message: `Actual spending ($${actExp}) exceeds estimate ($${estExp}).`,
    });
  }

  const speakerTasks = tasks.filter(
    (t) => t.category === "speakers" && t.status !== "completed",
  );
  if (speakerTasks.length >= 2) {
    risks.push({
      id: "speakers",
      severity: "medium",
      title: "Speaker lineup incomplete",
      message: `${speakerTasks.length} speaker-related tasks remain.`,
    });
  }

  if (event.date) {
    const daysUntil = Math.ceil(
      (new Date(`${event.date}T12:00:00`).getTime() - Date.now()) / 86400000,
    );
    if (daysUntil <= 7 && daysUntil >= 0) {
      const openTasks = tasks.filter((t) => t.status !== "completed").length;
      if (openTasks > 5) {
        risks.push({
          id: "crunch",
          severity: "high",
          title: "Event approaching",
          message: `${openTasks} tasks still open with ${daysUntil} day(s) remaining.`,
        });
      }
    }
  }

  if (!income.length && estExp > 1000) {
    risks.push({
      id: "sponsors",
      severity: "low",
      title: "No sponsorship income tracked",
      message: "Consider adding sponsor income to your budget.",
    });
  }

  return risks;
}

export async function getDashboardStats(
  eventId: string,
  event: Event,
): Promise<DashboardStats> {
  const [tasks, budgetItems, activity] = await Promise.all([
    getTasks(eventId),
    getBudgetItems(eventId),
    getActivityLogs(eventId, 10),
  ]);

  const rootTasks = tasks.filter((t) => !t.parent_id);
  const completedTasks = rootTasks.filter((t) => t.status === "completed").length;
  const today = new Date().toISOString().slice(0, 10);

  const upcomingDeadlines = rootTasks
    .filter((t) => t.due_date && t.due_date >= today && t.status !== "completed")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 5);

  const overdueTasks = rootTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  ).length;

  const expenses = budgetItems.filter((b) => b.item_type === "expense");
  const income = budgetItems.filter((b) => b.item_type === "income");
  const budgetEstimated =
    income.reduce((s, b) => s + Number(b.estimated), 0) -
    expenses.reduce((s, b) => s + Number(b.estimated), 0);
  const budgetActual =
    income.reduce((s, b) => s + Number(b.actual), 0) -
    expenses.reduce((s, b) => s + Number(b.actual), 0);

  return {
    progress: rootTasks.length
      ? Math.round((completedTasks / rootTasks.length) * 100)
      : 0,
    totalTasks: rootTasks.length,
    completedTasks,
    overdueTasks,
    upcomingDeadlines,
    budgetEstimated,
    budgetActual,
    budgetRemaining: budgetEstimated - expenses.reduce((s, b) => s + Number(b.actual), 0) + income.reduce((s, b) => s + Number(b.actual), 0),
    risks: computeRisks(tasks, budgetItems, event),
    recentActivity: activity,
  };
}
