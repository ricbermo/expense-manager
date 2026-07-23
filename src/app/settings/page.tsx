"use client";

import { AlertTriangle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ResetMonthButton } from "@/components/settings/reset-month-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatMonthYear } from "@/lib/utils/dates";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SettingsPage() {
  const month = useMemo(() => getCurrentMonth(), []);
  const monthLabel = formatMonthYear(`${month}-01`);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Ajustes"
        description="Configuración de la cuenta y datos"
      />

      <div className="app-shell page-stack">
        <section className="section-card space-y-3 border-destructive/30 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Zona de peligro
              </h2>
              <p className="text-sm text-muted-foreground">
                Reinicia el mes actual para empezar desde cero. Se borran tus
                movimientos y presupuestos de <strong>{monthLabel}</strong>. Las
                cuentas, categorías y extractos de tarjeta se conservan.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-destructive/20 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Usar solo cuando necesites empezar el mes de nuevo sin historial.
            </p>
            <ResetMonthButton month={month} />
          </div>
        </section>

        <section className="section-card space-y-3 p-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Sesión</h2>
            <p className="text-sm text-muted-foreground">
              Cierra la sesión en este dispositivo. Volverás a la pantalla de
              inicio.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void handleSignOut()}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </section>
      </div>
    </div>
  );
}
