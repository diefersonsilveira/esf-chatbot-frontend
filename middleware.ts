import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const ADMIN_ROUTES = ["/admin"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) return NextResponse.next();

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;
  const roleCookie = request.cookies.get("role")?.value as "admin" | "acs" | undefined;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (!sessionCookie || !roleCookie) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic) {
    const home = roleCookie === "admin" ? "/admin" : "/acs";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (isAdminRoute && roleCookie !== "admin") {
    return NextResponse.redirect(new URL("/acs", request.url));
  }

  if (pathname === "/") {
    const home = roleCookie === "admin" ? "/admin" : "/acs";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
