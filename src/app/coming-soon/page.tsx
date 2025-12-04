"use client";

import { ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
        <ShoppingCart className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Shopping Coming Soon
      </h1>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        We are building an amazing shopping experience for you. 
        Check back soon to browse and purchase products directly.
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
