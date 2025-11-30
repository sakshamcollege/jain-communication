"use client";

import { useSales, useProducts } from "@/lib/hooks";
import { formatCurrency, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Award,
} from "lucide-react";

export default function ReportsPage() {
  const startOfWeek = getStartOfWeek().toISOString();
  const startOfMonth = getStartOfMonth().toISOString();

  const { data: weeklySales, isLoading: weeklyLoading } = useSales({
    startDate: startOfWeek,
  });
  const { data: monthlySales, isLoading: monthlyLoading } = useSales({
    startDate: startOfMonth,
  });
  const { data: allSales, isLoading: allLoading } = useSales({});
  const { data: products, isLoading: productsLoading } = useProducts({});

  const isLoading = weeklyLoading || monthlyLoading || allLoading || productsLoading;

  // Calculate weekly stats
  const weeklyStats = weeklySales?.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.sellingPrice * sale.quantity,
      profit: acc.profit + sale.profit,
      quantity: acc.quantity + sale.quantity,
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, quantity: 0, count: 0 }
  ) || { revenue: 0, profit: 0, quantity: 0, count: 0 };

  // Calculate monthly stats
  const monthlyStats = monthlySales?.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.sellingPrice * sale.quantity,
      profit: acc.profit + sale.profit,
      quantity: acc.quantity + sale.quantity,
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, quantity: 0, count: 0 }
  ) || { revenue: 0, profit: 0, quantity: 0, count: 0 };

  // Calculate all-time stats
  const allTimeStats = allSales?.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.sellingPrice * sale.quantity,
      profit: acc.profit + sale.profit,
      quantity: acc.quantity + sale.quantity,
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, quantity: 0, count: 0 }
  ) || { revenue: 0, profit: 0, quantity: 0, count: 0 };

  // Calculate top selling products
  const productSalesMap = new Map<string, { name: string; category: string; quantity: number; revenue: number; profit: number }>();
  
  allSales?.forEach((sale) => {
    const existing = productSalesMap.get(sale.productId);
    if (existing) {
      existing.quantity += sale.quantity;
      existing.revenue += sale.sellingPrice * sale.quantity;
      existing.profit += sale.profit;
    } else {
      productSalesMap.set(sale.productId, {
        name: sale.product.name,
        category: sale.product.category,
        quantity: sale.quantity,
        revenue: sale.sellingPrice * sale.quantity,
        profit: sale.profit,
      });
    }
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Calculate stock value
  const stockValue = products?.reduce(
    (acc, product) => ({
      purchaseValue: acc.purchaseValue + product.purchasePrice * product.stock,
      sellingValue: acc.sellingValue + product.sellingPrice * product.stock,
      totalItems: acc.totalItems + product.stock,
    }),
    { purchaseValue: 0, sellingValue: 0, totalItems: 0 }
  ) || { purchaseValue: 0, sellingValue: 0, totalItems: 0 };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Business insights and performance metrics
        </p>
      </div>

      {/* Weekly Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          This Week
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(weeklyStats.revenue)}</p>
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
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(weeklyStats.profit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Items Sold</p>
              <p className="text-xl font-bold">{weeklyStats.quantity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-xl font-bold">{weeklyStats.count}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          This Month
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyStats.revenue)}</p>
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
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(monthlyStats.profit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Items Sold</p>
              <p className="text-xl font-bold">{monthlyStats.quantity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-xl font-bold">{monthlyStats.count}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stock Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Items in Stock</p>
              <p className="text-xl font-bold">{stockValue.totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Stock Cost Value</p>
              <p className="text-xl font-bold">{formatCurrency(stockValue.purchaseValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Potential Revenue</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stockValue.sellingValue)}</p>
              <p className="text-xs text-muted-foreground">
                Potential Profit: {formatCurrency(stockValue.sellingValue - stockValue.purchaseValue)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.quantity} sold</p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-sm text-green-600">
                      Profit: {formatCurrency(product.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No sales data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Time Stats */}
      <Card>
        <CardHeader>
          <CardTitle>All Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(allTimeStats.revenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(allTimeStats.profit)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items Sold</p>
              <p className="text-2xl font-bold">{allTimeStats.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{allTimeStats.count}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
