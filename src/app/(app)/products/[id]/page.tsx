"use client";

import { useState, use } from "react";
import { useProduct, useDeleteProduct, useSales } from "@/lib/hooks";
import { formatCurrency, formatDateTime, isLowStock } from "@/lib/helpers";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);
  const { data: sales } = useSales({ productId: id, limit: 10 });
  const deleteMutation = useDeleteProduct();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push("/products");
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-24" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Product not found</h2>
        <Button onClick={() => router.push("/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  const profit = product.sellingPrice - product.purchasePrice;
  const profitPercentage =
    product.purchasePrice > 0
      ? ((profit / product.purchasePrice) * 100).toFixed(1)
      : "0";
  const lowStock = isLowStock(product.stock);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setIsDeleting(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {lowStock && <Badge variant="destructive">Low Stock</Badge>}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-full">
              {product.frontImage ? (
                <img src={product.frontImage} alt={product.name} className="w-16 h-16 object-cover rounded-full" />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Description & Specs */}
          {(product.description || product.specs) && (
            <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
              {product.specs && (
                <div>
                  <h3 className="font-semibold mb-2">Specifications</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.specs}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Images */}
          {(product.frontImage || product.backImage) && (
             <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                {product.frontImage && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Front View</p>
                        <img src={product.frontImage} alt="Front" className="rounded-lg border w-full object-contain max-h-60" />
                    </div>
                )}
                {product.backImage && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Back View</p>
                        <img src={product.backImage} alt="Back" className="rounded-lg border w-full object-contain max-h-60" />
                    </div>
                )}
             </div>
          )}

          {/* Price & Stock Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
              <p className="text-lg font-semibold">{formatCurrency(product.purchasePrice)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Selling Price</p>
              <p className="text-lg font-semibold">{formatCurrency(product.sellingPrice)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Profit/Unit</p>
              <p className={`text-lg font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profit)} ({profitPercentage}%)
              </p>
            </div>
            <div className={`p-4 rounded-lg ${lowStock ? "bg-red-50" : "bg-muted"}`}>
              <p className="text-xs text-muted-foreground mb-1">Stock</p>
              <p className={`text-lg font-semibold ${lowStock ? "text-red-600" : ""}`}>
                {product.stock} units
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t space-y-3">
            {product.imei && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IMEI</span>
                <span className="font-mono">{product.imei}</span>
              </div>
            )}
            {product.supplier && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplier</span>
                <span>{product.supplier}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Added On</span>
              <span>{formatDateTime(product.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales for this product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales && sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{formatDateTime(sale.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} × {formatCurrency(sale.sellingPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {formatCurrency(sale.sellingPrice * sale.quantity)}
                    </p>
                    <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {formatCurrency(sale.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground text-sm">
              No sales recorded for this product yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Product</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProductForm
              product={product}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{product.name}&quot;? This will also
              delete all associated sales records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
