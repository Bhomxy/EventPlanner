import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { askEventAssistant } from "@/lib/ai/chat";
import { getEventForUser, getTasks, getTimelineItems, getBudgetItems } from "@/lib/events/queries";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const eventId = String(body.eventId ?? "");
  const message = String(body.message ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];

  if (!eventId || !message) {
    return NextResponse.json({ error: "Missing eventId or message" }, { status: 400 });
  }

  const event = await getEventForUser(eventId, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [tasks, timeline, budget] = await Promise.all([
    getTasks(eventId),
    getTimelineItems(eventId),
    getBudgetItems(eventId),
  ]);

  const result = await askEventAssistant(event, tasks, timeline, budget, message, history);
  return NextResponse.json(result);
}
