"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsLink() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const isActive = pathname === "/settings";

  return (
    <Link
      href="/settings"
      aria-label="Ajustes"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}
