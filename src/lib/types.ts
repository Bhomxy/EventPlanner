export const EVENT_TYPES = [
  "meetup",
  "hackathon",
  "workshop",
  "conference",
  "bootcamp",
  "other",
] as const;

export const EVENT_STATUSES = [
  "planning",
  "ready",
  "completed",
  "archived",
] as const;

export const CHECKLIST_CATEGORIES = [
  "venue",
  "volunteers",
  "marketing",
  "sponsors",
  "logistics",
  "speakers",
  "catering",
  "other",
] as const;

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
] as const;

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export const TIMELINE_ITEM_TYPES = [
  "session",
  "speaker",
  "volunteer_shift",
  "checkpoint",
  "other",
] as const;

export const BUDGET_CATEGORIES = [
  "venue",
  "catering",
  "media",
  "marketing",
  "swag",
  "logistics",
  "internet",
  "equipment",
  "other",
] as const;

export const MEMBER_ROLES = ["owner", "admin", "member", "viewer"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TimelineItemType = (typeof TIMELINE_ITEM_TYPES)[number];
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type Event = {
  id: string;
  user_id: string;
  name: string;
  type: EventType;
  date: string | null;
  location: string | null;
  audience_size: number | null;
  goal: string | null;
  notes: string | null;
  budget_range: string | null;
  plan_summary: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  event_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TimelineItem = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  item_type: TimelineItemType;
  start_time: string;
  end_time: string;
  assignee_id: string | null;
  sort_order: number;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  event_id: string;
  category: BudgetCategory;
  item_type: "expense" | "income";
  label: string;
  estimated: number;
  actual: number;
  notes: string | null;
  created_at: string;
};

export type EventMember = {
  id: string;
  event_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: MemberRole;
  created_at: string;
};

export type Comment = {
  id: string;
  event_id: string;
  task_id: string | null;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  event_id: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Template = {
  id: string;
  name: string;
  event_type: EventType;
  description: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type EventWithProgress = Event & {
  total_items: number;
  completed_items: number;
  next_step: string | null;
  overdue_count: number;
  attention_label: string | null;
};

export type RiskAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
};

export type DashboardStats = {
  progress: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: Task[];
  budgetEstimated: number;
  budgetActual: number;
  budgetRemaining: number;
  risks: RiskAlert[];
  recentActivity: ActivityLog[];
};
