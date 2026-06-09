"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react";
import type { ChecklistCategory, EventMember, Task, TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import { createTask, updateTaskStatus } from "@/lib/events/actions";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import {
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  formatCategory,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Done",
};

const STATUS_STYLES: Record<TaskStatus, { column: string; header: string; dot: string }> = {
  todo: {
    column: "bg-stone-100/80 dark:bg-stone-900/50",
    header: "text-stone-700 dark:text-stone-300",
    dot: "bg-stone-400",
  },
  in_progress: {
    column: "bg-blue-50/80 dark:bg-blue-950/30",
    header: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  blocked: {
    column: "bg-amber-50/80 dark:bg-amber-950/30",
    header: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  completed: {
    column: "bg-emerald-50/80 dark:bg-emerald-950/30",
    header: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
};

type TaskBoardProps = {
  eventId: string;
  tasks: Task[];
  members?: EventMember[];
};

function resolveStatus(overId: string, tasks: Task[]): TaskStatus | null {
  if (TASK_STATUSES.includes(overId as TaskStatus)) return overId as TaskStatus;
  return tasks.find((t) => t.id === overId)?.status ?? null;
}

function TaskRow({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 text-left",
        isOverlay && "bg-white shadow-lg ring-2 ring-violet-400/40 dark:bg-stone-950",
        !isOverlay && "hover:bg-white/80 dark:hover:bg-stone-900/80",
      )}
    >
      <span className="w-3 shrink-0 text-xs">{CATEGORY_ICONS[task.category]}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs leading-tight text-stone-800 dark:text-stone-200",
          task.status === "completed" && "text-stone-400 line-through",
        )}
      >
        {task.title}
      </span>
      {task.due_date ? (
        <span className="shrink-0 text-[10px] tabular-nums text-stone-400">
          {task.due_date.slice(5)}
        </span>
      ) : null}
    </div>
  );
}

function KanbanCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", status: task.status },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-0.5", isDragging && "opacity-30")}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-stone-300 hover:text-stone-500 active:cursor-grabbing"
        aria-label={`Drag ${task.title}`}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button type="button" className="min-w-0 flex-1" onClick={() => onOpen(task)}>
        <TaskRow task={task} />
      </button>
    </div>
  );
}

function CategoryGroup({
  category,
  tasks,
  defaultOpen,
  onOpenTask,
}: {
  category: ChecklistCategory;
  tasks: Task[];
  defaultOpen: boolean;
  onOpenTask: (task: Task) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!tasks.length) return null;

  return (
    <div className="rounded-lg bg-white/60 dark:bg-stone-950/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span>{formatCategory(category)}</span>
        <span className="ml-auto font-normal normal-case tabular-nums">{tasks.length}</span>
      </button>
      {open ? (
        <div className="space-y-0.5 px-1 pb-1">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ColumnAddTask({ eventId, status }: { eventId: string; status: TaskStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask(eventId, { title: title.trim(), status });
      setTitle("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-stone-500 hover:bg-white/70 dark:hover:bg-stone-900/60"
      >
        <Plus className="h-3 w-3" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 rounded-lg bg-white p-2 dark:bg-stone-950">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        autoFocus
        className="h-7 text-xs"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-6 px-2 text-[11px]" disabled={!title.trim()}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function KanbanColumn({
  status,
  tasks,
  activeId,
  eventId,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  activeId: string | null;
  eventId: string;
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });
  const styles = STATUS_STYLES[status];
  const isActiveDrop = isOver && activeId !== null;

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      tasks: tasks.filter((t) => t.category === category),
    })).filter((g) => g.tasks.length > 0);
  }, [tasks]);

  const firstWithTasks = grouped[0]?.category;

  return (
    <div
      className={cn(
        "flex min-w-[220px] flex-1 flex-col rounded-xl sm:min-w-0",
        styles.column,
        isActiveDrop && "ring-2 ring-violet-400/50",
      )}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
        <h3 className={cn("text-xs font-semibold", styles.header)}>{STATUS_LABELS[status]}</h3>
        <span className="ml-auto text-[10px] tabular-nums text-stone-500">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "mx-1 flex max-h-[min(520px,60vh)] flex-1 flex-col gap-1 overflow-y-auto px-1 pb-1",
          isActiveDrop && "rounded-lg bg-violet-100/30 dark:bg-violet-950/20",
        )}
      >
        {grouped.length ? (
          grouped.map(({ category, tasks: groupTasks }) => (
            <CategoryGroup
              key={category}
              category={category}
              tasks={groupTasks}
              defaultOpen={category === firstWithTasks}
              onOpenTask={onOpenTask}
            />
          ))
        ) : (
          <p className="py-6 text-center text-[10px] text-stone-400">
            {isActiveDrop ? "Drop here" : "Empty"}
          </p>
        )}
      </div>

      <div className="border-t border-stone-200/50 p-1.5 dark:border-stone-700/50">
        <ColumnAddTask eventId={eventId} status={status} />
      </div>
    </div>
  );
}

export function TaskBoard({ eventId, tasks, members = [] }: TaskBoardProps) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const columns = useMemo(() => {
    const map = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Record<
      TaskStatus,
      Task[]
    >;
    for (const task of localTasks.filter((t) => !t.parent_id)) {
      map[task.status].push(task);
    }
    return map;
  }, [localTasks]);

  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null;
  const selectedTask = selectedTaskId
    ? (localTasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  function persistStatus(taskId: string, status: TaskStatus) {
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, status);
        router.refresh();
      } catch {
        setLocalTasks(tasks);
      }
    });
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTaskId = String(active.id);
    const newStatus = resolveStatus(String(over.id), localTasks);
    if (!newStatus) return;
    setLocalTasks((current) => {
      const task = current.find((t) => t.id === activeTaskId);
      if (!task || task.status === newStatus) return current;
      return current.map((t) => (t.id === activeTaskId ? { ...t, status: newStatus } : t));
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      setLocalTasks(tasks);
      return;
    }
    const activeTaskId = String(active.id);
    const original = tasks.find((t) => t.id === activeTaskId);
    const newStatus = resolveStatus(String(over.id), localTasks);
    if (!newStatus || !original || original.status === newStatus) return;
    persistStatus(activeTaskId, newStatus);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setLocalTasks(tasks);
        }}
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              activeId={activeId}
              eventId={eventId}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
          {activeTask ? <TaskRow task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask ? (
        <TaskDetailPanel
          task={selectedTask}
          eventId={eventId}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updated) =>
            setLocalTasks((c) => c.map((t) => (t.id === updated.id ? updated : t)))
          }
          onDelete={(id) => {
            setLocalTasks((c) => c.filter((t) => t.id !== id));
            setSelectedTaskId(null);
          }}
        />
      ) : null}
    </>
  );
}
