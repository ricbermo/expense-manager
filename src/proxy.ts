import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getAllowedUserEmail,
  isAllowedUserEmail,
} from "@/lib/auth/allowed-user";
import { isProtectedPath, isPublicPath } from "@/lib/auth/route-access";

function applyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function redirectWithCookies(
  request: NextRequest,
  source: NextResponse,
  pathname: string,
) {
  const destination = new URL(pathname, request.url);
  const response = NextResponse.redirect(destination);
  applyCookies(source, response);
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.",
    );
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const onPublicPath = isPublicPath(pathname);
  const onProtectedPath = isProtectedPath(pathname);
  const allowedEmail = getAllowedUserEmail();

  if (user && !isAllowedUserEmail(user.email, allowedEmail)) {
    await supabase.auth.signOut();

    const unauthorizedRedirect = new URL("/login", request.url);
    unauthorizedRedirect.searchParams.set("error", "unauthorized");

    const redirectResponse = NextResponse.redirect(unauthorizedRedirect);
    applyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (!user && onProtectedPath) {
    return redirectWithCookies(request, response, "/login");
  }

  if (user && onPublicPath) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/accounts/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/settings/:path*",
  ],
};
