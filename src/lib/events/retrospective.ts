import type { Event, Task, TimelineItem, BudgetItem } from "@/lib/types";
import { formatCategory, formatMoney } from "@/lib/format";

export type RetrospectiveData = {
  completionRate: number;
  skippedCategories: string[];
  budgetVariance: number;
  budgetVariancePercent: number;
  onTimeRate: number;
  highlights: string[];
  improvements: string[];
  summary: string;
};

export function buildRetrospective(
  event: Event,
  tasks: Task[],
  timeline: TimelineItem[],
  budget: BudgetItem[],
): RetrospectiveData {
  const root = tasks.filter((t) => !t.parent_id);
  const completed = root.filter((t) => t.status === "completed");
  const open = root.filter((t) => t.status !== "completed");
  const completionRate = root.length ? Math.round((completed.length / root.length) * 100) : 0;

  const categories = [...new Set(root.map((t) => t.category))];
  const skippedCategories = categories.filter(
    (cat) => !root.some((t) => t.category === cat && t.status === "completed"),
  ).map(formatCategory);

  const expenses = budget.filter((b) => b.item_type === "expense");
  const estimated = expenses.reduce((s, b) => s + Number(b.estimated), 0);
  const actual = expenses.reduce((s, b) => s + Number(b.actual), 0);
  const budgetVariance = actual - estimated;
  const budgetVariancePercent =
    estimated > 0 ? Math.round((budgetVariance / estimated) * 100) : 0;

  const withDue = completed.filter((t) => t.due_date);
  const onTimeRate =
    withDue.length > 0
      ? Math.round(
          (withDue.filter((t) => t.updated_at.slice(0, 10) <= t.due_date!).length /
            withDue.length) *
            100,
        )
      : 100;

  const highlights: string[] = [];
  if (completionRate >= 80) highlights.push(`${completionRate}% of checklist tasks completed.`);
  if (timeline.length) highlights.push(`${timeline.length} schedule items planned.`);
  if (actual > 0)
    highlights.push(`Tracked ${formatMoney(actual, event.currency)} in actual spend.`);

  const improvements: string[] = [];
  if (open.length) improvements.push(`${open.length} tasks still open — carry forward or close them.`);
  if (skippedCategories.length)
    improvements.push(`Categories with no completed tasks: ${skippedCategories.join(", ")}.`);
  if (budgetVariancePercent > 10)
    improvements.push(
      `Spending came in ${budgetVariancePercent}% above estimate — review ${formatCategory("venue")} and ${formatCategory("catering")} lines.`,
    );
  if (onTimeRate < 70)
    improvements.push("Many tasks finished after their due dates — pad timelines next time.");

  const summary = [
    `${event.name} retrospective: ${completionRate}% task completion`,
    open.length ? `${open.length} items left open` : "checklist fully complete",
    budgetVariance !== 0
      ? `budget ${budgetVariance > 0 ? "over" : "under"} by ${formatMoney(Math.abs(budgetVariance), event.currency)}`
      : "budget on target",
  ].join(" · ");

  return {
    completionRate,
    skippedCategories,
    budgetVariance,
    budgetVariancePercent,
    onTimeRate,
    highlights: highlights.length ? highlights : ["Event plan captured for future reference."],
    improvements: improvements.length
      ? improvements
      : ["Strong execution — save this event as a template for next time."],
    summary,
  };
}
