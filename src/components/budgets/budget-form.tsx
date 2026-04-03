"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCategories } from "@/lib/hooks/use-categories";

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (categoryId: string, limitAmount: number) => Promise<void>;
  existingCategoryIds: string[];
}

export function BudgetForm({
  open,
  onOpenChange,
  onSubmit,
  existingCategoryIds,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const { categories } = useCategories("expense");

  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(categoryId, parseInt(limitAmount) || 0);
      onOpenChange(false);
      setCategoryId("");
      setLimitAmount("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoria</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger id="budget-category">
                <SelectValue placeholder="Selecciona categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite mensual (COP)</Label>
            <Input
              id="limit"
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="500000"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saving || !categoryId || !limitAmount}
          >
            {saving ? "Guardando..." : "Crear presupuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
