import prisma from "@/lib/prisma";
import { ShoppingProductCard } from "@/components/ShoppingProductCard";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const session = await getServerSession(authOptions);
  const canAccessDashboard = session?.user?.role === "OWNER" || session?.user?.role === "DEVELOPER";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shop Products</h1>
            <p className="text-muted-foreground">
              Browse our collection of mobile phones and accessories
            </p>
          </div>
        </div>
        {canAccessDashboard && (
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium text-muted-foreground">No products available yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back later for new arrivals!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ShoppingProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
