import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isBuyer = token?.role === "BUYER";
    const isShopping = req.nextUrl.pathname === "/shopping";

    if (isAuth && isBuyer && !isShopping) {
      return NextResponse.redirect(new URL("/shopping", req.url));
    }
    
    // Prevent non-buyers from seeing coming soon page? Optional.
    // if (isAuth && !isBuyer && isComingSoon) {
    //   return NextResponse.redirect(new URL("/dashboard", req.url));
    // }
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
    "/",
    "/dashboard/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/recharges/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/stock-history/:path*",
    "/users/:path*",
    "/shopping",
  ],
};
