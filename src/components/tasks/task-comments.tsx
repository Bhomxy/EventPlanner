"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Comment } from "@/lib/types";
import { addTaskComment, getTaskCommentsAction } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TaskCommentsProps = {
  taskId: string;
};

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getTaskCommentsAction(taskId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      await addTaskComment(taskId, body);
      setBody("");
      const updated = await getTaskCommentsAction(taskId);
      setComments(updated);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-2 text-xs font-medium text-zinc-500">Comments</p>
      {loading ? (
        <p className="text-xs text-zinc-400">Loading…</p>
      ) : comments.length ? (
        <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto">
          {comments.map((comment) => (
            <li key={comment.id} className="text-xs">
              <span className="font-medium">{comment.author_name ?? "Teammate"}</span>
              <span className="mx-1 text-zinc-400">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">{comment.body}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-zinc-400">No comments yet.</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-[60px] text-sm"
        />
        <Button type="submit" size="sm" className="shrink-0 self-end">
          Post
        </Button>
      </form>
    </div>
  );
}
