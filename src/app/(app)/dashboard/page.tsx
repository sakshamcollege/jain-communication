"use client";

import { useDashboard } from "@/lib/hooks";
import { formatCurrency, formatDateTime } from "@/lib/helpers";
import { DashboardSkeleton } from "@/components/Skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Plus,
  Smartphone,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </Link>
          <Link href="/sales">
            <Button size="sm" variant="outline">
              <ShoppingCart className="w-4 h-4 mr-1" />
              New Sale
            </Button>
          </Link>
          <Link href="/recharges">
            <Button size="sm" variant="outline">
              <Smartphone className="w-4 h-4 mr-1" />
              Recharge
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Sales</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.todaySales || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.todaySalesCount || 0} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Recharges</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.todayRecharges || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.todayRechargeCount || 0} recharges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Total Profit</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats?.todayTotalProfit || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sales: {formatCurrency(stats?.todayProfit || 0)} | Commission: {formatCurrency(stats?.todayRechargeCommission || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats?.lowStockCount && stats.lowStockCount > 0 ? "border-red-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats?.lowStockCount && stats.lowStockCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${stats?.lowStockCount && stats.lowStockCount > 0 ? "text-red-600" : "text-gray-600"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className={`text-xl font-bold ${stats?.lowStockCount && stats.lowStockCount > 0 ? "text-red-600" : ""}`}>
                  {stats?.lowStockCount || 0} items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly & Monthly Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Product Sales</span>
              <span className="font-semibold">{formatCurrency(stats?.weeklySales || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Recharges</span>
              <span className="font-semibold">{formatCurrency(stats?.weeklyRecharges || 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Total Profit</span>
              <span className="font-bold text-green-600">{formatCurrency(stats?.weeklyTotalProfit || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Sales Profit: {formatCurrency(stats?.weeklyProfit || 0)}</span>
              <span>Commission: {formatCurrency(stats?.weeklyRechargeCommission || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Product Sales</span>
              <span className="font-semibold">{formatCurrency(stats?.monthlySales || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Recharges</span>
              <span className="font-semibold">{formatCurrency(stats?.monthlyRecharges || 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Total Profit</span>
              <span className="font-bold text-green-600">{formatCurrency(stats?.monthlyTotalProfit || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Sales Profit: {formatCurrency(stats?.monthlyProfit || 0)}</span>
              <span>Commission: {formatCurrency(stats?.monthlyRechargeCommission || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales & Recent Recharges */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
            <Link href="/sales">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{sale.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} × {formatCurrency(sale.sellingPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(sale.sellingPrice * sale.quantity)}</p>
                      <p className="text-xs text-green-600">+{formatCurrency(sale.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sales recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Recharges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Recharges</CardTitle>
            <Link href="/recharges">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentRecharges && stats.recentRecharges.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRecharges.map((recharge) => (
                  <div key={recharge.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{recharge.mobileNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {recharge.type.replace("_", " ")} {recharge.operator && `• ${recharge.operator}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(recharge.amount)}</p>
                      <p className="text-xs text-green-600">+{formatCurrency(recharge.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recharges recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card className={stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? "border-red-200" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Low Stock Alerts
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.lowStockProducts.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/products?lowStock=true">
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {product.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All products are well stocked</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
