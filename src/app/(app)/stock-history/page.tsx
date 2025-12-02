"use client";

import { useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStockHistory, useAdjustStock, useProducts } from "@/lib/hooks";
import { formatDateTime, getStartOfToday, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Minus,
  ArrowRightLeft,
  Loader2,
  History,
  PackagePlus,
  PackageMinus,
  PackageCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StockMovementWithProduct, StockMovementType } from "@/lib/types";

type DateFilter = "today" | "week" | "month" | "all";
type TypeFilter = "all" | "STOCK_IN" | "STOCK_OUT" | "INITIAL" | "ADJUSTMENT";

function StockHistoryListSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-12 w-36" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-16 ml-auto" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getMovementIcon(type: StockMovementType) {
  switch (type) {
    case "STOCK_IN":
      return <PackagePlus className="h-4 w-4 text-green-600" />;
    case "STOCK_OUT":
      return <PackageMinus className="h-4 w-4 text-red-600" />;
    case "INITIAL":
      return <PackageCheck className="h-4 w-4 text-blue-600" />;
    case "ADJUSTMENT":
      return <ArrowRightLeft className="h-4 w-4 text-orange-600" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function getMovementColor(type: StockMovementType) {
  switch (type) {
    case "STOCK_IN":
      return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    case "STOCK_OUT":
      return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    case "INITIAL":
      return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "ADJUSTMENT":
      return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    default:
      return "";
  }
}

function getMovementLabel(type: StockMovementType) {
  switch (type) {
    case "STOCK_IN":
      return "Stock In";
    case "STOCK_OUT":
      return "Sold";
    case "INITIAL":
      return "Initial Stock";
    case "ADJUSTMENT":
      return "Adjustment";
    default:
      return type;
  }
}

function StockHistoryPageContent() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [adjustQuantity, setAdjustQuantity] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

  const getDateRange = () => {
    switch (dateFilter) {
      case "today":
        return { startDate: getStartOfToday().toISOString() };
      case "week":
        return { startDate: getStartOfWeek().toISOString() };
      case "month":
        return { startDate: getStartOfMonth().toISOString() };
      default:
        return {};
    }
  };

  const { data: stockHistory, isLoading } = useStockHistory({
    ...getDateRange(),
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const { data: products } = useProducts();
  const adjustStock = useAdjustStock();

  const dateFilterLabel: Record<DateFilter, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  const typeFilterLabel: Record<TypeFilter, string> = {
    all: "All Types",
    STOCK_IN: "Stock In",
    STOCK_OUT: "Sold",
    INITIAL: "Initial Stock",
    ADJUSTMENT: "Adjustments",
  };

  // Calculate summaries
  const stockInCount = stockHistory?.filter((m) => m.type === "STOCK_IN" || m.type === "INITIAL").reduce((sum, m) => sum + Math.abs(m.quantity), 0) || 0;
  const stockOutCount = stockHistory?.filter((m) => m.type === "STOCK_OUT").reduce((sum, m) => sum + Math.abs(m.quantity), 0) || 0;
  const adjustmentCount = stockHistory?.filter((m) => m.type === "ADJUSTMENT").reduce((sum, m) => sum + m.quantity, 0) || 0;

  const handleAdjustStock = async () => {
    if (!selectedProductId || !adjustQuantity) return;

    try {
      await adjustStock.mutateAsync({
        productId: selectedProductId,
        quantity: Number(adjustQuantity),
        reason: adjustReason || undefined,
      });
      setDialogOpen(false);
      setSelectedProductId("");
      setAdjustQuantity("");
      setAdjustReason("");
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      alert(error instanceof Error ? error.message : "Failed to adjust stock");
    }
  };

  // Group movements by date
  const groupedMovements = stockHistory?.reduce((groups, movement) => {
    const date = new Date(movement.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(movement);
    return groups;
  }, {} as Record<string, StockMovementWithProduct[]>);

  return (
    <div className="container mx-auto p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock History</h1>
          <p className="text-muted-foreground">{dateFilterLabel[dateFilter]} stock movements</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-12">
              <Plus className="mr-2 h-5 w-5" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
              <DialogDescription>
                Add or adjust stock for a product. Use positive numbers to add stock, negative to remove.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity (e.g., 10 or -5)"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Positive number to add stock, negative to remove
                </p>
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input
                  placeholder="e.g., New shipment arrived"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdjustStock}
                disabled={!selectedProductId || !adjustQuantity || adjustStock.isPending}
              >
                {adjustStock.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Stock In</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{stockInCount}</p>
            <p className="text-xs text-muted-foreground">{dateFilterLabel[dateFilter]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Sold Out</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{stockOutCount}</p>
            <p className="text-xs text-muted-foreground">{dateFilterLabel[dateFilter]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="text-sm">Net Change</span>
            </div>
            <p className={`text-2xl font-bold ${stockInCount - stockOutCount + adjustmentCount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {stockInCount - stockOutCount + adjustmentCount >= 0 ? "+" : ""}{stockInCount - stockOutCount + adjustmentCount}
            </p>
            <p className="text-xs text-muted-foreground">{dateFilterLabel[dateFilter]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-[180px]">
            <Package className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="STOCK_IN">Stock In</SelectItem>
            <SelectItem value="STOCK_OUT">Sold</SelectItem>
            <SelectItem value="INITIAL">Initial Stock</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stock History List */}
      {isLoading ? (
        <StockHistoryListSkeleton />
      ) : stockHistory && stockHistory.length > 0 ? (
        <div className="space-y-6">
          {groupedMovements && Object.entries(groupedMovements).map(([date, movements]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
              </div>
              {movements.map((movement) => (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${movement.type === "STOCK_IN" || movement.type === "INITIAL" ? "bg-green-100 dark:bg-green-900" : movement.type === "STOCK_OUT" ? "bg-red-100 dark:bg-red-900" : "bg-orange-100 dark:bg-orange-900"}`}>
                          {getMovementIcon(movement.type as StockMovementType)}
                        </div>
                        <div>
                          <p className="font-semibold">{movement.product?.name || "Unknown Product"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getMovementColor(movement.type as StockMovementType)}>
                              {getMovementLabel(movement.type as StockMovementType)}
                            </Badge>
                            {movement.product?.category && (
                              <Badge variant="secondary" className="text-xs">
                                {movement.product.category}
                              </Badge>
                            )}
                          </div>
                          {movement.reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {movement.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${movement.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.previousStock} → {movement.newStock}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(movement.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No stock movements found</h3>
            <p className="text-muted-foreground mb-4">
              {dateFilter === "all"
                ? "Stock movements will appear here when you add products, make sales, or adjust stock"
                : `No stock movements recorded for ${dateFilterLabel[dateFilter].toLowerCase()}`}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StockHistoryPage() {
  return (
    <Suspense fallback={<StockHistoryListSkeleton />}>
      <StockHistoryPageContent />
    </Suspense>
  );
}
