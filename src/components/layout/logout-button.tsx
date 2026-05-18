"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:left-auto sm:right-4"
      aria-label="Cerrar sesion"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
