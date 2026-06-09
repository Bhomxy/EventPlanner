"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/types";
import { createTask } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddTaskForm({ eventId }: { eventId: string }) {
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask(eventId, { title });
      setTitle("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
      />
      <Button type="submit">Add</Button>
    </form>
  );
}

export function TaskListCompact({ tasks }: { tasks: Task[] }) {
  const open = tasks.filter((t) => t.status !== "completed" && !t.parent_id).slice(0, 5);
  if (!open.length) return <p className="text-sm text-zinc-500">All tasks complete!</p>;
  return (
    <ul className="space-y-2">
      {open.map((task) => (
        <li key={task.id} className="text-sm">
          <span className="font-medium">{task.title}</span>
          {task.due_date ? (
            <span className="ml-2 text-xs text-zinc-500">Due {task.due_date}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
