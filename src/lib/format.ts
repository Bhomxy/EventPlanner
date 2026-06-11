import { format, formatDistanceToNow, isPast } from "date-fns";
import type { ChecklistCategory, EventStatus, EventType } from "@/lib/types";

export function formatEventType(type: EventType) {
  const labels: Record<EventType, string> = {
    meetup: "Meetup",
    hackathon: "Hackathon",
    workshop: "Workshop",
    conference: "Conference",
    bootcamp: "Bootcamp",
    other: "General event",
  };
  return labels[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatEventStatus(status: EventStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatCategory(category: ChecklistCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatEventDate(date: string | null) {
  if (!date) return "Date TBD";
  return format(new Date(`${date}T12:00:00`), "MMM d, yyyy");
}

export function getCountdownLabel(date: string | null) {
  if (!date) return "No date set";
  const eventDate = new Date(`${date}T12:00:00`);
  if (isPast(eventDate)) return "Event date passed";
  return formatDistanceToNow(eventDate, { addSuffix: true });
}

export function getProgressPercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "NGN", label: "Nigerian Naira (₦)" },
  { code: "GHS", label: "Ghanaian Cedi (₵)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "BRL", label: "Brazilian Real (R$)" },
] as const;

export function formatMoney(amount: number, currency?: string | null) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency ?? "$"}${amount.toLocaleString()}`;
  }
}

export const CATEGORY_ORDER: ChecklistCategory[] = [
  "venue",
  "volunteers",
  "speakers",
  "sponsors",
  "marketing",
  "catering",
  "logistics",
  "other",
];

export const CATEGORY_HINTS: Record<ChecklistCategory, string> = {
  venue: "Secure your space first — everything else depends on this",
  volunteers: "Recruit and brief your team or day-of helpers",
  speakers: "Hosts, performers, or program lineup",
  sponsors: "Partners, donors, or sponsors",
  marketing: "Promotion and registration",
  catering: "Food, drinks, and dietary needs",
  logistics: "Equipment, signage, transport, and day-of ops",
  other: "Everything else",
};
export const CATEGORY_ICONS: Record<ChecklistCategory, string> = {
  venue: "🏛️",
  volunteers: "🙋",
  marketing: "📣",
  sponsors: "🤝",
  logistics: "📦",
  speakers: "🎤",
  catering: "🍽️",
  other: "✅",
};
