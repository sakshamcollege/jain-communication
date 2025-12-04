"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3,
  Menu,
  Smartphone,
  History,
  Wallet,
  LogOut,
  User as UserIcon,
  UserCog
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/recharges", label: "Recharges", icon: Smartphone },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/stock-history", label: "Stock History", icon: History },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "DEVELOPER" || session?.user?.role === "OWNER";
  const isBuyer = session?.user?.role === "BUYER";

  if (isBuyer) return null;

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate">{item.label}</span>
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/users"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
            "hover:bg-accent hover:text-accent-foreground",
            pathname === "/users" && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <UserCog className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium truncate">Users</span>
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Jain Communication</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 flex flex-col h-full">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="p-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold">Jain Communication</span>
                </Link>
              </div>
              <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
                <NavLinks />
              </div>
              <div className="p-3 border-t space-y-2 mt-auto">
                {session?.user && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 border-r bg-background flex-col">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Jain</h1>
              <p className="text-xs text-muted-foreground">Communication</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 flex-1 p-3 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-3 border-t space-y-2">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
