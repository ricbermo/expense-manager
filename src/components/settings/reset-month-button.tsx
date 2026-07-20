"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResetMonth } from "@/lib/hooks/use-reset-month";
import { formatMonthYear } from "@/lib/utils/dates";

interface ResetMonthButtonProps {
  month: string;
}

export function ResetMonthButton({ month }: ResetMonthButtonProps) {
  const [open, setOpen] = useState(false);
  const { resetMonth, resetting } = useResetMonth();
  const router = useRouter();

  const handleConfirm = async () => {
    try {
      const { deletedTransactions, deletedBudgets } = await resetMonth(month);
      toast.success(
        `Mes reiniciado: ${deletedTransactions} movimientos y ${deletedBudgets} presupuestos eliminados`
      );
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("No se pudo reiniciar el mes. Intenta de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" className="w-full sm:w-auto">
            <Trash2 className="h-4 w-4" />
            Borrar mes actual
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            ¿Reiniciar {formatMonthYear(`${month}-01`)}?
          </DialogTitle>
          <DialogDescription>
            Se eliminarán <strong>todas las transacciones</strong> y{" "}
            <strong>presupuestos</strong> de {formatMonthYear(`${month}-01`)}.
            Las cuentas, categorías y extractos de tarjeta se conservan.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Esta acción es irreversible.</p>
          <p className="mt-1 text-xs text-destructive/80">
            No podrás recuperar los datos borrados. Si solo quieres corregir
            un movimiento, edítalo desde la página de Movimientos.
          </p>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={resetting}
          >
            {resetting ? "Borrando..." : "Borrar mes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}