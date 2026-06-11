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
    <div className="surface-card rounded-[var(--radius-xl)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <CountdownBadge date={event.date} />
        <span className="tabular-nums text-sm font-semibold">{stats.progress}% complete</span>
        {stats.overdueTasks > 0 ? (
          <span className="tabular-nums rounded-[var(--radius-sm)] bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            {stats.overdueTasks} overdue
          </span>
        ) : null}
      </div>
      <Progress value={stats.progress} className="mt-3" />
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {nextDeadline ? (
          <p className="text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-900 dark:text-stone-100">Next deadline</span>{" "}
            — {nextDeadline.title} ({nextDeadline.due_date})
          </p>
        ) : null}
        {topRisk ? (
          <p className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {topRisk.message}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--border)] pt-3 text-xs">
        <span className="tabular-nums text-stone-500">
          Budget remaining: {formatMoney(Math.round(stats.budgetRemaining), event.currency)}
        </span>
        <span className="hidden text-stone-300 sm:inline">·</span>
        <Link
          href={`/events/${eventId}/budget`}
          className="interactive font-semibold text-[var(--brand)] hover:underline"
        >
          Budget
        </Link>
        <Link
          href={`/events/${eventId}/timeline`}
          className="interactive font-semibold text-[var(--brand)] hover:underline"
        >
          Schedule
        </Link>
        <Link
          href={`/events/${eventId}/team`}
          className="interactive font-semibold text-[var(--brand)] hover:underline"
        >
          Team
        </Link>
      </div>
    </div>
  );
}
