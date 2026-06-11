"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { TimelineItem, TimelineItemType } from "@/lib/types";
import { TIMELINE_ITEM_TYPES } from "@/lib/types";
import {
  createTimelineItem,
  deleteTimelineItem,
  reorderTimelineItems,
  updateTimelineItem,
} from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimelineEditorProps = {
  eventId: string;
  items: TimelineItem[];
};

export function TimelineEditor({ eventId, items }: TimelineEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [localItems, setLocalItems] = useState(items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    item_type: "session" as TimelineItemType,
    start_time: "",
    end_time: "",
  });

  function moveItem(index: number, direction: -1 | 1) {
    const next = [...localItems];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLocalItems(next);
    startTransition(async () => {
      await reorderTimelineItems(
        eventId,
        next.map((i) => i.id),
      );
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setLocalItems((current) => current.filter((i) => i.id !== id));
    startTransition(async () => {
      await deleteTimelineItem(id);
      toast("Schedule item removed");
      router.refresh();
    });
  }

  function handleSaveEdit(item: TimelineItem) {
    startTransition(async () => {
      await updateTimelineItem(item.id, {
        title: form.title,
        description: form.description || null,
        item_type: form.item_type,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      setEditingId(null);
      toast("Saved");
      router.refresh();
    });
  }

  function startEdit(item: TimelineItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      item_type: item.item_type,
      start_time: format(new Date(item.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(item.end_time), "yyyy-MM-dd'T'HH:mm"),
    });
  }

  function handleAdd() {
    if (!form.title.trim() || !form.start_time || !form.end_time) return;
    startTransition(async () => {
      await createTimelineItem(eventId, {
        title: form.title,
        description: form.description,
        item_type: form.item_type,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      setShowAdd(false);
      setForm({ title: "", description: "", item_type: "session", start_time: "", end_time: "" });
      router.refresh();
    });
  }

  if (!localItems.length && !showAdd) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          No timeline items yet. Generate a plan or add run sheet entries.
        </p>
        <Button type="button" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add block
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localItems.map((item, index) => (
        <Card key={item.id}>
          {editingId === item.id ? (
            <CardContent className="space-y-3 pt-6">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
              <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v as TimelineItemType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMELINE_ITEM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => handleSaveEdit(item)}>Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">
                    {format(new Date(item.start_time), "h:mm a")} – {format(new Date(item.end_time), "h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary">{item.item_type.replace("_", " ")}</Badge>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(index, 1)} disabled={index === localItems.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {item.description ? (
                <CardContent className="pt-0 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</CardContent>
              ) : null}
            </>
          )}
        </Card>
      ))}

      {showAdd ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Block title" />
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes for volunteers" />
            <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v as TimelineItemType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMELINE_ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd}>Add block</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button type="button" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add block
        </Button>
      )}
    </div>
  );
}
