import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
  ],
};
