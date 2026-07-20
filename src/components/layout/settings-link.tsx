"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

export function SettingsLink() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <Link
      href="/ajustes"
      aria-label="Ajustes"
      aria-current={pathname === "/ajustes" ? "page" : undefined}
      className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:right-14"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}