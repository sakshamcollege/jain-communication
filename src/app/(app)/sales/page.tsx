"use client";

import { useState } from "react";
import { useSales, useDeleteSale } from "@/lib/hooks";
import { formatCurrency, formatDateTime, getStartOfToday, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";
import { SalesForm } from "@/components/SalesForm";
import { SalesListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ShoppingCart, TrendingUp, Calendar, Trash2, Loader2, Pencil } from "lucide-react";
import { SaleWithProduct } from "@/lib/types";

type DateFilter = "today" | "week" | "month" | "all";

export default function SalesPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleWithProduct | null>(null);
  const [editingSale, setEditingSale] = useState<SaleWithProduct | null>(null);
  
  const deleteSaleMutation = useDeleteSale();

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

  const { data: sales, isLoading, error } = useSales(getDateRange());

  // Calculate totals
  const totals = sales?.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.sellingPrice * sale.quantity,
      profit: acc.profit + sale.profit,
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, count: 0 }
  ) || { revenue: 0, profit: 0, count: 0 };

  const dateFilterLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    
    try {
      await deleteSaleMutation.mutateAsync(saleToDelete.id);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const handleOpenSheet = (sale?: SaleWithProduct) => {
    setEditingSale(sale || null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingSale(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load sales</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">
            Record and track your sales transactions
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpenSheet()}>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle>{editingSale ? "Edit Sale" : "Record New Sale"}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {editingSale ? "Update sale details" : "Select a product and enter sale details"}
              </p>
            </SheetHeader>
            <div className="px-6 pb-6">
              <SalesForm
                onSuccess={handleCloseSheet}
                onCancel={handleCloseSheet}
                editSale={editingSale || undefined}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{dateFilterLabel[dateFilter]} Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{dateFilterLabel[dateFilter]} Profit</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totals.profit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl font-bold">{totals.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* Sales List */}
      {isLoading ? (
        <SalesListSkeleton />
      ) : sales && sales.length > 0 ? (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {sale.product.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {sale.quantity} × {formatCurrency(sale.sellingPrice)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(sale.sellingPrice * sale.quantity)}
                      </p>
                      <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatCurrency(sale.profit)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleOpenSheet(sale)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setSaleToDelete(sale)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sales found</h3>
          <p className="text-muted-foreground mb-4">
            {dateFilter === "all"
              ? "Record your first sale to get started"
              : `No sales recorded for ${dateFilterLabel[dateFilter].toLowerCase()}`}
          </p>
          <Button onClick={() => handleOpenSheet()}>
            <Plus className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action will restore{" "}
              <span className="font-semibold">{saleToDelete?.quantity} unit(s)</span> of{" "}
              <span className="font-semibold">{saleToDelete?.product.name}</span> back to stock.
            </DialogDescription>
          </DialogHeader>
          {saleToDelete && (
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{saleToDelete.product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{saleToDelete.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{formatCurrency(saleToDelete.sellingPrice * saleToDelete.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit:</span>
                <span className="font-medium text-green-600">{formatCurrency(saleToDelete.profit)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSaleToDelete(null)}
              disabled={deleteSaleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSale}
              disabled={deleteSaleMutation.isPending}
            >
              {deleteSaleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
