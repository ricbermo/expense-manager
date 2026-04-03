import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="app-shell flex min-h-[100dvh] items-center justify-center py-8">
      <section className="section-card w-full max-w-sm p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ingresar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accede con tu correo y contraseña para continuar.
        </p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
