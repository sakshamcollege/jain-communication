"use client";

import { useState } from "react";
import { useSales, useDeleteSale } from "@/lib/hooks";
import { formatCurrency, formatDateTime, formatDateInput, getDateRangeFromInputs, getDateRangeLabel, getStartOfToday } from "@/lib/helpers";
import { SalesForm } from "@/components/SalesForm";
import { SalesListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/action-buttons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DateRangePicker, type DateRangeInput } from "@/components/DateRangePicker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ShoppingCart, TrendingUp } from "lucide-react";
import { SaleWithProduct } from "@/lib/types";

export default function SalesPage() {
  const [dateRange, setDateRange] = useState<DateRangeInput>(() => {
    const today = formatDateInput(getStartOfToday());
    return { from: today, to: today };
  });
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleWithProduct | null>(null);
  
  const deleteSaleMutation = useDeleteSale();

  const { data: sales, isLoading, error } = useSales(getDateRangeFromInputs(dateRange));

  // Calculate totals
  const totals = sales?.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.sellingPrice * sale.quantity,
      profit: acc.profit + sale.profit,
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, count: 0 }
  ) || { revenue: 0, profit: 0, count: 0 };

  const rangeLabel = getDateRangeLabel(dateRange);

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    
    try {
      await deleteSaleMutation.mutateAsync(saleToDelete.id);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
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

        <Sheet open={isAddingOpen} onOpenChange={setIsAddingOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle>Record New Sale</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Select a product and enter sale details
              </p>
            </SheetHeader>
            <div className="px-6 pb-6">
              <SalesForm
                onSuccess={() => setIsAddingOpen(false)}
                onCancel={() => setIsAddingOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{rangeLabel} Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{rangeLabel} Profit</p>
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
        <DateRangePicker value={dateRange} onValueChange={setDateRange} />
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(sale.sellingPrice * sale.quantity)}
                      </p>
                      <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatCurrency(sale.profit)}
                      </p>
                    </div>
                    <DeleteButton onClick={() => setSaleToDelete(sale)} />
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
            {!dateRange.from && !dateRange.to
              ? "Record your first sale to get started"
              : `No sales recorded for ${rangeLabel.toLowerCase()}`}
          </p>
          <Button onClick={() => setIsAddingOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
        title="Delete Sale"
        description={`Are you sure you want to delete this sale? This action will restore ${saleToDelete?.quantity} unit(s) of ${saleToDelete?.product.name} back to stock.`}
        onConfirm={handleDeleteSale}
        isDeleting={deleteSaleMutation.isPending}
      >
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
      </DeleteConfirmationDialog>
    </div>
  );
}
