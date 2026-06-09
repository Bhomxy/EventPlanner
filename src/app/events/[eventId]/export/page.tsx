import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getEventExportData } from "@/lib/events/actions";
import { formatEventDate, formatEventType, formatCategory } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExportPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function ExportPage({ params }: ExportPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  let data;
  try {
    data = await getEventExportData(eventId);
  } catch {
    return null;
  }

  const { event, completedTasks, openTasks, totalSpent, totalIncome, budgetItems } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Post-event report</h1>
          <p className="text-sm text-zinc-500">
            Summary of completed work and expenses for {event.name}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}`}>Back to checklists</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p><strong>Type:</strong> {formatEventType(event.type)}</p>
          <p><strong>Date:</strong> {formatEventDate(event.date)}</p>
          {event.location ? <p><strong>Location:</strong> {event.location}</p> : null}
          <p><strong>Completed tasks:</strong> {completedTasks.length}</p>
          <p><strong>Open tasks:</strong> {openTasks.length}</p>
          <p><strong>Total spent:</strong> ${totalSpent.toLocaleString()}</p>
          <p><strong>Sponsor income:</strong> ${totalIncome.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completed checklist ({completedTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {completedTasks.map((task) => (
              <li key={task.id} className="text-zinc-600 dark:text-zinc-400">
                ✓ [{formatCategory(task.category)}] {task.title}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {budgetItems
              .filter((b) => b.item_type === "expense")
              .map((item) => (
                <li key={item.id} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{item.label}</span>
                  <span>${Number(item.actual).toLocaleString()}</span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lessons learned</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            {event.notes ?? "Add notes in event settings to capture lessons for next time."}
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-400">
        Tip: use your browser&apos;s Print → Save as PDF to export this report.
      </p>
    </div>
  );
}
