"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import type { ChecklistCategory, EventMember, Task, TaskStatus } from "@/lib/types";
import { CHECKLIST_CATEGORIES, TASK_STATUSES } from "@/lib/types";
import {
  createTask,
  deleteTask,
  toggleTaskComplete,
  updateTaskDetails,
  updateTaskStatus,
} from "@/lib/events/actions";
import { TaskComments } from "@/components/tasks/task-comments";
import {
  CATEGORY_HINTS,
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  formatCategory,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ChecklistViewProps = {
  eventId: string;
  tasks: Task[];
  members?: EventMember[];
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Done",
};

export function ChecklistView({ eventId, tasks, members = [] }: ChecklistViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<ChecklistCategory>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsId, setCommentsId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ChecklistCategory>("venue");
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [addingCategory, setAddingCategory] = useState<ChecklistCategory | null>(null);
  const [categoryItemTitle, setCategoryItemTitle] = useState("");

  const rootTasks = useMemo(
    () => localTasks.filter((t) => !t.parent_id),
    [localTasks],
  );

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of localTasks) {
      if (!task.parent_id) continue;
      const list = map.get(task.parent_id) ?? [];
      list.push(task);
      map.set(task.parent_id, list);
    }
    return map;
  }, [localTasks]);

  const completed = rootTasks.filter((t) => t.status === "completed").length;
  const progress = rootTasks.length
    ? Math.round((completed / rootTasks.length) * 100)
    : 0;

  const grouped = useMemo(() => {
    const groups = new Map<ChecklistCategory, Task[]>();
    for (const category of CATEGORY_ORDER) groups.set(category, []);
    for (const task of rootTasks) {
      const list = groups.get(task.category) ?? [];
      list.push(task);
      groups.set(task.category, list);
    }
    return CATEGORY_ORDER.map((cat) => [cat, groups.get(cat)!] as const).filter(
      ([, items]) => items.length > 0,
    );
  }, [rootTasks]);

  const nextUp = useMemo(
    () =>
      rootTasks
        .filter((t) => t.status !== "completed")
        .sort(
          (a, b) =>
            CATEGORY_ORDER.indexOf(a.category) -
            CATEGORY_ORDER.indexOf(b.category),
        )
        .slice(0, 3),
    [rootTasks],
  );

  function patchTask(taskId: string, patch: Partial<Task>) {
    setLocalTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    );
  }

  function handleToggle(task: Task, checked: boolean) {
    patchTask(task.id, { status: checked ? "completed" : "todo" });
    if (checked) {
      toast("Task completed", {
        action: { label: "Undo", onClick: () => handleToggle(task, false) },
      });
    }
    startTransition(async () => {
      try {
        await toggleTaskComplete(task.id, checked);
        router.refresh();
      } catch {
        setLocalTasks(tasks);
        toast("Couldn't save — check your connection", { variant: "error" });
      }
    });
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    patchTask(task.id, { status });
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, status);
        router.refresh();
      } catch {
        setLocalTasks(tasks);
      }
    });
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
  }

  function saveEdit(taskId: string) {
    if (!editTitle.trim()) return;
    patchTask(taskId, { title: editTitle.trim() });
    setEditingId(null);
    startTransition(async () => {
      await updateTaskDetails(taskId, { title: editTitle });
      toast("Saved");
      router.refresh();
    });
  }

  function saveDueDate(taskId: string, dueDate: string | null) {
    patchTask(taskId, { due_date: dueDate });
    startTransition(async () => {
      await updateTaskDetails(taskId, { due_date: dueDate });
      toast("Due date saved");
      router.refresh();
    });
  }

  function saveNotes(taskId: string, description: string) {
    patchTask(taskId, { description: description || null });
    startTransition(async () => {
      await updateTaskDetails(taskId, {
        description: description.trim() || null,
      });
      toast("Notes saved");
      router.refresh();
    });
  }

  function saveAssignee(taskId: string, assigneeId: string | null) {
    patchTask(taskId, { assignee_id: assigneeId });
    startTransition(async () => {
      await updateTaskDetails(taskId, { assignee_id: assigneeId });
      toast("Assignee saved");
      router.refresh();
    });
  }

  function handleDeleteConfirmed(taskId: string) {
    setLocalTasks((current) =>
      current.filter((t) => t.id !== taskId && t.parent_id !== taskId),
    );
    startTransition(async () => {
      await deleteTask(taskId);
      toast("Task deleted");
      router.refresh();
    });
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await createTask(eventId, { title: newTitle, category: newCategory });
      setNewTitle("");
      router.refresh();
    });
  }

  function handleAddToCategory(category: ChecklistCategory) {
    if (!categoryItemTitle.trim()) return;
    startTransition(async () => {
      await createTask(eventId, { title: categoryItemTitle.trim(), category });
      setCategoryItemTitle("");
      setAddingCategory(null);
      router.refresh();
    });
  }

  function handleAddSubtask(parentId: string) {
    if (!subtaskTitle.trim()) return;
    const parent = localTasks.find((t) => t.id === parentId);
    startTransition(async () => {
      await createTask(eventId, {
        title: subtaskTitle,
        category: parent?.category ?? "other",
        parent_id: parentId,
      });
      setSubtaskTitle("");
      setSubtaskParentId(null);
      router.refresh();
    });
  }

  function renderTaskRow(task: Task, nested = false) {
    const isDone = task.status === "completed";
    const isEditing = editingId === task.id;
    const isExpanded = expandedId === task.id;
    const subtasks = subtasksByParent.get(task.id) ?? [];
    const assignee = members.find((m) => m.user_id === task.assignee_id);

    return (
      <li key={task.id} className={cn(nested && "ml-8 border-l border-zinc-100 pl-4 dark:border-zinc-800")}>
        <div className="flex items-start gap-3 px-5 py-3.5">
          <Checkbox
            checked={isDone}
            onCheckedChange={(checked) => handleToggle(task, checked === true)}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(task.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={() => saveEdit(task.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("text-sm leading-relaxed", isDone && "text-zinc-400 line-through")}>
                    {task.title}
                  </p>
                  {task.status === "in_progress" ? (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      In progress
                    </span>
                  ) : null}
                  {task.status === "blocked" ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Blocked
                    </span>
                  ) : null}
                  {assignee ? (
                    <span className="text-[10px] text-zinc-500">→ {assignee.name ?? assignee.email}</span>
                  ) : null}
                </div>
                {task.description && !isExpanded ? (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{task.description}</p>
                ) : null}
              </>
            )}

            {isExpanded && !isEditing ? (
              <div className="mt-3 space-y-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Due date</label>
                  <Input
                    type="date"
                    className="mt-1 h-9"
                    defaultValue={task.due_date ?? ""}
                    onBlur={(e) => saveDueDate(task.id, e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Notes</label>
                  <Textarea
                    className="mt-1 min-h-[72px] text-sm"
                    defaultValue={task.description ?? ""}
                    placeholder="Contact info, links, context…"
                    onBlur={(e) => saveNotes(task.id, e.target.value)}
                  />
                </div>
                {!isDone ? (
                  <div>
                    <label className="text-xs font-medium text-zinc-500">Status</label>
                    <Select
                      value={task.status}
                      onValueChange={(v) => handleStatusChange(task, v as TaskStatus)}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.filter((s) => s !== "completed").map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {members.length > 0 ? (
                  <div>
                    <label className="text-xs font-medium text-zinc-500">Assign to</label>
                    <Select
                      value={task.assignee_id ?? "none"}
                      onValueChange={(v) => saveAssignee(task.id, v === "none" ? null : v)}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {members.filter((m) => m.user_id).map((m) => (
                          <SelectItem key={m.id} value={m.user_id!}>
                            {m.name ?? m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {subtaskParentId === task.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      placeholder="Subtask title"
                      className="h-9"
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubtask(task.id)}
                    />
                    <Button type="button" size="sm" onClick={() => handleAddSubtask(task.id)}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setSubtaskParentId(task.id);
                      setSubtaskTitle("");
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add subtask
                  </Button>
                )}
              </div>
            ) : null}

            {commentsId === task.id ? (
              <div className="mt-3">
                <TaskComments taskId={task.id} />
              </div>
            ) : null}
          </div>
          {!isEditing ? (
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={isExpanded ? "Hide details" : "Show details (due date, notes, assignee)"}
                className="h-8 w-8 text-zinc-400"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Comments"
                className="h-8 w-8 text-zinc-400"
                onClick={() => setCommentsId(commentsId === task.id ? null : task.id)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" title="Edit title" className="h-8 w-8 text-zinc-400" onClick={() => startEdit(task)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" title="Delete task" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => setDeletingId(task.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
        {subtasks.length ? (
          <ul>{subtasks.map((st) => renderTaskRow(st, true))}</ul>
        ) : null}
      </li>
    );
  }

  if (!rootTasks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">
          No checklist yet. Regenerate your plan from settings, or add items below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm shadow-violet-600/5 dark:border-violet-900 dark:from-violet-950/40 dark:to-stone-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
              {progress === 100 ? "You're ready!" : "Start here"}
            </p>
            <p className="mt-1 text-xs text-violet-700/80 dark:text-violet-300/80">
              {completed} of {rootTasks.length} steps done · venue first, then work down
            </p>
          </div>
          <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-3" />
        {nextUp.length ? (
          <ul className="mt-4 space-y-1">
            {nextUp.map((task) => (
              <li key={task.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                → {task.title}
                <span className="ml-2 text-xs text-zinc-500">({formatCategory(task.category)})</span>
              </li>
            ))}
          </ul>
        ) : null}
        {completed > 0 ? (
          <button
            type="button"
            onClick={() => setHideCompleted(!hideCompleted)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-800 transition-colors hover:border-violet-300 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200"
          >
            {hideCompleted ? "Show" : "Hide"} {completed} completed
          </button>
        ) : null}
      </div>

      {grouped.map(([category, groupTasks]) => {
        const done = groupTasks.filter((t) => t.status === "completed").length;
        const isVenue = category === "venue";
        const visibleTasks = hideCompleted
          ? groupTasks.filter((t) => t.status !== "completed")
          : groupTasks;
        const isCollapsed = collapsed.has(category);

        if (hideCompleted && !visibleTasks.length) return null;

        return (
          <section
            key={category}
            className={cn(
              "rounded-2xl border",
              isVenue
                ? "border-violet-300 bg-white shadow-sm dark:border-violet-800 dark:bg-zinc-950"
                : "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <button
              type="button"
              onClick={() =>
                setCollapsed((current) => {
                  const next = new Set(current);
                  if (next.has(category)) next.delete(category);
                  else next.add(category);
                  return next;
                })
              }
              className={cn(
                "w-full px-5 py-4 text-left",
                !isCollapsed && "border-b border-zinc-100 dark:border-zinc-800",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_ICONS[category]}</span>
                <div>
                  <h3 className="font-semibold">
                    {formatCategory(category)}
                    {isVenue ? (
                      <span className="ml-2 text-xs font-normal text-violet-600">Start here</span>
                    ) : null}
                  </h3>
                  <p className="text-xs text-zinc-500">{CATEGORY_HINTS[category]}</p>
                </div>
                <span className="ml-auto text-xs tabular-nums text-zinc-500">
                  {done}/{groupTasks.length}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </div>
            </button>
            {isCollapsed ? null : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {visibleTasks.map((task) => renderTaskRow(task))}
              </ul>
            )}
            <div
              className={cn(
                "px-5 py-2.5",
                !isCollapsed && "border-t border-zinc-100 dark:border-zinc-800",
                isCollapsed && "hidden",
              )}
            >
              {addingCategory === category ? (
                <div className="flex gap-2">
                  <Input
                    value={categoryItemTitle}
                    onChange={(e) => setCategoryItemTitle(e.target.value)}
                    placeholder={`New ${formatCategory(category).toLowerCase()} step…`}
                    autoFocus
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddToCategory(category);
                      if (e.key === "Escape") {
                        setAddingCategory(null);
                        setCategoryItemTitle("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0"
                    disabled={!categoryItemTitle.trim()}
                    onClick={() => handleAddToCategory(category)}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9 shrink-0"
                    onClick={() => {
                      setAddingCategory(null);
                      setCategoryItemTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(category);
                    setCategoryItemTitle("");
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-violet-700 dark:hover:text-violet-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add item
                </button>
              )}
            </div>
          </section>
        );
      })}

      <div className="rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4" />
          Add your own step
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ChecklistCategory)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECKLIST_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {formatCategory(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Book venue and confirm deposit"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button type="button" onClick={handleAdd}>
            Add
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this task?"
        description="The task and any subtasks or comments on it will be removed."
        confirmLabel="Delete task"
        destructive
        onConfirm={() => deletingId && handleDeleteConfirmed(deletingId)}
      />
    </div>
  );
}
