import { z } from "zod";
import {
  BUDGET_CATEGORIES,
  CHECKLIST_CATEGORIES,
  TASK_PRIORITIES,
  TIMELINE_ITEM_TYPES,
} from "@/lib/types";

export const checklistItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  priority: z.enum(TASK_PRIORITIES).nullable(),
  dueInDays: z.number().nullable().describe("Days before event date"),
});

export const checklistGroupSchema = z.object({
  category: z.enum(CHECKLIST_CATEGORIES),
  items: z.array(checklistItemSchema).min(1),
});

export const timelineItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  itemType: z.enum(TIMELINE_ITEM_TYPES),
  startOffsetHours: z
    .number()
    .describe("Hours from event start (0 = event start time)"),
  durationMinutes: z.number().min(15),
});

export const budgetItemSchema = z.object({
  category: z.enum(BUDGET_CATEGORIES),
  label: z.string().min(1),
  estimated: z.number().min(0),
  itemType: z.enum(["expense", "income"]),
  notes: z.string().nullable(),
});

export const teamRoleSchema = z.object({
  role: z.string().min(1),
  count: z.number().min(1),
  responsibilities: z.string().nullable(),
});

export const eventPlanSchema = z.object({
  planSummary: z.string().min(50),
  checklistGroups: z.array(checklistGroupSchema).min(3),
  timeline: z.array(timelineItemSchema).min(3),
  budget: z.array(budgetItemSchema).min(3),
  teamStructure: z.array(teamRoleSchema).min(2),
  marketingChecklist: z.array(z.string()).min(2),
  sponsorshipChecklist: z.array(z.string()).min(2),
  risks: z.array(
    z.object({
      title: z.string(),
      message: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
});

export type EventPlan = z.infer<typeof eventPlanSchema>;
