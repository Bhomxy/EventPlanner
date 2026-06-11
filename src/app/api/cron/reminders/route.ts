import { NextResponse } from "next/server";
import { runDeadlineReminders } from "@/lib/email/reminders";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDeadlineReminders();
  return NextResponse.json({ ok: true, ...result });
}
