import type { EventWithProgress } from "@/lib/types";
import { AlertTriangle, Bell } from "lucide-react";

type DeadlineAlertsProps = {
  events: EventWithProgress[];
};

export function DeadlineAlerts({ events }: DeadlineAlertsProps) {
  const alerts = events.filter((e) => e.overdue_count > 0);

  if (!alerts.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex items-start gap-2">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">Deadline reminders</p>
          {alerts.map((event) => (
            <p key={event.id} className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                <strong>{event.name}</strong> — {event.overdue_count} overdue task
                {event.overdue_count === 1 ? "" : "s"}
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
