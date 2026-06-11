import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { isOpenAiQuotaError } from "@/lib/ai/fallback-plan";
import { buildEventContextBlock } from "@/lib/ai/event-context";
import type { BudgetItem, Event, Task, TimelineItem } from "@/lib/types";

export async function askEventAssistant(
  event: Event,
  tasks: Task[],
  timeline: TimelineItem[],
  budget: BudgetItem[],
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<{ reply: string; source: "ai" | "fallback" }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { reply: fallbackReply(message, tasks), source: "fallback" };
  }

  const context = buildEventContextBlock(event, tasks, timeline, budget);
  const historyBlock = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are an expert tech event operations assistant embedded in EventPlanner. Answer concisely and actionably. Reference specific tasks and deadlines from the event context when relevant. Prefer numbered lists for action items. Do not invent tasks that aren't implied by the context.`,
      prompt: `Event context:\n${context}\n\n${historyBlock ? `Recent conversation:\n${historyBlock}\n\n` : ""}User question: ${message}`,
    });
    return { reply: text.trim(), source: "ai" };
  } catch (error) {
    if (isOpenAiQuotaError(error)) {
      return { reply: fallbackReply(message, tasks), source: "fallback" };
    }
    throw error;
  }
}

const subtasksSchema = z.object({
  subtasks: z.array(z.string().min(3)).min(2).max(8),
});

export async function generateTaskSubtasks(
  event: Event,
  task: Task,
): Promise<{ subtasks: string[]; source: "ai" | "fallback" }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      subtasks: [
        `Research options for: ${task.title}`,
        `Confirm requirements and constraints`,
        `Execute and verify: ${task.title}`,
      ],
      source: "fallback",
    };
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: subtasksSchema,
      prompt: `Break this event task into 3-6 concrete sub-steps for "${event.name}" (${event.type}).
Task: ${task.title}
Category: ${task.category}
${task.description ? `Notes: ${task.description}` : ""}`,
    });
    return { subtasks: object.subtasks, source: "ai" };
  } catch (error) {
    if (isOpenAiQuotaError(error)) {
      return {
        subtasks: [
          `Prepare for: ${task.title}`,
          `Follow up on: ${task.title}`,
        ],
        source: "fallback",
      };
    }
    throw error;
  }
}

export async function draftTaskEmail(
  event: Event,
  task: Task,
  tone: "professional" | "friendly" = "professional",
): Promise<{ subject: string; body: string; source: "ai" | "fallback" }> {
  const contact = task.contact_name ?? "there";

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      subject: `Re: ${task.title} — ${event.name}`,
      body: `Hi ${contact},\n\nI'm reaching out regarding ${task.title.toLowerCase()} for ${event.name}${event.date ? ` on ${event.date}` : ""}.\n\nCould you confirm availability and next steps?\n\nThank you`,
      source: "fallback",
    };
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Write a ${tone} email about this event task.
Event: ${event.name}${event.date ? ` on ${event.date}` : ""}${event.location ? ` at ${event.location}` : ""}
Task: ${task.title}
${task.description ? `Context: ${task.description}` : ""}
Contact name: ${contact}

Return exactly two sections:
SUBJECT: ...
BODY:
...`,
    });

    const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
    return {
      subject: subjectMatch?.[1]?.trim() ?? `Re: ${task.title}`,
      body: bodyMatch?.[1]?.trim() ?? text.trim(),
      source: "ai",
    };
  } catch (error) {
    if (isOpenAiQuotaError(error)) {
      return {
        subject: `Re: ${task.title} — ${event.name}`,
        body: `Hi ${contact},\n\nFollowing up on ${task.title} for ${event.name}.\n\nBest regards`,
        source: "fallback",
      };
    }
    throw error;
  }
}

function fallbackReply(message: string, tasks: Task[]): string {
  const open = tasks.filter((t) => !t.parent_id && t.status !== "completed");
  const next = open[0];
  const lower = message.toLowerCase();

  if (lower.includes("priorit") || lower.includes("focus") || lower.includes("week")) {
    const venue = open.find((t) => t.category === "venue");
    const pick = venue ?? next;
    return pick
      ? `Focus on venue first: "${pick.title}"${pick.due_date ? ` (due ${pick.due_date})` : ""}. Then work through open marketing and volunteer tasks. AI is offline — enable OpenAI billing for tailored advice.`
      : "Your checklist looks complete. Review the schedule and budget before launch day.";
  }

  if (lower.includes("marketing")) {
    const m = open.filter((t) => t.category === "marketing").slice(0, 3);
    return m.length
      ? `Marketing tasks to tackle:\n${m.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}`
      : "No open marketing tasks right now.";
  }

  return next
    ? `Next open step: "${next.title}". You have ${open.length} tasks remaining. Connect OpenAI for personalized planning help.`
    : "All root tasks are complete. Review your schedule and budget before the event.";
}
