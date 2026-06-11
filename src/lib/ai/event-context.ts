import type { Event, Task, TimelineItem, BudgetItem } from "@/lib/types";
import { formatCategory, formatEventType, formatMoney } from "@/lib/format";

export function buildEventContextBlock(
  event: Event,
  tasks: Task[],
  timeline: TimelineItem[] = [],
  budget: BudgetItem[] = [],
): string {
  const rootTasks = tasks.filter((t) => !t.parent_id);
  const open = rootTasks.filter((t) => t.status !== "completed");
  const done = rootTasks.filter((t) => t.status === "completed");
  const overdue = open.filter(
    (t) => t.due_date && new Date(`${t.due_date}T23:59:59`) < new Date(),
  );

  const taskLines = open
    .slice(0, 40)
    .map(
      (t) =>
        `- [${t.status}] ${formatCategory(t.category)}: ${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`,
    )
    .join("\n");

  const timelineLines = timeline
    .slice(0, 15)
    .map((t) => `- ${t.title} (${new Date(t.start_time).toISOString()})`)
    .join("\n");

  const budgetTotal = budget
    .filter((b) => b.item_type === "expense")
    .reduce((s, b) => s + Number(b.estimated), 0);

  return [
    `Event: ${event.name}`,
    `Type: ${formatEventType(event.type)}`,
    event.date ? `Date: ${event.date}` : "Date: not set",
    event.location ? `Location: ${event.location}` : null,
    event.audience_size ? `Audience: ${event.audience_size}` : null,
    event.goal ? `Goal: ${event.goal}` : null,
    event.budget_range ? `Budget range: ${event.budget_range}` : null,
    budget.length ? `Budget estimated total: ${formatMoney(budgetTotal, event.currency)}` : null,
    `Progress: ${done.length}/${rootTasks.length} tasks complete`,
    overdue.length ? `Overdue tasks: ${overdue.length}` : null,
    event.plan_summary ? `\nPlan summary:\n${event.plan_summary.slice(0, 1500)}` : null,
    taskLines ? `\nOpen tasks:\n${taskLines}` : null,
    timelineLines ? `\nSchedule:\n${timelineLines}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
