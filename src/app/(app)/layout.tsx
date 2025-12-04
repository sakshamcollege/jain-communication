import { Navigation } from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "BUYER") {
    redirect("/shopping");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Mobile padding for fixed navbar */}
      <div className="md:hidden h-16" />
      
      {/* Main content area */}
      <main className="md:ml-60 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
