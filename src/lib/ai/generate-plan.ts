import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eventPlanSchema, type EventPlan } from "@/lib/ai/schemas/event-plan";
import {
  generateFallbackPlan,
  isOpenAiQuotaError,
} from "@/lib/ai/fallback-plan";
import type { EventType } from "@/lib/types";

type GeneratePlanInput = {
  name: string;
  type: EventType;
  date?: string | null;
  location?: string | null;
  audienceSize?: number | null;
  goal?: string | null;
  notes?: string | null;
  budgetRange?: string | null;
};

export type GeneratedPlan = EventPlan & { source: "ai" | "template" };

const TEMPLATE_NOTICE =
  "Note: Built-in template used (AI unavailable). Enable OpenAI billing for customized plans.\n\n";

export async function generateEventPlan(
  input: GeneratePlanInput,
): Promise<GeneratedPlan> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { ...generateFallbackPlan(input), source: "template" };
  }

  const details = [
    `Event name: ${input.name}`,
    `Event type: ${input.type}`,
    input.date ? `Date: ${input.date}` : null,
    input.location ? `Location: ${input.location}` : null,
    input.audienceSize ? `Audience: ${input.audienceSize}` : null,
    input.goal ? `Goal: ${input.goal}` : null,
    input.budgetRange ? `Budget range: ${input.budgetRange}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: eventPlanSchema,
      system: `You are an expert tech event operations planner. Generate checklists tailored to the specific event described.

CRITICAL: Order checklist groups with VENUE first, then volunteers, speakers, sponsors, marketing, catering, logistics.

Each checklist item must be a concrete action (e.g. "Book a venue that holds 300 seated" not "Plan venue"). Start venue items with securing/booking language.`,
      prompt: `Create a full operational plan:\n\n${details}`,
    });
    return { ...object, source: "ai" };
  } catch (error) {
    if (isOpenAiQuotaError(error)) {
      return { ...generateFallbackPlan(input), source: "template" };
    }
    throw error;
  }
}

export function formatPlanSummary(plan: GeneratedPlan): string {
  if (plan.source === "template") {
    return TEMPLATE_NOTICE + plan.planSummary;
  }
  return plan.planSummary;
}
