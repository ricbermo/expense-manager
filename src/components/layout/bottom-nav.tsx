"use client";

import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/budgets", label: "Presupuesto", icon: PiggyBank },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 px-4 md:inset-x-auto md:top-[calc(1rem+env(safe-area-inset-top))] md:right-auto md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:px-4"
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-border/80 bg-card/95 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="grid h-14 grid-cols-4 items-center gap-1 md:h-12">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex h-full min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
