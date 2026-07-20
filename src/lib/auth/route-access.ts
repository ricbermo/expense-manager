function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isPublicPath(pathname: string) {
  return normalizePathname(pathname) === "/login";
}

export function isProtectedPath(pathname: string) {
  const normalized = normalizePathname(pathname);

  if (normalized === "/") return true;

  return (
    normalized === "/accounts" ||
    normalized.startsWith("/accounts/") ||
    normalized === "/transactions" ||
    normalized.startsWith("/transactions/") ||
    normalized === "/budgets" ||
    normalized.startsWith("/budgets/") ||
    normalized === "/ajustes" ||
    normalized.startsWith("/ajustes/")
  );
}
