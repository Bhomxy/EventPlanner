import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { BudgetItem, ChecklistCategory, Event, Task, TimelineItem } from "@/lib/types";
import {
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  formatCategory,
  formatEventDate,
  formatEventType,
  formatMoney,
  getProgressPercent,
} from "@/lib/format";
import { AppLogo } from "@/components/layout/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

async function getSharedEvent(token: string) {
  if (!token || token.length < 16) return null;
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  if (!event) return null;

  const [{ data: tasks }, { data: timeline }, { data: budget }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("event_id", event.id)
      .is("parent_id", null)
      .order("sort_order"),
    supabase
      .from("timeline_items")
      .select("*")
      .eq("event_id", event.id)
      .order("start_time"),
    supabase
      .from("budget_items")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at"),
  ]);

  return {
    event: event as Event,
    tasks: (tasks ?? []) as Task[],
    timeline: (timeline ?? []) as TimelineItem[],
    budget: (budget ?? []) as BudgetItem[],
  };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getSharedEvent(token);
  if (!data) return { title: "Event plan not found" };
  return {
    title: `${data.event.name} — shared event plan`,
    description: `Planning progress and checklist for ${data.event.name}.`,
  };
}

export default async function SharedEventPage({ params }: SharePageProps) {
  const { token } = await params;
  const data = await getSharedEvent(token);
  if (!data) notFound();

  const { event, tasks, timeline, budget } = data;
  const expenses = budget.filter((b) => b.item_type === "expense");
  const income = budget.filter((b) => b.item_type === "income");
  const totalEstimated = expenses.reduce((s, b) => s + Number(b.estimated), 0);
  const totalSpent = expenses.reduce((s, b) => s + Number(b.actual), 0);
  const totalIncome = income.reduce((s, b) => s + Number(b.actual), 0);
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = getProgressPercent(completed, tasks.length);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: tasks.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-200/80 bg-white/85 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <AppLogo />
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/sign-up">Plan your own event</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-violet-700 dark:text-violet-300">
            Shared event plan · read-only
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{formatEventType(event.type)}</Badge>
            {event.date ? (
              <span className="text-sm text-stone-500">{formatEventDate(event.date)}</span>
            ) : null}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{event.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-500">
            {event.location ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            ) : null}
            {event.audience_size ? (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {event.audience_size} expected
              </span>
            ) : null}
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completed} of {tasks.length} steps complete
            </span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-3" />
        </div>

        {event.plan_summary ? (
          <div className="surface-card rounded-2xl p-5">
            <h2 className="font-display mb-2 text-lg font-semibold">Plan summary</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {event.plan_summary}
            </p>
          </div>
        ) : null}

        {grouped.length ? (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Checklist</h2>
            {grouped.map(({ category, items }) => (
              <CategorySection key={category} category={category} items={items} />
            ))}
          </div>
        ) : null}

        {budget.length ? (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Budget</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-card rounded-2xl p-4">
                <p className="text-xs text-stone-500">Estimated expenses</p>
                <p className="mt-1 text-xl font-bold">
                  {formatMoney(totalEstimated, event.currency)}
                </p>
              </div>
              <div className="surface-card rounded-2xl p-4">
                <p className="text-xs text-stone-500">Spent so far</p>
                <p className="mt-1 text-xl font-bold">{formatMoney(totalSpent, event.currency)}</p>
              </div>
              <div className="surface-card rounded-2xl p-4">
                <p className="text-xs text-stone-500">Sponsor income</p>
                <p className="mt-1 text-xl font-bold">{formatMoney(totalIncome, event.currency)}</p>
              </div>
            </div>
            <div className="surface-card overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b border-stone-100 text-left text-xs text-stone-500 dark:border-stone-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 text-right font-medium">Estimated</th>
                    <th className="px-5 py-3 text-right font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-900">
                  {budget.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-2.5">
                        {item.label}
                        {item.item_type === "income" ? (
                          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Income
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-2.5 capitalize text-stone-500">{item.category}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        {formatMoney(Number(item.estimated), event.currency)}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        {formatMoney(Number(item.actual), event.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {timeline.length ? (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Run sheet</h2>
            <div className="surface-card divide-y divide-stone-100 rounded-2xl dark:divide-stone-800">
              {timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-3.5">
                  <span className="w-24 shrink-0 text-sm tabular-nums text-stone-500">
                    {new Date(item.start_time).toLocaleTimeString("en", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-xs text-stone-500">{item.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <footer className="border-t border-stone-200/80 pt-6 text-center text-xs text-stone-400 dark:border-stone-800">
          Planned with{" "}
          <Link href="/" className="font-medium text-violet-700 hover:underline dark:text-violet-300">
            EventPlanner
          </Link>{" "}
          — AI checklists for tech events
        </footer>
      </div>
    </main>
  );
}

function CategorySection({
  category,
  items,
}: {
  category: ChecklistCategory;
  items: Task[];
}) {
  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-3 dark:border-stone-800">
        <span>{CATEGORY_ICONS[category]}</span>
        <h3 className="text-sm font-semibold">{formatCategory(category)}</h3>
        <span className="ml-auto text-xs tabular-nums text-stone-400">
          {items.filter((i) => i.status === "completed").length}/{items.length}
        </span>
      </div>
      <ul className="divide-y divide-stone-50 dark:divide-stone-900">
        {items.map((task) => {
          const done = task.status === "completed";
          return (
            <li key={task.id} className="flex items-start gap-3 px-5 py-2.5">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-stone-300 dark:border-stone-700",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : null}
              </span>
              <span
                className={cn(
                  "text-sm",
                  done ? "text-stone-400 line-through" : "text-stone-700 dark:text-stone-300",
                )}
              >
                {task.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
