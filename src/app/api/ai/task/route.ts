import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { draftTaskEmail, generateTaskSubtasks } from "@/lib/ai/chat";
import { createTask } from "@/lib/events/actions";
import { getEventForUser, getTasks } from "@/lib/events/queries";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const eventId = String(body.eventId ?? "");
  const taskId = String(body.taskId ?? "");
  const action = body.action as "subtasks" | "email";

  if (!eventId || !taskId || !action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const event = await getEventForUser(eventId, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await getTasks(eventId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (action === "subtasks") {
    const result = await generateTaskSubtasks(event, task);
    for (const title of result.subtasks) {
      await createTask(eventId, { title, category: task.category, parent_id: task.id });
    }
    return NextResponse.json({ ...result, created: result.subtasks.length });
  }

  const result = await draftTaskEmail(event, task);
  return NextResponse.json(result);
}
