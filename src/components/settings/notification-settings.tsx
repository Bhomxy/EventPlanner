"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/lib/events/actions";
import type { UserPreferences } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NotificationSettingsProps = {
  preferences: UserPreferences;
};

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [emailReminders, setEmailReminders] = useState(preferences.email_reminders);
  const [reminderDays, setReminderDays] = useState(String(preferences.reminder_days));
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateUserPreferences({
        email_reminders: emailReminders,
        reminder_days: Number(reminderDays),
      });
      toast("Notification settings saved");
    });
  }

  return (
    <div className="surface-card space-y-4 rounded-[var(--radius-xl)] p-5">
      <div>
        <h3 className="font-display font-semibold">Email reminders</h3>
        <p className="mt-1 text-sm text-stone-500">
          Daily digest when tasks are due soon or overdue. Requires{" "}
          <code className="text-xs">RESEND_API_KEY</code> on the server.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={emailReminders}
          onCheckedChange={(v) => setEmailReminders(v === true)}
        />
        Send deadline reminder emails
      </label>
      <div className="space-y-2">
        <Label>Remind me this many days before due date</Label>
        <Select value={reminderDays} onValueChange={setReminderDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 day</SelectItem>
            <SelectItem value="3">3 days</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="button" size="sm" disabled={isPending} onClick={save}>
        Save notifications
      </Button>
    </div>
  );
}
