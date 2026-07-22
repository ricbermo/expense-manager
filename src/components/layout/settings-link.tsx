"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsLink() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <Link
      href="/ajustes"
      aria-label="Ajustes"
      aria-current={pathname === "/ajustes" ? "page" : undefined}
      className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}
