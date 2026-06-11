"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import type { ChecklistCategory, EventMember, Task, TaskStatus } from "@/lib/types";
import { CHECKLIST_CATEGORIES, TASK_STATUSES } from "@/lib/types";
import {
  deleteTask,
  updateTaskDetails,
  updateTaskStatus,
} from "@/lib/events/actions";
import { TaskComments } from "@/components/tasks/task-comments";
import { formatCategory } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Done",
};

type TaskDetailPanelProps = {
  task: Task;
  eventId: string;
  members?: EventMember[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

export function TaskDetailPanel({
  task,
  eventId,
  members = [],
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "none");

  function saveField(data: {
    title?: string;
    description?: string | null;
    category?: ChecklistCategory;
    due_date?: string | null;
    assignee_id?: string | null;
  }) {
    onUpdate({ ...task, ...data });
    startTransition(async () => {
      await updateTaskDetails(task.id, data);
      toast("Saved");
      router.refresh();
    });
  }

  function handleStatusChange(next: TaskStatus) {
    setStatus(next);
    onUpdate({ ...task, status: next });
    startTransition(async () => {
      await updateTaskStatus(task.id, next);
      router.refresh();
    });
  }

  function handleDeleteConfirmed() {
    onDelete(task.id);
    startTransition(async () => {
      await deleteTask(task.id);
      toast("Task deleted");
      onClose();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-[1px]"
        aria-label="Close task details"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-950">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-stone-800">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Task details</p>
          <Button type="button" variant="ghost" size="icon" title="Close" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && saveField({ title: title.trim() })}
              className="text-base font-medium"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  const next = v as ChecklistCategory;
                  setCategory(next);
                  saveField({ category: next });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatCategory(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={() =>
                saveField({ due_date: dueDate || null })
              }
            />
          </div>

          {members.length > 0 ? (
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select
                value={assigneeId}
                onValueChange={(v) => {
                  const next = v === "none" ? null : v;
                  setAssigneeId(v);
                  saveField({ assignee_id: next });
                }}
              >
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                saveField({
                  description: description.trim() || null,
                })
              }
              placeholder="Contact info, links, context…"
              className="min-h-[100px]"
            />
          </div>

          <TaskComments taskId={task.id} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-stone-100 p-4 dark:border-stone-800">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${eventId}`}>Open in checklist</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto text-red-600 hover:text-red-700"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this task?"
        description="The task and any subtasks or comments on it will be removed."
        confirmLabel="Delete task"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
}
