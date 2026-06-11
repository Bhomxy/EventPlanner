import Link from "next/link";
import type { DashboardStats, Event } from "@/lib/types";
import { CountdownBadge } from "@/components/layout/event-sidebar";
import { formatMoney } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

type EventStatusBarProps = {
  event: Event;
  stats: DashboardStats;
  eventId: string;
};

export function EventStatusBar({ event, stats, eventId }: EventStatusBarProps) {
  const topRisk = stats.risks[0];
  const nextDeadline = stats.upcomingDeadlines[0];

  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <CountdownBadge date={event.date} />
        <span className="text-sm font-medium">{stats.progress}% complete</span>
        {stats.overdueTasks > 0 ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {stats.overdueTasks} overdue
          </span>
        ) : null}
      </div>
      <Progress value={stats.progress} className="mt-3" />
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {nextDeadline ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Next deadline:</span>{" "}
            {nextDeadline.title} ({nextDeadline.due_date})
          </p>
        ) : null}
        {topRisk ? (
          <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {topRisk.message}
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
        <span className="text-zinc-500">
          Budget remaining: {formatMoney(Math.round(stats.budgetRemaining), event.currency)}
        </span>
        <span className="text-zinc-300">·</span>
        <Link href={`/events/${eventId}/budget`} className="font-medium text-violet-700 hover:underline dark:text-violet-300">
          Budget
        </Link>
        <Link href={`/events/${eventId}/timeline`} className="font-medium text-violet-700 hover:underline dark:text-violet-300">
          Schedule
        </Link>
        <Link href={`/events/${eventId}/team`} className="font-medium text-violet-700 hover:underline dark:text-violet-300">
          Team
        </Link>
      </div>
    </div>
  );
}
