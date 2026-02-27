import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionTokenEdge } from "@/lib/auth/session-edge";

const ADMIN_LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authSecret = process.env.AUTH_SECRET ?? "";
  const session = await verifySessionTokenEdge(token, authSecret);
  const isAuthed = Boolean(session);

  if (pathname === ADMIN_LOGIN_PATH && isAuthed) {
    const nextPath = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN" ? "/admin/backend" : "/admin";
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH && !isAuthed) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  if (pathname.startsWith("/admin/backend") && session) {
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
