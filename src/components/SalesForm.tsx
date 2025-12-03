"use client";

import { useState, useEffect } from "react";
import { useProducts, useCreateSale } from "@/lib/hooks";
import { Product } from "@/lib/types";
import { formatCurrency, calculateProfit } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, AlertCircle } from "lucide-react";

interface SalesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preSelectedProductId?: string;
}

export function SalesForm({ onSuccess, onCancel, preSelectedProductId }: SalesFormProps) {
  const { data: products, isLoading: productsLoading } = useProducts();
  const createSaleMutation = useCreateSale();

  const [selectedProductId, setSelectedProductId] = useState(preSelectedProductId || "");
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  // Update selling price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setSellingPrice(selectedProduct.sellingPrice);
    }
  }, [selectedProduct]);

  const profit = selectedProduct
    ? calculateProfit(sellingPrice, selectedProduct.purchasePrice, quantity)
    : 0;

  const totalAmount = sellingPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || quantity < 1 || sellingPrice <= 0) {
      return;
    }

    try {
      await createSaleMutation.mutateAsync({
        productId: selectedProductId,
        quantity,
        sellingPrice,
      });
      
      // Reset form
      setSelectedProductId("");
      setQuantity(1);
      setSellingPrice(0);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating sale:", error);
    }
  };

  const hasInsufficientStock = selectedProduct && quantity > selectedProduct.stock;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="product" className="text-sm font-medium">Select Product *</Label>
        <Select
          value={selectedProductId}
          onValueChange={setSelectedProductId}
          disabled={productsLoading || createSaleMutation.isPending}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a product"} />
          </SelectTrigger>
          <SelectContent>
            {products
              ?.filter((p) => p.stock > 0)
              .map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{product.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({product.stock} in stock)
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <>
          <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2 border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{selectedProduct.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Purchase Price:</span>
              <span className="font-medium">{formatCurrency(selectedProduct.purchasePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Available Stock:</span>
              <span className={`font-medium ${selectedProduct.stock <= 5 ? "text-red-600" : ""}`}>
                {selectedProduct.stock} units
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={createSaleMutation.isPending}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (₹) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                disabled={createSaleMutation.isPending}
                className="h-11"
              />
            </div>
          </div>

          {hasInsufficientStock && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Quantity exceeds available stock!</span>
            </div>
          )}

          {/* Sale Summary */}
          <div className="p-4 bg-primary/5 rounded-lg space-y-3 border border-primary/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-base">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Expected Profit:
                </span>
                <span className={`font-semibold text-base ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11"
            disabled={createSaleMutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-11"
          disabled={
            !selectedProductId ||
            quantity < 1 ||
            sellingPrice <= 0 ||
            hasInsufficientStock ||
            createSaleMutation.isPending
          }
        >
          {createSaleMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recording Sale...
            </>
          ) : (
            "Record Sale"
          )}
        </Button>
      </div>

      {createSaleMutation.isError && (
        <p className="text-sm text-destructive text-center">
          {createSaleMutation.error?.message}
        </p>
      )}
    </form>
  );
}
