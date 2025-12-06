import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isBuyer = token?.role === "BUYER";
    const isShopping = req.nextUrl.pathname === "/shopping";
    const isApi = req.nextUrl.pathname.startsWith("/api/");

    // Redirect buyers to shopping page if they try to access other pages
    // Allow API access for data fetching
    if (isAuth && isBuyer && !isShopping && !isApi) {
      return NextResponse.redirect(new URL("/shopping", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/register (Registration API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - signup (signup page)
     * - manifest.json, sw.js, workbox-*, icons (PWA files)
     * - browserconfig.xml, _offline (other public files)
     */
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|login|signup|manifest.json|sw.js|workbox-|icons|browserconfig.xml|_offline).*)",
  ],
};
