"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
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

type BudgetFormMode = "create" | "edit";

interface BudgetFormInitialValues {
  id: string;
  name: string;
  categoryId: string;
  limitAmount: number;
}

interface BudgetFormSubmitValues {
  id?: string;
  name: string;
  categoryId: string;
  limitAmount: number;
}

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: BudgetFormMode;
  initialValues?: BudgetFormInitialValues | null;
  onSubmit: (values: BudgetFormSubmitValues) => Promise<void>;
}

interface BudgetFormValues {
  name: string;
  categoryId: string;
  limitAmount: string;
}

export function BudgetForm({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSubmit,
}: BudgetFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<BudgetFormValues>({
    defaultValues: {
      name: "",
      categoryId: "",
      limitAmount: "",
    },
  });

  const name = useWatch({ control, name: "name" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const limitAmount = useWatch({ control, name: "limitAmount" });
  const { categories } = useCategories("expense");

  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialValues) {
      reset({
        name: initialValues.name,
        categoryId: initialValues.categoryId,
        limitAmount: formatIntegerInput(String(initialValues.limitAmount)),
      });
      return;
    }

    reset({ name: "", categoryId: "", limitAmount: "" });
  }, [initialValues, mode, open, reset]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setSubmitError(null);
    onOpenChange(nextOpen);
  };

  const onFormSubmit = async (values: BudgetFormValues) => {
    const normalizedName = values.name.trim();
    if (!normalizedName) {
      setSubmitError("El nombre del presupuesto es obligatorio.");
      return;
    }

    try {
      await onSubmit({
        id: mode === "edit" ? initialValues?.id : undefined,
        name: normalizedName,
        categoryId: values.categoryId,
        limitAmount: parseIntegerInput(values.limitAmount),
      });
      toast.success(mode === "edit" ? "Presupuesto actualizado" : "Presupuesto creado");
      onOpenChange(false);
      reset({ name: "", categoryId: "", limitAmount: "" });
      setSubmitError(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el presupuesto."
      );
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el presupuesto."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar presupuesto" : "Nuevo presupuesto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-name">Nombre</Label>
            <Input
              id="budget-name"
              {...register("name")}
              placeholder="Ej: Almuerzos"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoría</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger id="budget-category">
                    <SelectValue placeholder="Selecciona categoria">
                      {() => selectedCategory?.name ?? "Selecciona categoría"}
                    </SelectValue>
                    </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
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
            <Label htmlFor="limit">Límite mensual (COP)</Label>
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

          {submitError && (
            <p className="text-xs text-rose-600" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              !name?.trim() ||
              !categoryId ||
              !limitAmount ||
              parseIntegerInput(limitAmount) <= 0
            }
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Crear presupuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
