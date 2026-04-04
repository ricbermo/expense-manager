"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
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
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/utils/number-input-format";

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (categoryId: string, limitAmount: number) => Promise<void>;
  existingCategoryIds: string[];
}

interface BudgetFormValues {
  categoryId: string;
  limitAmount: string;
}

export function BudgetForm({
  open,
  onOpenChange,
  onSubmit,
  existingCategoryIds,
}: BudgetFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<BudgetFormValues>({
    defaultValues: {
      categoryId: "",
      limitAmount: "",
    },
  });

  const categoryId = useWatch({ control, name: "categoryId" });
  const limitAmount = useWatch({ control, name: "limitAmount" });
  const { categories } = useCategories("expense");

  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const onFormSubmit = async (values: BudgetFormValues) => {
    await onSubmit(values.categoryId, parseIntegerInput(values.limitAmount));
    onOpenChange(false);
    reset({ categoryId: "", limitAmount: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoria</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger id="budget-category">
                    <SelectValue placeholder="Selecciona categoria">
                      {() => selectedCategory?.name ?? "Selecciona categoria"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id} label={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite mensual (COP)</Label>
            <Input
              id="limit"
              type="text"
              inputMode="numeric"
              {...register("limitAmount")}
              onChange={(e) => setValue("limitAmount", formatIntegerInput(e.target.value))}
              placeholder="500.000"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !categoryId || !limitAmount}
          >
            {isSubmitting ? "Guardando..." : "Crear presupuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
