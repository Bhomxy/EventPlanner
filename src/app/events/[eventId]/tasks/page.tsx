import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { TaskBoard } from "@/components/tasks/task-board";
import { getEventForUser, getEventMembers, getTasks } from "@/lib/events/queries";
import { Button } from "@/components/ui/button";

type TasksPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const [tasks, members] = await Promise.all([
    getTasks(eventId),
    getEventMembers(eventId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Board view</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">Kanban</h1>
          <p className="mt-1 text-sm text-stone-500">
            Grouped by category · drag between columns · click a task for details
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}`}>← Back to checklists</Link>
        </Button>
      </div>

      <TaskBoard eventId={eventId} tasks={tasks} members={members} />
    </div>
  );
}
