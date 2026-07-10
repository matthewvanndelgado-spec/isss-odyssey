import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users away from auth pages
    if (token && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Staff routes protection
    if (path.startsWith("/staff") && token?.role !== "STAFF") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Auth pages are always accessible
        if (path === "/login" || path === "/register") {
          return true;
        }

        // Dashboard and other protected routes require authentication
        if (path.startsWith("/dashboard") || path.startsWith("/staff") ||
            path.startsWith("/inquiries") || path.startsWith("/appointments") ||
            path.startsWith("/visa") || path.startsWith("/exchange") ||
            path.startsWith("/orientation") || path.startsWith("/assistant") ||
            path.startsWith("/notifications") || path.startsWith("/settings")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/inquiries/:path*",
    "/appointments/:path*",
    "/visa/:path*",
    "/exchange/:path*",
    "/orientation/:path*",
    "/assistant/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
