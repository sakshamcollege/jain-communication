"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If unauthenticated and not on public pages, redirect to login
    // This is a client-side backup to middleware
    const publicPaths = ["/login", "/signup", "/shopping"];
    const isPublic = publicPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
    
    if (status === "unauthenticated" && !isPublic) {
      router.push("/login");
    }
  }, [status, pathname, router]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
