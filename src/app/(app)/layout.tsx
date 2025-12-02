import { Navigation } from "@/components/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
