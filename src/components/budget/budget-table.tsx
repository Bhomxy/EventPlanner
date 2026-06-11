"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { BudgetCategory, BudgetItem } from "@/lib/types";
import { BUDGET_CATEGORIES } from "@/lib/types";
import {
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
  updateEventCurrency,
} from "@/lib/events/actions";
import { CURRENCIES, formatMoney } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BudgetTableProps = {
  eventId: string;
  items: BudgetItem[];
  currency?: string | null;
};

export function BudgetTable({ eventId, items, currency }: BudgetTableProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState(currency ?? "USD");
  const [newItem, setNewItem] = useState({
    label: "",
    category: "venue" as BudgetCategory,
    item_type: "expense" as "expense" | "income",
    estimated: "",
  });

  const expenses = items.filter((i) => i.item_type === "expense");
  const income = items.filter((i) => i.item_type === "income");
  const totalEstExp = expenses.reduce((s, i) => s + Number(i.estimated), 0);
  const totalActExp = expenses.reduce((s, i) => s + Number(i.actual), 0);
  const totalIncome = income.reduce((s, i) => s + Number(i.actual), 0);
  const overspend = totalActExp > totalEstExp * 1.1 && totalEstExp > 0;

  function updateField(id: string, field: "actual" | "estimated" | "label", value: string) {
    startTransition(async () => {
      if (field === "label") {
        await updateBudgetItem(id, { label: value });
      } else {
        await updateBudgetItem(id, { [field]: Number(value) || 0 });
      }
      router.refresh();
    });
  }

  function updateCategory(id: string, category: BudgetCategory) {
    startTransition(async () => {
      await updateBudgetItem(id, { category });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBudgetItem(id);
      router.refresh();
    });
  }

  function handleAdd() {
    if (!newItem.label.trim()) return;
    startTransition(async () => {
      await createBudgetItem(eventId, {
        label: newItem.label,
        category: newItem.category,
        item_type: newItem.item_type,
        estimated: Number(newItem.estimated) || 0,
      });
      setNewItem({ label: "", category: "venue", item_type: "expense", estimated: "" });
      setShowAdd(false);
      router.refresh();
    });
  }

  function handleCurrencyChange(next: string) {
    setActiveCurrency(next);
    startTransition(async () => {
      await updateEventCurrency(eventId, next);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-zinc-500">Currency</span>
        <Select value={activeCurrency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Estimated net</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatMoney(
              income.reduce((s, i) => s + Number(i.estimated), 0) - totalEstExp,
              activeCurrency,
            )}
          </CardContent>
        </Card>
        <Card className={overspend ? "border-red-300 dark:border-red-900" : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Total spent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatMoney(totalActExp, activeCurrency)}
            {overspend ? (
              <p className="mt-1 text-xs font-normal text-red-600">Over estimate</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Sponsor income</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatMoney(totalIncome, activeCurrency)}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Estimated</th>
              <th className="px-4 py-3 text-right font-medium">Actual</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <Input
                    className="h-8"
                    defaultValue={item.label}
                    onBlur={(e) => updateField(item.id, "label", e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateCategory(item.id, v as BudgetCategory)}
                  >
                    <SelectTrigger className="h-8 w-32 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Input
                    type="number"
                    className="ml-auto h-8 w-28 text-right"
                    defaultValue={Number(item.estimated)}
                    onBlur={(e) => updateField(item.id, "estimated", e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Input
                    type="number"
                    className="ml-auto h-8 w-28 text-right"
                    defaultValue={Number(item.actual)}
                    onBlur={(e) => updateField(item.id, "actual", e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-4 sm:flex-row dark:border-zinc-700">
          <Input
            value={newItem.label}
            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            placeholder="Line item label"
          />
          <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v as BudgetCategory })}>
            <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUDGET_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newItem.item_type} onValueChange={(v) => setNewItem({ ...newItem, item_type: v as "expense" | "income" })}>
            <SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={newItem.estimated}
            onChange={(e) => setNewItem({ ...newItem, estimated: e.target.value })}
            placeholder="Estimated"
            className="sm:w-28"
          />
          <Button type="button" onClick={handleAdd}>Add</Button>
          <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add line item
        </Button>
      )}
    </div>
  );
}
